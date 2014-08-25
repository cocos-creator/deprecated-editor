(function () {
    Polymer('project-item', {
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
        },

        setIcon: function ( className ) {
            this.$.typeIcon.className = "type-icon fa " + className;
        },

        mousedownAction: function ( event ) {
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

            event.stopPropagation();
        },

        foldMousedownAction: function ( event ) {
            this.folded = !this.folded;

            event.stopPropagation();
        },
    });
})();
