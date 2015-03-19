var remote = require('remote');
var watchStates = {
    "start-watching": { state: "starting", text: "Start Watching", icon: "fa-eye" },
    "watch-on": { state: "on", text: "Watching", icon: "fa-eye" },
    "stop-watching": { state: "stopping", text: "Stop Watching", icon: "fa-eye-slash" },
    "watch-off": { state: "off", text: "Sleep", icon: "fa-eye-slash" },
    "unknown": { state: "unknown", text: "Unknown", icon: "fa-eye-slash" },
};

Polymer({
    created: function () {
        this.ipc = new Fire.IpcListener();

        this.version = remote.getGlobal( 'FIRE_VER' );
        this.watchState = watchStates["watch-off"];
        this.dbState = { state: "normal", task: "none" };
        this.showSyncingWave = false;

        this._syncingTimeout = null;
    },

    attached: function () {
        this.ipc.on('asset-db:watch-changed', function ( detail ) {
            var state = detail.state;
            var expect = watchStates[state];
            if ( !expect ) {
                this.watchState = watchStates.unknown;
                return;
            }

            this.watchState = expect;
        }.bind(this) );

        this.ipc.on('asset-db:syncing', function ( detail ) {
            var taskName = detail.taskName;
            this.dbState = { state: "syncing", task: taskName };

            if ( this._syncingTimeout === null ) {
                this._syncingTimeout = setTimeout( function () {
                    this.showSyncingWave = true;
                }.bind(this), 500 );
            }
        }.bind(this) );

        this.ipc.on('asset-db:synced', function () {
            this.dbState = { state: "normal", task: "none" };
            this.showSyncingWave = false;

            if ( this._syncingTimeout ) {
                clearTimeout(this._syncingTimeout);
                this._syncingTimeout = null;
            }
        }.bind(this) );
    },

    detached: function () {
        this.ipc.clear();
    },
});
