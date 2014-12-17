(function () {
    Polymer(EditorUI.mixin({
        publish: {
            info: '',
            class: '',
        },

        observe: {
            info: 'infoChanged',
        },

        ready: function () {
            this._initResizable();
        },

        infoChanged: function () {
            //console.log("info:"+this.info);
        },
    }, EditorUI.resizable));
})();
