(function () {
    Polymer({
        domReady: function () {
            EditorApp.setMainWindow(this);

            // init project-tree
            this.$.projectView.load("assets://");

            // init engine & game-view
            console.log('fire-engine initializing...');
            var renderContext = FIRE.Engine.init( this.$.gameView.$.view.clientWidth,
                                                  this.$.gameView.$.view.clientHeight );
            this.$.gameView.setRenderContext(renderContext);

            canvas = document.createElement('canvas');
            renderContext = FIRE.Engine.createSceneView( this.$.sceneView.$.view.clientWidth,
                                                         this.$.sceneView.$.view.clientHeight,
                                                         canvas );
            this.$.sceneView.setRenderContext(renderContext);

            // TEMP TODO:
            var uuid = AssetDB.urlToUuid("assets://Textures/white-sheep/ip3_a_sheep_down_loop01.png");
            FIRE.AssetLibrary.loadAssetByUuid(uuid, function ( asset ) {
                var ent = new FIRE.Entity();
                var renderer = ent.addComponent(FIRE.SpriteRenderer);

                var sprite = new FIRE.Sprite();
                sprite.texture = asset;
                sprite.width = 104;
                sprite.height = 75;
                renderer.sprite = sprite;
            });
        },

        resizedAction: function () {
            this.$.gameView.resize();
            this.$.sceneView.resize();
        },
    });
})();
