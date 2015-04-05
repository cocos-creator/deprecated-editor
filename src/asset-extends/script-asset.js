Fire.ScriptAsset.prototype.createEntity = function (done) {
    var classID = Fire.compressUuid(this._uuid);
    var Comp = Fire.JS._getClassById(classID);
    if (Comp && Fire.isChildClassOf(Comp, Fire.Component)) {

        var entity = new Fire.Entity(this.name);
        entity.addComponent(Comp);
        if (done) {
            done(entity);
        }
    }
};
