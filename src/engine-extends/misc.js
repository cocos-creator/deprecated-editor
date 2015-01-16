var idToObject = {};

Fire._idToObject = idToObject;

Fire._getInstanceById = function (id) {
    return idToObject[id];
};

Object.defineProperty(Fire, '$0', {
    get: function () {
        var id = Fire.Selection.entities[0];
        if (id) {
            return Fire._getInstanceById(id);
        }
    }
});
