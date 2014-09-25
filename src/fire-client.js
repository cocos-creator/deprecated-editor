var FireClient = (function () {
    var ipc = require('ipc');

    function FireClient (id) {
        this.fireID = id;
    }

    FireClient.prototype.command = function ( name, args ) {
        ipc.send( 'command@' + this.fireID, name, args );
    }; 

    FireClient.prototype.windowCommand = function ( name, args ) {
        ipc.send( 'window.command@' + this.fireID, name, args );
    }; 

    return FireClient;
})();
