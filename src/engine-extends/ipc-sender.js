
// This adapter converts editor callbacks to ipc events

var editorCallback = Fire.Engine._editorCallback;

// pre-declaration for unit tests, overridable for editor
Fire.sendToWindows = function () {};

editorCallback.onEnginePlayed = function (continued) {
    window.dispatchEvent( new CustomEvent ('engine-played', {
        detail: { continued: continued },
        bubbles: false,
        cancelable: false,
    }) );

    Fire.sendToWindows('engine:played', continued);
};
editorCallback.onEngineStopped = function () {
    window.dispatchEvent( new CustomEvent ('engine-stopped', {
        bubbles: false,
        cancelable: false,
    }) );

    Fire.sendToWindows('engine:stopped');
};
editorCallback.onEnginePaused = function () {
    Fire.sendToWindows('engine:paused');
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

var EventEmitter = require('events');

editorCallback.onStartUnloadScene = function (scene) {
    window.dispatchEvent( new CustomEvent ('start-unload-scene', {
        detail: { scene: scene },
        bubbles: false,
        cancelable: false,
    }) );
};

editorCallback.onSceneLaunched = function (scene) {
    window.dispatchEvent( new CustomEvent ('scene-launched', {
        detail: { scene: scene },
        bubbles: false,
        cancelable: false,
    }) );

    Fire.sendToWindows('scene:launched', takeSceneSnapshot(scene));
    Fire.sendToWindows('scene:dirty');
};

//editorCallback.onSceneLoaded = function (scene) {
//    Fire.sendToWindows('scene:loaded', scene.entities);
//};

var onEntityCreated = 'entity:created';
editorCallback.onEntityCreated = function (entity) {
    if (entity._children.length === 0) {
        Fire.sendToWindows( onEntityCreated, entity._name, entity._objFlags, entity.id );
    }
    else {
        Fire.sendToWindows( onEntityCreated, takeEntitySnapshot(entity) );
    }
    Fire.sendToWindows('scene:dirty');
};

var onEntityRemoved = 'entity:removed';
editorCallback.onEntityRemoved = function (entity/*, isTopMost*/) {
    Fire.sendToWindows( onEntityRemoved, entity.id );
    Fire.sendToWindows('scene:dirty');
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
    Fire.sendToWindows( onEntityParentChanged, entity.id, entity.parent && entity.parent.id );
    Fire.sendToWindows('scene:dirty');
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
    Fire.sendToWindows( onEntityIndexChanged, entity.id, next && next.id );
    Fire.sendToWindows('scene:dirty');
};

editorCallback.onEntityRenamed = function (entity) {
    Fire.sendToWindows('entity:renamed', entity.id, entity._name);
};

editorCallback.onComponentEnabled = function (component) {
    Fire.sendToWindows('component:enabled', component.id);
};

editorCallback.onComponentDisabled = function (component) {
    Fire.sendToWindows('component:disabled', component.id);
};

editorCallback.onComponentAdded = function (entity, component) {
    Fire.sendToWindows('component:added', entity.id, component.id);
};

editorCallback.onComponentRemoved = function (entity, component) {
    Fire.sendToWindows('component:removed', entity.id, component.id);
};
