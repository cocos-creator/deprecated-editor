var Ipc = require('ipc');

function IpcListener () {
    this.listeningIpcs = [];
}

IpcListener.prototype.on = function (message, callback) {
    Ipc.on( message, callback );
    this.listeningIpcs.push( [message, callback] );
};

IpcListener.prototype.clear = function () {
    for (var i = 0; i < this.listeningIpcs.length; i++) {
        var pair = this.listeningIpcs[i];
        Ipc.removeListener( pair[0], pair[1] );
    }
    this.listeningIpcs.length = 0;
};

Fire.IpcListener = IpcListener;
