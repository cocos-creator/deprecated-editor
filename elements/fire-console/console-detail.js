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
        this.$.log.innerHTML = this.replaceWarp(this.replaceXSS(this.log));
    },

    clear: function () {
        this.log = '';
        this.type = '';
    },

    replaceWarp: function (log) {
        return log.replace(/\r\n/g,"<br/>").replace(/\n/g,"<br/>");
    },

    // NOTE: 简单的XSS过滤 避免输出的字符串污染documet
    replaceXSS: function (value) {
        value = value.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
        return value;
    },

}, EditorUI.resizable));
