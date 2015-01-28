var audioClip = Fire.AudioClip;

audioClip.prototype.createEntity = function () {
    var ent = new Fire.Entity(this.name);

    var audioClip = ent.addComponent(Fire.AudioSources);

    audioClip.audioClip = this;

    return ent;
};