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
        this.ipc.on('asset-db:debugger:url-uuid-results', function ( results ) {
            this.infoList = [];
            for ( var i = 0; i < results.length; ++i ) {
                var info = results[i];
                this.infoList.push( { key: info.url, value: info.uuid } );
            }
        }.bind(this) );

        this.ipc.on('asset-db:debugger:uuid-url-results', function ( results ) {
            this.infoList = [];
            for ( var i = 0; i < results.length; ++i ) {
                var info = results[i];
                this.infoList.push( { key: info.uuid, value: info.url } );
            }
        }.bind(this) );

        this.ipc.on('asset-db:debugger:url-subuuids-results', function ( results ) {
            this.infoList = [];
            for ( var i = 0; i < results.length; ++i ) {
                var info = results[i];
                for ( var j = 0; j < info.uuids.length; ++j ) {
                    this.infoList.push( { key: info.url, value: info.uuids[j] } );
                }
            }
        }.bind(this) );

        this.ipc.on('asset-library:debugger:uuid-asset-results', function ( results ) {
            this.infoList = [];
            for ( var i = 0; i < results.length; ++i ) {
                var info = results[i];
                this.infoList.push( { key: info.uuid, value: info.name + " [" + info.type + "]" } );
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

    urlUuidAction: function ( event ) {
        this._option = 'url-uuid';
        this.keyName = "URL";
        this.valueName = "UUID";
        Fire.sendToCore('asset-db:debugger:query-url-uuid');
    },

    uuidUrlAction: function ( event ) {
        this._option = 'uuid-url';
        this.keyName = "UUID";
        this.valueName = "URL";
        Fire.sendToCore('asset-db:debugger:query-uuid-url');
    },

    urlSubUuidsAction: function ( event ) {
        this._option = 'url-subuuids';
        this.keyName = "URL";
        this.valueName = "SUB UUIDS";
        Fire.sendToCore('asset-db:debugger:query-url-subuuids');
    },

    libraryAction: function ( event ) {
        this._option = 'library';
        this.keyName = "UUID";
        this.valueName = "ASSET NAME";
        Fire.sendToAll('asset-library:debugger:query-uuid-asset');
    },

    refreshAction: function ( event ) {
        switch (this._option) {
        case 'url-uuid': this.urlUuidAction(); break;
        case 'uuid-url': this.uuidUrlAction(); break;
        case 'url-subuuids': this.urlSubUuidsAction(); break;
        case 'library': this.libraryAction(); break;
        }
    },
});
