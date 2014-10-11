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
            this._ipc_inspectScene = this.inspectScene.bind(this);
        },

        ready: function () {
            this.tabIndex = EditorUI.getParentTabIndex(this)+1;

            // register Ipc
            Ipc.on('asset:selected', this._ipc_inspectAsset );
            Ipc.on('scene:selected', this._ipc_inspectScene );
        },

        detached: function () {
            Ipc.removeListener('asset:selected', this._ipc_inspectAsset );
            Ipc.removeListener('scene:selected', this._ipc_inspectScene );
        },

        inspectAsset: function ( uuid ) {
            var promise = new Promise(function(resolve, reject) {
                this.lastUuid = uuid;
                var meta = Fire.AssetDB.loadMeta(uuid);
                var importer = Fire.deserialize(meta);

                if ( this.lastUuid === uuid ) {
                    resolve(importer);
                }
                else {
                    reject();
                }
            }.bind(this));
            promise.then ( function ( importer ) {
                this.inspect(importer);
            }.bind(this));
        },

        inspectScene: function ( entityIdList ) {
            // only support entity currently
            var id = entityIdList[0];   // multi-inpector not yet implemented
            if (!id) {
                return;
            }
            var entity = Fire.Entity._getInstanceById(id);
            if (!entity) {
                return;
            }
            this.inspect(entity);
        },

        inspect: function ( obj ) {
            //
            if ( this.$.fields.target === obj ) {
                return;
            }
            
            //
            if ( this.$.fields.target instanceof Fire.Importer &&
                 obj instanceof Fire.Importer ) 
            {
                if ( this.$.fields.target.uuid === obj.uuid ) {
                    return;
                }
            }

            //
            if ( this.$.preview.firstChild ) {
                this.$.preview.removeChild(this.$.preview.firstChild);
            }
            this.$.preview.setAttribute('hidden','');

            //
            this.$.fields.target = obj;

            //
            if ( obj instanceof Fire.TextureImporter ) {
                var img = new Image(); 
                img.src = "uuid://" + obj.uuid;
                var div = document.createElement('div'); 
                div.classList.add('background');
                div.appendChild(img);
                this.$.preview.appendChild(div);
                this.$.preview.removeAttribute('hidden');
            }
        },
    });
})();
