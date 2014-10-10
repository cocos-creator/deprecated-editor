(function () {
    Polymer({
        publish: {
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
            this.super();

            this._isToggle = false;
            this._isShift = false;

            this.extname = '';
            this.isFolder = false;
            this.isRoot = false;
        },

        mousedownAction: function ( event ) {
            this.super([event]);
            if (event.cancelBubble) {
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
            this.super([event]);
            if (event.cancelBubble) {
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
            if ( !this.isFolder )
                this.fire('open');
            event.stopPropagation();
        },

        dragoverAction: function ( event ) {
            this.fire('draghover', {files : event.dataTransfer.files});

            event.preventDefault();
            event.stopPropagation();
        },

    });
})();
