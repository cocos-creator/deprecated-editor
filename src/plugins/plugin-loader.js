var Path = require('path');
var Ipc = require('ipc');

var PluginContext = Fire._PluginContext;

var MSG_LOAD = 'plugin:load';
var MSG_UNLOAD = 'plugin:unload';


var nameToPlugin = {};  // name to plugin context

var launched = false;

var pluginLoader = {
    // load all registered plugins
    load: function () {
        for (var name in nameToPlugin) {
            doLoad(nameToPlugin[name]);
        }
        launched = true;
    },

    // unload all registered plugins, but keep them registered
    unload: function () {
        for (var name in nameToPlugin) {
            doUnload(nameToPlugin[name]);
        }
    },

    name : 'user plugins'
};

Ipc.on(MSG_LOAD, function (pkg, pkgPath) {
    var name = pkg.name;
    var fb = pkg["fireball-x"];
    if ( !fb ) {
        // just resource package, not plugin
        return;
    }
    var path = Path.dirname(pkgPath);
    var mainPath = '';
    if (fb.main) {
        if (typeof fb.main === 'string') {
            mainPath = Path.resolve(path, fb.main);
        }
        else {
            Fire.warn('The "main" data in package.json must be a string');
        }
    }

    // register
    var plugin = new PluginContext(name, pkg, path, mainPath);
    nameToPlugin[name] = plugin;

    // if already launched, load immediately
    if ( launched ) {
        doLoad(plugin);
    }
});

Ipc.on(MSG_UNLOAD, function (name) {
    var plugin = nameToPlugin[name];
    if (plugin) {
        // unload
        doUnload(name);
        // deregister
        delete nameToPlugin[name];
        // reload to ensure context clear and menu unloaded
        Fire._Sandbox.reloadScripts();
    }
    else {
        Fire.error('Plugin not loaded:', name);
    }
});

function doLoad (plugin) {
    //console.trace('load', plugin.name);

    // add menu
    addMenu(plugin.package["fireball-x"].menus);

    // load script
    if (plugin._mainPath) {
        var main;   // plugin's main module
        try {
            main = require(plugin._mainPath);
        }
        catch (e) {
            Fire.error('Failed to load the %s\'s "main" file from %s.\n%s', plugin.name, plugin._mainPath, e);
            return;
        }
        if (main && main.load) {
            main.load(plugin);
        }
    }
}

function doUnload (plugin) {
    //console.trace('unload', plugin.name);

    // unload script
    if (plugin._mainPath) {
        var require = Fire._Sandbox.nodeJsRequire;
        var module = require.cache[plugin._mainPath];
        if (module) {
            var main = module && module.exports;
            if (main && main.unload) {
                main.unload(plugin);
            }
        }
        else {
            Fire.error('Module not found');
        }
        delete require.cache[plugin._mainPath];
    }

    //plugin.closeAllWindow();
}

function addMenu (menus) {
    if ( !menus ) {
        return;
    }
    if ( !Array.isArray(menus) ) {
        Fire.warn('The "fireball-x/menus" of package.json must be an Array of Objects');
        return;
    }
    for (var i = 0; i < menus.length; i++) {
        var menu = menus[i];
        var path = menu.path;
        if ( !path ) {
            Fire.warn('Invalid path of menu item');
            return;
        }
        var msg = menu.message;
        if ( !msg ) {
            Fire.warn('Invalid message of menu item');
            return;
        }
        Fire.MainMenu.addCommandItem(path, msg);
    }
}

Fire._PluginLoader = pluginLoader;
