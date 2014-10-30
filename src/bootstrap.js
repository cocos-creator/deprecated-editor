
var remote = require('remote');
var ipc = require('ipc');

Fire.plugins = {};  // TODO: 做成Remote Object，确保全局只有一份?
Fire.gizmos = {};

try {
    // skip "?fireID="
    var fireID = JSON.parse(decodeURIComponent(location.search.substr(8)));

    Fire.merge( Fire, {
        // console
        log: function ( text ) { 
            console.log(text); 
            Fire.command('console:log', text);
        },
        warn: function ( text ) { 
            console.warn(text); 
            Fire.command('console:warn', text);
        },
        error: function ( text ) { 
            console.error(text); 
            Fire.command('console:error', text);
        },
        success: function ( text ) { 
            console.log('%c' + text, "color: green"); 
            Fire.command('console:success', text);
        },
        failed: function ( text ) { 
            console.log('%c' + text, "color: red"); 
            Fire.command('console:failed', text);
        },
        hint: function ( text ) { 
            console.log('%c' + text, "color: blue"); 
            Fire.command('console:hint', text);
        },

        // app
        command: function ( name ) {
            'use strict';
            var args = arguments.length > 1 ? [].slice.call( arguments, 1 ) : [];
            ipc.send.apply( ipc, ['command@' + fireID, name].concat(args) );
        },
        broadcast: function ( name ) {
            'use strict';
            var args = arguments.length > 1 ? [].slice.call( arguments, 1 ) : [];
            ipc.send.apply( ipc, ['broadcast@' + fireID, name].concat(args) );
        },
        rpc: function ( name ) {
            'use strict';
            var args = arguments.length > 1 ? [].slice.call( arguments, 1 ) : [];
            ipc.send.apply( ipc, ['rpc@' + fireID, name].concat(args) );
        },
    });

    Fire.observe = function ( target, enabled ) {
        target._observing = enabled;
        if ( target instanceof Fire.Entity ) {
            for ( var i = 0; i < target._components.length; ++i ) {
                var comp = target._components[i];
                comp._observing = enabled;
            }
        }
    };

    // get remote globals
    Fire.AssetDB = remote.getGlobal( 'AssetDB@' + fireID );
    Fire.MainMenu = remote.getGlobal( 'MainMenu@' + fireID );

    //
    window.onload = function () {
        var key, plugin;
        // init plugins
        for (key in Fire.plugins) {
            plugin = Fire.plugins[key];
            if (plugin.init) {
                plugin.init();
            }
        }
        // register menus
        var isMainWebContext = true;
        if (isMainWebContext) {
            for (key in Fire.plugins) {
                plugin = Fire.plugins[key];
                if (plugin.mainMenu) {
                    Fire.MainMenu.addTemplate(plugin.mainMenu.path, plugin.mainMenu.template);
                }
            }
        }
    };
}
catch ( error ) {
    window.onload = function () {
        var currentWindow = remote.getCurrentWindow();
        currentWindow.setSize(800, 600);
        currentWindow.center();
        currentWindow.show();
        currentWindow.openDevTools();
        console.error(error.stack || error);
    };
}
