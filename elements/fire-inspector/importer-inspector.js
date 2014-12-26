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
        if ( !this.meta.inspector ) {
            while ( this.firstElementChild ) {
                this.removeChild(this.firstElementChild);
            }
            return;
        }


        Fire.AssetLibrary.loadAssetByUuid( this.meta.uuid, function ( asset ) {
            if ( this.meta.uuid === asset._uuid ) {
                this.asset = asset;
                this.inspector = new this.meta.inspector( this.asset, this.meta );

                this.$.fields.target = this.inspector;
                this.$.fields.refresh();

                // update preview
                if ( this.asset instanceof Fire.Texture ) {
                    this.$.preview.hide = false;
                    this.$.splitter.hide = false;
                }
                else {
                    this.$.preview.hide = true;
                    this.$.splitter.hide = true;
                }
            }
        }.bind(this) );

    },

    fieldsChangedAction: function ( event ) {
        event.stopPropagation();

        if ( this.inspector )
            this.inspector.dirty = true;
    },

    applyAction: function ( event ) {
        event.stopPropagation();

        // TODO:
        // var meta = Fire.serialize ( this.inspector );
        // Fire.sendToCore('asset-db:apply', meta );
    },

    revertAction: function ( event ) {
        event.stopPropagation();

        this.fire('reload');
    },
});
