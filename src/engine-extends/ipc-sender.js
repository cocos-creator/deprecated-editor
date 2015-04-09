
// This adapter converts editor callbacks to ipc events

var editorCallback = Fire.Engine._editorCallback;

// pre-declaration for unit tests, overridable for editor
Editor.sendToWindows = function () {};

editorCallback.onEnginePlayed = function (continued) {
    window.dispatchEvent( new CustomEvent ('engine-played', {
        detail: { continued: continued },
        bubbles: false,
        cancelable: false,
    }) );

    Editor.sendToWindows('engine:played', continued);
};
editorCallback.onEngineStopped = function () {
    window.dispatchEvent( new CustomEvent ('engine-stopped', {
        bubbles: false,
        cancelable: false,
    }) );

    Editor.sendToWindows('engine:stopped');
};
editorCallback.onEnginePaused = function () {
    Editor.sendToWindows('engine:paused');
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

    Editor.sendToWindows('scene:launched', takeSceneSnapshot(scene));
    Editor.sendToWindows('scene:dirty');
};

//editorCallback.onSceneLoaded = function (scene) {
//    Editor.sendToWindows('scene:loaded', scene.entities);
//};

var onEntityCreated = 'entity:created';
editorCallback.onEntityCreated = function (entity) {
    if (entity._children.length === 0) {
        Editor.sendToWindows( onEntityCreated, entity._name, entity._objFlags, entity.id );
    }
    else {
        Editor.sendToWindows( onEntityCreated, takeEntitySnapshot(entity) );
    }
    Editor.sendToWindows('scene:dirty');
};

var onEntityRemoved = 'entity:removed';
editorCallback.onEntityRemoved = function (entity/*, isTopMost*/) {
    Editor.sendToWindows( onEntityRemoved, entity.id );
    Editor.sendToWindows('scene:dirty');
    // deselect
    var entities = Editor.Selection.entities;
    if (entity.childCount > 0) {
        var unselect = [];
        for (var i = 0; i < entities.length; i++) {
            var id = entities[i];
            var selected = Editor.getInstanceById(id);
            if (selected && selected.isChildOf(entity)) {
                unselect.push(id);
            }
        }
        if (unselect.length > 0) {
            Editor.Selection.cancel();
            Editor.Selection.unselectEntity(unselect);
        }
    }
    else {
        if (entities.indexOf(entity.id) !== -1) {
            Editor.Selection.cancel();
            Editor.Selection.unselectEntity(entity.id);
        }
    }
    // hover out
    if (Editor.Selection.hoveringEntityId) {
        var hovering = Editor.getInstanceById(Editor.Selection.hoveringEntityId);
        if (hovering && hovering.isChildOf(entity)) {
            Editor.Selection.hoverEntity('');
        }
    }
};

var onEntityParentChanged = 'entity:parentChanged';
editorCallback.onEntityParentChanged = function (entity) {
    Editor.sendToWindows( onEntityParentChanged, entity.id, entity.parent && entity.parent.id );
    Editor.sendToWindows('scene:dirty');
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
    Editor.sendToWindows( onEntityIndexChanged, entity.id, next && next.id );
    Editor.sendToWindows('scene:dirty');
};

editorCallback.onEntityRenamed = function (entity) {
    Editor.sendToWindows('entity:renamed', entity.id, entity._name);
};

editorCallback.onComponentEnabled = function (component) {
    Editor.sendToWindows('component:enabled', component.id);
};

editorCallback.onComponentDisabled = function (component) {
    Editor.sendToWindows('component:disabled', component.id);
};

editorCallback.onComponentAdded = function (entity, component) {
    Editor.sendToWindows('component:added', entity.id, component.id);
};

editorCallback.onComponentRemoved = function (entity, component) {
    Editor.sendToWindows('component:removed', entity.id, component.id);
};
