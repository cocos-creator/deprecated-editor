// create entity action
Fire.AnimationClip.prototype.createEntity = function ( cb ) {
    var ent = new Fire.Entity(this.name);

    var animation = ent.addComponent(Fire.Animation);

    animation.defaultAnimation = this;

    if ( cb ) {
        cb (ent);
    }
};
