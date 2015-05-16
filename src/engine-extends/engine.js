var Engine = Fire.Engine;

Engine._editorAnimating = false;

Engine.createSceneView = function (width, height, canvas) {
    return Fire._Runtime.RenderContext.createSceneRenderCtx (width, height, canvas, true);
};

Engine.createInteractionContext = function () {
    return new Fire._InteractionContext();
};

var animateOneMoreTick = false;

Engine.tickInEditMode = function (renderContext) {
    var now = Fire._Ticker.now();
    Fire.Time._update(now);

    var animate = false;
    if (!Engine._isPlaying) {
        if (renderContext && renderContext.isSceneView) {
            if (Engine._editorAnimating) {
                animate = true;
                animateOneMoreTick = true;
            }
            else if (animateOneMoreTick) {
                animate = true;
                animateOneMoreTick = false;
            }
        }
    }
    else {
        animateOneMoreTick = false;
    }
    if (animate) {
        //Time.deltaTime = Time.deltaTime || (1 / 60);
        Fire._Runtime.animate();
    }

    Fire._Runtime.render(renderContext);
};
