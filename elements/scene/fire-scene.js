(function () {
    var Ipc = require('ipc');

    Polymer({
        created: function () {
            window.addEventListener('resize', function() {
                this.resize();
            }.bind(this));

            this._ipc_select = this.select.bind(this, true);
            this._ipc_unselect = this.select.bind(this, false);
            this._ipc_hover = this.hover.bind(this);
            this._ipc_hoverout = this.hoverout.bind(this);
            this._ipc_repaint = this.delayRepaintScene.bind(this);
        },

        ready: function () {
            // register Ipc
            Ipc.on('selection:activated:entity', this._ipc_select );
            Ipc.on('selection:deactivated:entity', this._ipc_unselect );
            Ipc.on('scene:hover', this._ipc_hover );
            Ipc.on('scene:hoverout', this._ipc_hoverout );
            Ipc.on('scene:dirty', this._ipc_repaint );

            this._repaintID = setInterval ( this.repaintScene.bind(this), 500 );
        },

        detached: function () {
            Ipc.removeListener('selection:activated:entity', this._ipc_select );
            Ipc.removeListener('selection:deactivated:entity', this._ipc_unselect );
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

        select: function ( selected, entityID ) {
            if (selected) {
                if (!entityID) {
                    return;
                }

                var entity = Fire.Entity._getInstanceById(entityID);
                if (!entity) {
                    return;
                }

                this.$.view.select(entity);
            }
            else {
                //TODO: this.$.view.clearselect();
            }
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
