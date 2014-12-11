(function () {
    Polymer({
        created: function () {
            this.ipc = new Fire.IpcListener();
        },

        domReady: function () {
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

            Fire.command('asset-db:query', "assets://", typename );

            this.ipc.on('asset-db:query-results', function ( urls ) {
                for ( var i = 0; i < urls.length; ++i ) {
                    Fire.log( urls[i] );
                }
            }.bind(this) );
        },

        detached: function () {
            this.ipc.clear();
        },
    });
})();
