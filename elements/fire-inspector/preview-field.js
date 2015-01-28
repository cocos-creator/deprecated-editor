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
    },

    ready: function () {
        this._initResizable();
    },

    resize: function () {
        if ( !this.asset )
            return;

        var contentRect = this.$.content.getBoundingClientRect();

        if ( this.asset instanceof Fire.Texture ||
             this.asset instanceof Fire.Sprite ) {
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
        var ctx = this.$.canvas.getContext("2d");

        if ( this.asset instanceof Fire.Texture ) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage( this.asset.image, 0, 0, this.$.canvas.width, this.$.canvas.height );
        }
        else if ( this.asset instanceof Fire.Sprite ) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage( this.asset.texture.image,
                           this.asset.x, this.asset.y, this.asset.width, this.asset.height,
                           0, 0, this.$.canvas.width, this.$.canvas.height
                         );
        }
    },

    assetChanged: function () {
        if ( this.asset instanceof Fire.Texture ||
             this.asset instanceof Fire.Sprite ) {
            this.info = this.asset.width + " x " + this.asset.height;
            this.resize();
        }
    },

    resizeAction: function ( event ) {
        this.resize();
    },
}, EditorUI.resizable));
