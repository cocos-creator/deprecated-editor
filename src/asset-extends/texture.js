var Texture = Fire.Texture;

Texture.prototype.createEntity = function ( cb ) {
    var metaJson = Editor.AssetDB.loadMetaJson(this._uuid);
    Fire.AssetLibrary.loadMeta(metaJson, function ( err, meta ) {
        if ( meta.subRawData && meta.subRawData.length > 0 ) {
            var subInfo = meta.subRawData[0];
            if ( subInfo.asset.createEntity ) {
                Fire.AssetLibrary.cacheAsset(subInfo.asset);

                subInfo.asset.createEntity(cb);
            }
        }
    }.bind(this));
};
