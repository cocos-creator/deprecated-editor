var remote = require('remote');
var assetDBStates = {
    "start-watching": { text: "Start Watching" },
    "watching": { text: "Watching" },
    "stop-watching": { text: "Stop Watching" },
    "syncing": { text: "Syncing" },
    "normal": { text: "Normal" },
    "unknown": { text: "Unknown" },
};

Polymer({
    created: function () {
        this.ipc = new Fire.IpcListener();

        this.version = remote.getGlobal( 'FIRE_VER' );
        this.dbState = "normal";
        this.dbStateText = assetDBStates[this.dbState].text;
    },

    attached: function () {
        this.ipc.on('asset-db:status-changed', function ( status ) {
            var state = assetDBStates[status];
            if ( !state ) {
                status = "unknown";
                state = assetDBStates.unknown;
            }

            this.dbState = status;
            this.dbStateText = state.text;
        }.bind(this) );
    },

    detached: function () {
        this.ipc.clear();
    },
});
