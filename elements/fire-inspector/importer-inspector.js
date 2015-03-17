var Path = require('fire-path');

Polymer({
    created: function () {
        this.asset = null;
        this.meta = null;
    },

    resize: function () {
        if ( !this.$.preview.hide ) {
            this.$.preview.resize();
        }
    },

    metaChanged: function () {
        // update preview
        if ( this.meta instanceof Fire.TextureMeta ||
             this.meta instanceof Fire.SpriteMeta ||
             this.meta instanceof Fire.AudioClipMeta )
        {
            this.$.preview.hide = false;
            this.$.splitter.hide = false;
        }
        else {
            this.$.preview.hide = true;
            this.$.splitter.hide = true;
        }

        // load asset
        if ( this.meta instanceof Fire.FolderMeta ) {
            this.$.metaFields.target = null;
            this.$.metaFields.refresh();

            this.asset = null;
            this.$.assetFields.target = null;
            this.$.assetFields.refresh();
        }
        else {
            Fire.AssetLibrary.loadAssetInEditor( this.meta.uuid, function ( err, asset ) {
                if ( asset && this.meta.uuid === asset._uuid ) {
                    this.$.metaFields.target = this.meta;
                    this.$.metaFields.refresh();

                    this.asset = asset;
                    this.$.assetFields.target = this.asset;
                    this.$.assetFields.refresh();
                }
            }.bind(this) );
        }
    },

    assetFieldsChangedAction: function ( event ) {
        event.stopPropagation();

        if ( this.asset ) {
            this.asset.dirty = true;
            Fire.sendToWindows( 'inspector:asset:dirty', this.meta.uuid, Fire.serialize(this.asset) );
        }
    },

    metaFieldsChangedAction: function ( event ) {
        event.stopPropagation();

        if ( this.meta ) {
            this.meta.dirty = true;
            Fire.sendToWindows( 'inspector:meta:dirty', this.meta.uuid, Fire.serialize(this.meta) );
        }
    },

    applyAction: function ( event ) {
        event.stopPropagation();

        Fire.AssetDB.apply({
            metaJson: Fire.serializeMeta(this.meta),
            assetJson: Fire.serializeMeta(this.asset),
            assetDirty: this.asset.dirty,
        });
    },

    revertAction: function ( event ) {
        event.stopPropagation();

        this.fire('reload');
    },
});
