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
            this._ipc_newItem = this.newItem.bind(this);
            this._ipc_deleteItem = this.deleteItem.bind(this);
            this._ipc_setItemParent = this.setItemParent.bind(this);
            this._ipc_setItemIndex = this.setItemIndex.bind(this);
        },

        ready: function () {
            this.tabIndex = EditorUI.getParentTabIndex(this) + 1;
            // register Ipc
            //Ipc.on('scene:launched', this._ipc_refresh);
            Ipc.on('entity:created', this._ipc_newItem);
            Ipc.on('entity:removed', this._ipc_deleteItem);
            Ipc.on('entity:parentChanged', this._ipc_setItemParent);
            Ipc.on('entity:indexChanged', this._ipc_setItemIndex);
        },

        detached: function () {
            //Ipc.removeListener('scene:launched', this._ipc_refresh);
            Ipc.removeListener('entity:created', this._ipc_newItem);
            Ipc.removeListener('entity:removed', this._ipc_deleteItem);
            Ipc.removeListener('entity:parentChanged', this._ipc_setItemParent);
            Ipc.removeListener('entity:indexChanged', this._ipc_setItemIndex);
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
            //if (parentEL === this) {
                newEL.style.marginLeft = '0px';
            //}
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
            if (parentEL === this) {
                newEL.style.marginLeft = '0px';
            }
            parentEL.appendChild(el);
        },

        setItemIndex: function ( id, index ) {
            var el = this._idToItem[id];
            if ( !el ) {
                Fire.warn( 'Can not find source element: ' + id );
                return;
            }
            var siblings = el.parentNode.children;
            if (index >= siblings.length) {
                Fire.warn( 'index out of range, max: %d, current: %d', siblings.length - 1, index );
                return;
            }
            if (index < siblings.length - 1) {
                el.parentNode.insertBefore(el, siblings[index]);
            }
            else {
                el.parentNode.appendChild(el);
            }
        },

    });
})();
