
// This adapter converts editor callbacks to ipc events

var editorCallback = Fire.Engine._editorCallback;

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

function takeEntitySnapshot(entity, options) {
    return {
        name: entity._name,
        objFlags: entity._objFlags,
        id: entity.id,
        options: options,   // 只有 root entity 会有 option
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

editorCallback.onBeforeActivateScene = function (scene) {
    window.dispatchEvent( new CustomEvent ('scene-launched', {
        detail: { scene: scene },
        bubbles: false,
        cancelable: false,
    }) );

    Editor.sendToWindows('scene:launched', takeSceneSnapshot(scene));
    Editor.sendToWindows('scene:repaint');
};

editorCallback.onSceneLaunched = function (scene) {

};

editorCallback.onEntityCreated = function (entity, options) {
    Editor.sendToWindows('entity:created', takeEntitySnapshot(entity, options));
    Editor.sendToWindows('scene:repaint');
};

editorCallback.onEntityRemoved = function (entity/*, isTopMost*/) {
    Editor.sendToWindows( 'entity:removed', {
        'entity-id': entity.id
    });
    Editor.sendToWindows('scene:repaint');
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

editorCallback.onEntityParentChanged = function (entity) {
    Editor.sendToWindows( 'entity:parent-changed', {
        'entity-id': entity.id,
        'parent-id': entity.parent ? entity.parent.id : null
    });
    Editor.sendToWindows('scene:repaint');
};

editorCallback.onEntityIndexChanged = function (entity, oldIndex, newIndex) {
    // get next sibling, skip object hidden in editor
    var next = null;
    var i = newIndex;
    do {
        ++i;
        next = entity.getSibling(i);
    } while (next && (next._objFlags & Fire._ObjectFlags.HideInEditor));
    //
    Editor.sendToWindows( 'entity:index-changed', {
        'entity-id': entity.id,
        'next-sibliing-id': next ? next.id : null
    });
    Editor.sendToWindows('scene:repaint');
};

editorCallback.onEntityRenamed = function (entity) {
    Editor.sendToWindows('entity:renamed', {
        'entity-id': entity.id,
        'name': entity._name,
    });
};

editorCallback.onComponentEnabled = function (component) {
    Editor.sendToWindows('component:enabled', {
        'component-id': component.id
    });
};

editorCallback.onComponentDisabled = function (component) {
    Editor.sendToWindows('component:disabled', {
        'component-id': component.id
    });
};

editorCallback.onComponentAdded = function (entity, component) {
    Editor.sendToWindows('component:added', {
        'entity-id': entity.id,
        'component-id': component.id,
    });
};

editorCallback.onComponentRemoved = function (entity, component) {
    Editor.sendToWindows('component:removed', {
        'entity-id': entity.id,
        'component-id': component.id,
    });
};
