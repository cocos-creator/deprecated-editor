(function () {
    var Remote = require('remote');

    Polymer({
        created: function () {
            Fire.mainWindow = this;

            this.settings = {
                handle: "move", // move, rotate, scale
                coordinate: "local", // local, global
                pivot: "pivot", // pivot, center
            };

            this.sceneNameObserver = null; 
        },

        domReady: function () {
            // init document events
            document.addEventListener( "dragstart", function (event) {
                event.preventDefault(); 
            } );
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

            // init engine
            Fire.log('fire-engine initializing...');
            Fire.AssetLibrary.init("library://");
            var renderContext = Fire.Engine.init( this.$.game.$.view.clientWidth,
                                                  this.$.game.$.view.clientHeight );

            // init game view
            this.$.game.setRenderContext(renderContext);

            // init scene view
            this.$.scene.initRenderContext();

            // TODO: load last-open scene or init new
            Fire.Engine._setCurrentScene(new Fire._Scene());
            var camera = new Fire.Entity('Main Camera');
            camera.addComponent(Fire.Camera);
            this.updateTitle();

            // observe the current scene name
            if ( this.sceneNameObserver ) {
                this.sceneNameObserver.close();
            }
            this.sceneNameObserver = new PathObserver( Fire.Engine._scene, "_name" );
            this.sceneNameObserver.open( function ( newValue, oldValue ) {
                this.updateTitle();
            }, this );
        },

        resizedAction: function ( event ) {
            this.$.game.resize();
            this.$.scene.resize();
        },

        layoutToolsAction: function ( event ) {
            var layoutToolsSettings = this.$.toolbar.$.layoutTools.settings();
            Fire.merge( this.settings, layoutToolsSettings );

            this.$.scene.fire('layout-tools-changed');
            event.stopPropagation();
        },

        updateTitle: function () {
            var sceneName = Fire.Engine._scene.name;
            if ( !sceneName ) {
                sceneName = 'Untitled';
            }
            Remote.getCurrentWindow().setTitle( sceneName + " - Fireball-x Editor" );
        },
    });
})();
