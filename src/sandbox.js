﻿var FireUrl = require('fire-url');
var Async = require('async');

var GlobalVarsChecker = (function () {

    var DefaultIgnoreGlobalVars = [
        'webkitIndexedDB',      // deprecated warning
        'webkitStorageInfo',    // deprecated warning
        'mixpanel',             // metrics
        'analytics',            // metrics
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

    Sandbox._launchScene = function (scene, onPreSceneLoad) {
        // save selection
        var selection = Editor.Selection.entities;
        var paths = [];
        var i;
        for (i = 0; i < selection.length; i++) {
            var entity = Editor.getInstanceById(selection[i]);
            if (entity) {
                paths.push(entity._getIndices());
            }
        }

        // launch
        //var checkerUnloadingGV = new GlobalVarsChecker().record();
        Fire.Engine._launchScene(scene, onPreSceneLoad/*function () {
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
        Editor.Selection.selectEntity(selection, false, true);
    };

    // 保存当前场景
    Sandbox.stashScene = function (onPreSceneLoad) {
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
            if (onPreSceneLoad) {
                onPreSceneLoad();
            }
        });
        Sandbox.globalVarsChecker.restore(Fire.warn, 'launching playing scene');
    };

    // 销毁当前场景，然后将之前保存的场景还原
    Sandbox.rewindScene = function (onPreSceneLoad) {
        purgeMemory();
        Sandbox.globalVarsChecker.restore(Fire.warn, 'playing');

        // force ignore dont destroy flags
        var entities = Fire.Engine._scene.entities;
        var DontDestroy = Fire._ObjectFlags.DontDestroy;
        for (var i = 0, len = entities.length; i < len; i++) {
            entities[i]._objFlags &= ~DontDestroy;
        }

        this._launchScene(stashedScene, function () {
            //gVarsCheckerForPlaying.restore(Fire.warn);
            Sandbox.globalVarsChecker.restore(Fire.warn, 'destroying playing scene');
            if (onPreSceneLoad) {
                onPreSceneLoad();
            }
        });
        Sandbox.globalVarsChecker.restore(Fire.warn, 'launching editing scene');
        stashedScene = null;
    };

    function recreateScene (scene) {
        // serialize scene
        var sceneSnapshot = Editor.serialize(scene, { stringify: false });

        // deserialize scene
        var info = new Fire._DeserializeInfo();
        Fire.Engine._canModifyCurrentScene = false;
        var newScene = Fire.deserialize(sceneSnapshot, info, {
            classFinder: Fire._MissingScript.safeFindClass
        });
        Fire.Engine._canModifyCurrentScene = true;
        //
        Sandbox.globalVarsChecker.restore(Fire.log, 'deserializing scene by new scripts');

        newScene._uuid = scene._uuid;
        if (newScene._uuid) {
            Fire.AssetLibrary.replaceAsset(newScene);
        }

        // load depends
        if ( !info.assignAssetsBy(Fire.AssetLibrary.getAssetByUuid) ) {
            Fire.error('Failed to assign asset to recreated scene, this can be caused by forgetting the call to AssetLibrary.cacheAsset');
        }

        return newScene;
    }

    Sandbox.reloadScene = function () {
        if (stashedScene) {
            console.time('reload stashed scene');
            stashedScene = recreateScene(stashedScene);
            console.time('reload stashed scene');
        }
        if (Fire.Engine._scene) {
            console.time('reload scene');
            var newScene = recreateScene(Fire.Engine._scene);
            Sandbox._launchScene(newScene, function () {
                Sandbox.globalVarsChecker.restore(Fire.log, 'destroying last scene');
            });
            Sandbox.globalVarsChecker.restore(Fire.warn, 'launching scene by new scripts');
            console.timeEnd('reload scene');
        }
    };

    Sandbox.compiled = false;

    return Sandbox;
})();


// 加载项目里的普通脚本
var runtimeScriptLoader = (function () {

    var SRC_BUILTIN = 'bundle.builtin.js';
    var SRC_PROJECT = 'bundle.project.js';

    var SRC_BUILTIN_URL = 'library://' + SRC_BUILTIN;
    var SRC_PROJECT_URL = 'library://' + SRC_PROJECT;

    var Remote = require('remote');
    var Path = require('path');
    var projectPath = Remote.getGlobal('Editor').projectPath;

    var SRC_BUILTIN_PATH = Path.join(projectPath, 'library', SRC_BUILTIN);
    var SRC_PROJECT_PATH = Path.join(projectPath, 'library', SRC_PROJECT);

    var loadedScriptNodes = [];
    //var gVarsCheckerBetweenReload = new GlobalVarsChecker();

    function doLoad (src, cb) {
        // 这里用 require 实现会更简单，但是为了和运行时保持尽量一致，还是改用 web 方式加载。
        var script = document.createElement('script');
        script.onload = function () {
            console.timeEnd('load ' + src);
            cb();
        };
        script.onerror = function () {
            console.timeEnd('load ' + src);
            if (loadedScriptNodes.length > 0) {
                loader.unloadAll();
            }
            Fire.error('Failed to load %s', src);
            cb('Failed to load ' + src);
        };
        script.setAttribute('type','text/javascript');
        script.setAttribute('src', FireUrl.addRandomQuery(src));
        console.time('load ' + src);
        document.head.appendChild(script);
        loadedScriptNodes.push(script);
    }

    function loadRuntime (url, fsPath, info, callback) {
        doLoad(url, function (err) {
            Sandbox.globalVarsChecker.restore(Fire.log, info, 'require');
            callback(err);
            if (! err) {
                loadSrcMap();
            }
        });
        function loadSrcMap () {
            console.time('load source map of ' + url);
            Editor._SourceMap.loadSrcMap(fsPath, url, function () {
                console.timeEnd('load source map of ' + url);
            });
        }
    }

    var loader = {

        loadBuiltin: function (callback) {
            loadRuntime(SRC_BUILTIN_URL, SRC_BUILTIN_PATH, 'loading builtin plugin runtime', callback);
        },

        loadProject: function (callback) {
            loadRuntime(SRC_PROJECT_URL, SRC_PROJECT_PATH, 'loading new scripts', callback);
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

    var builtinClassIds;
    var builtinClassNames;
    var builtinComponentMenus;
    var builtinCustomAssetMenus;

    var inited = false;

    function init () {
        inited = true;
        Sandbox.globalVarsChecker = new GlobalVarsChecker().record();
        Sandbox.nodeJsRequire = require;
        builtinClassIds = Fire.JS._registeredClassIds;
        builtinClassNames = Fire.JS._registeredClassNames;
        builtinComponentMenus = Fire._componentMenuItems.slice();
        builtinCustomAssetMenus = Fire._customAssetMenuItems.slice();
    }

    function purge () {
        Sandbox._purgeMemory();
        // reset menus
        Fire._componentMenuItems = builtinComponentMenus.slice();
        Fire._customAssetMenuItems = builtinCustomAssetMenus.slice();
        // Editor.MainMenu.reset();
        // remove user classes
        Fire.JS._registeredClassIds = builtinClassIds;
        Fire.JS._registeredClassNames = builtinClassNames;
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

    function reloadScripts (compileSucceeded, callback) {
        Sandbox.compiled = compileSucceeded;
        var scriptsLoaded = inited;
        if ( !inited ) {
            init();
        }

        // restore global variables（就算没 play 也可能会在 dev tools 里面添加全局变量）
        Sandbox.globalVarsChecker.restore(Fire.log, 'editing');
        if (scriptsLoaded) {
            // unload old
            var LoadSequence = [runtimeScriptLoader,
                                Editor._builtinPluginLoader,
                                Editor._globalPluginLoader,
                                Editor._projectPluginLoader];
            for (var j = LoadSequence.length - 1; j >= 0; j--) {
                LoadSequence[j].unloadAll();
                Sandbox.globalVarsChecker.restore(Fire.warn, 'unloading ' + LoadSequence[j].name);
            }
            // reset
            purge();
        }

        // 加载脚本和插件，这里的加载流程比较特殊，只好自己写。
        // （加载报错时，依赖项正常终止，但非依赖项必须正常执行。最后所有项目结束或报错才能回调。）

        var loadGlobalEditor;
        var loadProjectRuntime;

        Async.parallel([
            // load builtin runtime and editors
            function (cb) {
                // load builtin runtime
                runtimeScriptLoader.loadBuiltin(function (err) {
                    if (! err) {
                        loadBuiltinEditors();
                        loadGlobalEditor();
                        loadProjectRuntime();
                    }
                    else {
                        cb();
                    }
                });
                function loadBuiltinEditors () {
                    Editor._builtinPluginLoader.loadAll(function (err) {
                        Sandbox.globalVarsChecker.restore(Fire.warn, 'loading ' + Editor._builtinPluginLoader.name);
                        cb();
                    });
                }
            },
            // load global editors
            function (cb) {
                loadGlobalEditor = function () {
                    Editor._globalPluginLoader.loadAll(function (err) {
                        Sandbox.globalVarsChecker.restore(Fire.warn, 'loading ' + Editor._globalPluginLoader.name);
                        cb();
                    });
                };
            },
            // load project runtime and editors
            function (cb) {
                loadProjectRuntime = function () {
                    Async.series([
                        function (next) {
                            runtimeScriptLoader.loadProject(function (err) {
                                next(err);
                                if (! err) {
                                    Sandbox.reloadScene();
                                }
                            });
                        },
                        function (next) {
                            Editor._projectPluginLoader.loadAll(function (err) {
                                Sandbox.globalVarsChecker.restore(Fire.warn, 'loading ' + Editor._projectPluginLoader.name);
                                next();
                            });
                        },
                    ], cb);
                };
            },
        ], callback);
    }

    return reloadScripts;
})();

Editor._Sandbox = Sandbox;
