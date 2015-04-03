var Sprite = Fire.Sprite;

Sprite.prototype.createEntity = function ( cb ) {
    var ent = new Fire.Entity(this.name);

    var spriteRenderer = ent.addComponent(Fire.SpriteRenderer);
    spriteRenderer.sprite = this;
    spriteRenderer.width = this.width;
    spriteRenderer.height = this.height;

    if ( cb ) {
        cb ( ent );
    }
};
