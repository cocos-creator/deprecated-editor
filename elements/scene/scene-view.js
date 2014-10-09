(function () {
    Polymer({
        created: function () {
            this.renderContext = null;
        },

        init: function () {
            this.renderContext = Fire.Engine.createSceneView( this.clientWidth, 
                                                              this.clientHeight,
                                                              this.$.canvas );
            if ( this.renderContext !== null ) {
                // create editor camera
                if ( this.renderContext.camera === null ) {
                    // TODO: add this code to EditorUtils
                    var cameraEnt = new Fire.Entity.createWithFlags('Scene Camera', 
                                        Fire._ObjectFlags.SceneGizmo | Fire._ObjectFlags.EditorOnly);
                    var camera = cameraEnt.addComponent(Fire.Camera);
                    this.renderContext.camera = camera;
                    // NOTE: background setup must after camera set to render context
                    camera.background = new Fire.Color(0.4, 0.4, 0.4);
                }

                // start update
                window.requestAnimationFrame(this.update.bind(this));
            }

            // TEMP
            // // create a new graphics object
            // var graphics = new PIXI.Graphics();
            // // begin a green fill..
            // graphics.beginFill(0x00aaff, 0.5);
            // graphics.lineStyle(1, 0x00aaff);
            // // draw a rectangle
            // graphics.drawRect(0, 0, 400, 400);
            // // end the fill
            // graphics.endFill();
            // // add it the stage so we see it on our screens..
            // this.renderContext.stage.addChild(graphics);
            // TEMP
        }, 

        resize: function () {
            if ( this.renderContext !== null ) {
                this.renderContext.size = new Fire.Vec2( this.clientWidth, 
                                                         this.clientHeight );
            }
        },

        update: function () {
            if ( this.renderContext ) {
                Fire.Engine._scene.render(this.renderContext);
            }

            window.requestAnimationFrame(this.update.bind(this));
        },
    });
})();
