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
        },

        setIcon: function ( className ) {
            this.$.typeIcon.className = "type-icon fa " + className;
        },

        mousedownAction: function ( event ) {
            var isToggle = false;
            var isShift = false;

            if ( event.shiftKey ) {
                isShift = true;
            }
            else if ( event.metaKey || event.ctrlKey ) {
                isToggle = true;
            }

            this.fire('select', { 
                toggle: isToggle, 
                shift: isShift
            } );

            event.preventDefault();
            event.stopPropagation();
        },

        foldMousedownAction: function ( event ) {
            this.folded = !this.folded;

            event.stopPropagation();
        },
    });
})();
