Fire.AudioClip.prototype.createEntity = function () {
    var ent = new Fire.Entity(this.name);

    var audioSource = ent.addComponent(Fire.AudioSource);

    audioSource.clip = this;

    return ent;
};
