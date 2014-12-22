Polymer({
    publish: {
        type: 'log',
        text: '',
        selected: {
            value: false,
            reflect: true
        },
    },

    attached: function () {
        this.fire('item-added');
    },

    toIconClass: function ( value ) {
        switch ( value ) {
            case "log": return "fa-info";
            case "info": return "fa-info";
            case "warn": return "fa-warning";
            case "error": return "fa-times-circle";
        }
    },
});
