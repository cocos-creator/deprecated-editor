(function () {
    var Ipc = require('ipc');

    Polymer({
        created: function () {
            window.addEventListener('resize', function() {
                this.resize();
            }.bind(this));

            this._ipc_clearselect = this.clearselect.bind(this);
            this._ipc_select = this.select.bind(this);
            this._ipc_hover = this.hover.bind(this);
            this._ipc_hoverout = this.hoverout.bind(this);
            this._ipc_repaint = this.delayRepaintScene.bind(this);
        },

        ready: function () {
            // register Ipc
            Ipc.on('asset:selected', this._ipc_clearselect );
            Ipc.on('entity:selected', this._ipc_select );
            Ipc.on('scene:hover', this._ipc_hover );
            Ipc.on('scene:hoverout', this._ipc_hoverout );
            Ipc.on('scene:dirty', this._ipc_repaint );

            this._repaintID = setInterval ( this.repaintScene.bind(this), 500 );
        },

        detached: function () {
            Ipc.removeListener('asset:selected', this._ipc_clearselect );
            Ipc.removeListener('entity:selected', this._ipc_select );
            Ipc.removeListener('scene:hover', this._ipc_hover );
            Ipc.removeListener('scene:hoverout', this._ipc_hoverout );
            Ipc.removeListener('scene:dirty', this._ipc_repaint );

            clearInterval (this._repaintID);
        },

        initRenderContext: function () {
            this.$.view.init();
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

            this.$.view.select(entity);
        },

        hover: function ( entityID ) {
            if ( !entityID )
                return;

            var entity = Fire.Entity._getInstanceById(entityID);
            if (!entity) {
                return;
            }

            this.$.view.hover(entity);
        },

        hoverout: function ( entityID ) {
            this.$.view.hoverout();
        },

        delayRepaintScene: function () {
            if ( this._repainting )
                return;

            this._repainting = true;
            setTimeout( function () {
                this.repaintScene();
                this._repainting = false;
            }.bind(this), 100 );
        },

        repaintScene: function () {
            this.$.view.repaint();
        },

        showAction: function ( event ) {
            this.resize();
        },

        layoutToolsAction: function ( event ) {
            this.$.view.rebuildGizmos();
            event.stopPropagation();
        },
    });
})();
