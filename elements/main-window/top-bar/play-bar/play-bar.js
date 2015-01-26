Polymer({

    created: function () {
        this.ipc = new Fire.IpcListener();
    },

    attached: function () {
        this.ipc.on('engine:played', this.onEnginePlayed.bind(this));
        this.ipc.on('engine:stopped', this.onEngineStopped.bind(this));
        this.ipc.on('engine:paused', this.onEnginePaused.bind(this));
    },

    detached: function () {
        this.ipc.clear();
    },

    onEnginePlayed: function (continued) {
        if (continued) {
            this.$.pause.active = false;
        }
        else {
            this.$.play.active = true;
            this.$.group.active = true;
        }
    },

    onEngineStopped: function () {
        this.$.play.active = false;
        this.$.pause.active = false;
        this.$.group.active = false;
    },

    onEnginePaused: function () {
        this.$.pause.active = true;
    },

    playAction: function ( event ) {
        event.stopPropagation();

        if ( !Fire.Engine.isPlaying ) {
            Fire._Sandbox.stashScene();
            if (this.$.pause.active) {
                Fire.Engine.step();
            }
            else {
                Fire.Engine.play();
            }
        }
        else {
            Fire.Engine.stop();
            Fire._Sandbox.rewindScene();
        }
    },

    pauseAction: function ( event ) {
        event.stopPropagation();

        if (Fire.Engine.isPlaying) {
            if (Fire.Engine.isPaused) {
                Fire.Engine.play();
            }
            else {
                Fire.Engine.pause();
            }
        }
        else {
            this.$.pause.active = !this.$.pause.active;
        }
    },

    stepAction: function ( event ) {
        event.stopPropagation();

        if ( !Fire.Engine.isPlaying ) {
            // before play
            Fire._Sandbox.stashScene();
        }
        Fire.Engine.step();
    },

});
