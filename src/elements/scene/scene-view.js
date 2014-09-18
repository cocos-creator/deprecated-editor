(function () {
    Polymer({
        created: function () {
            this.canvas = null;
            this.frameID = -1;

            window.addEventListener('resize', function() {
                this.resize();
            }.bind(this));
        },

        setCanvas: function ( canvas ) {
            // cancel update first
            if ( this.frameID !== -1 ) {
                window.cancelAnimationFrame(this.frameID);
            }

            //
            if ( this.canvas !== null ) {
                this.$.view.removeChild(this.canvas);
            }

            //
            if ( canvas !== null ) {
                this.canvas = canvas;
                this.$.view.appendChild(canvas);
            }

            // start update
            this.frameID = window.requestAnimationFrame(this.update);
        }, 

        showAction: function ( event ) {
            this.resize();
        },

        resize: function () {
        },

        update: function () {
            // TODO: Engine._scene.render(Engine._renderContext);
        },

    });
})();
