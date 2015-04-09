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
             this.meta instanceof Editor.SpriteMeta ||
             this.meta instanceof Editor.AudioClipMeta )
        {
            this.$.preview.hide = false;
            this.$.splitter.hide = false;
        }
        else {
            this.$.preview.hide = true;
            this.$.splitter.hide = true;
        }

        // load asset
        if ( this.meta instanceof Editor.FolderMeta ||
             this.meta instanceof Editor.SceneMeta ) {
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
            Editor.sendToWindows( 'inspector:asset:dirty', {
                uuid: this.meta.uuid,
                json: Editor.serialize(this.asset)
            } );
        }
    },

    metaFieldsChangedAction: function ( event ) {
        event.stopPropagation();

        if ( this.meta ) {
            this.meta.dirty = true;
            Editor.sendToWindows( 'inspector:meta:dirty', {
                uuid: this.meta.uuid,
                json: Editor.serializeMeta(this.meta)
            } );
        }
    },

    applyAction: function ( event ) {
        event.stopPropagation();

        Editor.AssetDB.apply({
            'meta-json': Editor.serializeMeta(this.meta),
            'asset-json': Editor.serialize(this.asset),
            'asset-dirty': this.asset.dirty,
        });
    },

    revertAction: function ( event ) {
        event.stopPropagation();

        this.fire('reload');
    },
});
