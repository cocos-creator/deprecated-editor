// TextureMeta
var TextureMeta = FIRE.define('FIRE.TextureMeta', AssetMeta, function () {
    TextureMeta.$super.call(this);
});
FIRE_ED.TextureMeta = TextureMeta;

// TextureImporter
var TextureImporter = (function () {
    var _super = Importer;

    function TextureImporter () {
        _super.call(this,TextureMeta);
    }
    FIRE.extend(TextureImporter,_super);

    TextureImporter.prototype.exec = function ( fspath, meta ) {
        _super.prototype.exec(this,fspath,meta);
    };
    
    return TextureImporter;
})();

FIRE_ED.TextureImporter = TextureImporter;
