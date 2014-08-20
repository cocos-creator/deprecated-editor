// assetMng.js
var AssetDB;
(function (AssetDB) {
    var fs = require('fs');

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

    // TODO:
    AssetDB.mount = function (path) {
    };

})(AssetDB || (AssetDB = {}));
