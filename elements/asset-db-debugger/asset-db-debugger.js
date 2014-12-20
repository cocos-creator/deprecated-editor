(function () {
    Polymer({

        created: function () {
            this.ipc = new Fire.IpcListener();
            this.infoList = [];
            this._option = -1;
            this.searchValue = "";
            this.keyName = "";
            this.valueName = "";
            this.watchON = false;
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

        filter: function ( infoList, searchValue ) {
            var text = searchValue.toLowerCase();
            var filterList = [];

            for ( var i = 0; i < this.infoList.length; ++i ) {
                var info = this.infoList[i];
                if ( info.key.toLowerCase().indexOf(text) !== -1 ) {
                    filterList.push(info);
                    continue;
                }

                if ( info.value.toLowerCase().indexOf(text) !== -1 ) {
                    filterList.push(info);
                    continue;
                }
            }
            return filterList;
        },

        pathUuidAction: function ( event ) {
            this._option = 'path-uuid';
            this.keyName = "URL";
            this.valueName = "UUID";
            Fire.sendToCore('asset-db:debugger:query-path-uuid');
        },

        uuidPathAction: function ( event ) {
            this._option = 'uuid-path';
            this.keyName = "UUID";
            this.valueName = "URL";
            Fire.sendToCore('asset-db:debugger:query-uuid-path');
        },

        libraryAction: function ( event ) {
            this._option = 'library';
            this.keyName = "UUID";
            this.valueName = "URL";
            this.infoList = [];
            // TODO
            // Fire.sendToCore('asset-db:debugger:query-path-uuid');
        },

        refreshAction: function ( event ) {
            switch (this._option) {
            case 'path-uuid': this.pathUuidAction(); break;
            case 'uuid-path': this.uuidPathAction(); break;
            case 'library': this.libraryAction(); break;
            }
        },
    });
})();
