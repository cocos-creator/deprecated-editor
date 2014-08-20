// assetMng.js
var AssetDB;
(function (AssetDB) {
    var fs = require('fs');

    var _mounts = {};

    // name://foo/bar/foobar.png
    AssetDB.mount = function ( path, name, replace ) {
        if ( ["http", "https", "files", "ftp" ].indexOf(name) !== -1 ) {
            console.warn("Can not use " + name + " for mounting");
            return;
        }

        if ( _mounts[name] ) {
            if ( replace ) {
                AssetDB.unmount(name);
            }
            else {
                console.warn("the mounting " + name + " already exists!");
                return;
            }
        }
        _mounts[name] = path;
        console.log("mount " + path + " as " + name);
    };

    AssetDB.unmount = function (name) {
        if ( _mounts[name] ) {
            _mounts[name] = null;
        }
    };

    AssetDB.newAsset = function (path) {
        console.log('create asset');
        console.log(path);

        // TODO: create asset
        // TODO: create asset.json
    };

    AssetDB.deleteAsset = function (path) {
        console.log('delete asset');

        // TODO: delete asset
        // TODO: delete asset.json
    };

    AssetDB.moveAsset = function (src, dest) {
        console.log('move asset');
    };

})(AssetDB || (AssetDB = {}));
