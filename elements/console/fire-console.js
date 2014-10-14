(function () {
    var Ipc = require('ipc');

    Polymer({
        created: function () {
            this._ipc_log = function ( text ) {
                this.$.view.add( 'log', text );
            }.bind(this);
            
            this._ipc_warn = function ( text ) {
                this.$.view.add( 'warn', text );
            }.bind(this);

            this._ipc_error = function ( text ) {
                this.$.view.add( 'error', text );
            }.bind(this);

            this._ipc_hint = function ( text ) {
                this.$.view.add( 'hint', text );
            }.bind(this);
        },

        ready: function () {
            // register Ipc
            Ipc.on('console:log', this._ipc_log );
            Ipc.on('console:warn', this._ipc_warn );
            Ipc.on('console:error', this._ipc_error );
            Ipc.on('console:hint', this._ipc_hint );
        },

        detached: function () {
            Ipc.removeListener('console:log', this._ipc_log );
            Ipc.removeListener('console:warn', this._ipc_warn );
            Ipc.removeListener('console:error', this._ipc_error );
            Ipc.removeListener('console:hint', this._ipc_hint );
        },
    });
})();
