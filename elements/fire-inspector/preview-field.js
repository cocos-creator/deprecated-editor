Polymer(EditorUI.mixin({
    publish: {
        'width': 200,
        'height': 200,
        'min-width': 10,
        'min-height': 10,

        asset: null,
        hide: { value: false, reflect: true },
    },

    created: function () {
        this.info = "Unkown";
        this._previewType = "Unkown";
    },

    ready: function () {
        this._initResizable();
    },

    resize: function () {
        if ( !this.asset )
            return;

        var contentRect = this.$.content.getBoundingClientRect();

        if ( this._previewType === "texture" ) {
            if ( this.asset.width > contentRect.width &&
                 this.asset.height > contentRect.height )
            {
                var width = contentRect.width;
                var height = this.asset.height * contentRect.width/this.asset.width;

                if ( height > contentRect.height ) {
                    height = contentRect.height;
                    width = this.asset.width * contentRect.height/this.asset.height;
                }

                this.$.canvas.width = width;
                this.$.canvas.height = height;
            }
            else if ( this.asset.width > contentRect.width ) {
                this.$.canvas.width = contentRect.width;
                this.$.canvas.height = this.asset.height * contentRect.width/this.asset.width;
            }
            else if ( this.asset.height > contentRect.height ) {
                this.$.canvas.width = this.asset.width * contentRect.height/this.asset.height;
                this.$.canvas.height = contentRect.height;
            }
            else {
                this.$.canvas.width = this.asset.width;
                this.$.canvas.height = this.asset.height;
            }
        }
        else {
            this.$.canvas.width = contentRect.width;
            this.$.canvas.height = contentRect.height;
        }

        //
        this.repaint();
    },

    repaint: function () {
        if ( this._previewType === "texture" ) {
            var ctx = this.$.canvas.getContext("2d");
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage( this.asset.image, 0, 0, this.$.canvas.width, this.$.canvas.height );
        }
    },

    assetChanged: function () {
        if ( this.asset instanceof Fire.Texture ) {
            this._previewType = "texture";
            this.info = this.asset.width + " x " + this.asset.height;
            this.resize();
        }
    },

    resizeAction: function ( event ) {
        this.resize();
    },
}, EditorUI.resizable));
