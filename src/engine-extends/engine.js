var Engine = Fire.Engine;

Engine.createSceneView = function (width, height, canvas) {
    return Fire._Runtime.RenderContext.createSceneRenderCtx (width, height, canvas, true);
};

Engine.createInteractionContext = function () {
    return new Fire._InteractionContext();
};
