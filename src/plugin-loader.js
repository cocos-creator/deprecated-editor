
var Path = require('path');

/**
 * Implement PluginLoader for editor-window
 */
function PluginLoader () {
    Fire._PluginLoaderBase.apply(this, arguments);
}
Fire.JS.extend(PluginLoader, Fire._PluginLoaderBase);

PluginLoader.prototype.onAfterUnload = function () {
    // reload to ensure context clear and menu unloaded
    Fire._Sandbox.reloadScripts(true);
};
//PluginLoader.prototype._addMenuImpl = function (path, msg) {
//    Fire.MainMenu.addItem(path, msg);
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
        load('meta');
    });
};

PluginLoader.prototype._unloadImpl = function (plugin) {
    var cache = Fire._Sandbox.nodeJsRequire.cache;

    // unload meta
    PluginLoader.parseMeta(plugin, function (asset) {
        var metaType = ['meta'];
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

Fire._builtinPluginLoader = new PluginLoader('editor-window builtin plugins');
Fire._globalPluginLoader = new PluginLoader('editor-window global plugins');
Fire._projectPluginLoader = new PluginLoader('editor-window project plugins');

var TypeToLoader = {
    'builtin plugins': Fire._builtinPluginLoader,
    'global plugins': Fire._globalPluginLoader,
    'project plugins': Fire._projectPluginLoader,
};

Ipc.on(MSG_LOAD, function (pkg, pkgPath, type) {
    var loader = TypeToLoader[type];
    if (loader) {
        loader.load(pkg, pkgPath);
    }
    else {
        Fire.error('Unknown plugin type to load', type);
    }
});

Ipc.on(MSG_UNLOAD, function (name, type) {
    var loader = TypeToLoader[type];
    if (loader) {
        loader.unload(name);
    }
    else {
        Fire.error('Unknown plugin type to unload', type);
    }
});
