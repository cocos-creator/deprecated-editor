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
                }
            }.bind(this) );
        },

        inspect: function ( obj ) {
            if ( this.$.fields.target === obj ) {
                return;
            }

            if ( this.$.fields.target instanceof FIRE_ED.Importer &&
                 obj instanceof FIRE_ED.Importer ) 
            {
                if ( this.$.fields.target.uuid === obj.uuid ) {
                    return;
                }
            }

            //
            if ( this.$.preview.firstChild ) {
                this.$.preview.removeChild(this.$.preview.firstChild);
            }

            this.$.fields.target = obj;

            if ( obj instanceof FIRE_ED.TextureImporter ) {
                var img = new Image(); 
                img.src = obj.rawfile;
                var div = document.createElement('div'); 
                div.classList.add('background');
                div.appendChild(img);
                this.$.preview.appendChild(div);
            }
        },
    });
})();
