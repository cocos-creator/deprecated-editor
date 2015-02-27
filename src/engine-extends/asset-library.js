/**
 * @param {object} meta
 */
Fire.AssetLibrary.loadMeta = function (metaJson, callback) {
    var metaJsonObj = JSON.parse(metaJson);

    if ( metaJsonObj.subRawData ) {
        metaJsonObj.subRawData = metaJsonObj.subRawData.map(function ( item ) {
            item.asset = { __uuid__: item.meta.uuid };
            return item;
        });
    }

    function readSubAssetsUuid(subRawData) {
        for (var i = 0; i < subRawData.length; i++) {
            var item = subRawData[i];
            item.asset._uuid = item.meta.uuid;
            if (item.meta.subRawData) {
                readSubAssetsUuid(item.meta.subRawData);
            }
        }
    }
    this.loadJson(metaJsonObj, '', function (error, meta) {
        if (meta && meta.subRawData) {
            readSubAssetsUuid(meta.subRawData);
        }

        //
        callback(error, meta);
    }, true);
};

/**
 * Kill all references to assets so they can be garbage collected.
 * Fireball will reload the asset from disk or remote if loadAssetByUuid being called again.
 * 如果还有地方引用到 asset，调用该方法可能会导致 asset 被多次创建。
 *
 * @private
 */
Fire.AssetLibrary.clearAllCache = function () {
    this._uuidToAsset = {};
};

/**
 * @param {Fire.Asset} newAsset
 * @param {string} [uuid]
 */
Fire.AssetLibrary.replaceAsset = function (newAsset, uuid) {
    uuid = uuid || newAsset._uuid;
    if (uuid) {
        this._uuidToAsset[uuid] = newAsset;
    }
    else {
        Fire.error('[AssetLibrary] Not supplied uuid of asset to replace');
    }
};

// the asset changed listener
// 这里的回调需要完全由使用者自己维护，AssetLibrary只负责调用。
Fire.AssetLibrary.assetListener = new Fire.CallbacksInvoker();

Fire.AssetLibrary._onAssetChanged = function (uuid, asset) {
    this.assetListener.invoke(uuid, asset);
};

///**
// * Shadow copy all serializable properties from supplied asset to another indicated by uuid.
// * @param {string} uuid
// * @param {Fire.Asset} newAsset
// */
//Fire.AssetLibrary._updateAsset = function (uuid, newAsset) {
//    var asset = this._uuidToAsset[uuid];
//    if (!asset || !newAsset) {
//        return;
//    }
//    var cls = asset.constructor;
//    if (cls !== newAsset.constructor) {
//        Fire.error('Not the same type');
//        return;
//    }
//    if (asset.shadowCopyFrom) {
//        asset.shadowCopyFrom(newAsset);
//    }
//    else {
//        var props = cls.__props__;
//        if (props) {
//            for (var p = 0; p < props.length; p++) {
//                var propName = props[p];
//                var attrs = Fire.attr(cls, propName);
//                if (attrs.serializable !== false) {
//                    asset[propName] = newAsset[propName];
//                }
//            }
//        }
//    }
//    this._onAssetChanged(uuid, asset);
//};

/**
 * In editor, if you load an asset from loadAsset, and then use the asset in the scene,
 * you should call cacheAsset manually to ensure the asset's reference is unique.
 */
Fire.AssetLibrary.cacheAsset = function (asset) {
    var _uuidToAsset = this._uuidToAsset;
    function cacheDependsAssets (asset) {
        for (var key in asset) {
            if (asset.hasOwnProperty(key)) {
                var val = asset[key];
                if (val instanceof Fire.Asset && val._uuid && !(val._uuid in _uuidToAsset)) {
                    _uuidToAsset[val._uuid] = val;
                    cacheDependsAssets(val);
                }
            }
        }
    }
    if (asset) {
        if (asset._uuid) {
            if ( !_uuidToAsset[asset._uuid] ) {
                _uuidToAsset[asset._uuid] = asset;
                cacheDependsAssets(asset);
            }
        }
        else {
            Fire.error('[AssetLibrary] Not defined uuid of the asset to cache');
        }
    }
    else {
        Fire.error('[AssetLibrary] The asset to cache must be non-nil');
    }
};

/**
 * If asset is cached, reload and update it.
 * @param {string} uuid
 */
Fire.AssetLibrary.onAssetReimported = function (uuid) {
    var exists = this._uuidToAsset[uuid];
    if ( !exists ) {
        return;
    }

    // 重新读取 asset 并将数据覆盖到已有 asset，如果 asset 引用到的其它 asset uuid 不变，
    // 则其它 asset 不会重新读取。
    this._loadAssetByUuid(uuid, function (err, asset) {
        var notUnloaded = uuid in this._uuidToAsset;
        if (asset && notUnloaded) {
            console.assert(asset === exists);
            this._onAssetChanged(uuid, asset);
        }
    }.bind(this), false, null, exists);

    //// 删除旧的引用，所有用到 asset 的地方必须通过 assetListener 监听资源的更新
    //// 否则资源将出现新旧两份引用。
    //delete this._uuidToAsset[uuid];  // force reload
    //this._loadAssetByUuid(uuid, function (err, asset) {
    //    var notUnloaded = uuid in this._uuidToAsset;
    //    if (asset && notUnloaded) {
    //        this._updateAsset(uuid, asset);
    //    }
    //}.bind(this));
};

var doUnload = Fire.AssetLibrary.unloadAsset.bind(Fire.AssetLibrary);
Fire.AssetLibrary.unloadAsset = function (assetOrUuid, destroyAsset) {
    var uuid;
    var asset;
    if (typeof assetOrUuid === 'string') {
        uuid = assetOrUuid;
    }
    else {
        asset = assetOrUuid;
        uuid = asset && asset._uuid;
    }
    if (uuid) {
        this._onAssetChanged(uuid, null);
        doUnload(assetOrUuid, destroyAsset);
    }
    else if (asset) {
        asset.destroy();
        // simulate destroy immediate
        FObject._deferredDestroy();
    }
};
