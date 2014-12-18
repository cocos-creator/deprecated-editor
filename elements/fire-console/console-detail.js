(function () {
    Polymer(EditorUI.mixin({
        publish: {
            type: '',
            log: '',
        },

        ready: function () {
            this._initResizable();
        },

        toIconClass: function ( value ) {
            switch ( value ) {
                case "log": return "fa-info";
                case "info": return "fa-info";
                case "warn": return "fa-warning";
                case "error": return "fa-times-circle";
            }
        },

        clear: function () {
            this.log = '';
            this.type = '';
        },

    }, EditorUI.resizable));
})();
