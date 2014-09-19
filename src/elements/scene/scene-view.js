(function () {
    Polymer({
        created: function () {
            this.renderContext = null;
            this.frameID = -1;

            window.addEventListener('resize', function() {
                this.resize();
            }.bind(this));
        },

        setRenderContext: function ( renderContext ) {
            // cancel update first
            if ( this.frameID !== -1 ) {
                window.cancelAnimationFrame(this.frameID);
            }

            if ( this.renderContext !== null ) {
                this.$.view.removeChild(this.renderContext.canvas);
            }

            this.renderContext = renderContext;

            if ( this.renderContext !== null ) {
                this.$.view.appendChild(renderContext.canvas);

                // start update
                this.frameID = window.requestAnimationFrame(this.update.bind(this));
            }
        }, 

        showAction: function ( event ) {
            this.resize();
        },

        resize: function () {
            if ( this.renderContext !== null ) {
                this.renderContext.size = new FIRE.Vec2( this.$.view.clientWidth, 
                                                         this.$.view.clientHeight );
            }
        },

        update: function () {
            FIRE.Engine._scene.render(this.renderContext);
        },

    });
})();
