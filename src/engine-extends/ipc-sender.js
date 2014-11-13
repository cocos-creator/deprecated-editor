
// This adapter converts editor callbacks to ipc events

(function () {

    var editorCallback = Fire.Engine._editorCallback;

    // pre-declaration for unit tests, overridable for editor
    Fire.broadcast = function () {};

    function takeSceneSnapshot (scene) {
        function takeEntitySnapshot(entity) {
            var children = entity._children;
            var snapshot = {
                name: entity._name,
                objFlags: entity._objFlags,
                id: entity.id,
                children: new Array(children.length),
            };
            var childrenDatas = snapshot.children;
            for (var i = 0, len = children.length; i < len; i++) {
                childrenDatas[i] = takeEntitySnapshot(children[i]);
            }
            return snapshot;
        }
        var entities = scene.entities;
        var snapshot = { entities : new Array(entities.length) };
        var entityDatas = snapshot.entities;
        for (var i = 0, len = entities.length; i < len; i++) {
            entityDatas[i] = takeEntitySnapshot(entities[i]);
        }
        return snapshot;
    }

    editorCallback.onSceneLaunched = function (scene) {
        Fire.broadcast('scene:launched', takeSceneSnapshot(scene));
        Fire.broadcast('scene:dirty');
    };

    //editorCallback.onSceneLoaded = function (scene) {
    //    Fire.broadcast('scene:loaded', scene.entities);
    //};

    var onEntityCreated = 'entity:created';
    editorCallback.onEntityCreated = function (entity) {
        Fire.broadcast( onEntityCreated, entity._name, entity._objFlags, entity.id );
    };

    var onEntityRemoved = 'entity:removed';
    editorCallback.onEntityRemoved = function (entity) {
        Fire.broadcast( onEntityRemoved, entity.id );
        Fire.broadcast('scene:dirty');
    };

    var onEntityParentChanged = 'entity:parentChanged';
    editorCallback.onEntityParentChanged = function (entity) {
        Fire.broadcast( onEntityParentChanged, entity.id, entity.parent && entity.parent.id );
        Fire.broadcast('scene:dirty');
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
        Fire.broadcast( onEntityIndexChanged, entity.id, next && next.id );
        Fire.broadcast('scene:dirty');
    };

    editorCallback.onEntityRenamed = function (entity) {
        Fire.broadcast('entity:renamed', entity.id, entity._name);
    };

    editorCallback.onComponentEnabled = function (component) {
        Fire.broadcast('component:enabled', component.id);
    };

    editorCallback.onComponentDisabled = function (component) {
        Fire.broadcast('component:disabled', component.id);
    };

})();
