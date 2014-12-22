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
        this.ipc.on('selection:activated', this._onInspect.bind(this, true) );
        this.ipc.on('selection:deactivated', this._onInspect.bind(this, false) );

        this.ipc.on('asset:applied', this._onAssetApplied.bind(this) );
        this.ipc.on('asset:moved', this._onAssetMoved.bind(this) );
    },

    detached: function () {
        this.ipc.clear();
    },

    _onInspect: function ( active, type, id ) {
        if (type === 'entity') {
            if (active) {
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
            if (active) {
                this.lastUuid = id;
                var meta = Fire.AssetDB.loadMeta(id);
                // Checks whether last uuid modified to ensure call stack not suspended by another ipc event
                // This may occurred after ipc sync invocation such as AssetDB.xxx
                if (meta && this.lastUuid === id) {
                    // one frame dely to make sure mouse right click event (contextmenu popup) will not suspend the rendering
                    process.nextTick(function (meta) {
                        // Only inspect the lastest one
                        if (this.lastUuid === id) {
                            var importer = Fire.deserialize(meta);
                            this.inspect(importer);
                        }
                    }.bind(this, meta));
                }
            }
            else if (this.target instanceof Fire.Importer) {
                // uninspect
                this.inspect(null);
            }
        }
    },

    _onAssetApplied: function ( uuid ) {
        if ( this.target && this.target.uuid === uuid ) {
            this.target.dirty = false;
            Fire.warn('@Jare: Please put AssetLibrary.UpdateAsset(uuid) here');
        }
    },

    _onAssetMoved: function ( uuid, destUrl ) {
        if ( this.target && this.target.uuid === uuid ) {
            this.$.inspector.updateAssetName();
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
            if ( this.target instanceof Fire.Importer &&
                 obj instanceof Fire.Importer )
            {
                if ( this.target.uuid === obj.uuid ) {
                    return;
                }
            }
        }

        //
        if ( this.target ) {
            Fire.observe(this.target,false);
        }
        if ( obj ) {
            Fire.observe(obj,true);
        }

        if ( this.target instanceof Fire.Importer && obj instanceof Fire.Importer ||
             this.target instanceof Fire.Entity && obj instanceof Fire.Entity )
        {
            this.target = obj;
            this.$.inspector.target = obj;
        }
        else {
            while ( this.firstElementChild ) {
                this.removeChild(this.firstElementChild);
            }
            var inspector = null;
            if ( obj instanceof Fire.Importer ) {
                inspector = new ImporterInspector();
                inspector.target = obj;
            }
            else if ( obj instanceof Fire.Entity ) {
                inspector = new EntityInspector();
                inspector.target = obj;
            }
            this.target = obj;
            this.$.inspector = inspector;
            if ( inspector ) {
                inspector.setAttribute('fit','');
                this.appendChild(inspector);
            }
        }
    },

    reloadAction: function ( event ) {
        event.stopPropagation();

        if ( this.target && this.target instanceof Fire.Importer ) {
            var meta = Fire.AssetDB.loadMeta(this.target.uuid);
            var importer = Fire.deserialize(meta);
            this.inspect(importer,true);
        }
    },

    resizeAction: function ( event ) {
        var old = this.style.display;
        this.style.display = "";

        // TODO

        this.style.display = old;
    },
});
