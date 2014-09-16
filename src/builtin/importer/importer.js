// Importer
var Importer = FIRE.define('FIRE_ED.Importer', function () {
    this.rawfile = "";
});
Importer.prop('ver', 0, FIRE.Integer, FIRE.HideInInspector);
Importer.prop('uuid', "", FIRE.HideInInspector);

Importer.prototype.exec = function () {
};

FIRE_ED.Importer = Importer;

