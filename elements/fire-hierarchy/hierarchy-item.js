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
            hover: {
                value: false,
                reflect: true
            },
        },

        created: function () {
            this.super();

            this._isToggle = false;
            this._isShift = false;

            this.renaming = false;
        },

        mousedownAction: function ( event ) {
            this.super([event]);
            if (event.cancelBubble) {
                return;
            }
            var mouseLeft = event.which === 1;
            if (mouseLeft) {
                // selecting
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
            }
        },

        mouseupAction: function ( event ) {
            this.super([event]);
            if (event.cancelBubble) {
                return;
            }
            var mouseLeft = event.which === 1;
            if (mouseLeft) {
                this.fire('select', { 
                    toggle: this._isToggle, 
                    shift: this._isShift
                } );

                event.stopPropagation();
            }
        },

        mouseenterAction: function ( event ) {
            Fire.Selection.hoverEntity(this.userId);
            event.stopPropagation();
        },

        mouseleaveAction: function ( event ) {
            Fire.Selection.hoverEntity(null);
            event.stopPropagation();
        },
    });
})();
