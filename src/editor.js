(function () {
    // skip "?fireID="
    // var fireID = JSON.parse(decodeURIComponent(location.search.substr(8)));
    var fireID = -1;

    // format: "?foo=bar&hell=world"
    // skip "?"
    var queryString = decodeURIComponent(location.search.substr(1));
    var queryList = queryString.split('&');
    for ( var i = 0; i < queryList.length; ++i ) {
        var pair = queryList[i].split("=");
        if ( pair[0] === "fireID" ) {
            fireID = parseInt(pair[1]);
        }
    }

    //
    var remote = require('remote');
    var ipc = require('ipc');

    //
    Fire.mixin( Fire, {
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
            if ( typeof name === 'string' ) {
                var args = [].slice.call( arguments );
                ipc.send.apply( ipc, ['command@' + fireID].concat( args ) );
            }
            else {
                Fire.error('The name of command must be provided');
            }
        },
        broadcast: function ( name ) {
            'use strict';
            if ( typeof name === 'string' ) {
                var args = [].slice.call( arguments );
                ipc.send.apply( ipc, ['broadcast@' + fireID].concat( args ) );
            }
            else {
                Fire.error('The name of broadcast must be provided');
            }
        },
        broadcastOthers: function ( name ) {
            'use strict';
            if ( typeof name === 'string' ) {
                var args = [].slice.call( arguments );
                ipc.send.apply( ipc, ['broadcast-others@' + fireID].concat( args ) );
            }
            else {
                Fire.error('The name of broadcastOthers must be provided');
            }
        },
        rpc: function ( name ) {
            'use strict';
            if ( typeof name === 'string' ) {
                var args = [].slice.call( arguments );
                ipc.send.apply( ipc, ['rpc@' + fireID].concat( args ) );
            }
            else {
                Fire.error('The name of rpc must be provided');
            }
        },
    });

    Fire.observe = function ( target, enabled ) {
        if ( !target.isValid ) {
            return;
        }
        target._observing = enabled;
        if ( target instanceof Fire.Entity ) {
            for ( var i = 0; i < target._components.length; ++i ) {
                var comp = target._components[i];
                comp._observing = enabled;
            }
        }
    };

    Fire.hintObject = function ( target ) {
        if ( target instanceof Fire.Entity ) {
            Fire.broadcast('entity:hint', target.id );
        }
        else if ( target instanceof Fire.Component ) {
            Fire.broadcast('entity:hint', target.entity.id );
        }
        else if ( target instanceof Fire.Asset ) {
            Fire.broadcast('asset:hint', target._uuid );
        }
    };

    Fire.browseObject = function ( type ) {
        if ( Fire.isChildClassOf( type, Fire.Entity ) ) {
            Fire.warning('TODO: ask johnny how to do this.');
        }
        else if ( Fire.isChildClassOf( type, Fire.Component ) ) {
            Fire.warning('TODO: ask johnny how to do this.');
        }
        else if ( Fire.isChildClassOf( type, Fire.Asset ) ) {
            var typename = Fire.getClassName(type);
            Fire.command('window:open', 'quick-assets', 'fire://static/quick-assets.html', {
                title: "Quick Assets",
                width: 800, 
                height: 600,
                show: true,
                resizable: true,
                query: { typename: typename },
            } );
        }
    };

    // get remote globals
    Fire.AssetDB = remote.getGlobal( 'AssetDB@' + fireID );
    Fire.MainMenu = remote.getGlobal( 'MainMenu@' + fireID );

    //
    Fire.plugins = {}; // TODO: 做成Remote Object，确保全局只有一份?
    Fire.gizmos = {};

    // init editor-shares after Fire inited
    Fire.Selection.registerCommands(ipc);
})();
