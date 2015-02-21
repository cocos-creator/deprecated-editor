if (!Fire.isAtomShell) {
    return;
}

var Ipc = require('ipc');

var Engine = Fire.Engine;
var Entity = Fire.Entity;
var FObject = Fire.FObject;

Ipc.on('engine:renameEntity', function (id, name) {
    var entity = Fire._getInstanceById(id);
    if (entity) {
        entity.name = name;
    }
});

Ipc.on('engine:deleteEntities', function (idList) {
    for (var i = 0; i < idList.length; i++) {
        var id = idList[i];
        var entity = Fire._getInstanceById(id);
        if (entity) {
            entity.destroy();
        }
    }
    if ( !Engine.isPlaying ) {
        FObject._deferredDestroy();
    }
});

Ipc.on('engine:createEntity', function (parentId) {
    var ent = new Entity();
    if (parentId) {
        var parent = Fire._getInstanceById(parentId);
        if (parent) {
            ent.parent = parent;
        }
    }
});

Ipc.on('engine:moveEntities', function (idList, parentId, nextSiblingId) {
    var parent = parentId && Fire._getInstanceById(parentId);
    var next = nextSiblingId ? Fire._getInstanceById(nextSiblingId) : null;
    var nextIndex = next ? next.getSiblingIndex() : -1;
    for (var i = 0; i < idList.length; i++) {
        var id = idList[i];
        var entity = Fire._getInstanceById(id);
        if (entity && (!parent || !parent.isChildOf(entity))) {
            if (entity.parent !== parent) {
                // keep world transform not changed
                var worldPos = entity.transform.worldPosition;
                var worldRotation = entity.transform.worldRotation;
                var lossyScale = entity.transform.worldScale;
                entity.parent = parent;
                // restore world transform
                entity.transform.worldPosition = worldPos;
                entity.transform.worldRotation = worldRotation;
                if (parent) {
                    entity.transform.scale = lossyScale.divSelf(parent.transform.worldScale);
                }
                else {
                    entity.transform.scale = lossyScale;
                }
                if (next) {
                    entity.setSiblingIndex(nextIndex);
                    ++nextIndex;
                }
            }
            else if (next) {
                var lastIndex = entity.getSiblingIndex();
                var newIndex = nextIndex;
                if (newIndex > lastIndex) {
                    --newIndex;
                }
                if (newIndex !== lastIndex) {
                    entity.setSiblingIndex(newIndex);
                    if (lastIndex > newIndex) {
                        ++nextIndex;
                    }
                    else {
                        --nextIndex;
                    }
                }
            }
            else {
                entity.setAsLastSibling();
            }
        }
    }
});

Ipc.on('engine:duplicateEntities', function (idList) {
    for (var i = 0; i < idList.length; i++) {
        var id = idList[i];
        var entity = Fire._getInstanceById(id);
        if (entity) {
            // duplicate
            var clone = Fire.instantiate(entity);
            clone.parent = entity.parent;
        }
    }
});

Ipc.on('engine:addComponent', function (entityId, compClassId) {
    var entity = Fire._getInstanceById(entityId);
    if (entity) {
        var CompCtor = Fire.JS._getClassById(compClassId);
        if (CompCtor) {
            entity.addComponent(CompCtor);
        }
    }
});

Ipc.on('engine:removeComponent', function (componentId) {
    var comp = Fire._getInstanceById(componentId);
    if (comp) {
        comp.destroy();
    }
    if ( !Engine.isPlaying ) {
        FObject._deferredDestroy();
    }
});

Ipc.on('engine:openScene', function (uuid) {
    Fire.Engine.stop();
    Fire.AssetLibrary.clearAllCache();
    Fire.Engine.loadScene(uuid);
});

Ipc.on('asset:moved', function (uuid, destUrl) {
    // rename asset
    var asset = Fire.AssetLibrary.getAssetByUuid(uuid);
    if (asset) {
        var Url = require('fire-url');
        var name = Url.basename(destUrl, Url.extname(destUrl));
        asset.name = name;
    }
});

Ipc.on('assets:deleted', function (results) {
    for ( var i = 0; i < results.length; ++i ) {
        Fire.AssetLibrary.unloadAsset(results[i].uuid, true);
    }
});

Ipc.on('asset:changed', function (uuid) {
    // 虽然在 applyAsset 时已经修改过内存中的 asset 了，但某些 Importer 会依据修改后的 meta 重新 import 一次，
    // 对它们来说 asset 需要重新导入才能得到真正结果。
    Fire.AssetLibrary.onAssetReimported(uuid);
});
