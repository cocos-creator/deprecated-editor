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

        var self = this;
        Fire.AssetDB.query( "assets://", {
            'type-id': typeID
        }, function ( results ) {
            self.items = results.map ( function ( item ) {
                var icon = '';
                if ( typeID === Fire.JS._getClassId(Fire.Texture) ) {
                    icon = "uuid://" + item.uuid + "?thumb";
                }

                return {
                    icon: icon,
                    text: Url.basenameNoExt(item.url),
                    uuid: item.uuid,
                    selected: (item.uuid === self._curId)
                };
            }).sort( function (a,b) {
                return a.text.localeCompare(b.text);
            });
        });

        if ( typeID !== Fire.JS._getClassId(Fire.Texture) ) {
            this.$.btnGroup.style.display = "none";
        }
        this.$.btnGroup.select(0);

        var remote = require('remote');
        var browserWindow = remote.getCurrentWindow();
        if ( browserWindow ) {
            browserWindow.on ( 'close', function () {
                Fire.sendToWindows('quick-asset:closed');
            });
        }

        window.onkeydown = function ( event ) {
            switch ( event.which ) {
            // enter, esc
            case 13:
            case 27:
                var browserWindow = remote.getCurrentWindow();
                browserWindow.close();
                break;

            default:
                this.$.search.focus();
            }
        }.bind(this);
    },

    attached: function () {
    },

    detached: function () {
        this.ipc.clear();
    },

    applyFilter: function ( items, searchText ) {
        var results = items.filter( function ( item ) {
            return item.text.toLowerCase().indexOf(searchText) !== -1;
        });
        results.unshift({
            icon: null,
            text: "None",
            uuid: "",
            selected: this._curId === "",
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

        Fire.sendToWindows('quick-asset:selected', event.detail.uuid);
    },
});
