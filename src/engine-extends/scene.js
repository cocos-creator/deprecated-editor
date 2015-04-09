// editor utils for scene operation

var Scene = Fire._Scene;
var Engine = Fire.Engine;
var Entity = Fire.Entity;

Scene.prototype.createEntity = function (name, flags) {
    var currentScene = Engine._scene;
    var isCurrentScene = Engine._scene === this;
    if (isCurrentScene === false) {
        Engine._canModifyCurrentScene = false;
        Engine._scene = this;
    }

    var ent = Entity.createWithFlags(name, flags);

    if (isCurrentScene === false) {
        Engine._canModifyCurrentScene = true;
        Engine._scene = currentScene;
    }
    return ent;
};

Scene.prototype.findEntityWithFlag = function (path, flags) {
    var nameList = path.split('/');
    var match = null;

    // visit root entities
    var name = nameList[1];     // skip first '/'
    var entities = this.entities;
    for (var i = 0; i < entities.length; i++) {
        if (entities[i].isValid &&
            entities[i]._name === name &&
            (entities[i]._objFlags & flags) === flags)
        {
            match = entities[i];
            break;
        }
    }
    if (!match) {
        return null;
    }

    // parse path
    var n = 2;                  // skip first '/' and roots
    for (n; n < nameList.length; n++) {
        name = nameList[n];
        // visit sub entities
        var children = match._children;
        match = null;
        for (var t = 0, len = children.length; t < len; ++t) {
            var subEntity = children[t];
            if (subEntity.name === name &&
                (subEntity._objFlags & flags) === flags ) {
                match = subEntity;
                break;
            }
        }
        if (!match) {
            return null;
        }
    }

    return match;
};

/**
 * @param {number[]} indices - the array contains index of all entities parents in the hierarchy
 * @return {Entity} the entity or null if not found
 */
Scene.prototype.findEntityByIndices = function (indices) {
    var entity;
    for (var i = 0, children = this.entities; i < indices.length; i++, children = entity._children) {
        var index = indices[i];
        if (index < children.length) {
            entity = children[index];
            if (Fire.isValid(entity)) {
                continue;
            }
        }
        return null;
    }
    return entity;
};

Scene.prototype._instantiate = function () {
    var uuid = this._uuid;
    var dirty = this.dirty;
    var result = Fire._doInstantiate(this);
    result._uuid = uuid;
    result.dirty = dirty;   // 这里虽然会保持 dirty 状态，但要注意现有的 IPC 体系很脆弱不应该完全依赖这个标志
    return result;
};
