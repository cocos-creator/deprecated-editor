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

            // init engine & game window
            Fire.AssetLibrary.init(Fire.AssetDB.getLibraryPath());
            Fire.log('fire-engine initializing...');
            var renderContext = Fire.Engine.init( this.$.game.$.view.clientWidth,
                                                  this.$.game.$.view.clientHeight );
            this.$.game.setRenderContext(renderContext);

            this.$.scene.initRenderContext();

            // TEMP TODO:
            var assetPath = 'assets://Foobar/004.png';
            var uuid = Fire.AssetDB.urlToUuid(assetPath);
            if ( uuid ) {
                Fire.AssetLibrary.loadAssetByUuid(uuid, function ( asset ) {
                    var ent = new Fire.Entity();
                    var renderer = ent.addComponent(Fire.SpriteRenderer);

                    var sprite = new Fire.Sprite();
                    sprite.texture = asset;
                    sprite.width = 400;
                    sprite.height = 300;
                    renderer.sprite = sprite;
                });
            }
            else {
                Fire.error('Failed to load ' + assetPath);
            }
        },

        resizedAction: function () {
            this.$.game.resize();
            this.$.scene.resize();
        },

    });
})();
