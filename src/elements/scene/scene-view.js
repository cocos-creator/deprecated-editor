(function () {
    Polymer({
        created: function () {
            this.canvas = null;

            window.addEventListener('resize', function() {
                this.resize();
            }.bind(this));
        },

        setCanvas: function ( canvas ) {
            if ( this.canvas !== null ) {
                this.$.view.removeChild(this.canvas);
            }

            if ( canvas !== null ) {
                this.canvas = canvas;
                this.$.view.appendChild(canvas);
            }
        }, 

        showAction: function ( event ) {
            this.resize();
        },

        resize: function () {
        },

    });
})();
