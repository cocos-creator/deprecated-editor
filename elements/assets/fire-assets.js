(function () {
    var Ipc = require('ipc');

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
        },

        ready: function () {
            this.tabIndex = EditorUI.getParentTabIndex(this) + 1;

            Ipc.on('selection:asset:selected', this._ipc_selected);
            Ipc.on('selection:asset:unselected', this._ipc_unselected);
        },

        detached: function () {
            Ipc.removeListener('selection:asset:selected', this._ipc_selected);
            Ipc.removeListener('selection:asset:unselected', this._ipc_unselected);
        },

        select: function (selected, ids) {
            for (var i = 0; i < ids.length; ++i) {
                var id = ids[i];
                var el = this.$.assetsTree.idToItem[id];
                if (el) {
                    el.selected = selected;
                }
            }
        },

        domReady: function () {
            this.load("assets://");
        },

        load: function ( url ) {
            this.$.assetsTree.load(url);
        },

    });
})();
