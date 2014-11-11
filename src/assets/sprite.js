(function () {
    
    var Sprite = Fire.Sprite;

    Sprite.prototype.createEntity = function () {
        var ent = new Fire.Entity(this.name);

        var spriteRenderer = ent.addComponent(Fire.SpriteRenderer);
        spriteRenderer.sprite = this;

        return ent;
    };

})();
