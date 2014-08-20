// assetMng.js
var AssetMng;
(function (AssetMng) {
    var fs = require('fs');

    AssetMng.newAsset = function (path) {
        console.log('create asset');
        console.log(path);

        // TODO: create asset
        // TODO: create asset.json
    };

    AssetMng.deleteAsset = function (path) {
        console.log('delete asset');

        // TODO: delete asset
        // TODO: delete asset.json
    };

    AssetMng.moveAsset = function (src, dest) {
        console.log('move asset');
    };

})(AssetMng || (AssetMng = {}));
