// editor utils

(function () {
    
    var Entity = Fire.Entity;

    Entity.createWithFlags = function (name, flags) {
        Entity._defaultFlags = flags;
        var ent = new Entity(name);
        Entity._defaultFlags = 0;
        return ent;
    };

    // register id
    Object.defineProperty ( Entity.prototype, 'id', {
        get: function () {
            var retval = this._id;
            if (retval) {
                return retval;
            }
            //retval = Object.getOwnPropertyDescriptor(HashObject.prototype, 'id').get.call(this);
            retval = (this._id = '' + this.hashCode);
            Fire._idToObject[retval] = this;
            return retval;
        }
    });

    // unregister id
    var doOnPreDestroy = Entity.prototype._onPreDestroy;
    Entity.prototype._onPreDestroy = function () {
        doOnPreDestroy.call(this);
        delete Fire._idToObject[this._id];
    };

    Entity.prototype._getIndices = function () {
        var indices = [];
        for (var ent = this; ent; ent = ent._parent) {
            indices.push(ent.getSiblingIndex());
        }
        return indices;
    };

})();
