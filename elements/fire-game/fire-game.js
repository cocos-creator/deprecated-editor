var resolutionList = [
    { name: "Free Aspect", type: "free", value: [-1,-1] },
    { name: "Custom Size", type: "custom", value: [-1, -1] },
    { name: "Display (4:3)", type: "ratio", value: [4, 3] },
    { name: "Display (16:9)", type: "ratio", value: [16, 9] },
    { name: "iPhone 4 (640 x 960)", type: "fixed", value: [640, 960] },
    { name: "iPhone 5 (640 x 1136)", type: "fixed", value: [640, 1136] },
    { name: "iPhone 6 (750 x 1334)", type: "fixed", value: [750, 1334] },
    { name: "iPhone 6 Plus (1242 x 2208)", type: "fixed", value: [1242, 2208] },
];

Polymer({
    created: function () {
        this.icon = new Image();
        this.icon.src = "fire://static/img/plugin-game.png";

        this.ipc = new Editor.IpcListener();

        this.renderContext = null;
        this.curResolution = 0;
        this.rotate = false;
        this.customWidth = 640;
        this.customHeight = 480;
    },

    observe: {
        'curResolution': 'resize',
        'rotate': 'resize',
        'customWidth': 'resize',
        'customHeight': 'resize',
    },

    ready: function () {
        this.$.resolutionOptions.options = resolutionList.map( function ( item, idx ) {
            return { value: idx, name: item.name };
        });

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
        if ( !this.renderContext )
            return;

        //
        var oldDisplay = this.style.display;
        this.style.display = "";

        //
        var size = [ -1, -1 ];
        var resolutionInfo = resolutionList[this.curResolution];
        var contentRect = this.$.view.getBoundingClientRect();
        var srcWidth, srcHeight, ratio;

        if ( resolutionInfo.type === "fixed" ) {
            if ( this.rotate ) {
                srcWidth = resolutionInfo.value[1];
                srcHeight = resolutionInfo.value[0];
            }
            else {
                srcWidth = resolutionInfo.value[0];
                srcHeight = resolutionInfo.value[1];
            }
            size = Fire.fitSize( srcWidth, srcHeight, contentRect.width, contentRect.height );
        }
        else if ( resolutionInfo.type === "ratio" ) {
            if ( this.rotate ) {
                ratio = resolutionInfo.value[1]/resolutionInfo.value[0]; // h/w
            }
            else {
                ratio = resolutionInfo.value[0]/resolutionInfo.value[1]; // w/h
            }
            size = Fire.fitRatio( ratio, contentRect.width, contentRect.height );
        }
        else if ( resolutionInfo.type === "custom" ) {
            if ( this.rotate ) {
                srcWidth = this.customHeight;
                srcHeight = this.customWidth;
            }
            else {
                srcWidth = this.customWidth;
                srcHeight = this.customHeight;
            }
            size = Fire.fitSize( srcWidth, srcHeight, contentRect.width, contentRect.height );
        }
        else {
            size = [this.$.view.clientWidth, this.$.view.clientHeight];
        }

        //
        this.renderContext.size = new Fire.Vec2( size[0], size[1] );
        this.style.display = oldDisplay;
        this.repaintScene();
    },

    repaintScene: function () {
        if ( !this.renderContext )
            return;

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

    mousedownAction: function ( event ) {
        event.stopPropagation();
        this.$.view.focus();
    },
});
