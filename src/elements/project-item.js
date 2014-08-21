(function () {
    Polymer('project-item', {
        publish: {
            foldable: {
                value: false,
                reflect: true
            },
        },

        setIcon: function ( className ) {
            this.$.typeIcon.className = "type-icon fa " + className;
        },
    });
})();
