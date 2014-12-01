(function () {
    var Path = require('fire-path');
    var Url = require('fire-url');
    var Remote = require('remote');

    Polymer({
        created: function () {
            this.icon = new Image();
            this.icon.src = "fire://static/img/plugin-scene.png";

            window.addEventListener('resize', function() {
                this.resize();
            }.bind(this));

            this.ipc = new Fire.IpcListener();

            this._newsceneUrl = null;
        },

        ready: function () {
            // register ipc
            this.ipc.on('selection:entity:selected', this.select.bind(this, true) );
            this.ipc.on('selection:entity:unselected', this.select.bind(this, false) );
            this.ipc.on('selection:entity:hover', this.hover.bind(this) );
            this.ipc.on('selection:entity:hoverout', this.hoverout.bind(this) );
            this.ipc.on('scene:dirty', this.delayRepaintScene.bind(this) );
            this.ipc.on('scene:save', this.saveCurrentScene.bind(this) );
            this.ipc.on('scene:launched', this.sceneLaunched.bind(this));
            this.ipc.on('asset:saved', function ( url, uuid, parentUuid ) {
                // update the uuid of current scene, if we first time save it
                if ( this._newsceneUrl === url ) {
                    this._newsceneUrl = null;
                    var sceneName = Url.basename(url);
                    Fire.Engine._scene._uuid = uuid;
                    Fire.Engine._scene.name = sceneName;
                    Fire.log(url + ' saved');
                }
            }.bind(this) );

            this._repaintID = setInterval ( this.repaintScene.bind(this), 500 );
        },

        detached: function () {
            this.ipc.clear();

            clearInterval (this._repaintID);
        },

        initRenderContext: function () {
            this.$.view.init();
        },

        resize: function () {
            this.$.view.resize();
        },

        select: function ( selected, entityIDs ) {
            if ( selected )
                this.$.view.select(entityIDs);
            else
                this.$.view.unselect(entityIDs);
        },

        hover: function ( entityID ) {
            if ( !entityID )
                return;

            this.$.view.hover(entityID);
        },

        hoverout: function ( entityID ) {
            if ( !entityID )
                return;

            this.$.view.hoverout( entityID );
        },

        delayRepaintScene: function () {
            if ( this._repainting )
                return;

            this._repainting = true;
            setTimeout( function () {
                this.repaintScene();
                this._repainting = false;
            }.bind(this), 100 );
        },

        repaintScene: function () {
            this.$.view.repaint();
        },

        saveCurrentScene: function () {
            var currentScene = Fire.Engine._scene;
            var saveUrl = null;
            var rootPath = Fire.AssetDB.fspath("assets://");
            var dialog = Remote.require('dialog');

            if ( currentScene._uuid ) {
                savePath = Fire.AssetDB.uuidToFspath(currentScene._uuid);
                saveUrl = 'assets://' + Path.relative( rootPath, savePath );
            }
            else {
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
                Fire.command( 'asset-db:save', 
                              this._newsceneUrl, 
                              Fire.serialize(currentScene) );
            }
        },

        sceneLaunched: function () {
            this.$.view.initSceneCamera();
        },

        showAction: function ( event ) {
            this.resize();
        },

        layoutToolsAction: function ( event ) {
            this.$.view.rebuildGizmos();
            event.stopPropagation();
        },
    });
})();
