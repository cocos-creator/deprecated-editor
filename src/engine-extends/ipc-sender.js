
// This adapter converts editor callbacks to ipc events

var editorCallback = Fire.Engine._editorCallback;

// pre-declaration for unit tests, overridable for editor
Fire.sendToPages = function () {};

editorCallback.onEnginePlayed = function (continued) {
    Fire.sendToPages('engine:played', continued);
};
editorCallback.onEngineStopped = function () {
    Fire.sendToPages('engine:stopped');
};
editorCallback.onEnginePaused = function () {
    Fire.sendToPages('engine:paused');
};

function takeEntitySnapshot(entity) {
    return {
        name: entity._name,
        objFlags: entity._objFlags,
        id: entity.id,
        children: entity._children.map(takeEntitySnapshot),
    };
}
function takeSceneSnapshot (scene) {
    return {
        entities : scene.entities.map(takeEntitySnapshot)
    };
}

editorCallback.onSceneLaunched = function (scene) {
    Fire.sendToPages('scene:launched', takeSceneSnapshot(scene));
    Fire.sendToPages('scene:dirty');
};

//editorCallback.onSceneLoaded = function (scene) {
//    Fire.sendToPages('scene:loaded', scene.entities);
//};

var onEntityCreated = 'entity:created';
editorCallback.onEntityCreated = function (entity) {
    if (entity._children.length === 0) {
        Fire.sendToPages( onEntityCreated, entity._name, entity._objFlags, entity.id );
    }
    else {
        Fire.sendToPages( onEntityCreated, takeEntitySnapshot(entity) );
    }
    Fire.sendToPages('scene:dirty');
};

var onEntityRemoved = 'entity:removed';
editorCallback.onEntityRemoved = function (entity/*, isTopMost*/) {
    Fire.sendToPages( onEntityRemoved, entity.id );
    Fire.sendToPages('scene:dirty');
    // deselect
    var entities = Fire.Selection.entities;
    if (entity.childCount > 0) {
        var unselect = [];
        for (var i = 0; i < entities.length; i++) {
            var id = entities[i];
            var selected = Fire._getInstanceById(id);
            if (selected && selected.isChildOf(entity)) {
                unselect.push(id);
            }
        }
        if (unselect.length > 0) {
            Fire.Selection.cancel();
            Fire.Selection.unselectEntity(unselect);
        }
    }
    else {
        if (entities.indexOf(entity.id) !== -1) {
            Fire.Selection.cancel();
            Fire.Selection.unselectEntity(entity.id);
        }
    }
    // hover out
    if (Fire.Selection.hoveringEntityId) {
        var hovering = Fire._getInstanceById(Fire.Selection.hoveringEntityId);
        if (hovering && hovering.isChildOf(entity)) {
            Fire.Selection.hoverEntity('');
        }
    }
};

var onEntityParentChanged = 'entity:parentChanged';
editorCallback.onEntityParentChanged = function (entity) {
    Fire.sendToPages( onEntityParentChanged, entity.id, entity.parent && entity.parent.id );
    Fire.sendToPages('scene:dirty');
};

var onEntityIndexChanged = 'entity:indexChanged';
editorCallback.onEntityIndexChanged = function (entity, oldIndex, newIndex) {
    // get next sibling, skip object hidden in editor
    var next = null;
    var i = newIndex;
    do {
        ++i;
        next = entity.getSibling(i);
    } while (next && (next._objFlags & Fire._ObjectFlags.HideInEditor));
    //
    Fire.sendToPages( onEntityIndexChanged, entity.id, next && next.id );
    Fire.sendToPages('scene:dirty');
};

editorCallback.onEntityRenamed = function (entity) {
    Fire.sendToPages('entity:renamed', entity.id, entity._name);
};

editorCallback.onComponentEnabled = function (component) {
    Fire.sendToPages('component:enabled', component.id);
};

editorCallback.onComponentDisabled = function (component) {
    Fire.sendToPages('component:disabled', component.id);
};

editorCallback.onComponentAdded = function (component) {
    Fire.sendToPages('component:added', component.id);
};

editorCallback.onComponentRemoved = function (component, entity) {
    Fire.sendToPages('component:removed', component.id, entity.id);
};
