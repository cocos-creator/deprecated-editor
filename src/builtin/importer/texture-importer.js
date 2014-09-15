// TextureImporter
var TextureImporter = FIRE.define('FIRE_ED.TextureImporter', Importer);
TextureImporter.prop('wrapMode', FIRE.Texture.WrapMode.Clamp, FIRE.Enum(FIRE.Texture.WrapMode));
TextureImporter.prop('filterMode', FIRE.Texture.FilterMode.Bilinear, FIRE.Enum(FIRE.Texture.FilterMode));

TextureImporter.prototype.exec = function () {
    var img = new Image();
    img.onload = function () {
        var tex = new FIRE.Texture(img);
        tex.wrapMode = this.wrapMode;
        tex.filterMode = this.filterMode;

        AssetDB.importToLibrary( this.uuid, tex );

        // copy host file to library/{{this.uuid}}.host 
        AssetDB.importHostData( this.uuid, this.rawfile );
    }.bind(this);
    img.src = this.rawfile; 
};

FIRE_ED.TextureImporter = TextureImporter;
