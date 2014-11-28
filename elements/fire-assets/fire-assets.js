(function () {
    Polymer({
        publish: {
            focused: {
                value: false,
                reflect: true
            },
        },

        created: function () {
            this.icon = new Image();
            this.icon.src = "fire://static/img/plugin-assets.png";

            this.focused = false;
            this.ipc = new Fire.IpcListener();
        },

        ready: function () {
            this.tabIndex = EditorUI.getParentTabIndex(this) + 1;

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
            var el = this.$.assetsTree.idToItem[uuid];
            if (el) {
                this.$.assetsTree.scrollTop = el.offsetTop + 16 - this.$.assetsTree.offsetHeight/2;
                el.animate([
                    {background: "white", transform: "scale(1.2)"},
                    {background: "none", transform: "scale(1)"}
                ], {
                    duration: 200
                });
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
