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
            this.tabIndex = EditorUI.getParentTabIndex(this) + 1;
        },

        getCreateMenuTemplate: function (isContextMenu) {
            //var Remote = require('remote');
            //var Menu = Remote.require('menu');
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
                        Fire.broadcast('engine:createEntity', this.contextmenuAt && this.contextmenuAt.id);
                    }.bind(this.$.hierarchyTree)
                },
            ];
        },
    });

})();
