Polymer({
    created: function () {
        this.icon = new Image();
        this.icon.src = "fire://static/img/plugin-game.png";

        this.ipc = new Fire.IpcListener();

        this.renderContext = null;
        this.curResolution = 0;
    },

    ready: function () {
        this.$.resolutionSelect.options = [
            { name: "Free Aspect", value: 0 },
            { name: "iPhone 5 (9:16)", value: 1 },
            { name: "iPhone 6 (2:3)", value: 2 },
            { name: "Custom", value: 3 },
        ];

        this.$.view.tabIndex = EditorUI.getParentTabIndex(this)+1;
    },

    attached: function () {
        this.ipc.on('scene:dirty', this.delayRepaintScene.bind(this) );
    },

    detached: function () {
        this.ipc.clear();
    },

    setRenderContext: function ( renderContext ) {
        if ( this.renderContext !== null ) {
            this.$.view.removeChild(this.renderContext.canvas);
        }

        this.renderContext = renderContext;

        if ( this.renderContext !== null ) {
            this.$.view.appendChild(this.renderContext.canvas);
        }
    },

    resize: function () {
        if ( this.renderContext !== null ) {
            var old = this.style.display;
            this.style.display = "";
            this.renderContext.size = new Fire.Vec2( this.$.view.clientWidth,
                                                     this.$.view.clientHeight );
            this.style.display = old;
            this.repaintScene();
        }
    },

    repaintScene: function () {
        Fire.Engine._scene.render(this.renderContext);
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

    showAction: function ( event ) {
        this.repaintScene();

        this._repaintID = setInterval ( this.repaintScene.bind(this), 500 );
    },

    hideAction: function ( event ) {
        clearInterval (this._repaintID);
    },

    resizeAction: function ( event ) {
        this.resize();
    },
});
