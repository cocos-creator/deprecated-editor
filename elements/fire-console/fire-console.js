(function () {
    Polymer({
        created: function () {
            this.icon = new Image();
            this.icon.src = "fire://static/img/plugin-console.png";

            this.ipc = new Fire.IpcListener();
        },

        attached: function () {
            // register ipc
            this.ipc.on('console:log', function ( text ) {
                this.$.view.add( 'log', text );
            }.bind(this) );

            this.ipc.on('console:warn', function ( text ) {
                this.$.view.add( 'warn', text );
            }.bind(this) );

            this.ipc.on('console:error', function ( text ) {
                this.$.view.add( 'error', text );
            }.bind(this) );

            this.ipc.on('console:info', function ( text ) {
                this.$.view.add( 'info', text );
            }.bind(this) );
        },

        detached: function () {
            this.ipc.clear();
        },
    });
})();
