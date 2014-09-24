(function () {
    Polymer({

        playAction: function ( event ) {
            if ( !FIRE.Engine.isPlaying ) {
                this.$.play.setAttribute('active','');
                this.setAttribute('active','');
                FIRE.Engine.play();
            }
            else {
                this.$.play.removeAttribute('active');
                this.$.pause.removeAttribute('active');
                this.removeAttribute('active');
                FIRE.Engine.stop();
            }
        },

        pauseAction: function ( event ) {
            if ( !FIRE.Engine.isPaused ) {
                this.$.pause.setAttribute('active','');
                FIRE.Engine.pause();
            }
            else {
                this.$.pause.removeAttribute('active');
                FIRE.Engine.play();
            }
        },

        stepAction: function ( event ) {
            this.$.pause.setAttribute('active','');
            this.$.play.setAttribute('active','');
            this.setAttribute('active','');
            FIRE.Engine.step();
        },

    });
})();
