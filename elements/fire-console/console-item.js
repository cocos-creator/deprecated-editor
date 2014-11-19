(function () {
    Polymer({
        publish: {
            type: 'log',
            text: '',
        },

        created: function () {
        },

        attached: function () {
            this.fire('item-added');
        },

        toIconClass: function ( value ) {
            switch ( value ) {
                case "log": return "fa-info";
                case "hint": return "fa-info";
                case "warn": return "fa-warning";
                case "error": return "fa-times-circle";
            }
        },
    });
})();
