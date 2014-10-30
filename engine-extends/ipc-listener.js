(function () {
    if (!Fire.isAtomShell) {
        return;
    }

    var Ipc = require('ipc');

    var Entity = Fire.Entity;
    var FObject = Fire.FObject;

    Ipc.on('engine:renameEntity', function (id, name) {
        var entity = Entity._getInstanceById(id);
        if (entity) {
            entity.name = name;
        }
    });

    Ipc.on('engine:deleteEntities', function (idList) {
        for (var i = 0; i < idList.length; i++) {
            var id = idList[i];
            var entity = Entity._getInstanceById(id);
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
            var parent = Entity._getInstanceById(parentId);
            if (parent) {
                ent.transform.parent = parent.transform;
            }
        }
    });

    Ipc.on('engine:moveEntity', function (idList, parentId, nextSiblingId) {
        var parentT = null;
        if (parentId) {
            var parentE = Entity._getInstanceById(parentId);
            parentT = parentE && parentE.transform;
        }
        var index = -1;
        if (nextSiblingId) {
            var next = Entity._getInstanceById(nextSiblingId);
            if (next) {
                index = next.transform.getSiblingIndex();
            }
        }
        for (var i = 0; i < idList.length; i++) {
            var id = idList[i];
            var entity = Entity._getInstanceById(id);
            if (entity) {
                if (parentT.isChildOf(entity.transform) === false) {
                    entity.transform.parent = parentT;
                }
                if (index !== -1) {
                    entity.transform.setSiblingIndex(index + i);
                }
            }
        }
    });

})();
