(function () {
    Polymer({

        created: function () {
            this.ipc = new Fire.IpcListener();
        },

        attached: function () {
            var typename = "";
            // get typename from url query
            var queryString = decodeURIComponent(location.search.substr(1));
            var queryList = queryString.split('&');
            for ( var i = 0; i < queryList.length; ++i ) {
                var pair = queryList[i].split("=");
                if ( pair[0] === "typename" ) {
                    typename = pair[1];
                }
            }

            this.ipc.on('asset-db:query-results', function ( results ) {
                this.$.dataView.dataList = results;
                this.$.dataView.typename = typename;
                this.$.dataView.update();
                Fire.log("load:"+typename+" array!");
            }.bind(this) );

            if (typename.toString() != "Fire.Texture") {
                this.$.btnGroup.style.display = "none";
            }
            this.$.btnGroup.select(0);

            Fire.sendToCore('asset-db:query', "assets://", typename );
        },

        detached: function () {
            this.ipc.clear();
        },

        oninput: function () {
            console.log('ipt');
        },

        ChangeView: function () {
            if (this.$.dataView.viewMode == "list"){
                this.$.dataView.viewMode = "img";
            }else{
                this.$.dataView.viewMode = "list";
            }
        },

    });
})();
