(function () {
    Polymer({

        playAction: function ( event ) {
            event.stopPropagation();

            if ( !Fire.Engine.isPlaying ) {
                this.$.play.active = true;
                this.$.group.active = true;
                //
                Sandbox.stashScene();
                Fire.Engine.play();
            }
            else {
                this.$.play.active = false;
                this.$.pause.active = false;
                this.$.group.active = false;
                //
                Fire.Engine.stop();
                Sandbox.rewindScene();
            }
        },

        pauseAction: function ( event ) {
            event.stopPropagation();
            
            if ( !Fire.Engine.isPaused ) {
                this.$.pause.active = true;
                Fire.Engine.pause();
            }
            else {
                this.$.pause.active = false;
                Fire.Engine.play();
            }
        },

        stepAction: function ( event ) {
            event.stopPropagation();

            this.$.pause.active = true;
            this.$.play.active = true;
            this.$.group.active = true;
            Fire.Engine.step();
        },

    });
})();
