var Path = require('path');

/**
 * Implements interfaces for plugins.
 */
function PluginContext (name, pkg, path, _mainPath) {
    /**
     * @property {object} - the json object parsed from package.json
     */
    this.package = pkg;

    /**
     * @property {string} - the name of the plugin
     */
    this.name = name;

    /**
     * @property {string} - the absolute file system path of the plugin's directory
     */
    this.path = path;

    this._mainPath = _mainPath;
}

PluginContext.prototype.openWindow = function (winName) {
    var fb = this.config;
    var win = fb.windows && fb.windows[winName];
    if (win) {
        var options = win.options;
        if (win.url) {
            var url = Path.resolve(this.path, win.url);
            Fire.sendToCore('plugin:window:open', this.name, winName, options, url);
        }
        else {
            Fire.error('Failed to get "%s"\'s "url" from %s\'s package.json.', winName, this.name);
        }
    }
    else {
        Fire.error('Can not find the %s\'s "%s" window in the package.json.', this.name, winName);
    }
};

//PluginContext.prototype.closeAllWindow = function () {
//    var fb = this.config;
//    for (var winName in fb.windows) {
//        Fire.sendToCore('plugin:window:close', this.name, winName);
//    }
//};

Object.defineProperty(PluginContext.prototype, 'config', {
    get: function () {
        var fb = this.package["fireball-x"];
        console.assert(fb);
        return fb;
    }
});

Fire._PluginContext = PluginContext;
