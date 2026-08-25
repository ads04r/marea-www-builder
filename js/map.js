var map;
var hash;
var markers = L.markerClusterGroup({
	spiderfyOnMaxZoon: false,
	showCoverageOnHover: false,
	zoomToBoundsOnClick: true
});

function FeatureSetRegistry()
{
	this.featuresets = {};
	this.featuresetmenus = {};
	this.ordering = [];
	this.icons = {};
	this.lastHash = "";
	this.mapMoving = true;
	this.addFeatureSet = function(id, featureset)
	{
		if(!(id.match(/^[a-zA-Z]/))) { throw "FeatureSet IDs must begin with a letter."; }
		this.featuresets[id] = featureset;
		featureset.id = id;
		this.ordering.push(id);
	}
	this.hasFeatureSet = function(id) { return(id in this.featuresets); }
	this.getFeatureSet = function(id) { return(this.featuresets[id]); }
	this.getFeatureSetIds = function() { return(this.ordering); }
	this.callTriggers = function(uri)
	{
		for(var i = 0; i < this.ordering.length; i++)
		{
			var layerkey = this.ordering[i];
			var featureset = this.featuresets[layerkey];
			featureset.trigger(uri);
		}
	}
	this.hashChanged = function(map, hash)
	{
		if(hash.indexOf('#') === 0) {
			hash = hash.substr(1);
		}
		var parsed = {}
		var args = hash.split("/");
		if ((args.length == 3) || (args.length == 4)) {
			var layers = []
			if(args.length == 4) { layers = args[3].split(','); }
			var zoom = parseInt(args[0], 10),
			lat = parseFloat(args[1]),
			lon = parseFloat(args[2]);
			if (!((isNaN(zoom) || isNaN(lat) || isNaN(lon)))) {
				parsed = {
					center: new L.LatLng(lat, lon),
					zoom: zoom,
					soton_layers: layers
				};
			}
		}
		if("center" in parsed)
		{
			map.setView(parsed.center, parsed.zoom);
			for(var i = 0; i < this.ordering.length; i++)
			{
				var layerkey = this.ordering[i];
				var featureset = this.featuresets[layerkey];
				var menu_item = this.featuresetmenus[layerkey];

				if(($.inArray(layerkey, parsed.soton_layers) > -1) == (featureset.startsVisible()))
				{
					if(featureset.isVisible())
					{
						featureset.hide();
						featureset.visible = false;
						try { menu_item.removeClass("selected"); } catch(err) { }
					}
				}
				else
				{
					if(!(featureset.isVisible()))
					{
						featureset.show();
						featureset.visible = true;
						try { menu_item.addClass("selected"); } catch(err) { }
					}
				}

			}
		}		
	}
	this.formatHash = function(map)
	{
		var center = map.getCenter(),
		    zoom = map.getZoom(),
		    precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
		    layers = []
		    ret = []

		for(var i = 0; i < this.ordering.length; i++)
		{
			var id = this.ordering[i];
			var fs = this.featuresets[id];
			if(fs.isVisible() != fs.startsVisible()) { layers.push(id); }
		}

		ret = [zoom, center.lat.toFixed(precision), center.lng.toFixed(precision)];
		if(layers.length > 0) { ret.push(layers.join(",")); }

		return "#" + ret.join("/");
	}
	this.getIcon = function(url)
	{
		if(url in this.icons)
		{
			return(this.icons[url]);
		}
		this.icons[url] = L.icon({
			iconUrl: url,
			shadowUrl: '/graphics/map-icons/shadow.png',
			iconSize: [32, 37],
			shadowSize: [69, 33],
			iconAnchor: [16, 36],
			popupAnchor: [0, -38],
			shadowAnchor: [16, 33]
		});
		return(this.icons[url]);
	}
	this.start = function()
	{
		for(var i = 0; i < this.ordering.length; i++)
		{
			var id = this.ordering[i];
			var fs = this.featuresets[id];
			fs.init();
			var menu = fs.modifyMenu();
			this.featuresetmenus[id] = menu;
			if(fs.startsVisible())
			{
				fs.show();
				fs.visible = true;
				if(menu != false) { menu.addClass("selected"); }
			}
		}
		var obj = this;
		setInterval(function()
		{
			var hash = location.hash;
			if(hash != obj.lastHash)
			{
				obj.mapMoving = true;
				obj.lastHash = hash;
				obj.hashChanged(map, hash);
				obj.mapMoving = false;
			}
		}, 300);
		this.mapMoving = false;
	}
	this.update = function()
	{
		for(var i = 0; i < this.ordering.length; i++)
		{
			var id = this.ordering[i];
			this.featuresets[id].update();
		}
	}
	this.mapUpdated = function(map)
	{
		if(!(this.mapMoving))
		{
			var newHash = this.formatHash(map);
			this.lastHash = newHash;
			location.replace(newHash);
		}
	}
}

var FSREG = new FeatureSetRegistry()

function FeatureSet()
{
	this.hide = function() { }
	this.show = function() { }
	this.update = function() { }
	this.init = function() { }
	this.trigger = function(uri) { }
	this.title = function() { return("UNTITLED LAYER"); }
	this.description = function() { return(""); }
	this.popupMessage = function() { return ""; }
	this.startsVisible = function() { return false; }
	this.visible = this.startsVisible();
	this.isVisible = function() { return this.visible; }
	this.embedList = function() { return true; }
	this.modifyMenu = function()
	{
		var featureset = this;
		var featuresets_menu = $('.menu-layers');
		var toggle_class = 'menu-layer-item-'+this.id;
		featuresets_menu.each( function(k,v) {
			var menu_item = $("<li></li>");
			var menu_link = $('<a class="' + toggle_class + '" data-toggle-class="' + toggle_class + '"  href="#">' + featureset.title() + ' <span class="glyphicon glyphicon-ok" aria-hidden="true"></span></a>');
			menu_item.append(menu_link);
			$(v).append(menu_item);
		} );

		var menu_items = $("."+toggle_class);

		menu_items.on('click', function()
		{
			// "this" is clicked menu item
			if(featureset.isVisible())
			{
				featureset.hide();
				featureset.visible = false;
				menu_items.removeClass("selected");
			} else {
				featureset.show();
				featureset.visible = true;
				menu_items.addClass("selected");
			}
			if( $(window).width() < 768 ) { 
				$('.navbar-toggle').click();
			}
			FSREG.mapUpdated(map);
			return false;
		});
		return(menu_items);
	}
}

/**
 * Defines a Separator  - purely an aesthetic thing for the Layers menu
 */
function Separator()
{
	FeatureSet.call(this);
	this.embedList = function() { return false; } // We don't want this appearing on the Embed dialog.
	this.modifyMenu = function()
	{
		var featuresets_menu = $('.menu-layers');
		var menu_item = $('<li role="separator" class="divider"></li>');
		featuresets_menu.append(menu_item);
		return(menu_item);
	}
}
Separator.prototype = Object.create(FeatureSet.prototype);

$(document).ready(function()
{
	// Create the map object with some sensible defaults
	map = L.map('map', {
		zoomControl: false,
		center: [24.81, 20.65],
		zoom: 4,
		maxZoom: 20
	});

	// Create the popup open event
	map.on('popupopen', function(e)
	{
		FSREG.update();
	});

	FSREG.start();

	map.on('moveend', function(e)
	{
		FSREG.mapUpdated(map);
	});

	new L.Control.Zoom({ position: 'bottomright' }).addTo(map);

});
