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

    Ipc.on('engine:moveEntity', function (idList, parentId, nextSiblingId) {
        var parentT = parentId && Fire._getInstanceById(parentId);
        
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
                if (parentT.isChildOf(entity) === false) {
                    entity.parent = parentT;
                }
                if (index !== -1) {
                    entity.setSiblingIndex(index + i);
                }
            }
        }
    });

})();
