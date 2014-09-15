(function () {
    Polymer({
        publish: {
            focused: {
                value: false,
                reflect: true
            },
        },

        created: function () {
            this.focused = false;
        },

        ready: function () {
            this.tabIndex = EditorUI.getParentTabIndex(this)+1;

            EditorApp.on('selected', function ( event ) {
                if ( event.detail.uuid ) {
                    // var asset = AssetLibrary.loadAssetByUuid(event.detail.uuid);
                    var fspath = AssetDB.uuidToFsysPath(event.detail.uuid);
                    var importer = AssetDB.getImporter(fspath);
                    this.inspect(importer);

                    if ( importer instanceof FIRE_ED.TextureImporter ) {
                        this.$.preview.removeChild(this.$.preview.firstChild);
                        var img = new Image(); 
                        img.src = fspath;
                        this.$.preview.appendChild(img);
                    }
                }
            }.bind(this) );
        },

        inspect: function ( obj ) {
            if ( this.$.fields.target !== obj ) {
                this.$.fields.target = obj;
            }
        },
    });
})();
