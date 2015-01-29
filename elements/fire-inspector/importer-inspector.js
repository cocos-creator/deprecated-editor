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

    // NOTE: this is call after asset successfully applied from editor-core
    applyAsset: function () {
        this.inspector.applyAsset(this.asset);
    },

    metaChanged: function () {
        // update preview
        if ( this.meta instanceof Fire.TextureMeta ||
             this.meta instanceof Fire.SpriteMeta ) {
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
            Fire.AssetLibrary.loadAsset( this.meta.uuid, function ( asset ) {
                if ( asset && this.meta.uuid === asset._uuid ) {
                    this.asset = asset;
                    this.inspector = null;

                    if ( this.meta.inspector ) {
                        var inspector = new this.meta.inspector();
                        inspector.init( this.asset, this.meta );
                        this.inspector = inspector;
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
        Fire.sendToCore('asset-db:apply',
                        Fire.serialize(this.asset),
                        Fire.serialize(this.meta),
                        Fire.serialize(this.inspector)
                       );
    },

    revertAction: function ( event ) {
        event.stopPropagation();

        this.fire('reload');
    },
});
