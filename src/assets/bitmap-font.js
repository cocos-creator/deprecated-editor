var BitmapFont = Fire.BitmapFont;

BitmapFont.prototype.createEntity = function () {
    var ent = new Fire.Entity(this.name);

    var bitmapText = ent.addComponent(Fire.BitmapText);

    bitmapText.bitmapFont = this;

    return ent;
};
