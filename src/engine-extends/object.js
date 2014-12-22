// fobject extends

(function () {

    var FObject = Fire.FObject;

    Object.defineProperty(FObject.prototype, 'dirty', {
        get: function () {
            return this._objFlags & Fire._ObjectFlags.Dirty;
        },
        set: function (value) {
            if ( value ) {
                this._objFlags |= Fire._ObjectFlags.Dirty;
            }
            else {
                this._objFlags &= ~Fire._ObjectFlags.Dirty;
            }
        },
        enumerable: false
    });

})();
