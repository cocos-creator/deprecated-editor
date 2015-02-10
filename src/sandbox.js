var FireUrl = require('fire-url');

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
                                    infoCallback('Modified global variable while %s: %s\nBefore: %s\nAfter: %s',
                                                 processingInfo, key, lastValue, globals[key]);
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
                            var canDelete = delete globals[key];
                            if ( !canDelete ) {
                                this._snapshot[key] = globals[key] = undefined;
                            }
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


// 加载项目里的普通脚本
var userScriptLoader = (function () {

    var SRC_BUILTIN = 'library://bundle.builtin.js';
    var SRC_PROJECT = 'library://bundle.project.js';

    var loadedScriptNodes = [];
    //var gVarsCheckerBetweenReload = new GlobalVarsChecker();

    function recreateScene () {
        // serialize scene
        var sceneSnapshot = Fire.serialize(Fire.Engine._scene, { stringify: false });

        // deserialize scene
        var info = new Fire._DeserializeInfo();
        Fire.Engine._canModifyCurrentScene = false;
        var newScene = Fire.deserialize(sceneSnapshot, info, {
            classFinder: Fire._MissingScript.safeFindClass
        });
        Fire.Engine._canModifyCurrentScene = true;
        //
        Sandbox.globalVarsChecker.restore(Fire.log, 'deserializing scene by new scripts');

        newScene._uuid = Fire.Engine._scene._uuid;
        if (newScene._uuid) {
            Fire.AssetLibrary.replaceAsset(newScene);
        }

        // load depends
        info.assignAssetsBy(Fire.AssetLibrary.getAssetByUuid);

        return newScene;
    }

    function doLoad (src, onload) {
        // 这里用 require 实现会更简单，但是为了和运行时保持尽量一致，还是改用 web 方式加载。
        var script = document.createElement('script');
        script.onload = function () {
            console.timeEnd('load ' + src);
            onload();
        };
        script.onerror = function () {
            console.timeEnd('load ' + src);
            if (loadedScriptNodes.length > 0) {
                loader.unloadAll();
            }
            Fire.error('Failed to load %s', src);
        };
        script.setAttribute('type','text/javascript');
        script.setAttribute('src', FireUrl.addRandomQuery(src));
        console.time('load ' + src);
        document.head.appendChild(script);
        loadedScriptNodes.push(script);
    }

    var loader = {

        loadAll: function () {
            doLoad(SRC_BUILTIN, function () {
                Sandbox.globalVarsChecker.restore(Fire.log, 'loading builtin plugin runtime', 'require');

                doLoad(SRC_PROJECT, function () {
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
                });
            });
        },

        unloadAll: function () {
            // remove script element
            for (var i = 0; i < loadedScriptNodes.length; i++) {
                var node = loadedScriptNodes[i];
                node.remove();
            }
            loadedScriptNodes.length = 0;
        },

        name: 'common scripts'
    };

    return loader;
})();

// 重新加载全部脚本和插件
Sandbox.reloadScripts = (function () {

    var LoadSequence = [userScriptLoader, Fire._pluginLoader];

    var builtinClassIds;
    var builtinClassNames;
    var builtinComponentMenus;
    var builtinCustomAssetMenus;

    var inited = false;

    function init () {
        inited = true;
        Sandbox.globalVarsChecker = new GlobalVarsChecker().record();
        Sandbox.nodeJsRequire = require;
        builtinClassIds = Fire._registeredClassIds;
        builtinClassNames = Fire._registeredClassNames;
        builtinComponentMenus = Fire._componentMenuItems.slice();
        builtinCustomAssetMenus = Fire._customAssetMenuItems.slice();
    }

    function purge () {
        Sandbox._purgeMemory();
        // reset menus
        Fire._componentMenuItems = builtinComponentMenus.slice();
        Fire._customAssetMenuItems = builtinCustomAssetMenus.slice();
        Fire.MainMenu.reset();
        // remove user classes
        Fire._registeredClassIds = builtinClassIds;
        Fire._registeredClassNames = builtinClassNames;
        //
        Fire.LoadManager.reset();
        // 清除 browserify 声明的 require 后，除非用户另外找地方存了原来的 require，否则之前的脚本都将会被垃圾回收
        require = Sandbox.nodeJsRequire;
        Sandbox.globalVarsChecker.restore(Fire.log, 'purging', 'require');
        Fire._requiringStack = [];
    }

    //// 重新加载插件脚本
    //var reloadPluginScripts = (function () {
    //    function reloadPluginScripts () {

    //    }
    //    return reloadPluginScripts;
    //})();

    function reloadScripts (compileSucceeded) {
        var scriptsLoaded = inited;
        if ( !inited ) {
            init();
        }

        if ( !compileSucceeded ) {
            return;
        }

        // restore global variables（就算没 play 也可能会在 dev tools 里面添加全局变量）
        Sandbox.globalVarsChecker.restore(Fire.log, 'editing');

        if (scriptsLoaded) {
            // unload old
            for (var j = LoadSequence.length - 1; j >= 0; j--) {
                LoadSequence[j].unloadAll();
                Sandbox.globalVarsChecker.restore(Fire.warn, 'unloading ' + LoadSequence[j].name);
            }

            // reset
            purge();
        }

        // load new
        for (var i = 0; i < LoadSequence.length; i++) {
            LoadSequence[i].loadAll();
            Sandbox.globalVarsChecker.restore(Fire.warn, 'loading ' + LoadSequence[i].name);
        }
    }

    return reloadScripts;
})();

Fire._Sandbox = Sandbox;
