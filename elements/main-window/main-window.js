var Remote = require('remote');
var Async = require('async');
var Url = require('fire-url');
var Path = require('fire-path');

Polymer({
    _scriptsLoaded: false,

    created: function () {
        Fire.mainWindow = this;

        this.settings = {
            handle: "move", // move, rotate, scale
            coordinate: "local", // local, global
            pivot: "pivot", // pivot, center
        };
        this.sceneInfo = {};

        this.sceneNameObserver = null;
        this.ipc = new Fire.IpcListener();

        this._updateSceneIntervalID = null;
        this._updateSceneAnimFrameID = null;

        this._newsceneUrl = null;
        this._sceneDirtyFlag = false;
    },

    ready: function () {
        window.onbeforeunload = function ( event ) {
            var res = this.confirmCloseScene();
            switch ( res ) {
            // save
            case 0:
                this.saveCurrentScene();
                Fire.Metrics.trackEditorClose();
                return true;

            // cancel
            case 1:
                return false;

            // don't save
            case 2:
                Fire.Metrics.trackEditorClose();
                return true;
            }
        }.bind(this);

        window.addEventListener('resize', function() {
            this.$.mainDock._notifyResize();
        }.bind(this));

        // NOTE: the start-unload-scene and engine-stopped must be dom event because we want to stop repaint immediately

        window.addEventListener('start-unload-scene', function ( event ) {
            // do nothing if engine is playing
            if ( Fire.Engine.isPlaying ) {
                return;
            }

            //
            this._stopSceneInterval();
        }.bind(this));

        window.addEventListener('engine-stopped', function ( event ) {
            // stop anim frame update
            this._stopSceneInAnimationFrame();
        }.bind(this));
    },

    attached: function () {
        this.ipc.on('project:ready', this.init.bind(this));

        this.ipc.on('reload:window-scripts', function ( compiled ) {
            Fire._Sandbox.reloadScripts(compiled, function () {
                this._scriptsLoaded = true;
            }.bind(this) );
        }.bind(this));

        this.ipc.on('asset-library:debugger:query-uuid-asset', function () {
            var results = [];
            for ( var p in Fire.AssetLibrary._uuidToAsset ) {
                var asset = Fire.AssetLibrary._uuidToAsset[p];
                results.push( { uuid: p, name: asset.name, type: Fire.JS.getClassName(asset) } );
            }
            Fire.sendToAll('asset-library:debugger:uuid-asset-results', {
                results: results
            });
        }.bind(this));

        this.ipc.on('asset:moved', function ( detail ) {
            var uuid = detail.uuid;
            var destUrl = detail.destUrl;

            // if it is current scene renamed, update title
            if ( uuid === Fire.Engine._scene._uuid ) {
                this.updateTitle();
            }
        }.bind(this));

        this.ipc.on('scene:save', this.saveCurrentScene.bind(this) );

        // scene saved
        this.ipc.on('asset:saved', function ( detail ) {
            var url = detail.url;
            var uuid = detail.uuid;

            // update the uuid of current scene, if we first time save it
            if ( this._newsceneUrl === url ) {
                this._newsceneUrl = null;
                var sceneName = Url.basename(url);
                Fire.Engine._scene._uuid = uuid;
                Fire.Engine._scene.name = sceneName;

                this.setSceneDirty(false,true);
            }
        }.bind(this) );

        //
        this.ipc.on('asset:open', function ( uuid, url ) {
            if ( Url.extname(url) !== '.fire' ) {
                return;
            }

            var res = this.confirmCloseScene();
            switch ( res ) {
            // save
            case 0:
                this.saveCurrentScene();
                this._sceneDirtyFlag = false;
                // don't re-open current saving scene
                if ( uuid !== Fire.Engine._scene._uuid ) {
                    Fire.sendToMainWindow('engine:open-scene', {
                        uuid: uuid
                    });
                }
                break;

            // cancel
            case 1:
                break;

            // don't save
            case 2:
                this._sceneDirtyFlag = false;
                Fire.sendToMainWindow('engine:open-scene', {
                    uuid: uuid
                });
                break;
            }
        }.bind(this) );

        this.ipc.on('entity:added', this.setSceneDirty.bind(this,true,false));
        this.ipc.on('entity:removed', this.setSceneDirty.bind(this,true,false));
        this.ipc.on('entity:parentChanged', this.setSceneDirty.bind(this,true,false));
        this.ipc.on('entity:indexChanged', this.setSceneDirty.bind(this,true,false));
        this.ipc.on('entity:renamed', this.setSceneDirty.bind(this,true,false));
        this.ipc.on('entity:inspector-dirty', this.setSceneDirty.bind(this,true,false));
        this.ipc.on('gizmos:dirty', this.setSceneDirty.bind(this,true,false));

        this.ipc.on('scene:new', function ( event ) {
            this.newScene();
        }.bind(this));

        // NOTE: the scene:launched and engine:played must be ipc event to make sure component:disabled been called before it.

        this.ipc.on('scene:launched', function ( event ) {
            // TEMP HACK: waiting for jare's new scene-camera, that will make scene camera only initialize once
            this.$.scene.initSceneCamera();
            this.$.game.resize();

            // do nothing if engine is playing
            if ( Fire.Engine.isPlaying ) {
                return;
            }

            //
            this.setSceneDirty(this._sceneDirtyFlag,true);

            //
            if ( this._updateSceneIntervalID ) {
                Fire.warn( 'The _updateSceneInterval still ON' );
                return;
            }
            this._updateSceneInterval();
        }.bind(this));

        this.ipc.on('engine:played', function ( continued ) {
            // if this is resume from paused, do nothing
            if ( continued ) {
                return;
            }

            // check if we have invalid anim frame request
            if ( this._updateSceneAnimFrameID ) {
                Fire.warn( 'The _updateSceneInAnimationFrame still ON' );
                return;
            }

            // store scene dirty flag
            this._sceneDirtyFlag = Fire.Engine._scene.dirty;
            this._updateSceneInAnimationFrame();
        }.bind(this));
    },

    detached: function () {
        this.ipc.clear();
    },

    domReady: function () {
        Fire.PanelMng.root = this.$.mainDock;
        Fire.sendToCore('project:init');
    },

    init: function () {
        var self = this;

        Async.series([
            // init plugins
            function ( next ) {
                Polymer.import([
                    "fire://src/editor/fire-assets/fire-assets.html",
                    "fire://src/editor/fire-hierarchy/fire-hierarchy.html",
                    "fire://src/editor/fire-inspector/fire-inspector.html",
                    "fire://src/editor/fire-console/fire-console.html",
                    "fire://src/editor/fire-scene/fire-scene.html",
                    "fire://src/editor/fire-game/fire-game.html",
                ], function () {
                    self.addPlugin( self.$.hierarchyPanel, FireHierarchy, 'hierarchy', 'Hierarchy' );
                    self.addPlugin( self.$.assetsPanel, FireAssets, 'assets', 'Assets' );
                    self.addPlugin( self.$.inspectorPanel, FireInspector, 'inspector', 'Inspector' );
                    self.addPlugin( self.$.consolePanel, FireConsole, 'console', 'Console' );
                    self.addPlugin( self.$.editPanel, FireScene, 'scene', 'Scene' );
                    self.addPlugin( self.$.editPanel, FireGame, 'game', 'Game' );

                    // for each plugin
                    for ( var key in Fire.plugins) {
                        var plugin = Fire.plugins[key];

                        // init plugin
                        if ( plugin.init ) {
                            plugin.init();
                        }
                    }

                    // save layout
                    Fire.sendToCore( 'window:save-layout',
                                    Fire.PanelMng.getLayout(),
                                    Fire.RequireIpcEvent );

                    //
                    next();
                });
            },

            // compile scripts
            function ( next ) {
                Fire.sendToCore('compiler:compile-and-reload');
                var id = setInterval( function () {
                    if ( self._scriptsLoaded ) {
                        clearInterval(id);
                        next();
                    }
                }, 100 );
            },

            function ( next ) {
                // init AssetLibrary
                Fire.info('asset-library initializing...');
                Fire.AssetLibrary.init("library://");

                // query scenes
                var SCENE_ID = Fire.JS._getClassId(Fire._Scene);
                Fire.AssetDB.query( "assets://", {
                    'type-id': SCENE_ID
                }, function ( results ) {
                    for ( var i = 0; i < results.length; ++i ) {
                        var result = results[i];
                        var name = Url.basenameNoExt(result.url);
                        self.sceneInfo[result.uuid] = result.url;
                        Fire.Engine._sceneInfos[name] = result.uuid;
                    }
                    next();
                });
            },

            function ( next ) {
                Fire.info('fire-engine initializing...');

                var renderContext = Fire.Engine.init( self.$.game.$.view.clientWidth,
                                                      self.$.game.$.view.clientHeight );
                // init game view
                self.$.game.setRenderContext(renderContext);

                // init scene view
                self.$.scene.initRenderContext();

                // TODO: load last-open scene or init new
                var lastEditScene = null;
                if ( lastEditScene === null ) {
                    self.newScene();
                }

                Fire.Metrics.trackEditorOpen();
                next();
            },

        ], function ( err ) {
            if ( err ) {
                Fire.error( err.message );
            }
        } );
    },

    layoutToolsAction: function ( event ) {
        var layoutToolsSettings = this.$.toolbar.$.layoutTools.settings();
        Fire.JS.mixin( this.settings, layoutToolsSettings );

        this.$.scene.fire('layout-tools-changed');
        event.stopPropagation();
    },

    setSceneDirty: function ( dirty, forceUpdateTitle ) {
        var updateTitle = forceUpdateTitle;
        if ( Fire.Engine._scene.dirty !== dirty ) {
            Fire.Engine._scene.dirty = dirty;
            updateTitle = true;
        }

        if ( updateTitle ) {
            this.updateTitle();
        }
    },

    updateTitle: function () {
        setImmediate(function () {
            var url = Fire.AssetDB.uuidToUrl(Fire.Engine._scene._uuid);
            if ( !url ) {
                url = 'Untitled';
            }
            url += Fire.Engine._scene.dirty ? "*" : "";
            var currentWin = Remote.getCurrentWindow();
            currentWin.setTitle( "Fireball Editor - " + url );
            currentWin.setDocumentEdited(Fire.Engine._scene.dirty);
        }.bind(this));
    },

    addPlugin: function ( panel, plugin, id, name ) {
        var pluginInst = new plugin();
        pluginInst.setAttribute('id', id);
        pluginInst.setAttribute('name', name);
        pluginInst.setAttribute('fit', '');
        this.$[id] = pluginInst;
        panel.add(pluginInst);
        panel.$.tabs.select(0);
    },

    newScene: function () {
        Fire.Engine._setCurrentScene(new Fire._Scene());

        var camera = new Fire.Entity('Main Camera');
        camera.addComponent(Fire.Camera);
    },

    confirmCloseScene: function () {
        if ( Fire.Engine._scene && Fire.Engine._scene.dirty ) {
            var dialog = Remote.require('dialog');
            return dialog.showMessageBox( Remote.getCurrentWindow(), {
                type: "warning",
                buttons: ["Save","Cancel","Don't Save"],
                title: "Save Scene Confirm",
                message: Fire.AssetDB.uuidToUrl(Fire.Engine._scene._uuid) + " has changed, do you want to save it?",
                detail: "Your changes will be lost if you close this item without saving."
            } );
        }

        //
        return 2;
    },

    saveCurrentScene: function () {
        var currentScene = Fire.Engine._scene;
        var dialog = Remote.require('dialog');
        var saveUrl = Fire.AssetDB.uuidToUrl(currentScene._uuid);

        if ( !saveUrl ) {
            var rootPath = Fire.AssetDB._fspath("assets://");
            var savePath = dialog.showSaveDialog( Remote.getCurrentWindow(), {
                title: "Save Scene",
                defaultPath: rootPath,
                filters: [
                    { name: 'Scenes', extensions: ['fire'] },
                ],
            } );

            if ( savePath ) {
                if ( Path.contains( rootPath, savePath ) ) {
                    saveUrl = 'assets://' + Path.relative( rootPath, savePath );
                }
                else {
                    dialog.showMessageBox ( Remote.getCurrentWindow(), {
                        type: "warning",
                        buttons: ["OK"],
                        title: "Warning",
                        message: "Warning: please save the scene in the assets folder.",
                        detail: "The scene needs to be saved inside the assets folder of your project.",
                    } );
                    // try to popup the dailog for user to save the scene
                    this.saveCurrentScene();
                }
            }
        }

        //
        if ( saveUrl ) {
            this._newsceneUrl = saveUrl;
            Fire.AssetDB.save( this._newsceneUrl, Fire.serialize(currentScene) );
        }
    },

    _updateSceneInterval: function () {
        this._updateSceneIntervalID = setInterval ( function () {
            this.$.scene.repaintScene();
        }.bind(this), 500 );
    },

    _stopSceneInterval: function () {
        if ( this._updateSceneIntervalID ) {
            clearInterval (this._updateSceneIntervalID);
            this._updateSceneIntervalID = null;
        }
    },

    _updateSceneInAnimationFrame: function () {
        this._updateSceneAnimFrameID = window.requestAnimationFrame( function () {
            this.$.scene.repaintScene();
            this._updateSceneInAnimationFrame();
        }.bind(this) );
    },

    _stopSceneInAnimationFrame: function () {
        // stop anim frame update
        if ( this._updateSceneAnimFrameID ) {
            window.cancelAnimationFrame(this._updateSceneAnimFrameID);
            this._updateSceneAnimFrameID = null;
        }
    },
});
