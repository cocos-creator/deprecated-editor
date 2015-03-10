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

    logChanged: function () {
        this.$.log.innerHTML = this.replaceWarp(this.log);
    },

    clear: function () {
        this.log = '';
        this.type = '';
    },

    replaceWarp: function (log) {
        return log.replace(/\r\n/g,"<br/>").replace(/\n/g,"<br/>");
    }

}, EditorUI.resizable));
