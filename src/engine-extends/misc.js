var idToObject = {};

Fire._idToObject = idToObject;

Fire._getInstanceById = function (id) {
    return idToObject[id];
};
