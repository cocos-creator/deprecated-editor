var Ipc = require('ipc');
var Weak = require('weak');

/**
 * @param {object} [binder=null] - The target object to bind, it will be set as the This argument for all callbacks.
 * NOTE: The binder and its callbacks will internally referenced as weak references to avoid memory leak.
 *       If the IpcListener is garbage collected, all callbacks can be removed automatically.
 */
function IpcListener (binder) {
    this.ipcCbToEvent = new Map();
    this.binder = binder;

    // if garbage collected, remove all callback
    //Weak(this, removeAllCallbacks);
}

function removeAllCallbacks (ipcListener) {
    console.log('clear');
    ipcListener.clear();
}

Object.defineProperty(IpcListener.prototype, 'binder', {
    get: function () {
        return this._binder ? Weak.get(this._binder) : this;
    },
    set: function (value) {
        this._binder = value ? Weak(value) : null;
    }
});

IpcListener.prototype.on = function (message, callback) {
    if (!callback) {
        return;
    }
    var self = this;
    weakCb = Weak(callback);
    function cbWrapper () {
        var cb = Weak.get(weakCb);
        if (cb) {
            cb.apply(self.binder, arguments);
        }
        else {
            var event = self.ipcCbToEvent.get(cbWrapper);
            Ipc.removeListener(event, cbWrapper);
            self.ipcCbTzoEvent.delete(cbWrapper);
        }
    }
    Ipc.on(message, cbWrapper);
    this.ipcCbToEvent.set(cbWrapper, message);
};

IpcListener.prototype.clear = function () {
    // clear ipc
    // jshint esnext: true
    for (var cb of this.ipcCbToEvent) {
        var event = this.ipcCbToEvent.get(cb);
        Ipc.removeListener(event, cb);
    }
    // jshint esnext: false
    this.ipcCbToEvent.clear();
};

Fire.IpcListener = IpcListener;
