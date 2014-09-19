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

            if ( this.renderContext !== null ) {
                // create editor camera
                if ( this.renderContext.camera === null ) {
                    var cameraEnt = new FIRE.Entity();
                    cameraEnt._objFlags |= FIRE.ObjectFlags.EditorOnly;
                    var camera = cameraEnt.addComponent(new FIRE.Camera());
                    camera.background = new FIRE.Color(0, 0.5, 1.0);
                    this.renderContext.camera = camera;
                }

                this.$.view.appendChild(this.renderContext.canvas);

                // start update
                window.requestAnimationFrame(this.update.bind(this));
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
            if ( this.renderContext ) {
                FIRE.Engine._scene.render(this.renderContext);
            }

            window.requestAnimationFrame(this.update.bind(this));
        },

    });
})();
