// skip "?fireID="
window.onload = function() {
    var remote = require('remote');
    var ipc = require('ipc');

    try {
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
        Fire.AssetDB = remote.getGlobal( 'AssetDB@' + fireID ); 
        Fire.observe = function ( target, enabled ) {
            target._observing = enabled;
            if ( target instanceof Fire.Entity ) {
                for ( var i = 0; i < target._components.length; ++i ) {
                    var comp = target._components[i];
                    comp._observing = enabled;
                }
            }
        };
        Fire.Selection = remote.getGlobal( 'Selection' );
    }
    catch ( error ) {
        var currentWindow = remote.getCurrentWindow();
        currentWindow.setSize(800, 600);
        currentWindow.center();
        currentWindow.show();
        currentWindow.openDevTools();
        console.error(error.stack || error);
    }
};
