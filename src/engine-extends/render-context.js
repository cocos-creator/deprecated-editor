// editor functions for H5 PIXI RenderContext

var RenderContext = Fire._RenderContext;
var Engine = Fire.Engine;

RenderContext.createSceneRenderCtx = function (width, height, canvas, transparent) {
    var sceneCtx = new RenderContext (width, height, canvas, transparent);

    var foreground = new PIXI.DisplayObjectContainer();
    var gameRoot = new PIXI.DisplayObjectContainer();
    var background = new PIXI.DisplayObjectContainer();
    sceneCtx.stage.addChild(background);
    sceneCtx.stage.addChild(gameRoot);
    sceneCtx.stage.addChild(foreground);
    sceneCtx.root = gameRoot;
    sceneCtx.isSceneView = true;

    Engine._renderContext.sceneView = sceneCtx;
    return sceneCtx;
};

/**
 * @param {Fire.Renderer} renderer
 * @returns {PIXI.DisplayObject}
 */
RenderContext.prototype.getDisplayObject = function (renderer) {
    var isSceneView = this.sceneView;
    return isSceneView ? renderer._renderObjInScene : renderer._renderObj;
};

// save entity id in pixi obj
//var doAddSprite = RenderContext.prototype.addSprite;
//RenderContext.prototype.addSprite = function (target) {
//    doAddSprite.call(this, target);
//    if (target._renderObjInScene) {
//        // allow get entity from pixi object
//        target._renderObjInScene.entityId = target.entity.id;
//    }
//};

RenderContext.prototype.getForegroundNode = function () {
    return this.stage.children[this.stage.children.length - 1];
};

RenderContext.prototype.getBackgroundNode = function () {
    return this.stage.children[0];
};
