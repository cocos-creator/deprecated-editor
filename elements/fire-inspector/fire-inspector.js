var Remote = require('remote');
var Menu = Remote.require('menu');

Polymer({
    created: function () {
        this.target = null;
        this.icon = new Image();
        this.icon.src = "fire://static/img/plugin-inspector.png";

        this.ipc = new Fire.IpcListener();
    },

    attached: function () {
        // register Ipc
        this.ipc.on('selection:activated', this._onInspect.bind(this, true) );
        this.ipc.on('selection:deactivated', this._onInspect.bind(this, false) );

        this.ipc.on('asset:applied', this._onAssetApplied.bind(this) );
    },

    detached: function () {
        this.ipc.clear();
    },

    _reload: function () {
        var meta = Fire.AssetDB.loadMeta(this.lastUuid);
        var importer = Fire.deserialize(meta);
        this.inspect(importer,true);
    },

    _onInspect: function ( active, type, id ) {
        if (type === 'entity') {
            if (active) {
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
            if (active) {
                this.lastUuid = id;
                var meta = Fire.AssetDB.loadMeta(id);
                // Checks whether last uuid modified to ensure call stack not suspended by another ipc event
                // This may occurred after ipc sync invocation such as AssetDB.xxx
                if (meta && this.lastUuid === id) {
                    // one frame dely to make sure mouse right click event (contextmenu popup) will not suspend the rendering
                    process.nextTick(function (meta) {
                        // Only inspect the lastest one
                        if (this.lastUuid === id) {
                            var importer = Fire.deserialize(meta);
                            this.inspect(importer);
                        }
                    }.bind(this, meta));
                }
            }
            else if (this.$.fields.target instanceof Fire.Importer) {
                // uninspect
                this.inspect(null);
            }
        }
    },

    _onAssetApplied: function ( uuid ) {
        if ( this.lastUuid === uuid ) {
            this.target.dirty = false;
            Fire.warn('@Jare: Please put AssetLibrary.UpdateAsset(uuid) here');
        }
    },

    _updateEntityToolbar: function () {
        var toolbar = this.$.toolbar;
        var target = this.target;
        var el = new FireCheckbox();
        el.bind('value', new PathObserver( target, 'active'));
        toolbar.appendChild(el);

        el = new FireTextInput();
        el.bind('value', new PathObserver( target, 'name'));
        el.setAttribute('flex-1','');
        toolbar.appendChild(el);

        el = document.createElement('i');
        el.id = 'btnAddComp';
        el.classList.add('fa', 'fa-plus');
        el.addEventListener('click', this.addComponentAction.bind(this) );
        toolbar.appendChild(el);
    },

    _updateImporterToolbar: function () {
        var toolbar = this.$.toolbar;
        var target = this.target;

        toolbar.setAttribute('justify-end','');

        var el = new FireButton();
        var observer = new PathObserver(target, 'dirty');
        var transformObserver = new ObserverTransform(observer, function ( value ) {
            return !value;
        });
        el.bind('disabled', transformObserver );
        el.addEventListener('click', this.revertAction.bind(this));
        var icon = document.createElement('i');
        icon.classList.add('fa', 'fa-close');
        el.appendChild(icon);
        toolbar.appendChild(el);

        el = new FireButton();
        observer = new PathObserver(target, 'dirty');
        transformObserver = new ObserverTransform(observer, function ( value ) {
            return !value;
        });
        el.bind('disabled', transformObserver );
        el.addEventListener('click', this.applyAction.bind(this));
        icon = document.createElement('i');
        icon.classList.add('fa', 'fa-check');
        el.appendChild(icon);
        toolbar.appendChild(el);

    },

    inspect: function ( obj, force ) {
        //
        if ( !force ) {
            //
            if ( this.target === obj ) {
                return;
            }

            //
            if ( this.target instanceof Fire.Importer &&
                 obj instanceof Fire.Importer )
            {
                if ( this.target.uuid === obj.uuid ) {
                    return;
                }
            }
        }

        //
        if ( this.target ) {
            Fire.observe(this.target,false);
        }
        if ( obj ) {
            Fire.observe(obj,true);
        }
        this.target = obj;
        this.$.fields.target = obj;

        // update toolbar
        while (this.$.toolbar.firstElementChild) {
            this.$.toolbar.removeChild(this.$.toolbar.firstElementChild);
        }
        this.$.toolbar.removeAttribute('justify-end');
        if ( obj instanceof Fire.Entity ) {
            this._updateEntityToolbar();
        }
        else if ( obj instanceof Fire.Importer ) {
            this._updateImporterToolbar();
        }

        // update fileds
        this.$.fields.refresh();

        // update preview
        if ( this.$.preview.firstElementChild ) {
            this.$.preview.removeChild(this.$.preview.firstElementChild);
        }
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
                // jshint ignore:start
                newMenu.click = (function (component) {
                    this.addComponent(component);
                }).bind(this, item.component);
                // jshint ignore:end
            }
            else {
                Fire.error('Invalid component menu path: ' + item.menuPath);
            }
        }
        return template;
    },

    addComponentAction: function () {
        var btnAddComp = this.shadowRoot.getElementById('btnAddComp');
        var rect = btnAddComp.getBoundingClientRect();
        var x = rect.left;
        var y = rect.bottom;

        var entity = this.$.fields.target;
        if (entity instanceof Fire.Entity === false) {
            return;
        }
        var template = this.getAddCompMenuTemplate();
        var menu = Menu.buildFromTemplate(template);
        menu.popup(Remote.getCurrentWindow(), Math.floor(x), Math.floor(y));
    },

    fieldsChangedAction: function ( event ) {
        Fire.sendToPages( 'scene:dirty' );
    },

    propertyChangedAction: function ( event ) {
        if ( this.target )
            this.target.dirty = true;
    },

    applyAction: function ( event ) {
        var meta = Fire.serialize(this.target);
        Fire.sendToCore('asset-db:apply', meta );
    },

    revertAction: function ( event ) {
        this._reload();
    },
});
