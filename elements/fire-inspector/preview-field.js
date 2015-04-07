Polymer(EditorUI.mixin({
    publish: {
        asset: null,
        meta: null,
        hide: { value: false, reflect: true },
    },

    _fieldEL: null,

    ready: function () {
        this._initResizable();
    },

    resize: function () {
        if ( this._fieldEL )
            this._fieldEL.resize();
    },

    repaint: function () {
        if ( this._fieldEL ) {
            this._fieldEL.resize();
            this._fieldEL.repaint();
        }
    },

    assetChanged: function () {
        //
        if ( this._fieldEL ) {
            if ( this.asset && this.asset.constructor === this._fieldEL.asset.constructor ) {
                this._fieldEL.meta = this.meta;
                this._fieldEL.asset = this.asset;

                return;
            }

            this._fieldEL.remove();
            this._fieldEL = null;
        }

        //
        if ( this.asset instanceof Fire.Texture ||
             this.asset instanceof Fire.Sprite )
        {
            this._fieldEL = new ImagePreviewField();
        }
        else if ( Fire.AudioClip && this.asset instanceof Fire.AudioClip ) {
            this._fieldEL = new AudioPreviewField();
        }

        //
        if ( this._fieldEL ) {
            this._fieldEL.setAttribute('fit', '');
            this._fieldEL.meta = this.meta;
            this._fieldEL.asset = this.asset;
            this.shadowRoot.appendChild(this._fieldEL);
        }
    },

    resizeAction: function ( event ) {
        this.resize();
    },
}, EditorUI.resizable));
