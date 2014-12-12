(function () {
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
            this.icon = new Image();
            this.icon.src = "fire://static/img/plugin-inspector.png";

            this.focused = false;

            this.ipc = new Fire.IpcListener();
        },

        ready: function () {
            this.tabIndex = EditorUI.getParentTabIndex(this)+1;

            // register Ipc
            this.ipc.on('selection:activated', this.onInspect.bind(this, true) );
            this.ipc.on('selection:deactivated', this.onInspect.bind(this, false) );
        },

        detached: function () {
            this.ipc.clear();
        },

        onInspect: function ( inspect, type, id ) {
            if (type === 'entity') {
                if (inspect) {
                    var entity = Fire._getInstanceById(id);
                    if (entity) {
                        this.inspect(entity);
                    }
                }
                else if (this.$.fields.target instanceof Fire.Entity) {
                    // uninspect
                    this.inspect(null);
                }
            }
            else if (type === 'asset') {
                if (inspect) {
                    this.lastUuid = id;
                    var meta = Fire.AssetDB.loadMeta(id);
                    // Checks whether last uuid modified to ensure call stack not suspended by another ipc event
                    // This may occurred after ipc sync invocation such as AssetDB.xxx
                    if (this.lastUuid === id) {
                        // this.inspect 前如果不延迟一帧，点右键菜单时渲染会只进行到一半，同时 inspector 切换也会有问题。
                        process.nextTick(function (meta) {
                            // Only inspect the lastest one
                            if (this.lastUuid === id) {
                                var importer = Fire.deserialize(meta);
                                this.inspect(importer);
                            }
                        }.bind(this, meta));
                    }
                }
                else if (this.$.fields.target instanceof Fire.Asset) {
                    // uninspect
                    this.inspect(null);
                }
            }
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

            this.$.fields.refresh();
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
                
                var prio = item.priority || 0;
                // enumerate menu path
                var newMenu = null;
                for (var p = 0, parent = template; p < subPathes.length; p++) {
                    var label = subPathes[p];
                    if (!label) {
                        continue;
                    }
                    var parentMenuArray = parent === template ? template : parent.submenu;
                    var menu;
                    if (parentMenuArray) {
                        if (parentMenuArray.length > 0) {
                             menu = findMenu(parentMenuArray, label);
                        }
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
                        priority: prio
                    };
                    if ( !parentMenuArray ) {
                        parent.submenu = [newMenu];
                    }
                    else {
                        var length = parentMenuArray.length;
                        if (length > 0) {
                            // find from back to front to get the one less than supplied priority,
                            // then return the last one.
                            for (var j = length - 1; j >= 0; j--) {
                                if (parentMenuArray[j].priority > newMenu.priority) {
                                    // end loop
                                    if (j === 0) {
                                        parentMenuArray.unshift(newMenu);
                                    }
                                }
                                else {
                                    parentMenuArray.splice(j + 1, 0, newMenu);
                                    break;
                                }
                            }
                        }
                        else {
                            parentMenuArray.push(newMenu);
                        }
                    }
                    parent = newMenu;
                }
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
            var rect = this.$.addComponent.getBoundingClientRect();
            var x = rect.left;
            var y = rect.bottom;

            var entity = this.$.fields.target;
            if (entity instanceof Fire.Entity === false) {
                return;
            }
            var template = this.getAddCompMenuTemplate();
            var menu = Menu.buildFromTemplate(template);
            menu.popup(Remote.getCurrentWindow(), x, y );
        },

        fieldsChangedAction: function ( event ) {
            Fire.broadcast( 'scene:dirty' );
        },
    });
})();
