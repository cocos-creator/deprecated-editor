// skip "?fireID="
window.onload = function() {
    var remote = require('remote');
    var fireID = JSON.parse(decodeURIComponent(location.search.substr(8)));

    window.FireApp = new FireClient(fireID); 
    window.AssetDB = remote.getGlobal( 'AssetDB@' + fireID ); 
    var remoteConsole = remote.getGlobal( 'FireConsole@' + fireID ); 
    window.FireConsole = {
        log: function ( text ) { console.log(text); remoteConsole.log(text); },
        warn: function ( text ) { console.warn(text); remoteConsole.warn(text); },
        error: function ( text ) { console.error(text); remoteConsole.error(text); },
        hint: function ( text ) { console.hint(text); remoteConsole.hint(text); },
    };
};
