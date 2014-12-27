var Path = require('fire-path');

Polymer({
    created: function () {
        this.asset = null;
        this.meta = null;
        this.inspector = null;
    },

    resize: function () {
        if ( !this.$.preview.hide ) {
            this.$.preview.resize();
        }
    },

    metaChanged: function () {
        // update preview
        if ( this.meta instanceof Fire.TextureMeta ) {
            this.$.preview.hide = false;
            this.$.splitter.hide = false;
        }
        else {
            this.$.preview.hide = true;
            this.$.splitter.hide = true;
        }

        // load asset
        if ( this.meta instanceof Fire.FolderMeta ) {
            this.asset = null;
            this.inspector = null;
            this.$.fields.target = this.inspector;
            this.$.fields.refresh();
        }
        else {
            Fire.AssetLibrary.loadAssetByUuid( this.meta.uuid, function ( asset ) {
                if ( asset && this.meta.uuid === asset._uuid ) {
                    this.asset = asset;
                    this.inspector = null;

                    if ( this.meta.inspector ) {
                        this.inspector = new this.meta.inspector( this.asset, this.meta );
                    }

                    this.$.fields.target = this.inspector;
                    this.$.fields.refresh();
                }
            }.bind(this) );
        }
    },

    fieldsChangedAction: function ( event ) {
        event.stopPropagation();

        if ( this.inspector )
            this.inspector.dirty = true;
    },

    applyAction: function ( event ) {
        event.stopPropagation();
        Fire.sendToCore('asset-db:apply', Fire.serialize(this.inspector) );
    },

    revertAction: function ( event ) {
        event.stopPropagation();

        this.fire('reload');
    },
});
