(function () {
    var remote = require('remote');
    var AssetDB = remote.getGlobal('AssetDB');

    Polymer({
        domReady: function () {
            // init document events
            document.addEventListener( "drop", function (event) {
                event.preventDefault(); 
            } );
            document.addEventListener( "dragover", function (event) {
                event.preventDefault(); 
            } );
            document.addEventListener( "contextmenu", function (event) {
                event.preventDefault();
                event.stopPropagation();
            } );
            document.addEventListener( "keydown", function ( event ) {
                switch ( event.keyCode ) {
                    // TEST
                    // F3
                    case 114:
                    break;

                    // F5
                    case 116:
                        nativeMainWin.reload();
                    break;

                    // F12
                    case 123:
                        nativeMainWin.showDevTools();
                        event.stopPropagation();
                    break;
                }
            }, true );

            // init project-tree
            this.$.projectView.load("assets://");

            // init engine & game-view
            // TODO: FIRE.AssetLibrary.init(_libraryPath);
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
