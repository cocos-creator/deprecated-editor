var idToObject = {};

Editor._idToObject = idToObject;

Editor.getInstanceById = function (id) {
    return idToObject[id];
};

Object.defineProperty(Fire, '$0', {
    get: function () {
        var id = Editor.Selection.entities[0];
        if (id) {
            return Editor.getInstanceById(id);
        }
    }
});
