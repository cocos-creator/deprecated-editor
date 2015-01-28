var Texture = Fire.Texture;

Texture.prototype.createEntity = function ( cb ) {
    var metaJson = Fire.AssetDB.loadMetaJson(this._uuid);
    Fire.AssetLibrary.loadMeta(metaJson, function ( meta ) {
        if ( meta.subAssets && meta.subAssets.length > 0 ) {
            var subInfo = meta.subAssets[0];
            if ( subInfo.asset.createEntity ) {
                subInfo.asset.createEntity(cb);
            }
        }
    }.bind(this));
};
