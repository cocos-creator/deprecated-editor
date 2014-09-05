(function () {
    Polymer({

        playAction: function ( event ) {
            this.$.play.setAttribute('active','');
            this.setAttribute('active','');
        },

        pauseAction: function ( event ) {
            if ( this.$.pause.getAttribute('active') !== null ) {
                this.$.pause.removeAttribute('active');
            }
            else {
                this.$.pause.setAttribute('active','');
            }
        },

        stepAction: function ( event ) {
        },

    });
})();
