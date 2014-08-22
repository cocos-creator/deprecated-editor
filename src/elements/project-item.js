(function () {
    Polymer('project-item', {
        publish: {
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
            if ( event.metaKey || event.ctrlKey ) {
                isToggle = true;
            }

            this.fire('select', { toggle: isToggle } );
            event.stopPropagation();
        },
    });
})();
