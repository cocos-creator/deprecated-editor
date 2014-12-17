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
            Fire.sendToCore('console:log', text);
        },
        warn: function ( text ) { 
            console.warn(text); 
            Fire.sendToCore('console:warn', text);
        },
        error: function ( text ) { 
            console.error(text); 
            Fire.sendToCore('console:error', text);
        },
        success: function ( text ) { 
            console.log('%c' + text, "color: green"); 
            Fire.sendToCore('console:success', text);
        },
        failed: function ( text ) { 
            console.log('%c' + text, "color: red"); 
            Fire.sendToCore('console:failed', text);
        },
        info: function ( text ) { 
            console.log('%c' + text, "color: blue"); 
            Fire.sendToCore('console:info', text);
        },
        
        // messages
        
        /**
        * Send message to editor-core, which is so called as main app, or atom shell's browser side.
        * @param {string} message - the message to send
        * @param {...*} [arg] - whatever arguments the message needs
        */
        sendToCore: function ( message ) {
            'use strict';
            if ( typeof message === 'string' ) {
                var args = [].slice.call( arguments );
                ipc.send.apply( ipc, ['send2core@' + fireID].concat( args ) );
            }
            else {
                Fire.error('The message must be provided');
            }
        },
        
        /**
        * Broadcast message to all pages.
        * The page is so called as atom shell's web side. Each application window is an independent page and has its own JavaScript context.
        * @param {string} message - the message to send
        * @param {...*} [arg] - whatever arguments the message needs
        * @param {object} [options] - you can indicate the options such as Fire.SelfExcluded
        */
        sendToPages: function ( message ) {
            'use strict';
            if ( typeof message === 'string' ) {
                var args = [].slice.call( arguments );
                ipc.send.apply( ipc, ['send2pages@' + fireID].concat( args ) );
            }
            else {
                Fire.error('The message must be provided');
            }
        },
        
        /**
        * Broadcast message to all pages and editor-core
        * @param {string} message - the message to send
        * @param {...*} [arg] - whatever arguments the message needs
        * @param {object} [options] - you can indicate the options such as Fire.SelfExcluded
        */
        sendToAll: function ( message ) {
            'use strict';
            if ( typeof message === 'string' ) {
                var args = [].slice.call( arguments );
                ipc.send.apply( ipc, ['send2all@' + fireID].concat( args ) );
            }
            else {
                Fire.error('The message must be provided');
            }
        },
        
        command: function () {
            Fire.warn('Fire.command is deprecated, use Fire.sendToCore please.');
            Fire.sendToCore.apply(this, arguments);
        },
        broadcast: function ( name ) {
            Fire.warn('Fire.broadcast is deprecated, use Fire.sendToPages please.');
            Fire.sendToPages.apply(this, arguments);
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
            Fire.sendToPages('entity:hint', target.id );
        }
        else if ( target instanceof Fire.Component ) {
            Fire.sendToPages('entity:hint', target.entity.id );
        }
        else if ( target instanceof Fire.Asset ) {
            Fire.sendToPages('asset:hint', target._uuid );
        }
    };
    
    Fire.browseObject = function ( type ) {
        if ( Fire.isChildClassOf( type, Fire.Entity ) ) {
            Fire.warn('TODO: ask johnny how to do this.');
        }
        else if ( Fire.isChildClassOf( type, Fire.Component ) ) {
            Fire.warn('TODO: ask johnny how to do this.');
        }
        else if ( Fire.isChildClassOf( type, Fire.Asset ) ) {
            var typename = Fire.getClassName(type);
            Fire.sendToCore('window:open', 'quick-assets', 'fire://static/quick-assets.html', {
                title: "Quick Assets",
                width: 812, 
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
    Fire.Selection.registerMessages(ipc);
})();
