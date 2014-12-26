var Path = require('fire-path');

Polymer({
    created: function () {
        this.target = null;
        this.asset = null;
        this.assetName = '';
    },

    resize: function () {
        if ( !this.$.preview.hide ) {
            this.$.preview.resize();
        }
    },

    updateAssetName: function () {
        var fspath = Fire.AssetDB.uuidToFspath( this.target.uuid );
        this.assetName = Path.basename(fspath);
    },

    targetChanged: function () {
        this.$.fields.target = this.target;
        this.$.fields.refresh();

        this.updateAssetName();

        // update preview
        if ( this.target instanceof Fire.TextureImporter ) {
            this.$.preview.hide = false;
            this.$.splitter.hide = false;
            Fire.AssetLibrary.loadAssetByUuid( this.target.uuid, function ( asset ) {
                if ( this.target.uuid === asset._uuid ) {
                    this.asset = asset;
                }
            }.bind(this) );
        }
        else {
            this.$.preview.hide = true;
            this.$.splitter.hide = true;
        }
    },

    fieldsChangedAction: function ( event ) {
        event.stopPropagation();

        if ( this.target )
            this.target.dirty = true;
    },

    applyAction: function ( event ) {
        event.stopPropagation();

        var meta = Fire.serialize ( this.target, false, true );
        Fire.sendToCore('asset-db:apply', meta );
    },

    revertAction: function ( event ) {
        event.stopPropagation();

        this.fire('reload');
    },
});
