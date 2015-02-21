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


// extend defineComponent to register the default component menu
var doDefine = Fire.defineComponent;
var doExtend = Fire.extendComponent;

/**
 * @method defineComponent
 * @static
 * @param {function} [constructor]
 */
Fire.defineComponent = function (constructor) {
    var comp = doDefine(constructor);
    if (comp) {
        Fire.addComponentMenu(comp, 'Scripts/' + Fire.JS.getClassName(comp), -1);
    }
    return comp;
};

/**
 * @method extendComponent
 * @static
 * @param {function} baseClass
 * @param {function} [constructor]
 */
Fire.extendComponent = function (baseClass, constructor) {
    var comp = doExtend(baseClass, constructor);
    if (comp) {
        Fire.addComponentMenu(comp, 'Scripts/' + Fire.JS.getClassName(comp), -1);
    }
    return comp;
};
