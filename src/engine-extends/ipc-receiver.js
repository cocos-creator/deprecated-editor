(function () {
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
        
        var index = -1;
        if (nextSiblingId) {
            var next = Fire._getInstanceById(nextSiblingId);
            if (next) {
                index = next.getSiblingIndex();
            }
        }
        for (var i = 0; i < idList.length; i++) {
            var id = idList[i];
            var entity = Fire._getInstanceById(id);
            if (entity) {
                if (entity.parent !== parent && parent.isChildOf(entity) === false) {
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
                }
                if (index !== -1) {
                    entity.setSiblingIndex(index + i);
                }
            }
        }
    });

})();
