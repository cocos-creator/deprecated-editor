var FireApp = (function () {
    var ipc = require('ipc');
    var remote = require('remote');

    function FireApp (id) {
        this.fireID = id;
        this.assetDB = remote.getGlobal( 'assetDB@' + this.fireID ); 
    }

    FireApp.prototype.command = function ( name, args ) {
        ipc.send( 'command@' + this.fireID, name, args );
    }; 

    FireApp.prototype.windowCommand = function ( name, args ) {
        ipc.send( 'window.command@' + this.fireID, name, args );
    }; 

    return FireApp;
})();
