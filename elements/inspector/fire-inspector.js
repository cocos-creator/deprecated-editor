(function () {
    var Ipc = require('ipc');
    var Remote = require('remote');
    var Menu = Remote.require('menu');

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
            var isEntity = obj instanceof Fire.Entity;
            this.$.addComponent.style.display = isEntity ? '' : 'none';

            //
            if ( this.$.fields.target ) {
                Fire.observe(this.$.fields.target,false);
            }
            if ( obj ) {
                Fire.observe(obj,true);
            }
            this.$.fields.target = obj;
            this.$.fields.refresh();

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

        addComponent: function (component) {
            var entity = this.$.fields.target;
            if (entity instanceof Fire.Entity === false) {
                return;
            }
            entity.addComponent(component);
        },

        getAddCompMenuTemplate: function () {
            function findMenu (menuArray, label) {
                for (var i = 0; i < menuArray.length; i++) {
                    if (menuArray[i].label === label) {
                        return menuArray[i];
                    }
                }
                return null;
            }

            var template = [];
            var items = Fire._componentMenuItems;
            // enumerate components
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                var subPathes = item.menuPath.split('/');
                // enumerate menu path
                var newMenu = null;
                for (var p = 0, parent = template; p < subPathes.length; p++) {
                    var label = subPathes[p];
                    if (!label) {
                        continue;
                    }
                    var parentMenuArray = parent === template ? template : parent.submenu;
                    if (parentMenuArray) {
                        var menu = findMenu(parentMenuArray, label);
                        if (menu) {
                            if (menu.submenu) {
                                parent = menu;
                                continue;
                            }
                            else {
                                Fire.error('Component menu path %s conflict', item.menuPath);
                                break;
                            }
                        }
                    }
                    // create
                    newMenu = {
                        label: label,
                    };
                    if ( !parentMenuArray ) {
                        parent.submenu = [newMenu];
                    }
                    else {
                        // TODO: sort by items.order;
                        parentMenuArray.push(newMenu);
                    }
                    parent = newMenu;
                }
                //
                if (newMenu && !newMenu.submenu) {
                    // click callback
                    newMenu.click = (function (component) {
                        this.addComponent(component);
                    }).bind(this, item.component);
                }
                else {
                    Fire.error('Invalid component menu path: ' + item.menuPath);
                }
            }
            return template;
        },

        addComponentAction: function () {
            var entity = this.$.fields.target;
            if (entity instanceof Fire.Entity === false) {
                return;
            }
            var template = this.getAddCompMenuTemplate();
            var menu = Menu.buildFromTemplate(template);
            menu.popup(Remote.getCurrentWindow());
        },

        fieldsChangedAction: function ( event ) {
            if ( this.collectingChanges )
                return;

            this.collectingChanges = true;
            setTimeout ( function () {
                this.collectingChanges = false;
                Fire.broadcast( 'scene:dirty' );
            }.bind(this), 100 );
        },
    });
})();
