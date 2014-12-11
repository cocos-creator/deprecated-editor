(function () {
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
                Sandbox.stashScene();
                Fire.Engine.play();
            }
            else {
                Fire.Engine.stop();
                Sandbox.rewindScene();
            }
        },

        pauseAction: function ( event ) {
            event.stopPropagation();
            
            if ( !Fire.Engine.isPaused ) {
                Fire.Engine.pause();
            }
            else {
                Fire.Engine.play();
            }
        },

        stepAction: function ( event ) {
            event.stopPropagation();

            Fire.Engine.step();
        },

    });
})();
