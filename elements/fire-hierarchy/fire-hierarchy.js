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
            this.icon.src = "fire://static/img/plugin-hierarchy.png";

            this.focused = false;

            this.ipc = new Fire.IpcListener();
        },

        ready: function () {
            this.tabIndex = EditorUI.getParentTabIndex(this) + 1;

            this.ipc.on('selection:entity:selected', this.select.bind(this, true));
            this.ipc.on('selection:entity:unselected', this.select.bind(this, false));
            this.ipc.on('selection:entity:hover', this.hover.bind(this));
            this.ipc.on('selection:entity:hoverout', this.hoverout.bind(this));
            this.ipc.on('scene:launched', this.reload.bind(this));
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

        hover: function ( entityID ) {
            var el = this.$.hierarchyTree.idToItem[entityID];
            if (el) {
                el.hover = true;
            }
        },

        hoverout: function ( entityID ) {
            var el = this.$.hierarchyTree.idToItem[entityID];
            if (el) {
                el.hover = false;
            }
        },

        createAction: function () {
            var type = 'create';
            Fire.popupMenu(Fire.plugins.hierarchy.getMenuTemplate(type));
        },

        reload: function (sceneSnapshot) {
            var tree = this.$.hierarchyTree;
            tree.clear();

            var selection = Fire.Selection.entities;
            function createItem(entityData, parentEL) {
                var el = tree.newItem(entityData.name, entityData.objFlags, entityData.id, parentEL);
                if (el) {
                    var children = entityData.children;
                    for (var i = 0, len = children.length; i < len; i++) {
                        createItem(children[i], el);
                    }
                    el.selected = selection.indexOf(el.userId) !== -1;
                }
            }
            var entityDatas = sceneSnapshot.entities;
            for (var i = 0, len = entityDatas.length; i < len; i++) {
                createItem(entityDatas[i]);
            }
        },
    });
})();
