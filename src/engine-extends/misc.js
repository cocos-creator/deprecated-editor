var idToObject = {};

Editor._idToObject = idToObject;

Editor.getInstanceById = function (id) {
    return idToObject[id];
};

Fire.JS.get(Fire, '$0', function () {
    var id = Editor.Selection.entities[0];
    if (id) {
        return Editor.getInstanceById(id);
    }
});

Fire.JS.get(Fire, '$0C', function () {
    var id = Editor.Selection.entities[0];
    if (id) {
        var entity = Editor.getInstanceById(id);
        return entity._components;
    }
});
