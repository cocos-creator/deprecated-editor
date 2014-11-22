(function () {
    Polymer({
        publish: {
            name: "",
            path: "",
        },

        openAction: function ( event ) {
            Fire.command('dashboard:open-project', this.path);
        },

        closeAction: function ( event ) {
            Fire.command('dashboard:remove-project', this.path);
        },
    });
})();
