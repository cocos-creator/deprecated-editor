Polymer({
    publish: {
        item: null,
        selected: {
            value: false,
            reflect: true
        },
    },

    mousedownAction: function ( event ) {
        this.fire('select');
    },
});
