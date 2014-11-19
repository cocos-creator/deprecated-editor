(function () {
    Polymer({
        created: function () {
            this.icon = new Image();
            this.icon.src = "fire://static/img/plugin-game.png";

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

            if ( this.renderContext !== null ) {
                this.$.view.appendChild(this.renderContext.canvas);
            }
        }, 

        showAction: function ( event ) {
            this.resize();
        },

        resize: function () {
            if ( this.renderContext !== null ) {
                this.renderContext.size = new Fire.Vec2( this.$.view.clientWidth, 
                                                         this.$.view.clientHeight );

                Fire.Engine._scene.render(this.renderContext);
            }
        },

    });
})();
