var Remote = require('remote');
var Menu = Remote.require('menu');

function createEntityFromSnapshot(tree, selection, entityData, parentEL) {
    if ( !(entityData.objFlags & Fire._ObjectFlags.HideInEditor) ) {
        var el = tree.newItem(entityData.name, entityData.id, parentEL);
        if (selection) {
            el.selected = selection.indexOf(el.userId) !== -1;
        }

        var children = entityData.children;
        for (var i = 0, len = children.length; i < len; i++) {
            createEntityFromSnapshot(tree, selection, children[i], el);
        }
    }
}

Polymer({
    created: function () {
        this.icon = new Image();
        this.icon.src = "fire://static/img/plugin-hierarchy.png";

        this.ipc = new Fire.IpcListener();
    },

    attached: function () {
        this.ipc.on('entity:created', this.newEntity.bind(this));
        this.ipc.on('scene:launched', this.reload.bind(this));

        this.ipc.on('selection:entity:selected', this.select.bind(this, true));
        this.ipc.on('selection:entity:unselected', this.select.bind(this, false));
        this.ipc.on('selection:entity:hover', this.hover.bind(this));
        this.ipc.on('selection:entity:hoverout', this.hoverout.bind(this));
        this.ipc.on('selection:entity:activated', this.active.bind(this, true));
        this.ipc.on('selection:entity:deactivated', this.active.bind(this, false));

        this.ipc.on('entity:hint', this.hint.bind(this));
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

    active: function (activated, id) {
        if ( activated ) {
            var el = this.$.hierarchyTree.idToItem[id];
            this.$.hierarchyTree.active(el);
        }
        else {
            this.$.hierarchyTree.active(null);
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

    hint: function ( entityID ) {
        this.$.hierarchyTree.hintItem(entityID);
    },

    createAction: function () {
        var type = 'create';
        Fire.popupMenu(Fire.plugins.hierarchy.getMenuTemplate(type));
    },

    reload: function (sceneSnapshot) {
        var tree = this.$.hierarchyTree;
        tree.clear();

        var selection = Fire.Selection.entities;
        var entityDatas = sceneSnapshot.entities;
        for (var i = 0, len = entityDatas.length; i < len; i++) {
            createEntityFromSnapshot(tree, selection, entityDatas[i]);
        }
    },

    newEntity: function ( name, flags, id, parentEL ) {
        var tree = this.$.hierarchyTree;
        if (typeof name === 'string') {
            if ( !(flags & Fire._ObjectFlags.HideInEditor) ) {
                return tree.newItem(name, id, parentEL);
            }
        }
        else if (name){
            var snapshot = name;
            createEntityFromSnapshot(tree, null, snapshot);
        }
    },
});
