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
    },

    attached: function () {
        this.ipc.on('asset-db:watch-changed', function ( state ) {
            var expect = watchStates[state];
            if ( !expect ) {
                this.watchState = watchStates.unknown;
                return;
            }

            this.watchState = expect;
        }.bind(this) );

        this.ipc.on('asset-db:syncing', function ( task ) {
            this.dbState = { state: "syncing", task: task };
        }.bind(this) );

        this.ipc.on('asset-db:synced', function () {
            this.dbState = { state: "normal", task: "none" };
        }.bind(this) );
    },

    detached: function () {
        this.ipc.clear();
    },
});
