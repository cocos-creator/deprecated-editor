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

Component.prototype._cacheUuid = null;

// extend Fire._doDefine to register the default component menu

var doDefine = Fire._doDefine;
Fire._doDefine = function (className, baseClass, constructor) {
    var comp = doDefine(className, baseClass, constructor);
    if (comp && Fire.isChildClassOf(baseClass, Fire.Component)) {
        var frame = Fire._RFget();
        var uuid = frame.uuid;
        // project script
        if (uuid) {
            Fire.addComponentMenu(comp, 'Scripts/' + Fire.JS.getClassName(comp), -1);
            comp.prototype._cacheUuid = Fire.decompressUuid(uuid);
            //Fire.AssetLibrary.loadAsset(uuid, function (err, scriptAsset) {
            //    if (err) {
            //        Fire.error('Failed to assign script reference of component "%s": %s', className, err);
            //        return;
            //    }
            //});
        }
    }
    return comp;
};

// 如果不带有 uuid，则返回空字符串。
Component.prototype.getScriptUuid = function () {
    if (this._cacheUuid) {
        return this._cacheUuid;
    }
    //var id = Fire.JS._getClassId(this);
    //if (Fire.isUuid(id)) {
    //    return Fire.decompressUuid(id);
    //}
    return '';
};

// 预定义一些容易混淆的字段，用来检查拼写

var TypoCheckList = {
    onEnabled: "onEnable",
    enable: "enabled",
    onDisabled: "onDisable",
    onDestroyed: "onDestroy",
    awake: "onLoad",
    start: "onStart",
};

for (var typo in TypoCheckList) {
    (function (typo) {
        var correct = TypoCheckList[typo];
        Object.defineProperty(Component.prototype, typo, {
            set: function (value) {
                Fire.warn('Potential Typo: Please use "%s" instead of "%s" for Component "%s"', correct,
                          typo, Fire.JS.getClassName(this));
                Object.defineProperty(Component.prototype, typo, {
                    value: value,
                    writable: true
                });
            },
            configurable: true,
        });
    })(typo);
}
