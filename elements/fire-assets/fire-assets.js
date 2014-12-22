(function () {
    Polymer({
        created: function () {
            this.icon = new Image();
            this.icon.src = "fire://static/img/plugin-assets.png";

            this.ipc = new Fire.IpcListener();
        },

        attached: function () {
            this.ipc.on('selection:asset:selected', this.select.bind(this, true));
            this.ipc.on('selection:asset:unselected', this.select.bind(this, false));
            this.ipc.on('asset:hint', this.hint.bind(this));
        },

        detached: function () {
            this.ipc.clear();
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

        hint: function (uuid) {
            this.$.assetsTree.hintItem(uuid);
        },

        domReady: function () {
            Fire.info("browse assets://");
            this.$.assetsTree.browse("assets://");
        },

    });
})();
