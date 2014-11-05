(function () {
    Polymer({
        created: function () {
            this.icon = new Image();
            this.icon.src = "fire://static/img/plugin-scene.png";

            window.addEventListener('resize', function() {
                this.resize();
            }.bind(this));

            this.ipc = new Fire.IpcListener();
        },

        ready: function () {
            // register ipc
            this.ipc.on('selection:entity:selected', this.select.bind(this, true) );
            this.ipc.on('selection:entity:unselected', this.select.bind(this, false) );
            this.ipc.on('selection:entity:hover', this.hover.bind(this) );
            this.ipc.on('selection:entity:hoverout', this.hoverout.bind(this) );
            this.ipc.on('scene:dirty', this.delayRepaintScene.bind(this) );

            this._repaintID = setInterval ( this.repaintScene.bind(this), 500 );
        },

        detached: function () {
            this.ipc.clear();

            clearInterval (this._repaintID);
        },

        initRenderContext: function () {
            this.$.view.init();
        },

        resize: function () {
            this.$.view.resize();
        },

        select: function ( selected, entityIDs ) {
            var entities = [];
            for ( var i = 0; i < entityIDs.length; ++i ) {
                var entity = Fire._getInstanceById(entityIDs[i]);
                if (entity) {
                    entities.push( entity );
                }
            }

            if ( selected )
                this.$.view.select(entities);
            else
                this.$.view.unselect(entities);
        },

        hover: function ( entityID ) {
            if ( !entityID )
                return;

            var entity = Fire._getInstanceById(entityID);
            if (!entity) {
                return;
            }

            this.$.view.hover(entity);
        },

        hoverout: function ( entityID ) {
            if ( !entityID )
                return;

            var entity = Fire._getInstanceById(entityID);
            if (!entity) {
                return;
            }

            this.$.view.hoverout( entity );
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
