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
            conflicted: {
                value: false,
                reflect: true
            },
            highlighted: {
                value: false,
                reflect: true
            },
            invalid: {
                value: false,
                reflect: true
            },
        },

        created: function () {
            this._isToggle = false;
            this._isShift = false;

            this.name = '';
            this.id = '';

            this.renaming = false;
        },
        
        get expanded() {
            return this.foldable && !this.folded;   // hierarchy item can foldable only if has child
        },

        domReady: function () {
            // HACK: to make this.$.rename.select() works
            this.$.rename.value = this.name;
        },

        rename: function () {
            this.$.rename.style.display = '';
            this.$.rename.value = this.name;
            this.$.rename.focus();
            this.$.rename.select();

            this.renaming = true;
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
                shift: this._isShift,
                x: event.x,
                y: event.y,
            } );

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

        dblclickAction: function ( event ) {
            this.fire('open');
            event.stopPropagation();
        },

        //dragoverAction: function ( event ) {
        //    this.fire('draghover', {files : event.dataTransfer.files});

        //    event.preventDefault();
        //    event.stopPropagation();
        //},

        foldMousedownAction: function ( event ) {
            this.folded = !this.folded;

            event.stopPropagation();
        },

        renameConfirmAction: function ( event ) {
            this.$.rename.style.display = 'none';
            this.renaming = false;

            if ( this.$.rename.value !== this.name ) {
                this.fire('namechanged', { name: this.$.rename.value } );
            }
            event.stopPropagation();
        },
    });
})();
