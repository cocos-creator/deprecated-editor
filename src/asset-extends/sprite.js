var Sprite = Fire.Sprite;

Sprite.prototype.createEntity = function ( cb ) {
    var ent = new Fire.Entity(this.name);

    var spriteRenderer = ent.addComponent(Fire.SpriteRenderer);
    spriteRenderer.sprite = this;
    spriteRenderer.customWidth = this.width;
    spriteRenderer.customHeight = this.height;

    if ( cb ) {
        cb ( ent );
    }
};
