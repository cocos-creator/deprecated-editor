var BitmapFont = Fire.BitmapFont;

BitmapFont.prototype.createEntity = function ( cb ) {
    var ent = new Fire.Entity(this.name);

    var bitmapText = ent.addComponent(Fire.BitmapText);

    bitmapText.bitmapFont = this;

    if ( cb ) {
        cb ( ent );
    }
};
