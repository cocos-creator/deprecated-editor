(function () {
    Polymer({

        created: function () {
            this.ipc = new Fire.IpcListener();
            this.infoList = [];
        },

        attached: function () {
            this.ipc.on('asset-db:debugger:path-uuid-results', function ( results ) {
                this.infoList = [];
                for ( var p in results ) {
                    this.infoList.push( { key: p, value: results[p] } );
                }
            }.bind(this) );

            this.ipc.on('asset-db:debugger:uuid-path-results', function ( results ) {
                this.infoList = [];
                for ( var p in results ) {
                    this.infoList.push( { key: p, value: results[p] } );
                }
            }.bind(this) );
        },

        detached: function () {
            this.ipc.clear();
        },

        domReady: function () {
            this.$.btnGroup.select(0);
        },

        pathUuidAction: function ( event ) {
            Fire.sendToCore('asset-db:debugger:query-path-uuid');
        },

        uuidPathAction: function ( event ) {
            Fire.sendToCore('asset-db:debugger:query-uuid-path');
        },

        libraryAction: function ( event ) {
            // TODO
            // Fire.sendToCore('asset-db:debugger:query-path-uuid');
        },
    });
})();
