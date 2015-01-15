var Fs = require("fire-fs");

Polymer({
    created: function () {
        var url = "";
        var queryString = decodeURIComponent(location.search.substr(1));
        var queryList = queryString.split('&');
        for ( var i = 0; i < queryList.length; ++i ) {
            var pair = queryList[i].split("=");
            if ( pair[0] === "url" ) {
                url = pair[1];
            }
        }

        // DISABLE
        // var client = new XMLHttpRequest();
        // client.open('GET', url);
        // client.onreadystatechange = function() {
        //     this.$.mirror.value = client.responseText;
        // }.bind(this);
        // client.send();

        var fspath = Fire.AssetDB._fspath(url);
        Fs.readFile(fspath, 'utf8', function ( err, data ) {
            this.$.mirror.value = data;
        }.bind(this));
    },

});
