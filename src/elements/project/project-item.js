(function () {
    Polymer({
        publish: {
            folded: false,
            foldable: {
                value: false,
                reflect: true
            },
            selected: {
                value: false,
                reflect: true
            },
            highlighted: {
                value: false,
                reflect: true
            },
        },

        created: function () {
            this._isToggle = false;
            this._isShift = false;

            this.basename = '';
            this.extname = '';
            this.isFolder = false;
            this.isRoot = false;

            this.renaming = false;
        },

        domReady: function () {
            // HACK: to make this.$.rename.select() works
            this.$.rename.value = this.basename;
        },

        rename: function () {
            this.$.rename.style.display = '';
            this.$.rename.value = this.basename;
            this.$.rename.focus();
            this.$.rename.select();

            this.renaming = true;
        },

        setIcon: function ( icon ) {
            if ( icon instanceof Image ) {
                icon.width=14
                this.$.typeIcon.appendChild(icon);
            }
            else {
                this.$.typeIcon.className = "type-icon fa " + icon;
            }
        },

        mousedownAction: function ( event ) {
            if ( this.renaming ) {
                event.stopPropagation();
                return;
            }

            // if this is not the mouse-left-button
            if ( event.which !== 1 )
                return;

            this._isToggle = false;
            this._isShift = false;

            if ( event.shiftKey ) {
                this._isShift = true;
            }
            else if ( event.metaKey || event.ctrlKey ) {
                this._isToggle = true;
            }

            this.fire('selecting', { 
                toggle: this._isToggle, 
                shift: this._isShift
            } );

            event.preventDefault();
            event.stopPropagation();
        },

        mouseupAction: function ( event ) {
            if ( this.renaming ) {
                event.stopPropagation();
                return;
            }

            // if this is not the mouse-left-button
            if ( event.which !== 1 )
                return;

            this.fire('select', { 
                toggle: this._isToggle, 
                shift: this._isShift
            } );

            event.stopPropagation();
        },

        mousemoveAction: function ( event ) {
            this.fire('draghover');

            event.stopPropagation();
        },

        dragoverAction: function ( event ) {
            this.fire('draghover');

            event.preventDefault();
            event.stopPropagation();
        },

        foldMousedownAction: function ( event ) {
            this.folded = !this.folded;

            event.stopPropagation();
        },

        renameConfirmAction: function ( event ) {
            this.$.rename.style.display = 'none';
            this.renaming = false;

            if ( this.$.rename.value !== this.basename ) {
                this.fire('namechanged', { name: this.$.rename.value } );
            }
            event.stopPropagation();
        },
    });
})();
