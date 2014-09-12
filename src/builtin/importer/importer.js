// AssetMeta
var AssetMeta = FIRE.define('FIRE.AssetMeta', function () {
    this.uuid = Uuid.v4();
});
AssetMeta.prop('ver', 0, FIRE.Integer);
FIRE_ED.AssetMeta = AssetMeta;

// Importer
var Importer = (function () {
    // constructor
    function Importer ( metaClass ) {
        if ( metaClass )
            this.metaClass = metaClass;
        else
            this.metaClass = AssetMeta;
    }

    Importer.prototype.newMeta = function () {
        return new this.metaClass();
    };

    Importer.prototype.exec = function ( fspath, meta ) {
        // TODO: copy asset to library
    };

    return Importer;
})();
FIRE_ED.Importer = Importer;
