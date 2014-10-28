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
            this._ipc_selected = this.select.bind(this, true);
            this._ipc_unselected = this.select.bind(this, false);
            //this._ipc_activated = this.activate.bind(this, true);
            //this._ipc_deactivated = this.activate.bind(this, false);
            this._ipc_hover = this.hover.bind(this);
            this._ipc_hoverout = this.hoverout.bind(this);

            this._lasthover = null;
        },

        ready: function () {
            this.tabIndex = EditorUI.getParentTabIndex(this) + 1;

            Ipc.on('selection:entity:selected', this._ipc_selected);
            Ipc.on('selection:entity:unselected', this._ipc_unselected);
            //Ipc.on('selection:entity:activated', this._ipc_activated);
            //Ipc.on('selection:entity:deactivated', this._ipc_deactivated);
            Ipc.on('selection:entity:hover', this._ipc_hover );
            Ipc.on('selection:entity:hoverout', this._ipc_hoverout );
        },

        detached: function () {
            Ipc.removeListener('selection:entity:selected', this._ipc_selected);
            Ipc.removeListener('selection:entity:unselected', this._ipc_unselected);
            Ipc.removeListener('selection:entity:hover', this._ipc_hover );
            Ipc.removeListener('selection:entity:hoverout', this._ipc_hoverout );
        },

        select: function (selected, entityIds) {
            for (var i = 0; i < entityIds.length; ++i) {
                var id = entityIds[i];
                var el = this.$.hierarchyTree.idToItem[id];
                if (el) {
                    el.selected = selected;
                }
            }
        },

        hover: function ( entityID ) {
            var el = this.$.hierarchyTree.idToItem[entityID];
            if (el) {
                el.hover = true;
            }

            if ( this._lasthover && this._lasthover !== el ) {
                this._lasthover.hover = false;
            }
            this._lasthover = el;
        },

        hoverout: function () {
            if ( this._lasthover ) {
                this._lasthover.hover = false;
                this._lasthover = null;
            }
        },

        getCreateMenuTemplate: function (isContextMenu) {
            return [
                {
                    label: 'Create Empty',
                    click: function () {
                        if (isContextMenu) {
                            var parentEL = this.contextmenuAt && this.contextmenuAt.parentElement;
                            if (parentEL instanceof HierarchyItem) {
                                Fire.broadcast('engine:createEntity', parentEL.userId);
                                return;
                            }
                        }
                        Fire.broadcast('engine:createEntity');
                    }.bind(this.$.hierarchyTree),
                },
                {
                    label: 'Create Empty Child',
                    click: function () {
                        if (isContextMenu && this.contextmenuAt) {
                            Fire.broadcast('engine:createEntity', this.contextmenuAt.userId);
                        }
                        else {
                            var activeId = Fire.Selection.activeEntityId;
                            if (activeId) {
                                Fire.broadcast('engine:createEntity', activeId);
                            }
                        }
                    }.bind(this.$.hierarchyTree)
                },
            ];
        },

        createAction: function () {
            var template = this.getCreateMenuTemplate(false);
            var menu = Menu.buildFromTemplate(template);
            menu.popup(Remote.getCurrentWindow());
        },
    });

})();
