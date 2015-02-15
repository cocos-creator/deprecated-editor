
var Path = require('path');

/**
 * Implement PluginLoader for editor-window
 */
function PluginLoader () {
    Fire._PluginLoaderBase.apply(this, arguments);
}
Fire.extend(PluginLoader, Fire._PluginLoaderBase);

PluginLoader.prototype.onAfterUnload = function () {
    // reload to ensure context clear and menu unloaded
    Fire._Sandbox.reloadScripts(true);
};
//PluginLoader.prototype._addMenuImpl = function (path, msg) {
//    Fire.MainMenu.addCommandItem(path, msg);
//};
//PluginLoader.prototype._getRequireCacheImpl = function () {
//    return Fire._Sandbox.nodeJsRequire.cache;
//};

PluginLoader.prototype._loadImpl = function (plugin) {
    // register meta
    PluginLoader.parseMeta(plugin, function (asset) {
        console.assert(asset.meta);
        console.assert(asset.pattern);
        function load (name) {
            if (asset[name]) {
                var scriptPath = Path.resolve(plugin.path, asset[name]);
                var script;
                try {
                    script = require(scriptPath);
                }
                catch (e) {
                    Fire.error('Failed to load %s script from %s.\n%s', name, scriptPath, e);
                    return null;
                }
                return script;
            }
        }
        function loadToMeta (name) {
            var script = load(name);
            if (script) {
                meta.prototype[name] = script;
            }
        }
        var meta = load('meta');
        if (meta) {
            loadToMeta('inspector');
        }
    });
};

PluginLoader.prototype._unloadImpl = function (plugin) {
    var cache = Fire._Sandbox.nodeJsRequire.cache;

    // unload meta
    PluginLoader.parseMeta(plugin, function (asset) {
        var metaType = ['inspector', 'meta'];
        for (var index in metaType ) {
            var name = metaType[index];
            if (asset[name]) {
                var scriptPath = Path.resolve(plugin.path, asset[name]);
                var module = cache[scriptPath];
                if ( !module ) {
                    Fire.error('Module not found');
                }
                delete cache[scriptPath];
            }
        }
    });
};

// Instantiate PluginLoader

var Ipc = require('ipc');

var MSG_LOAD = 'plugin:load';
var MSG_UNLOAD = 'plugin:unload';

Fire._pluginLoader = new PluginLoader('editor-window plugins');

Ipc.on(MSG_LOAD, function (pkg, pkgPath) {
    Fire._pluginLoader.load(pkg, pkgPath);
});

Ipc.on(MSG_UNLOAD, function (name) {
    Fire._pluginLoader.unload(name);
});
