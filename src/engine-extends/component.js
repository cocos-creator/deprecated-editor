// editor utils

(function () {
    
    var Component = Fire.Component;

    // register id
    Object.defineProperty ( Component.prototype, 'hashKey', {
        get: function () {
            var retval = this._hashKey;
            if (retval) {
                return retval;
            }
            //retval = Object.getOwnPropertyDescriptor(HashObject.prototype, 'hashKey').get.call(this);
            retval = (this._hashKey = '' + this.hashId);
            Fire._idToObject[retval] = this;
            return retval;
        }
    });

    // unregister id
    var doOnPreDestroy = Component.prototype._onPreDestroy;
    Component.prototype._onPreDestroy = function () {
        doOnPreDestroy.call(this);
        delete Fire._idToObject[this._hashKey];
    };

})();
