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

})();
