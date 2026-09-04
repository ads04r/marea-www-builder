import os, json, csv, requests, shutil, kml2geojson.main, argparse

def get_grid_geometries(grids_file):

    data = kml2geojson.main.convert(grids_file, 'grids')
    ret = {}
    for grid in data['feature_collections'][0]['features']:
        id = grid['properties']['name'].strip().upper()
        ret[id] = grid['geometry']
    return ret

def get_site_geometries(geometries_file):

    geom_id = '5348cf67-c2c5-11ea-9026-02e7594ce0a0'

    ret = {}
    with open(geometries_file, 'r') as fp:
        reader = csv.DictReader(fp)
        for item in reader:
            id = item['resourceinstanceid']
            geom = json.loads(item['position'])
            if geom_id in geom:
                if geom[geom_id] is None:
                    continue
                ret[id] = geom[geom_id]
    return ret

def flatten_properties(data):
    ret = {'label': '', 'dates': [], 'countries': [], 'people': []}
    if 'ID' in data:
        ret['label'] = data['ID']
    if 'Date' in data:
        if isinstance(data['Date'], str):
            ret['dates'] = [data['Date']]
        elif isinstance(data['Date'], list):
            ret['dates'] = data['Date']
    if 'Country' in data:
        if isinstance(data['Country'], str):
            ret['countries'].append(data['Country'])
        elif isinstance(data['Country'], dict):
            ret['countries'].append(data['Country']['label'])
        elif isinstance(data['Country'], list):
            for country in data['Country']:
                if country['label'] in ret['countries']:
                    continue
                ret['countries'].append(country['label'])
    if 'Actor' in data:
        if isinstance(data['Actor'], str):
            ret['people'].append(data['Actor'])
        elif isinstance(data['Actor'], dict):
            ret['people'].append(data['Actor']['label'])
        elif isinstance(data['Actor'], list):
            for person in data['Actor']:
                if person['label'] in ret['people']:
                    continue
                ret['people'].append(person['label'])
    return ret

def flatten_features(geojson, properties={}):

    if geojson is None:
        return []
    if not isinstance(geojson, dict):
        return []
    if 'type' not in geojson:
        return []
    if geojson['type'] == 'Feature':
        if 'properties' not in geojson:
            geojson['properties'] = {}
        for kk, v in properties.items():
            k = str(kk)
            geojson['properties'][k] = v
        return [geojson]
    if geojson['type'] == 'FeatureCollection':
        if 'features' in geojson:
            ret = []
            for feature in geojson['features']:
                ret = ret + flatten_features(feature, properties)
            return ret
    return []

def copy_static_files(static_path, dist_dir):

    for filename in os.listdir(static_path):
        src = os.path.join(static_path, filename)
        dst = os.path.join(dist_dir, filename)
        shutil.copy(src, dst)

def compile_assets(config, js_path, css_path, dist_dir):

    priority = []
    for item in config:
        js_filename = os.path.join(js_path, "{}.{}.js".format(item[0], item[1]))
        css_filename = os.path.join(css_path, "{}.{}.css".format(item[0], item[1]))
        if len(item) >= 3:
            priority.append(js_filename)
            if not os.path.exists(js_filename):
                url = item[2].format(item[1])
                with requests.get(url) as r:
                    with open(js_filename, 'w') as fp:
                        fp.write(r.content.decode('utf-8'))
            if len(item) >= 4:
                priority.append(css_filename)
                if not os.path.exists(css_filename):
                    url = item[3].format(item[1])
                    with requests.get(url) as r:
                        with open(css_filename, 'w') as fp:
                            fp.write(r.content.decode('utf-8'))
    js = ''
    for js_filename in priority:
        if js_filename.endswith('.js'):
            with open(js_filename, 'r') as fp:
                js = js + str(fp.read()) + '\n'
    for filename in sorted(os.listdir(js_path)):
        if not filename.endswith('.js'):
            continue
        js_filename = os.path.join(js_path, filename)
        if js_filename in priority:
            continue
        with open(js_filename, 'r') as fp:
            js = js + str(fp.read()) + '\n'
    css = ''
    for css_filename in priority:
        if css_filename.endswith('.css'):
            with open(css_filename, 'r') as fp:
                css = css + str(fp.read()) + '\n'
    for filename in os.listdir(css_path):
        if not filename.endswith('.css'):
            continue
        css_filename = os.path.join(css_path, filename)
        if css_filename in priority:
            continue
        with open(css_filename, 'r') as fp:
            css = css + str(fp.read()) + '\n'

    with open(os.path.join(dist_dir, 'js.js'), 'w') as fp:
        fp.write(js)
    with open(os.path.join(dist_dir, 'css.css'), 'w') as fp:
        fp.write(css)    

def compile_grids_data(grids_file, geometries_file, summary_file, disturbances_file, dist_dir):
    geom = get_grid_geometries(grids_file)
    with open(disturbances_file, 'r') as fp:
        disturbances_data = json.load(fp)
    item_geom = get_site_geometries(geometries_file)
    dist_data = os.path.join(dist_dir, 'data')
    os.makedirs(dist_data, exist_ok=True)
    with open(summary_file, 'r') as fp:
        summary = json.load(fp)
    data = {}
    for id, item in summary.items():
        marea = False
        if 'Role' not in item:
            continue
        if 'Grid' not in item:
            continue
        if isinstance(item['Role'], str):
            roles = [{"id": item['Role']}]
        elif isinstance(item['Role'], list):
            roles = item['Role']
        else:
            roles = [item['Role']]
        for role in roles:
            if role['id'] == '270e5b36-4d18-4b6e-a7ee-c49e3d301620':
                marea = True
                break
        if not marea:
            continue
        disturbances = []
        if id in disturbances_data:
            if 'disturbances' in disturbances_data[id]:
                disturbances = disturbances_data[id]['disturbances']
        if isinstance(item['Grid'], list):
            grids = item['Grid']
        else:
            grids = [item['Grid']]
        for grid in grids:
            grid_id = grid['label'].upper().strip()
            grid_url = "https://marea-project.github.io/eamena-stats/{}.html".format(grid_id)
            if grid_id not in geom:
                continue
            if grid_id not in data:
                data[grid_id] = {
                    "type": "Feature",
                    "properties": {
                        "name": grid_id,
                        "url": grid_url,
                        "sites": [],
                        "disturbances": {}
                    },
                    "geometry": geom[grid_id]
                }
            data[grid_id]['properties']['sites'].append(str(id))
            for disturbance in disturbances:
                if disturbance not in data[grid_id]['properties']['disturbances']:
                    data[grid_id]['properties']['disturbances'][disturbance] = 0
                data[grid_id]['properties']['disturbances'][disturbance] = data[grid_id]['properties']['disturbances'][disturbance] + 1
    for kk in data.keys():
        grid_id = str(kk)
        if len(data[grid_id]['properties']['disturbances']) == 0:
            data[grid_id]['properties']['html'] = '<p>No disturbance information available for this grid square.</p>'
            continue
        table_data = sorted([[str(k), int(v)] for k, v in data[grid_id]['properties']['disturbances'].items()], key=lambda x: x[1])
        table_html = ''.join(["<tr><th>{}</th><td>{}</td></tr>".format(x[0], x[1]) for x in table_data])
        data[grid_id]['properties']['html'] = "<table>{}</table>".format(table_html)
    with open(os.path.join(dist_data, 'grids.json'), 'w') as fp:
        fp.write(json.dumps(list(data.values())))
    for k, v in data.items():
        grid_id = str(k)
        features = []
        for item_id in v['properties']['sites']:
            if item_id not in item_geom:
                continue
            prop = {}
            if item_id in summary:
                prop = flatten_properties(summary[item_id])
            prop['id'] = item_id
            prop['url'] = "https://database.eamena.org/report/{}".format(item_id)
            prop['edit_url'] = "https://database.eamena.org/resource/{}".format(item_id)
            features = features + flatten_features(item_geom[item_id], prop)
        if len(features) > 0:
            with open(os.path.join(dist_data, grid_id + '.json'), 'w') as fp:
                fp.write(json.dumps({"type": "FeatureCollection", "features": features}))

def compile_optional_grid_data(grids_file, all_grids_file, dist_dir):
    return False

def get_empty_records_layer(empty_records_file, geometries_file):
    geom = get_site_geometries(geometries_file)
    ret = {}
    with open(empty_records_file, 'r') as fp:
        reader = csv.DictReader(fp)
        for item in reader:
            id_key = 'UUID'
            for kk in item.keys():
                k = str(kk)
                if k.endswith('UUID'):
                    id_key = k
            id = item[id_key]
            if id in geom:
                ret[id] = geom[id]
    return ret

def main(operation='all'):

    base_dir = os.path.dirname(__file__)
    dist_dir = os.path.join(base_dir, 'dist')
    data_dir = os.path.join(base_dir, 'data')
    config_file = os.path.join(base_dir, 'javascript.json')
    js_path = os.path.join(base_dir, 'js')
    css_path = os.path.join(base_dir, 'css')
    static_path = os.path.join(base_dir, 'static')
    grids_file = os.path.join(data_dir, 'eamena_grids.kml')
    all_grids_file = os.path.join(data_dir, 'marea_all_grids.kml')
    geometries_file = os.path.join(data_dir, 'geometries.csv')
    disturbances_file = os.path.join(data_dir, 'disturbances.json')
    summary_file = os.path.join(data_dir, 'summary.json')
    empty_records_file = os.path.join(data_dir, 'eamena_empty_records.csv')

    with open(config_file, 'r') as fp:
        config = json.load(fp)

    os.makedirs(dist_dir, exist_ok=True)

    if operation in ['all', 'build']:
        compile_assets(config, js_path, css_path, dist_dir)
        copy_static_files(static_path, dist_dir)
    if operation in ['all']:
        compile_grids_data(grids_file, geometries_file, summary_file, disturbances_file, dist_dir)
        compile_optional_grid_data(grids_file, all_grids_file, dist_dir)

if __name__ == "__main__":

    parser = argparse.ArgumentParser(description = 'Tool for building ')
    parser.add_argument('operation', help='The operation you want this command to carry out.', nargs='?', action='store', default='all', choices=['all', 'clean', 'build'])
    args = parser.parse_args()

    main(args.operation)
