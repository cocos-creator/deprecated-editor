// assetMng.js

console.log("load assetMng.js");

var fs = require('fs');

function newAsset(path) {
    console.log('create asset');
    console.log(path);

    // TODO: create asset
    // TODO: create asset.json
}

function deleteAsset (path) {
    console.log('delete asset');

    // TODO: delete asset
    // TODO: delete asset.json
}


function moveAsset (src, dest) {
    console.log('move asset');
}

exports.newAsset = newAsset;
exports.deleteAsset = deleteAsset;
exports.moveAsset = moveAsset;