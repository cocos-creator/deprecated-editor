// JsonImporter
var JsonImporter = FIRE.define('FIRE_ED.JsonImporter', Importer);
JsonImporter.prop('binary', false);

JsonImporter.prototype.exec = function () {
    AssetDB.copyToLibrary( this.uuid, this.rawfile );
};

FIRE_ED.JsonImporter = JsonImporter;
