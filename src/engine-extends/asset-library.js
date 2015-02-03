/**
 * @param {object} meta
 */
Fire.AssetLibrary.loadMeta = function (meta, callback) {
    function readSubAssetsUuid(subAssets) {
        for (var i = 0; i < subAssets.length; i++) {
            var item = subAssets[i];
            item.asset._uuid = item.meta.uuid;
            if (item.meta.subAssets) {
                readSubAssetsUuid(item.meta.subAssets);
            }
        }
    }
    this._deserializeWithDepends(meta, '', function (meta, error) {
        if (meta && meta.subAssets) {
            readSubAssetsUuid(meta.subAssets);
        }
        callback(meta, error);
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

/**
 * Shadow copy all serializable properties from supplied asset to another indicated by uuid.
 * @param {string} uuid
 * @param {Fire.Asset} newAsset
 */
Fire.AssetLibrary._updateAsset = function (uuid, newAsset) {
    var asset = this._uuidToAsset[uuid];
    if (!asset || !newAsset) {
        return;
    }
    var cls = asset.constructor;
    if (cls !== newAsset.constructor) {
        Fire.error('Not the same type');
        return;
    }
    if (asset.shadowCopyFrom) {
        asset.shadowCopyFrom(newAsset);
    }
    else {
        var props = cls.__props__;
        if (props) {
            for (var p = 0; p < props.length; p++) {
                var propName = props[p];
                var attrs = Fire.attr(cls, propName);
                if (attrs.serializable !== false) {
                    asset[propName] = newAsset[propName];
                }
            }
        }
    }
    this._onAssetChanged(uuid, asset);
};

/**
 * In editor, if you load an asset from loadAsset, and then use the asset in the scene,
 * you should call cacheAsset manually to ensure the asset's reference is unique.
 */
Fire.AssetLibrary.cacheAsset = function (asset) {
    if (asset) {
        if (asset._uuid) {
            this._uuidToAsset[asset._uuid] = asset;
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
    var loaded = this._uuidToAsset[uuid];
    if (!loaded) {
        return;
    }

    // reload

    // 删除旧的引用，所有用到 asset 的地方必须通过 assetListener 监听资源的更新
    // 否则资源将出现新旧两份引用。
    delete this._uuidToAsset[uuid];  // force reload
    this._loadAssetByUuid(uuid, function (asset) {
        var notUnloaded = uuid in this._uuidToAsset;
        if (asset && notUnloaded) {
            this._updateAsset(uuid, asset);
        }
    }.bind(this));
};
