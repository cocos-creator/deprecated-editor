// editor utils

(function () {

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

    // Checks Component declaration

    Fire._requiringStack = [];

    var define = Fire.define;
    Fire.define = function (className, baseOrConstructor, constructor) {
        if (Fire.isChildClassOf(baseOrConstructor, Component)) {
            var loadingScript = Fire._requiringStack[Fire._requiringStack.length - 1];
            if (className !== loadingScript) {
                if (loadingScript) {
                    Fire.error('Can\'t define Component "' + className + '" in script "' + loadingScript +
                        '". Make sure that the file name and class name match.');
                }
                else {
                    Fire.warn('Sorry, defining Component "' + className + '" dynamically is not allowed, defines in its corresponding script please.');
                }
            }
        }
        var cls = define(className, baseOrConstructor, constructor);
        return cls;
    };

})();
