/**
 * Defines the Tiles FeatureSet. This allows the user to toggle between map and aerial views
 */
function TilesFeatureSet()
{
	FeatureSet.call(this);
	this.layers = {}
	this.init = function()
	{
		this.layers['map'] = L.tileLayer('https://tiles.flarpyland.com/lite/{z}/{x}/{y}.png', {
		attribution: 'Map data &copy; <a href="http://www.openstreetmap.org/#map=16/50.881000518799/-1.0309200286865" target="_top">OpenStreetMap</a> contributors <a href="http://creativecommons.org/licenses/by-sa/2.0/" target="_top">CC-BY-SA</a>',
		maxZoom: 20
		});

	        this.layers['aerial'] = L.tileLayer('https://tiles.flarpyland.com/sat/{z}/{x}/{y}.png', {
                attribution: 'Map data &copy; <a href="http://www.openstreetmap.org/#map=16/50.881000518799/-1.0309200286865" target="_top">OpenStreetMap</a> contributors <a href="http://creativecommons.org/licenses/by-sa/2.0/" target="_top">CC-BY-SA</a>',
                maxZoom: 20
	        }); // Aerial photography

	        this.layers['null'] = L.tileLayer('/graphics/blank-tile.png', {
                attributionControl: false,
                maxZoom: 20
	        }); // 'Null' image

		map.addLayer(this.layers['map']);
	}
	this.show = function()
	{
		map.addLayer(this.layers['null']).addLayer(this.layers['aerial']).removeLayer(this.layers['map']);
	}
	this.hide = function()
	{
		map.addLayer(this.layers['map']).removeLayer(this.layers['null']).removeLayer(this.layers['aerial']);
	}
	this.title = function() { return("Aerial View"); }
	this.description = function() { return("Toggles between the standard map view and aerial imagery."); }
	this.startsVisible = function() { return false; }
}
TilesFeatureSet.prototype = Object.create(FeatureSet.prototype);
FSREG.addFeatureSet('aerial', new TilesFeatureSet());

// End Tiles FeatureSet
