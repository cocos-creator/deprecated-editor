var Sandbox = (function () {

    var stashedScene = null;
    var savedGlobalVars = null;

    function cloneScene (scene) {
        return Fire.instantiate(scene);
    }

    function purgeMemory () {
        Fire.FObject._deferredDestroy();    // 预先释放一批对象，方便 GC
    }

    var Sandbox = function () {};

    Sandbox._launchScene = function (scene, onUnloaded) {
        // save selection
        var selection = Fire.Selection.entities;
        var paths = [];
        var i;
        for (i = 0; i < selection.length; i++) {
            var entity = Fire._getInstanceById(selection[i]);
            if (entity) {
                paths.push(entity._getIndices());
            }
        }

        // launch
        Fire.Engine._setCurrentScene(scene, onUnloaded);

        // restore selection
        selection.length = 0;
        for (i = 0; i < paths.length; i++) {
            var indices = paths[0];
            var ent = Fire.Engine._scene.findEntityByIndices(indices);
            if (!ent) {
                Fire.error('Can not find entity: ' + indices);
            }
            selection.push(ent.id);
        }
        Fire.Selection.selectEntity(selection, false, true);
    };

    // 保存当前场景
    Sandbox.stashScene = function () {
        purgeMemory();
        this.saveGlobalVars();
        // backup scene
        stashedScene = cloneScene(Fire.Engine._scene);
        // clone current scene
        var shadowScene = cloneScene(Fire.Engine._scene);
        // switch scene
        this._launchScene(shadowScene);
    };

    // 销毁当前场景，将之前保存的场景还原
    Sandbox.rewindScene = function () {
        purgeMemory();
        this._launchScene(stashedScene, this.resetGlobalVars.bind(this, true));
        stashedScene = null;
    };

    /**
     * Take a snapshot of current global variables
     */
    Sandbox.saveGlobalVars = function () {
        savedGlobalVars = {};
        var globals = window;
        for (var key in globals) {
            if (globals.hasOwnProperty(key)) {
                savedGlobalVars[key] = globals[key];
            }
        }
    };

    /**
     * @param {boolean} showWarning
     */
    Sandbox.resetGlobalVars = function (showWarning) {
        var key;
        var globals = window;
        for (key in globals) {
            if (globals.hasOwnProperty(key)) {
                if (key in savedGlobalVars) {
                    var lastValue = savedGlobalVars[key];
                    var type = typeof lastValue;
                    if ((type === 'object' || type === 'function') && globals[key] !== lastValue) {
                        if (showWarning) {
                            Fire.warn('Modified global variable: ' + key);
                        }
                        globals[key] = lastValue;
                    }
                }
                else {
                    if (showWarning) {
                        Fire.warn('Introduced global variable: ' + key);
                    }
                    delete globals[key];
                }
            }
        }
        for (key in savedGlobalVars) {
            if ( !(key in globals) ) {
                if (showWarning) {
                    Fire.warn('Deleted global variable: ' + key);
                }
                globals[key] = savedGlobalVars[key];
            }
        }
    };

    return Sandbox;
})();
