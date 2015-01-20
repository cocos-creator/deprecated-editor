var Url = require('fire-url');

Polymer({
    created: function () {
        this.ipc = new Fire.IpcListener();

        this.viewMode = "list";
        this.searchText = "";
        this.items = [];
        this._curId = "";
    },

    domReady: function () {
        var typeID = "";
        // get typeID from url query
        var queryString = decodeURIComponent(location.search.substr(1));
        var queryList = queryString.split('&');
        for ( var i = 0; i < queryList.length; ++i ) {
            var pair = queryList[i].split("=");
            if ( pair[0] === "typeID" ) {
                typeID = pair[1];
            }
            else if ( pair[0] === "id" ) {
                this._curId = pair[1];
            }
        }

        Fire.sendToCore('asset-db:query', "assets://", typeID);

        if ( typeID !== Fire.getClassId(Fire.Texture) ) {
            this.$.btnGroup.style.display = "none";
        }
        this.$.btnGroup.select(0);

        var remote = require('remote');
        var browserWindow = remote.getCurrentWindow();
        if ( browserWindow ) {
            browserWindow.on ( 'close', function () {
                Fire.sendToPages('quick-asset:closed');
            });
        }
    },

    attached: function () {
        this.ipc.on('asset-db:query-results', function ( url, typeID, results ) {
            var quickAssets = this;
            this.items = results.map ( function ( item ) {
                var icon = '';
                if ( typeID === Fire.getClassId(Fire.Texture) ) {
                    icon = "uuid://" + item.uuid + "?thumb";
                }

                return {
                    icon: icon,
                    text: Url.basenameNoExt(item.url),
                    uuid: item.uuid,
                    selected: (item.uuid === quickAssets._curId)
                };
            }).sort( function (a,b) {
                return a.text.localeCompare(b.text);
            });
        }.bind(this) );
    },

    detached: function () {
        this.ipc.clear();
    },

    applyFilter: function ( items, searchText ) {
        var results = items.filter( function ( item ) {
            return item.text.toLowerCase().indexOf(searchText) !== -1;
        });
        return results;
    },

    listViewAction: function () {
        this.viewMode = "list";
    },

    gridViewAction: function () {
        this.viewMode = "grid";
    },

    selectAction: function ( event ) {
        event.stopPropagation();

        Fire.sendToPages('quick-asset:selected', event.detail.uuid);
    },
});
