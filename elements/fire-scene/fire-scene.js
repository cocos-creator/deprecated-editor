var Path = require('fire-path');
var Url = require('fire-url');
var Remote = require('remote');

Polymer({
    created: function () {
        this.icon = new Image();
        this.icon.src = "fire://static/img/plugin-scene.png";

        this.ipc = new Fire.IpcListener();
    },

    ready: function () {
    },

    attached: function () {
        // register ipc
        this.ipc.on('selection:entity:selected', this.select.bind(this, true) );
        this.ipc.on('selection:entity:unselected', this.select.bind(this, false) );
        this.ipc.on('selection:entity:hover', this.hover.bind(this) );
        this.ipc.on('selection:entity:hoverout', this.hoverout.bind(this) );
        this.ipc.on('scene:dirty', this.delayRepaintScene.bind(this) );
    },

    detached: function () {
        this.ipc.clear();
    },

    initRenderContext: function () {
        this.$.view.init();
    },

    resize: function () {
        var old = this.style.display;
        this.style.display = "";

        this.$.view.resize();

        this.style.display = old;
    },

    select: function ( selected, entityIds ) {
        if ( selected )
            this.$.view.select(entityIds);
        else
            this.$.view.unselect(entityIds);
    },

    hover: function ( entityID ) {
        if ( !entityID )
            return;

        this.$.view.hover(entityID);
    },

    hoverout: function ( entityID ) {
        if ( !entityID )
            return;

        this.$.view.hoverout( entityID );
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

    initSceneCamera: function () {
        this.$.view.initSceneCamera();
    },

    layoutToolsAction: function ( event ) {
        this.$.view.rebuildGizmos();
        event.stopPropagation();
    },

    showAction: function ( event ) {
        this.resize();
    },

    resizeAction: function ( event ) {
        this.resize();
    },
});
