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
        ready: function () {
            this.tabIndex = EditorUI.getParentTabIndex(this)+1;
            Ipc.on('transform:created', this._ipc_newItem);

        detached: function () {
            Ipc.removeListener('scene:launched', this._ipc_refresh);
            Ipc.removeListener('transform:created', this._ipc_newItem);
            Ipc.removeListener('transform:removed', this._ipc_deleteItem);
            Ipc.removeListener('transform:parentChanged', this._ipc_setItemParent);
            Ipc.removeListener('transform:indexChanged', this._ipc_setItemIndex);
        },
        newItem: function ( transform ) {
            var entity = transform.entity;
            var newEL = new HierarchyItem();
            newEL.name = entity.name;
            this._idToItem[entity.hashKey] = entity;

            var parent = transform.parent && transform.parent.entity;
            //var index = transform.getSiblingIndex();
            var parentEL = parent ? this._idToItem[parent.hashKey] : this;
            parentEL.appendChild(newEL);
            //parentEL.insertBefore(newEL, parentEL.children[index]);
            if (!parent) {
                newEL.style.marginLeft = '0px';
            }
        },

    });
})();
