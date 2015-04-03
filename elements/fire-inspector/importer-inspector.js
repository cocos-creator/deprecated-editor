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

    repaint: function () {
        if ( this.$.preview.repaint ) {
            this.$.preview.repaint();
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
        if ( this.meta instanceof Fire.FolderMeta ||
             this.meta instanceof Fire.SceneMeta ) {
            this.$.metaFields.target = this.meta;
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
            Fire.sendToWindows( 'inspector:asset:dirty', {
                uuid: this.meta.uuid,
                json: Fire.serialize(this.asset)
            } );
        }
    },

    metaFieldsChangedAction: function ( event ) {
        event.stopPropagation();

        if ( this.meta ) {
            this.meta.dirty = true;
            Fire.sendToWindows( 'inspector:meta:dirty', {
                uuid: this.meta.uuid,
                json: Fire.serializeMeta(this.meta)
            } );
        }
    },

    applyAction: function ( event ) {
        event.stopPropagation();

        Fire.AssetDB.apply({
            'meta-json': Fire.serializeMeta(this.meta),
            'asset-json': Fire.serialize(this.asset),
            'asset-dirty': this.asset.dirty,
        });
    },

    revertAction: function ( event ) {
        event.stopPropagation();

        this.fire('reload');
    },
});
