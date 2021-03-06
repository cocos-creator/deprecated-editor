﻿// editor utils

var Entity = Fire.Entity;

// register id
Object.defineProperty ( Entity.prototype, 'id', {
    get: function () {
        var retval = this._id;
        if (retval) {
            return retval;
        }
        //retval = Object.getOwnPropertyDescriptor(HashObject.prototype, 'id').get.call(this);
        retval = (this._id = '' + this.hashCode);
        Editor._idToObject[retval] = this;
        return retval;
    }
});

// unregister id
var doOnPreDestroy = Entity.prototype._onPreDestroy;
Entity.prototype._onPreDestroy = function () {
    doOnPreDestroy.call(this);
    delete Editor._idToObject[this._id];
};

Entity.prototype._getIndices = function () {
    var indices = [];
    for (var ent = this; ent; ent = ent._parent) {
        indices.push(ent.getSiblingIndex());
    }
    return indices.reverse();
};
