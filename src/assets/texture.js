var Texture = Fire.Texture;

Texture.prototype.createEntity = function ( cb ) {
    var metaJson = Fire.AssetDB.loadMetaJson(this._uuid);
    Fire.AssetLibrary.loadMeta(metaJson, function ( meta ) {
        if ( meta.subAssets && meta.subAssets.length > 0 ) {
            var subInfo = meta.subAssets[0];
            if ( subInfo.asset.createEntity ) {
                Fire.warn('TODO: remove uuid setup once @Jare fix uuid assignment issue');
                subInfo.asset._uuid = subInfo.meta.uuid;
                Fire.AssetLibrary.cacheAsset(subInfo.asset);

                subInfo.asset.createEntity(cb);
            }
        }
    }.bind(this));
};
