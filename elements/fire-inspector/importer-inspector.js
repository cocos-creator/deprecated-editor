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
            Fire.AssetLibrary.loadAsset( this.meta.uuid, function ( err, asset ) {
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
            // TODO: Fire.sendToPages( 'inspector:dirty', this.meta.uuid, Fire.serialize(this.inspector) );
        }
    },

    metaFieldsChangedAction: function ( event ) {
        event.stopPropagation();

        if ( this.meta ) {
            this.meta.dirty = true;
            // TODO: Fire.sendToPages( 'inspector:dirty', this.meta.uuid, Fire.serialize(this.inspector) );
        }
    },

    applyAction: function ( event ) {
        event.stopPropagation();

        var metaJson = Fire.serializeMeta(this.meta);
        var assetJson = Fire.serialize(this.asset);

        Fire.sendToCore('asset-db:apply', metaJson, assetJson, this.asset.dirty );
    },

    revertAction: function ( event ) {
        event.stopPropagation();

        this.fire('reload');
    },
});
