
function EditorPluginLoader () {
    Fire._PluginLoader.apply(this, arguments);
}
Fire.extend(EditorPluginLoader, Fire._PluginLoader);

EditorPluginLoader.prototype.onAfterUnload = function () {
    // reload to ensure context clear and menu unloaded
    Fire._Sandbox.reloadScripts();
};
EditorPluginLoader.prototype._addMenuImpl = function (path, msg) {
    Fire.MainMenu.addCommandItem(path, msg);
};
EditorPluginLoader.prototype._getRequireCacheImpl = function () {
    return Fire._Sandbox.nodeJsRequire.cache;
};

var Ipc = require('ipc');

var MSG_LOAD = 'plugin:load';
var MSG_UNLOAD = 'plugin:unload';

Fire._editorPluginLoader = new EditorPluginLoader('user plugins');

Ipc.on(MSG_LOAD, function (pkg, pkgPath) {
    Fire._editorPluginLoader.load(pkg, pkgPath);
});

Ipc.on(MSG_UNLOAD, function (name) {
    Fire._editorPluginLoader.unload(name);
});
