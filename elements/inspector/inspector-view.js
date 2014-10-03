(function () {
    var Ipc = require('ipc');

    Polymer({
        publish: {
            focused: {
                value: false,
                reflect: true
            },
        },

        created: function () {
            this.focused = false;

            this._ipc_inspectAsset = this.inspectAsset.bind(this);
        },

        ready: function () {
            this.tabIndex = EditorUI.getParentTabIndex(this)+1;

            // register Ipc
            Ipc.on('asset:selected', this._ipc_inspectAsset );
        },

        detached: function () {
            Ipc.removeListener('asset:selected', this._ipc_inspectAsset );
        },

        inspectAsset: function ( uuid ) {
            var meta = Fire.AssetDB.loadMeta(uuid);
            var importer = Fire.deserialize(meta);
            this.inspect(importer);
        },

        inspect: function ( obj ) {
            if ( this.$.fields.target === obj ) {
                return;
            }

            // 
            // if ( this.$.fields.target &&
            //      this.$.fields.target instanceof Fire.Importer &&
            //      obj instanceof Fire.Importer ) 
            // {
            //     if ( this.$.fields.target.uuid === obj.uuid ) {
            //         return;
            //     }
            // }

            //
            if ( this.$.preview.firstChild ) {
                this.$.preview.removeChild(this.$.preview.firstChild);
            }

            this.$.fields.target = obj;

            if ( obj instanceof Fire.TextureImporter ) {
                var img = new Image(); 
                img.src = "uuid://" + obj.uuid;
                var div = document.createElement('div'); 
                div.classList.add('background');
                div.appendChild(img);
                this.$.preview.appendChild(div);
                this.$.preview.removeAttribute('hidden');
            }
            else {
                this.$.preview.setAttribute('hidden','');
            }
        },
    });
})();
