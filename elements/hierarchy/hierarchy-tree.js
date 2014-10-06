(function () {
    var Path = require('fire-path');
    var Url = require('fire-url');

    var Remote = require('remote');
    var Ipc = require('ipc');
    var Menu = Remote.require('menu');
    var MenuItem = Remote.require('menu-item');

    Polymer({
        publish: {
            focused: {
                value: false,
                reflect: true
            },
        },

        created: function () {
            this.focused = false;

            this._idToItem = {};
            this._ipc_refresh = this.refresh.bind(this);
            this._ipc_newItem = this.newItem.bind(this);
            this._ipc_deleteItem = this.deleteItem.bind(this);
            this._ipc_setItemParent = this.setItemParent.bind(this);
            this._ipc_setItemIndex = this.setItemIndex.bind(this);
            //this._ipc_beginLoad = this.beginLoad.bind(this);
            //this._ipc_endLoad = this.endLoad.bind(this);
        },

        ready: function () {
            this.tabIndex = EditorUI.getParentTabIndex(this) + 1;
            // register Ipc
            Ipc.on('scene:launched', this._ipc_refresh);
            Ipc.on('entity:created', this._ipc_newItem);
            Ipc.on('entity:removed', this._ipc_deleteItem);
            Ipc.on('entity:parentChanged', this._ipc_setItemParent);
            Ipc.on('entity:indexChanged', this._ipc_setItemIndex);
            //Ipc.on('hierarchy:beginLoad', this._ipc_beginLoad);
            //Ipc.on('hierarchy:endLoad', this._ipc_endLoad);

            //
            this.refresh();
        },

        detached: function () {
            // unregister Ipc
            Ipc.removeListener('scene:launched', this._ipc_refresh);
            Ipc.removeListener('entity:created', this._ipc_newItem);
            Ipc.removeListener('entity:removed', this._ipc_deleteItem);
            Ipc.removeListener('entity:parentChanged', this._ipc_setItemParent);
            Ipc.removeListener('entity:indexChanged', this._ipc_setItemIndex);
            //Ipc.removeListener('hierarchy:beginLoad', this._ipc_beginLoad);
            //Ipc.removeListener('hierarchy:endLoad', this._ipc_endLoad);
        },

        newItem: function ( name, flags, id/*, parentID*/ ) {
            if (flags & Fire._ObjectFlags.SceneGizmo) {
                return;
            }
            var newEL = new HierarchyItem();
            newEL.name = name;
            this._idToItem[id] = newEL;

            //var index = transform.getSiblingIndex();
            var parentEL = /*parentID ? this._idToItem[parentID] : */this;
            parentEL.appendChild(newEL);
            //parentEL.insertBefore(newEL, parentEL.children[index]);
        },

        deleteItem: function ( id ) {
            var el = this._idToItem[id];
            if ( !el ) {
                Fire.warn( 'Can not find source element: ' + id );
                return;
            }
            el.remove();
        },

        setItemParent: function ( id, parentID ) {
            var el = this._idToItem[id];
            if ( !el ) {
                Fire.warn( 'Can not find source element: ' + id );
                return;
            }

            var parentEL = parentID ? this._idToItem[parentID] : this;
            if ( !parentEL ) {
                Fire.warn( 'Can not find dest element: ' + destUrl );
                return;
            }
            parentEL.appendChild(el);
        },

        setItemIndex: function ( id, nextIdInGame ) {
            var el = this._idToItem[id];
            if ( !el ) {
                Fire.warn( 'Can not find source element: ' + id );
                return;
            }
            if ( nextIdInGame ) {
                var next = this._idToItem[nextIdInGame];
                if ( !next ) {
                    Fire.warn( 'Can not find next element: ' + nextIdInGame );
                    return;
                }
                el.parentNode.insertBefore(el, next);
            }
            else {
                el.parentNode.appendChild(el);
            }
        },

        //beginLoad: function () {
        //    // TODO lock
        //    console.time('hierarchy-tree:load');
        //    // TODO clear
        //},

        //endLoad: function () {
        //    // TODO unlock
        //    console.timeEnd('hierarchy-tree:load');
        //},
        refresh: function () {
            // clear
            while (this.firstChild) {
                this.removeChild(this.firstChild);
            }
            // 目前hierarchy和engine处在同一context，直接访问场景就行，
            // 将来如有需要再改成ipc
            if (!Fire.Engine._scene) {
                return;
            }
            function createItem(transform) {
                var entity = transform.entity;
                this.newItem(entity.name, entity._objFlags, entity.hashKey);

                var children = transform._children;
                for (var i = 0, len = children.length; i < len; i++) {
                    createItem(children[i]);
                }
            }
            var entities = Fire.Engine._scene.entities;
            for (var i = 0, len = entities.length; i < len; i++) {
                createItem(entities[i].transform);
            }
        },

    });
})();
