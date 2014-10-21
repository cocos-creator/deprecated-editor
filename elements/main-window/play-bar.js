(function () {
    Polymer({

        playAction: function ( event ) {
            if ( !Fire.Engine.isPlaying ) {
                this.$.play.setAttribute('active','');
                this.setAttribute('active','');
                Fire.Engine.play();
            }
            else {
                this.$.play.removeAttribute('active');
                this.$.pause.removeAttribute('active');
                this.removeAttribute('active');
                Fire.Engine.stop();
            }
        },

        pauseAction: function ( event ) {
            if ( !Fire.Engine.isPaused ) {
                this.$.pause.setAttribute('active','');
                Fire.Engine.pause();
            }
            else {
                this.$.pause.removeAttribute('active');
                Fire.Engine.play();
            }
        },

        stepAction: function ( event ) {
            this.$.pause.setAttribute('active','');
            this.$.play.setAttribute('active','');
            this.setAttribute('active','');
            Fire.Engine.step();
        },

    });
})();
