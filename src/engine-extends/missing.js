var MSG = 'Can not load the associated script. Please fix any errors and assign a valid script.';

var MissingScript = Fire._MissingScript;

MissingScript.get('errorInfo', function () {
    return MSG;
});

// the serialized data for original script object
// NOTE: '_$erialized' 这个特殊标记只有声明为最后一个 prop 才有用，这个FireClass的原始序列化数据将直接赋给 prop。
MissingScript.prop('_$erialized', null, Fire.HideInInspector, Fire.EditorOnly);

/**
 * @param {string} id
 * @returns {function} constructor
 */
MissingScript.safeFindClass = function (id) {
    var cls = Fire._getClassById(id);
    if (cls) {
        return cls;
    }
    // TODO: Track the rename operactions of scripts
    if (id) {
        return MissingScript;
    }
    return null;
};
