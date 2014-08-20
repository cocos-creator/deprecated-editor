(function () {
    Polymer('main-window', {
        ready: function () {
            // init editor-app
            EditorApp.init(this);
        },
    });
})();
