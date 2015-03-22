﻿var MSG_COMPILED = 'Can not load the associated script. Please assign a valid script.';
var MSG_NOT_COMPILED = 'Compilation fails, please fix errors and retry.';

var MissingScript = Fire._MissingScript;

MissingScript.prop('_script', null, Fire.HideInInspector );
MissingScript.getset('script',
    function () {
        return this._script;
    },
    function (value) {
        if (this._script !== value) {
            this._script = value;
            // TODO: @jare, please add your ipc in here
        }
    },
    Fire.ObjectType(Fire.ScriptAsset)
);

MissingScript.get('errorInfo',
    function () {
        return Fire._Sandbox.compiled ? MSG_COMPILED : MSG_NOT_COMPILED;
    },
    Fire.MultiText
);

// the serialized data for original script object
// NOTE: '_$erialized' 这个特殊标记只有声明为最后一个 prop 才有用，这个FireClass的原始序列化数据将直接赋给 prop。
MissingScript.prop('_$erialized', null, Fire.HideInInspector, Fire.EditorOnly);


MissingScript.prototype.getScriptUuid = function () {
    var id = this._$erialized && this._$erialized.__type__;
    if (Fire.isUuid(id)) {
        return Fire.decompressUuid(id);
    }
    return '';
};

/**
 * @param {string} id
 * @returns {function} constructor
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
