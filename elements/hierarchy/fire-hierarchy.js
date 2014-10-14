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
            this.focused = false;
        },

        ready: function () {
            this.tabIndex = EditorUI.getParentTabIndex(this) + 1;
        },

        getCreateMenuTemplate: function (isContextMenu) {
            return [
                {
                    label: 'Create Empty',
                    click: function () {
                        if (isContextMenu) {
                            var parentEL = this.contextmenuAt && this.contextmenuAt.parentElement;
                            if (parentEL instanceof HierarchyItem) {
                                Fire.broadcast('engine:createEntity', parentEL.id);
                                return;
                            }
                        }
                        Fire.broadcast('engine:createEntity');
                    }.bind(this.$.hierarchyTree),
                },
                {
                    label: 'Create Empty Child',
                    click: function () {
                        var selected = isContextMenu ? this.contextmenuAt : this.lastActive;
                        Fire.broadcast('engine:createEntity', selected && selected.id);
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
