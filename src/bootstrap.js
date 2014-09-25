// skip "?fireID="
window.onload = function() {
    var remote = require('remote');
    var fireID = JSON.parse(decodeURIComponent(location.search.substr(8)));

    window.FireApp = new FireClient(fireID); 
    window.AssetDB = remote.getGlobal( 'AssetDB@' + fireID ); 
    window.FireConsole = {
        log: function ( text ) { 
            console.log(text); 
            FireApp.command('console:log', text);
        },
        warn: function ( text ) { 
            console.warn(text); 
            FireApp.command('console:warn', text);
        },
        error: function ( text ) { 
            console.error(text); 
            FireApp.command('console:error', text);
        },
        hint: function ( text ) { 
            console.log('%c' + text, "color: blue"); 
            FireApp.command('console:hint', text);
        },
    };
};
