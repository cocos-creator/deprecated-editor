var Path = require('path');
var Ipc = require('ipc');

var MSG_LOAD = 'plugin:load';
var MSG_UNLOAD = 'plugin:unload';


var nameToPlugin = {};

Ipc.on(MSG_LOAD, function (package, path) {
    var name = package.name;
    var plugin = package["fireball-x"];
    if ( !plugin ) {
        return;
    }
    if ( plugin.main ) {
        if (typeof plugin.main !== 'string') {
            Fire.warn('The "main" data in package.json must be a string');
        }

        var base = Path.dirname(path);
        var mainPath = Path.resolve(base, plugin.main);
        var main;   // plugin's main file
        try {
            console.log('loading', mainPath);
            main = require(mainPath);
        }
        catch (e) {
            Fire.error('Failed to load the %s\'s "main" file from %s.\n%s', name, mainPath, e);
            return;
        }

        nameToPlugin[name] = {
            package: package,
            main: mainPath,
        };

        if (main) {
            main.load();
        }
    }
});

Ipc.on(MSG_UNLOAD, function (name) {
    var plugin = nameToPlugin[name];
    if (!plugin) {
        Fire.error('Plugin not loaded');
        return;
    }
    var require = Fire._Sandbox.nodeJsRequire;
    var module = require.cache[plugin.main];
    if (!module) {
        Fire.error('Module not found');
        return;
    }
    var main = module && module.exports;
    if (main) {
        main.unload();
    }
    //Ipc.emit(name + ':unload');
    delete nameToPlugin[name];

    // unload script
    delete require.cache[plugin.main];
});
