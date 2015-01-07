var Path = require('path');
var Ipc = require('ipc');

var MSG_LOAD = 'plugin:load';
var MSG_UNLOAD = 'plugin:unload';

/**
 * name: {
 *     package: package,
 *     main: mainPath,
 * }
 */
var nameToPlugin = {};

var launched = false;

var pluginLoader = {
    // load all registered plugins
    load: function () {
        for (var name in nameToPlugin) {
            var plugin = nameToPlugin[name];
            doLoad(name, plugin.package, plugin.main);
        }
        launched = true;
    },

    // unload all registered plugins, but keep them registered
    unload: function () {
        for (var name in nameToPlugin) {
            doUnload(name);
        }
    },

    name : 'user plugins'
};

Ipc.on(MSG_LOAD, function (pkg, path) {
    var name = pkg.name;
    var fb = pkg["fireball-x"];
    if ( !fb ) {
        return;
    }
    if ( fb.main ) {
        if (typeof fb.main !== 'string') {
            Fire.warn('The "main" data in package.json must be a string');
        }
        var mainPath = Path.resolve(Path.dirname(path), fb.main);

        // register
        nameToPlugin[name] = {
            'package': pkg,
            main: mainPath,
        };

        // if already launched, load immediately
        if ( launched ) {
            doLoad(name, pkg, mainPath);
        }
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
        Fire.error('Plugin not loaded');
    }
});

function doLoad (name, pkg, mainPath) {
    //console.trace('load', name);

    var main;   // plugin's main file
    try {
        main = require(mainPath);
    }
    catch (e) {
        Fire.error('Failed to load the %s\'s "main" file from %s.\n%s', name, mainPath, e);
        return;
    }

    // init
    addMenu(pkg["fireball-x"].menus);

    if (main) {
        main.load();
    }
}

function doUnload (name) {
    //console.trace('unload', name);

    var plugin = nameToPlugin[name];
    var require = Fire._Sandbox.nodeJsRequire;
    var module = require.cache[plugin.main];
    if (!module) {
        Fire.error('Module not found');
        return;
    }

    // unload

    var main = module && module.exports;
    if (main) {
        main.unload();
    }

    // unload script

    delete require.cache[plugin.main];
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
