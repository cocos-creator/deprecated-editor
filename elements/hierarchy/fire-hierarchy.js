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

            this.ipc = new Fire.IpcListener();
        },

        ready: function () {
            this.tabIndex = EditorUI.getParentTabIndex(this) + 1;

            this.ipc.on('selection:entity:selected', this.select.bind(this, true));
            this.ipc.on('selection:entity:unselected', this.select.bind(this, false));
        },

        detached: function () {
            this.ipc.clear();
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

        createAction: function () {
            var type = 'main-menu'; // the same as main menu
            Fire.popupMenu(Fire.plugins.hierarchy.getCreateMenuTemplate(type));
        },
    });
})();
