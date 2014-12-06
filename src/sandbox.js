var Sandbox = (function () {

    var stashedScene = null;

    function cloneScene (scene) {
        return Fire.instantiate(scene);
    }

    function purgeMemory () {
        Fire.FObject._deferredDestroy();    // 预先释放一批对象，方便 GC
    }

    function launchScene (scene) {
        Fire.Engine._setCurrentScene(scene);
    }

    var Sandbox = function () {};

    // 保存当前场景，然后启动新场景。
    Sandbox.launchScene = function () {
        purgeMemory();
        // backup scene
        stashedScene = cloneScene(Fire.Engine._scene);
        // clone current scene
        var shadowScene = cloneScene(Fire.Engine._scene);
        // switch scene
        launchScene(shadowScene);
    };

    // 销毁当前场景，将之前保存的场景还原
    Sandbox.rewindScene = function () {
        purgeMemory();
        launchScene(stashedScene);
        stashedScene = null;
    };

    return Sandbox;
})();
