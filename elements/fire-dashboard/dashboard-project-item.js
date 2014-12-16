(function () {
    Polymer({
        publish: {
            name: "",
            path: "",
        },

        openAction: function ( event ) {
            Fire.sendToCore('dashboard:open-project', this.path);
        },

        closeAction: function ( event ) {
            Fire.sendToCore('dashboard:remove-project', this.path);
        },
    });
})();
