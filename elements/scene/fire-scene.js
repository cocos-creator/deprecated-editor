(function () {
    Polymer({
        created: function () {
            window.addEventListener('resize', function() {
                this.resize();
            }.bind(this));

            this._ipc_clearselect = this.clearselect.bind(this);
            this._ipc_select = this.select.bind(this);
        },

        ready: function () {
            // register Ipc
            Ipc.on('asset:selected', this._ipc_clearselect );
            Ipc.on('scene:selected', this._ipc_select );
        },

        detached: function () {
            Ipc.removeListener('asset:selected', this._ipc_clearselect );
            Ipc.removeListener('scene:selected', this._ipc_select );
        },

        initRenderContext: function () {
            this.$.view.init();
        },

        showAction: function ( event ) {
            this.resize();
        },

        resize: function () {
            this.$.view.resize();
        },

        clearselect: function () {
            // this.$.view.clearselect();
        },

        select: function ( entityIDs ) {
            this.clearselect();

            // only support entity currently
            var id = entityIDs[0];   // multi-inpector not yet implemented
            if (!id) {
                return;
            }

            var entity = Fire.Entity._getInstanceById(id);
            if (!entity) {
                return;
            }

            // TODO
            // this.$.view.select(entity);
        },

    });
})();
