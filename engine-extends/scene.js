// editor utils for scene operation

(function () {

    var Scene = Fire._Scene;
    var Engine = Fire.Engine;
    var Entity = Fire.Entity;

    Scene.prototype.createEntity = function (name, flags) {
        var isCurrentScene = Engine._scene === this;
        if (isCurrentScene === false) {
            Engine._canModifyCurrentScene = false;
            Engine._scene = this;
        }

        var ent = Entity.createWithFlags(name, flags);
        
        if (isCurrentScene === false) {
            Engine._canModifyCurrentScene = true;
        }
        return ent;
    };
})();
