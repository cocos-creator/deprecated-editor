var MSG_COMPILED = 'Can not load the associated script. Please assign a valid script.';
var MSG_NOT_COMPILED = 'Compilation fails, please fix errors and retry.';

var MissingScript = Fire._MissingScript;

MissingScript.getset('_scriptUuid',
    function () {
        var id = this._$erialized.__type__;
        if (Editor.isUuid(id)) {
            return Editor.decompressUuid(id);
        }
        return '';
    },
    function (value) {
        if ( !Editor._Sandbox.compiled ) {
            Fire.error('Scripts not yet compiled, please fix script errors and compile first.');
            return;
        }
        if (value && Editor.isUuid(value._uuid)) {
            var classId = Editor.compressUuid(value);
            if (Fire.JS._getClassById(classId)) {
                this._$erialized.__type__ = classId;
                Editor.sendToWindows('reload:window-scripts', Editor._Sandbox.compiled);
            }
            else {
                Fire.error('Can not find a component in the script which uuid is "%s".', value);
            }
        }
        else {
            Fire.error('invalid script');
        }
    }
);

MissingScript.get('errorInfo',
    function () {
        return Editor._Sandbox.compiled ? MSG_COMPILED : MSG_NOT_COMPILED;
    },
    Fire.MultiText
);

// the serialized data for original script object
// NOTE: '_$erialized' 这个特殊标记只有声明为最后一个 prop 才有用，这个FireClass的原始序列化数据将直接赋给 prop。
MissingScript.prop('_$erialized', null, Fire.HideInInspector, Fire.EditorOnly);


/**
 * @param {string} id
 * @return {function} constructor
 */
MissingScript.safeFindClass = function (id) {
    var cls = Fire.JS._getClassById(id);
    if (cls) {
        return cls;
    }
    // TODO: Track the rename operactions of scripts
    if (id) {
        return MissingScript;
    }
    return null;
};
