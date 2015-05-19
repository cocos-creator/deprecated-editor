var Engine = Fire.Engine;

Engine._editorAnimating = false;

Engine.createSceneView = function (width, height, canvas) {
    return Fire._Runtime.RenderContext.createSceneRenderCtx (width, height, canvas, true);
};

Engine.createInteractionContext = function () {
    return new Fire._InteractionContext();
};

var maxDeltaTimeInEditMode = 0.03;

Engine.tickInEditMode = function (renderContext) {
    var runtime = Fire._Runtime;
    if (runtime.tickInEditMode) {
        runtime.tickInEditMode(renderContext);
    }
    else {
        if (! Engine._isPlaying && renderContext && renderContext.isSceneView) {
            var now = Fire._Ticker.now();
            Fire.Time._update(now, false, maxDeltaTimeInEditMode);
            if (Engine._editorAnimating) {
                runtime.animate();
            }
        }
        runtime.render(renderContext);
    }
};
