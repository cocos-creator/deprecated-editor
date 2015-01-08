var Remote = require('remote');
var Menu = Remote.require('menu');
var Path = require('fire-path');

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
        this.ipc.on('asset:applied', this._onAssetApplied.bind(this) );
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
                    process.nextTick(function (metaJson) {
                        // Only inspect the lastest one
                        if (this.lastUuid === id) {
                            var meta = Fire.deserialize(metaJson);
                            this.inspect(meta);
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

    _onAssetApplied: function ( uuid ) {
        if ( this.target && this.target.uuid === uuid ) {
            // instead of reload asset, we do fast memory apply
            if ( this.$.inspector.applyAsset ) {
                this.$.inspector.applyAsset();
            }

            //
            var metaJson = Fire.AssetDB.loadMetaJson(uuid);
            var meta = Fire.deserialize(metaJson);
            this.inspect(meta,true);

            // 虽然在 applyAsset 时已经修改过内存中的 asset 了，但某些 Importer 会依据修改后的 meta 重新 import 一次，
            // 对它们来说 asset 需要重新导入才能得到真正结果。
            Fire.AssetLibrary.onAssetReimported(uuid);
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

        if ( this.target instanceof Fire.AssetMeta && obj instanceof Fire.AssetMeta ) {
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
                this.$.inspector = new ImporterInspector();
                this.target = this.$.inspector.meta = obj;
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
            var meta = Fire.deserialize(metaJson);
            this.inspect(meta,true);
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
});
