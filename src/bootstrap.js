// skip "?fireID="
window.onload = function() {
    var remote = require('remote');
    var ipc = require('ipc');
    var fireID = JSON.parse(decodeURIComponent(location.search.substr(8)));

    var Fire = {
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
        hint: function ( text ) { 
            console.log('%c' + text, "color: blue"); 
            Fire.command('console:hint', text);
        },

        // app
        command: function ( name, args ) {
            ipc.send( 'command@' + fireID, name, args );
        },
        windowCommand: function ( name, args ) {
            ipc.send( 'window.command@' + fireID, name, args );
        },
    };
    Fire.AssetDB = remote.getGlobal( 'AssetDB@' + fireID ); 

    window.Fire = Fire;
};
