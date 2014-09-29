(function () {
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

            // NOTE: this will prevent mac touchpad scroll the body
            document.body.onscroll = function ( event ) {
                document.body.scrollLeft = 0;
                document.body.scrollTop = 0;
            };

            // init project-tree
            this.$.projectView.load("assets://");

            // init engine & game-view
            Fire.AssetLibrary.init(Fire.AssetDB.getLibraryPath());
            Fire.log('fire-engine initializing...');
            var renderContext = Fire.Engine.init( this.$.gameView.$.view.clientWidth,
                                                  this.$.gameView.$.view.clientHeight );
            this.$.gameView.setRenderContext(renderContext);

            canvas = document.createElement('canvas');
            renderContext = Fire.Engine.createSceneView( this.$.sceneView.$.view.clientWidth,
                                                         this.$.sceneView.$.view.clientHeight,
                                                         canvas );
            this.$.sceneView.setRenderContext(renderContext);

            // TEMP TODO:
            var assetPath = 'assets://white-sheep/ip3_a_sheep_down_loop01.png';
            var uuid = Fire.AssetDB.urlToUuid(assetPath);
            if ( uuid ) {
                Fire.AssetLibrary.loadAssetByUuid(uuid, function ( asset ) {
                    var ent = new Fire.Entity();
                    var renderer = ent.addComponent(Fire.SpriteRenderer);

                    var sprite = new Fire.Sprite();
                    sprite.texture = asset;
                    sprite.width = 104;
                    sprite.height = 75;
                    renderer.sprite = sprite;
                });
            }
            else {
                Fire.error('Failed to load ' + assetPath);
            }
        },

        resizedAction: function () {
            this.$.gameView.resize();
            this.$.sceneView.resize();
        },

    });
})();
