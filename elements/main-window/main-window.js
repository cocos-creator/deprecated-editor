(function () {
    var Remote = require('remote');

    function loadUserScripts () {
        var script = document.createElement('script');
        script.setAttribute('type','text/javascript');
        script.setAttribute('src', 'library://bundle.js');
        document.head.appendChild(script);
    }

    Polymer({
        created: function () {
            Fire.mainWindow = this;

            this.settings = {
                handle: "move", // move, rotate, scale
                coordinate: "local", // local, global
                pivot: "pivot", // pivot, center
            };

            this.sceneNameObserver = null; 
            this.ipc = new Fire.IpcListener();
        },

        attached: function () {
            this.ipc.on('project:ready', function () {
                Polymer.import([
                    "fire://src/editor/fire-assets/fire-assets.html",
                    "fire://src/editor/fire-hierarchy/fire-hierarchy.html",
                    "fire://src/editor/fire-inspector/fire-inspector.html",
                    "fire://src/editor/fire-console/fire-console.html",
                    "fire://src/editor/fire-scene/fire-scene.html",
                    "fire://src/editor/fire-game/fire-game.html",
                ], function () {
                    this.addPlugin( this.$.hierarchyPanel, FireHierarchy, 'hierarchy', 'Hierarchy' );
                    this.addPlugin( this.$.assetsPanel, FireAssets, 'assets', 'Assets' );
                    this.addPlugin( this.$.inspectorPanel, FireInspector, 'inspector', 'Inspector' );
                    this.addPlugin( this.$.consolePanel, FireConsole, 'console', 'Console' );
                    this.addPlugin( this.$.editPanel, FireScene, 'scene', 'Scene' );
                    this.addPlugin( this.$.editPanel, FireGame, 'game', 'Game' );

                    // for each plugin
                    for ( var key in Fire.plugins) {
                        var plugin = Fire.plugins[key];

                        // init plugin
                        if ( plugin.init ) {
                            plugin.init();
                        }

                        // register menu
                        if ( plugin.mainMenu ) {
                            Fire.MainMenu.addTemplate(plugin.mainMenu.path, plugin.mainMenu.template);
                        }
                    }

                    // load user scripts
                    loadUserScripts();

                    // init engine
                    Fire.hint('fire-engine initializing...');
                    Fire.AssetLibrary.init("library://");
                    var renderContext = Fire.Engine.init( this.$.game.$.view.clientWidth,
                                                          this.$.game.$.view.clientHeight );

                    // init game view
                    this.$.game.setRenderContext(renderContext);

                    // init scene view
                    this.$.scene.initRenderContext();

                    // TODO: load last-open scene or init new
                    var lastEditScene = null;
                    if ( lastEditScene === null ) {
                        Fire.Engine._setCurrentScene(new Fire._Scene());

                        var camera = new Fire.Entity('Main Camera');
                        camera.addComponent(Fire.Camera);
                    }

                    // observe the current scene name
                    this.updateTitle();
                    if ( this.sceneNameObserver ) {
                        this.sceneNameObserver.close();
                    }
                    this.sceneNameObserver = new PathObserver( Fire.Engine._scene, "_name" );
                    this.sceneNameObserver.open( function ( newValue, oldValue ) {
                        this.updateTitle();
                    }, this );
                }.bind(this));
            }.bind(this) );
        },

        detached: function () {
            this.ipc.clear();
        },

        domReady: function () {
            Fire.command('project:init');
        },

        resizedAction: function ( event ) {
            this.$.game.resize();
            this.$.scene.resize();
        },

        layoutToolsAction: function ( event ) {
            var layoutToolsSettings = this.$.toolbar.$.layoutTools.settings();
            Fire.mixin( this.settings, layoutToolsSettings );

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

        addPlugin: function ( dock, plugin, id, name ) {
            var pluginInst = new plugin();
            pluginInst.setAttribute('id', id);
            pluginInst.setAttribute('name', name);
            pluginInst.setAttribute('fit', '');
            this.$[id] = pluginInst;
            dock.add(pluginInst);
            dock.$.tabs.select(0);
        },
    });
})();
