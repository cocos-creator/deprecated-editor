(function () {
    Polymer({
        created: function () {
            this.renderContext = null;
            this.pixiGrids = null;
            this.svgGizmos = null;
            this.view = { width: 0, height: 0 };
            this.sceneCamera = {
                position: { 
                    x: 0.0,
                    y: 0.0,
                },
                scale: 1.0,
            };

            this._layoutTool = null;
        },

        ready: function () {
            this.tabIndex = EditorUI.getParentTabIndex(this)+1;

            // init pixi grids
            this.pixiGrids = new Fire.PixiGrids();

            // init gizmos
            this.svgGizmos = new Fire.SvgGizmos( this.$.gizmos );
        },

        init: function () {
            var clientRect = this.getBoundingClientRect();
            this.view = {
                left: clientRect.left,
                top: clientRect.top,
                width: clientRect.width,
                height: clientRect.height,
            };

            // init render context
            this.renderContext = Fire.Engine.createSceneView( this.view.width,
                                                              this.view.height,
                                                              this.$.canvas );
            if ( this.renderContext !== null ) {
                // create editor camera
                if ( this.renderContext.camera === null ) {
                    // TODO: add this code to EditorUtils
                    var cameraEnt = new Fire.Entity.createWithFlags('Scene Camera', 
                                        Fire._ObjectFlags.SceneGizmo | Fire._ObjectFlags.EditorOnly);
                    var camera = cameraEnt.addComponent(Fire.Camera);
                    camera.size = this.view.height;
                    this.renderContext.camera = camera;
                    this.svgGizmos.setCamera(camera);

                    var graphics = new PIXI.Graphics();
                    this.renderContext.getBackgroundNode().addChild(graphics);
                    this.pixiGrids.setGraphics(graphics);
                    this.pixiGrids.setCamera(camera);
                }
            }

            this.resize(); // make sure we apply the size to all canvas

            // TEMP {
            var assetPath = 'assets://white-sheep/ip3_a_sheep_down_loop01.png';
            var uuid = Fire.AssetDB.urlToUuid(assetPath);
            if ( uuid ) {
                Fire.AssetLibrary.loadAssetByUuid(uuid, function ( asset ) {
                    var sprite;
                    var ent = new Fire.Entity('Foobar');
                    sprite = new Fire.Sprite();
                    sprite.name = "Temp";
                    sprite.texture = asset;
                    sprite.x = 0;
                    sprite.y = 0;
                    sprite.width = 400;
                    sprite.height = 300;
                    ent.addComponent(Fire.SpriteRenderer).sprite = sprite;
                    ent.transform.position = new Fire.Vec2(-200, 150);

                    // global variable： pivot
                    pivot = new Fire.Entity('pivot');
                    sprite = new Fire.Sprite();
                    sprite.texture = asset;
                    sprite.x = 20;
                    sprite.y = 40;
                    sprite.width = 200;
                    sprite.height = 150;
                    pivot.addComponent(Fire.SpriteRenderer).sprite = sprite;
                    pivot.addComponent(Fire.Camera);

                    // global variable： wei
                    wei = new Fire.Entity('喂~~ 你还好吗？');
                    wei.transform.scale = new Fire.Vec2(3, 1);
                    wei.transform.rotation = -90;
                    wei.transform.position = new Fire.Vec2(-100, -30);

                    // global variable: hao
                    hao = new Fire.Entity('很~好~啊~~');
                    hao.transform.parent = wei.transform;
                    sprite = new Fire.Sprite();
                    sprite.texture = asset;
                    sprite.x = 20;
                    sprite.y = 40;
                    sprite.width = 40;
                    sprite.height = 10;
                    hao.addComponent(Fire.SpriteRenderer).sprite = sprite;
                    // local bounds: (-8, -9, 20, 40)
                    // world bounds: (-109, -66, 40, 60)
                    hao.transform.scale = new Fire.Vec2(1, 2);
                    hao.transform.rotation = -90;
                    hao.transform.position = new Fire.Vec2(12, 31);
                }.bind(this) );
            }
            else {
                Fire.error('Failed to load ' + assetPath);
            }
            // } TEMP
        }, 

        resize: function () {
            if ( this.renderContext !== null ) {
                var clientRect = this.getBoundingClientRect();
                this.view = {
                    left: clientRect.left,
                    top: clientRect.top,
                    width: clientRect.width,
                    height: clientRect.height,
                };
                this.renderContext.size = new Fire.Vec2( this.view.width, this.view.height );
                this.pixiGrids.resize( this.view.width, this.view.height );
                this.svgGizmos.resize( this.view.width, this.view.height );

                this.repaint();
            }
        },

        repaint: function () {
            this.updateCamera();
            this.updateScene();
            this.updateGizmos();
        },

        updateCamera: function () {
            if ( this.renderContext ) {
                this.renderContext.camera.size = this.sceneCamera.scale * this.view.height; 
                this.renderContext.camera.transform.position = 
                    new Vec2 ( this.sceneCamera.position.x, 
                               this.sceneCamera.position.y );
            }
        },

        updateScene: function () {
            if ( this.renderContext ) {
                this.pixiGrids.update();
                Fire.Engine._scene.render(this.renderContext);
            }
        },

        updateGizmos: function () {
            this.svgGizmos.update();
        },

        rebuildGizmos: function () {
            for ( var i = 0; i < this.svgGizmos.gizmos.length; ++i ) {
                var gizmo = this.svgGizmos.gizmos[i];
                if ( gizmo.entity ) {
                    var newGizmo = this.newLayoutTools(gizmo.entity);
                    this.svgGizmos.gizmos[i] = newGizmo;

                    if ( this._layoutTool === gizmo ) {
                        this._layoutTool = newGizmo;
                    }
                    gizmo.remove();
                }
            }
            this.updateGizmos();
        },

        hover: function ( entity ) {
            this.svgGizmos.hover(entity);
        },

        hoverout: function () {
            this.svgGizmos.hoverout();
        },

        select: function ( entity ) {
            if ( this._layoutTool ) {
                this.svgGizmos.remove(this._layoutTool);
                this._layoutTool = null;
            }

            this._layoutTool = this.newLayoutTools(entity);
            this.svgGizmos.add( this._layoutTool );
        },

        newLayoutTools: function ( entity ) {
            var sceneView = this;
            var tool;

            var localToWorld = entity.transform.getLocalToWorldMatrix();
            var worldpos = new Fire.Vec2(localToWorld.tx, localToWorld.ty);
            var screenpos = this.renderContext.camera.worldToScreen(worldpos);
            screenpos.x = Math.floor(screenpos.x) + 0.5;
            screenpos.y = Math.floor(screenpos.y) + 0.5;
            var rotation = Math.rad2deg(-localToWorld.getRotation());

            switch ( Fire.mainWindow.settings.handle ) {
                case "move":
                    tool = this.svgGizmos.positionTool ( screenpos, rotation, {
                        start: function () {
                            worldpos = this.entity.transform.worldPosition;
                        },

                        update: function ( dx, dy ) {
                            var delta = new Fire.Vec2( dx/sceneView.sceneCamera.scale, 
                                                      -dy/sceneView.sceneCamera.scale );
                            this.entity.transform.worldPosition = worldpos.add(delta);
                            sceneView.repaint();
                        }, 
                    } ); 
                    break;

                case "rotate":
                    var worldrot;
                    tool = this.svgGizmos.rotationTool ( screenpos, rotation, {
                        start: function () {
                            worldrot = this.entity.transform.worldRotation;
                        },

                        update: function ( delta ) {
                            var rot = Math.deg180(worldrot + delta);
                            rot = Math.floor(rot);
                            this.entity.transform.worldRotation = rot;
                            sceneView.repaint();
                        }, 
                    } ); 
                    break;

                case "scale":
                    var localscale = entity.transform.scale;
                    tool = this.svgGizmos.scaleTool ( screenpos, rotation, {
                        start: function () {
                            localscale = this.entity.transform.scale;
                        },

                        update: function ( dx, dy ) {
                            this.entity.transform.scale = new Fire.Vec2 ( 
                                localscale.x * (1.0 + dx),
                                localscale.y * (1.0 - dy)
                            ); 
                            sceneView.repaint();
                        }, 
                    } ); 
                    break;
            }

            tool.entity = entity;
            tool.handle = Fire.mainWindow.settings.handle;
            tool.pivot = Fire.mainWindow.settings.pivot;
            tool.coordinate = Fire.mainWindow.settings.coordinate;

            return tool;
        },

        mousedownAction: function ( event ) {
            // process camera panning
            if ( event.which === 1 && event.shiftKey ) {
                var mousemoveHandle = function(event) {
                    var dx = event.clientX - this._lastClientX;
                    var dy = event.clientY - this._lastClientY;

                    this.sceneCamera.position.x = this.sceneCamera.position.x - dx/this.sceneCamera.scale;
                    this.sceneCamera.position.y = this.sceneCamera.position.y + dy/this.sceneCamera.scale;

                    this._lastClientX = event.clientX;
                    this._lastClientY = event.clientY;

                    this.repaint();

                    event.stopPropagation();
                }.bind(this);

                var mouseupHandle = function(event) {
                    document.removeEventListener('mousemove', mousemoveHandle);
                    document.removeEventListener('mouseup', mouseupHandle);
                    document.removeEventListener('keyup', keyupHandle);

                    EditorUI.removeDragGhost();
                    event.stopPropagation();
                }.bind(this);

                var keyupHandle = function(event) {
                    // shift key
                    if ( event.keyCode === 16 ) {
                        document.removeEventListener('mousemove', mousemoveHandle);
                        document.removeEventListener('mouseup', mouseupHandle);
                        document.removeEventListener('keyup', keyupHandle);

                        EditorUI.removeDragGhost();
                        event.stopPropagation();
                    }
                }.bind(this);

                //
                this._lastClientX = event.clientX;
                this._lastClientY = event.clientY;
                EditorUI.addDragGhost("cell");
                document.addEventListener ( 'mousemove', mousemoveHandle );
                document.addEventListener ( 'mouseup', mouseupHandle );
                document.addEventListener ( 'keyup', keyupHandle );

                event.stopPropagation();
                return;
            }

            // process rect-selection
            if ( event.which === 1 ) {
                var selectmoveHandle = function(event) {
                    // this._rectSelectStartX;
                    // this._rectSelectStartY;
                    var x = this._rectSelectStartX - this.view.left; 
                    var y = this._rectSelectStartY - this.view.top; 
                    var w = event.clientX - this._rectSelectStartX;
                    var h = event.clientY - this._rectSelectStartY;
                    if ( w < 0.0 ) {
                        x += w;
                        w = -w;
                    }
                    if ( h < 0.0 ) {
                        y += h;
                        h = -h;
                    }
                    this.svgGizmos.updateSelection( x, y, w, h);

                    event.stopPropagation();
                }.bind(this);

                var selectexitHandle = function(event) {
                    document.removeEventListener('mousemove', selectmoveHandle);
                    document.removeEventListener('mouseup', selectexitHandle);

                    this.svgGizmos.fadeoutSelection();
                    EditorUI.removeDragGhost();
                    event.stopPropagation();
                }.bind(this);

                //
                this._rectSelectStartX = event.clientX;
                this._rectSelectStartY = event.clientY;
                EditorUI.addDragGhost("default");
                document.addEventListener ( 'mousemove', selectmoveHandle );
                document.addEventListener ( 'mouseup', selectexitHandle );

                event.stopPropagation();
                return;
            }
        },

        mousewheelAction: function ( event ) {
            var scale = this.sceneCamera.scale;
            scale = Math.pow( 2, event.wheelDelta * 0.002) * scale;
            scale = Math.max( 0.01, Math.min( scale, 1000 ) );
            this.sceneCamera.scale = scale;

            this.repaint();

            event.stopPropagation();
        },
    });
})();
