// editor utils

var Component = Fire.Component;

// register id
Object.defineProperty ( Component.prototype, 'id', {
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
var doOnPreDestroy = Component.prototype._onPreDestroy;
Component.prototype._onPreDestroy = function () {
    doOnPreDestroy.call(this);
    delete Fire._idToObject[this._id];
};


// extend Fire._doDefine to register the default component menu

var doDefine = Fire._doDefine;
Fire._doDefine = function (className, baseClass, constructor) {
    var comp = doDefine(className, baseClass, constructor);
    if (comp && Fire.isChildClassOf(baseClass, Fire.Component)) {
        var frame = Fire._RFget();
        var isProjectScript = frame.uuid;
        if (isProjectScript) {
            Fire.addComponentMenu(comp, 'Scripts/' + Fire.JS.getClassName(comp), -1);
        }
    }
    return comp;
};

// 如果不带有 uuid，则返回空字符串。
Component.prototype.getScriptUuid = function () {
    var id = Fire.JS._getClassId(this);
    if (Fire.isUuid(id)) {
        return Fire.decompressUuid(id);
    }
    return '';
};
