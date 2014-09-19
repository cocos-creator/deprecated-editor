(function () {
    Polymer({
        created: function () {
            this.renderContext = null;

            window.addEventListener('resize', function() {
                this.resize();
            }.bind(this));
        },

        setRenderContext: function ( renderContext ) {
            if ( this.renderContext !== null ) {
                this.$.view.removeChild(this.renderContext.canvas);
            }

            this.renderContext = renderContext;

            if ( renderContext !== null ) {
                this.$.view.appendChild(renderContext.canvas);
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

    });
})();
