var Remote = require('remote');
var Menu = Remote.require('menu');
var Path = require('fire-path');
var Url = require('fire-url');

Polymer({
    created: function () {
        this.target = null;
        this.icon = new Image();
        this.icon.src = "fire://static/img/plugin-inspector.png";

        this.ipc = new Fire.IpcListener();
    },

    attached: function () {
        // register Ipc
        this.ipc.on('selection:activated', this._onInspect.bind(this) );
        this.ipc.on('asset:changed', this._onAssetChanged.bind(this) );
        this.ipc.on('asset:moved', this._onAssetMoved.bind(this) );
        this.ipc.on('asset:saved', this._onAssetSaved.bind(this) );
        this.ipc.on('asset:dirty', this._onAssetDirty.bind(this) );
        this.ipc.on('component:added', this._onEntityDirty.bind(this) );
        this.ipc.on('component:removed', this._onEntityDirty.bind(this) );
    },

    detached: function () {
        this.ipc.clear();
    },

    _onInspect: function ( type, id ) {
        if (type === 'entity') {
            if (id) {
                var entity = Fire._getInstanceById(id);
                if (entity) {
                    this.inspect(entity);
                }
                else {
                    this.inspect(null);
                }
            }
            else if (this.target instanceof Fire.Entity) {
                // uninspect
                this.inspect(null);
            }
        }
        else if (type === 'asset') {
            if (id) {
                this.lastUuid = id;
                var metaJson = Fire.AssetDB.loadMetaJson(id);
                // Checks whether last uuid modified to ensure call stack not suspended by another ipc event
                // This may occurred after ipc sync invocation such as AssetDB.xxx
                if (metaJson && this.lastUuid === id) {
                    // one frame dely to make sure mouse right click event (contextmenu popup) will not suspend the rendering
                    setImmediate(function (metaJson) {
                        // Only inspect the lastest one
                        if (this.lastUuid === id) {
                            Fire.AssetLibrary.loadMeta(metaJson, function ( err, meta ) {
                                this.inspect(meta);
                            }.bind(this));
                        }
                    }.bind(this, metaJson));
                }
            }
            else if (this.target instanceof Fire.AssetMeta) {
                // uninspect
                this.inspect(null);
            }
        }
    },

    _onAssetChanged: function ( detail ) {
        var uuid = detail.uuid;
        if ( this.target && this.target.uuid === uuid ) {
            var reloadMeta = true;

            // NOTE: we don't need to reload custom-asset if it is auto-saved
            if ( this.target instanceof Fire.CustomAssetMeta ) {
                if ( this.$.inspector.asset && this.$.inspector.asset.dirty ) {
                    this.$.inspector.asset.dirty = false;
                    reloadMeta = false;
                }
            }

            //
            if ( reloadMeta ) {
                var metaJson = Fire.AssetDB.loadMetaJson(uuid);
                Fire.AssetLibrary.loadMeta(metaJson, function ( err, meta ) {
                    this.inspect(meta,true);
                }.bind(this));
            }
        }
    },

    _onAssetMoved: function ( detail ) {
        var uuid = detail.uuid;
        var destUrl = detail['dest-url'];
        if ( this.target && this.target.uuid === uuid ) {
            if ( this.$.inspector.asset ) {
                this.$.inspector.asset.name = Url.basenameNoExt(destUrl);
            }
        }
    },

    _onAssetSaved: function ( detail ) {
        var url = detail.url;
        var uuid = detail.uuid;

        if ( this.target && this.target.uuid === uuid ) {
            if ( this.$.inspector.saving !== undefined ) {
                this.$.inspector.saving = false;

                if ( this.$.inspector.asset && this.$.inspector.asset.dirty ) {
                    this.$.inspector.asset.dirty = false;
                }
            }
        }
    },

    _onAssetDirty: function ( uuid, assetJson ) {
        if ( this.target && this.target.uuid === uuid ) {
            Fire.warn("TODO, waiting for @Jare's asset.deserialize()");
        }
    },

    _onEntityDirty: function ( entityID, componentID ) {
        if ( this.target && this.target.id === entityID ) {
            var entity = Fire._getInstanceById(entityID);
            if (entity) {
                this.$.inspector.refresh();
            }
        }
    },

    inspect: function ( obj, force ) {
        //
        if ( !force ) {
            //
            if ( this.target === obj ) {
                return;
            }

            //
            if ( this.target instanceof Fire.AssetMeta && obj instanceof Fire.AssetMeta ) {
                if ( this.target.uuid === obj.uuid ) {
                    return;
                }
            }
        }
        if ( obj && obj.constructor === Fire.AssetMeta ) {
            // unknown asset
            obj = null;
        }
        //
        if ( this.target ) {
            Fire.observe(this.target,false);
        }
        if ( obj ) {
            Fire.observe(obj,true);
        }

        var isTargetCustom = this.target instanceof Fire.CustomAssetMeta;
        var isObjCustom = obj instanceof Fire.CustomAssetMeta;

        if ( isTargetCustom && isObjCustom ) {
            this.target = this.$.inspector.meta = obj;
        }
        else if ( this.target instanceof Fire.AssetMeta && obj instanceof Fire.AssetMeta &&
                 !isTargetCustom && !isObjCustom )
        {
            this.target = this.$.inspector.meta = obj;
        }
        else if ( this.target instanceof Fire.Entity && obj instanceof Fire.Entity ) {
            this.target = this.$.inspector.target = obj;
        }
        else {
            while ( this.firstElementChild ) {
                this.removeChild(this.firstElementChild);
            }
            if ( obj instanceof Fire.AssetMeta ) {
                if ( obj instanceof Fire.CustomAssetMeta ) {
                    this.$.inspector = new CustomAssetInspector();
                    this.target = this.$.inspector.meta = obj;
                }
                else {
                    this.$.inspector = new ImporterInspector();
                    this.target = this.$.inspector.meta = obj;
                }
            }
            else if ( obj instanceof Fire.Entity ) {
                this.$.inspector = new EntityInspector();
                this.target = this.$.inspector.target = obj;
            }
            else {
                this.$.inspector = null;
                this.target = null;
                return;
            }
            this.$.inspector.setAttribute('fit','');
            this.appendChild(this.$.inspector);
        }
    },

    reloadAction: function ( event ) {
        event.stopPropagation();

        if ( this.target && this.target instanceof Fire.AssetMeta ) {
            var metaJson = Fire.AssetDB.loadMetaJson(this.target.uuid);
            Fire.AssetLibrary.loadMeta(metaJson, function ( err, meta ) {
                this.inspect(meta,true);
            }.bind(this));
        }
    },

    resizeAction: function ( event ) {
        if ( this.$.inspector && this.$.inspector.resize ) {
            var old = this.style.display;
            this.style.display = "";

            this.$.inspector.resize();

            this.style.display = old;
        }
    },

    showAction: function ( event ) {
        if ( this.$.inspector && this.$.inspector.repaint ) {
            this.$.inspector.repaint();
        }
    },
});
