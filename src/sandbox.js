var GlobalVarsChecker = (function () {

    var DefaultIgnoreGlobalVars = [
        'webkitIndexedDB',      // deprecated warning
        'webkitStorageInfo',    // deprecated warning
    ];

    var globals = window;

    function GlobalVarsChecker(ignoreNames) {
        this._snapshot = {};
        var namesArray = DefaultIgnoreGlobalVars.concat(ignoreNames);
        this.ignoreNames = namesArray.reduce(function (obj, name) {
            obj[name] = true;
            return obj;
        }, {});
    }

    GlobalVarsChecker.prototype = {
        /**
         * Take a snapshot of current global variables
         */
        record: function () {
            //console.assert(Object.keys(this._snapshot).length === 0, 'Should not yet recorded');
            this._snapshot = {};
            for (var key in globals) {
                if (globals.hasOwnProperty(key) && !this.ignoreNames[key]) {
                    this._snapshot[key] = globals[key];
                }
            }
            return this;
        },
        /**
         * @param {function} infoCallback
         * @param {string} processingInfo
         * @param {string} ignoreName - ignore and update the record
         */
        restore: function (infoCallback, processingInfo, ignoreName) {
            console.assert(Object.keys(this._snapshot).length > 0, 'Should recorded');
            var key;
            for (key in globals) {
                if (globals.hasOwnProperty(key) && !this.ignoreNames[key]) {
                    var currValue = globals[key];
                    if (key in this._snapshot) {
                        var lastValue = this._snapshot[key];
                        var type = typeof lastValue;
                        if ((type === 'object' || type === 'function') && currValue !== lastValue) {
                            if (key !== ignoreName) {
                                if (infoCallback) {
                                    infoCallback('Modified global variable while ' + processingInfo + ': ' + key);
                                }
                                globals[key] = lastValue;
                            }
                            else {
                                this._snapshot[key] = currValue;
                            }
                        }
                    }
                    else {
                        if (key !== ignoreName) {
                            Fire.error('Introduced global variable while %s: %s', processingInfo, key);
                            delete globals[key];
                        }
                        else {
                            this._snapshot[key] = currValue;
                        }
                    }
                }
            }
            for (key in this._snapshot) {
                if ( !(key in globals) ) {
                    if (key !== ignoreName) {
                        if (infoCallback) {
                            infoCallback('Deleted global variable while ' + processingInfo + ': ' + key);
                        }
                        globals[key] = this._snapshot[key];
                    }
                    else {
                        delete this._snapshot[key];
                    }
                }
            }
            //this._snapshot = {};
        }
    };

    return GlobalVarsChecker;
})();

var Sandbox = (function () {

    var stashedScene = null;
    //var gVarsCheckerForPlaying = new GlobalVarsChecker();

    function cloneScene (scene) {
        return Fire.instantiate(scene);
    }

    var Sandbox = function () {};

    function purgeMemory () {
        Fire.FObject._deferredDestroy();    // 预先释放一批对象，方便 GC
    }
    Sandbox._purgeMemory = purgeMemory;

    Sandbox.globalVarsChecker = null;

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
        //var checkerUnloadingGV = new GlobalVarsChecker().record();
        Fire.Engine._setCurrentScene(scene, onUnloaded/*function () {
            checkerUnloadingGV.restore(Fire.error);
            if (onUnloaded) {
                onUnloaded();
            }
        }*/);

        // restore selection
        selection.length = 0;
        for (i = 0; i < paths.length; i++) {
            var indices = paths[0];
            var ent = Fire.Engine._scene.findEntityByIndices(indices);
            if (ent) {
                selection.push(ent.id);
            }
            else {
                Fire.error('Can not find entity: ' + indices);
            }
        }
        Fire.Selection.selectEntity(selection, false, true);
    };

    // 保存当前场景
    Sandbox.stashScene = function () {
        purgeMemory();
        //gVarsCheckerForPlaying.record();
        Sandbox.globalVarsChecker.restore(Fire.log, 'editing');

        // backup scene
        stashedScene = cloneScene(Fire.Engine._scene);
        // clone current scene
        var shadowScene = cloneScene(Fire.Engine._scene);
        // switch scene
        this._launchScene(shadowScene, function () {
            Sandbox.globalVarsChecker.restore(Fire.warn, 'destroying editing scene');
        });
        Sandbox.globalVarsChecker.restore(Fire.warn, 'launching playing scene');
    };

    // 销毁当前场景，将之前保存的场景还原
    Sandbox.rewindScene = function () {
        purgeMemory();
        Sandbox.globalVarsChecker.restore(Fire.warn, 'playing');

        this._launchScene(stashedScene, function () {
            //gVarsCheckerForPlaying.restore(Fire.warn);
            Sandbox.globalVarsChecker.restore(Fire.warn, 'destroying playing scene');
        });
        Sandbox.globalVarsChecker.restore(Fire.warn, 'launching editing scene');
        stashedScene = null;
    };

    return Sandbox;
})();

Sandbox.reloadUserScripts = (function () {

    var SRC = 'library://bundle.js';
    //var SRC = 'C:/Firebox/main/bin/projects/default/library/bundle.js';

    var nodeJsRequire;
    var builtinClasses;
    var builtinComponentMenus;

    var loadedScriptNodes = [];
    //var gVarsCheckerBetweenReload = new GlobalVarsChecker();

    function init () {
        Sandbox.globalVarsChecker = new GlobalVarsChecker().record();
        nodeJsRequire = require;
        builtinClasses = Fire._registeredClasses;
        builtinComponentMenus = Fire._componentMenuItems.slice();
    }

    function purge () {
        Sandbox._purgeMemory();
        // reset menu
        Fire._componentMenuItems = builtinComponentMenus.slice();
        // remove user classes
        Fire._registeredClasses = builtinClasses;
        // 清除 browserify 声明的 require 后，除非用户另外找地方存了原来的 require，否则之前的脚本都将会被垃圾回收
        require = nodeJsRequire;
        // restore global variables（就算没 play 也可能会在 dev tools 里面添加全局变量）
        Sandbox.globalVarsChecker.restore(Fire.log, 'editing', 'require');
        //gVarsCheckerBetweenReload.restore(Fire.log);
        Fire._requiringStack = [];
    }

    function recreateScene () {
        // serialize scene
        var sceneSnapshot = Fire.serialize(Fire.Engine._scene, false, false, false);

        // deserialize scene
        var info = new Fire._DeserializeInfo();
        Fire.Engine._canModifyCurrentScene = false;
        var newScene = Fire.deserialize(sceneSnapshot, info, true, {
            classFinder: Fire._MissingScript.safeFindClass,
        });
        Fire.Engine._canModifyCurrentScene = true;
        newScene._uuid = Fire.Engine._scene._uuid;

        Sandbox.globalVarsChecker.restore(Fire.log, 'deserializing scene by new scripts');

        // load depends
        var getAssetByUuid = Fire.AssetLibrary.getAssetByUuid;
        for (var i = 0, len = info.uuidList.length; i < len; i++) {
            var uuid = info.uuidList[i];
            var asset = getAssetByUuid(uuid);
            if (asset) {
                var obj = info.uuidObjList[i];
                var prop = info.uuidPropList[i];
                obj[prop] = asset;
            }
            else {
                Fire.error('Failed to reload asset: ' + uuid);
            }
        }
        //
        Fire.AssetLibrary._replaceAsset(newScene);

        return newScene;
    }

    function unload () {
        // remove script element
        for (var i = 0; i < loadedScriptNodes.length; i++) {
            var node = loadedScriptNodes[i];
            node.remove();
        }
        loadedScriptNodes.length = 0;
        //
        purge();

        Fire.sendToCore('unload:user-scripts');

        // re-register menu
        for ( var key in Fire.plugins) {
            var plugin = Fire.plugins[key];
            if ( plugin.mainMenu ) {
                Fire.MainMenu.addTemplate(plugin.mainMenu.path, plugin.mainMenu.template);
            }
        }
    }

    /**
     * Reload user scripts
     */
    function reloadUserScripts () {
        if (loadedScriptNodes.length > 0) {
            unload();
        }
        else {
            init();
        }

        // before load
        //gVarsCheckerBetweenReload.record();
        //var gVarsCheckerDuringLoading = new GlobalVarsChecker(['require']).record();

        // do load
        var src = SRC + '?' + window.performance.now(); // 防止浏览器缓存
        var script = document.createElement('script');
        script.onload = function () {
            console.timeEnd('reload scripts');

            // after loaded

            //gVarsCheckerDuringLoading.restore();
            Sandbox.globalVarsChecker.restore(Fire.log, 'loading new scripts', 'require');

            // reload scene
            if (Fire.Engine._scene) {
                console.time('reload scene');
                var newScene = recreateScene();
                Sandbox._launchScene(newScene, function () {
                    Sandbox.globalVarsChecker.restore(Fire.log, 'destroying last scene');
                });
                Sandbox.globalVarsChecker.restore(Fire.warn, 'launching scene by new scripts');
                console.timeEnd('reload scene');
            }
        };
        script.onerror = function () {
            console.timeEnd('reload scripts');
            if (loadedScriptNodes.length > 0) {
                unload();
            }
        };
        script.setAttribute('type','text/javascript');
        script.setAttribute('src', src);
        console.time('reload scripts');
        document.head.appendChild(script);
        loadedScriptNodes.push(script);
    }

    return reloadUserScripts;

})();

Fire._Sandbox = Sandbox;
