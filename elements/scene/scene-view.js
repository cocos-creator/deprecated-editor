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

            this.ipc = new Fire.IpcListener();

            this._layoutTool = null;
            this._lasthover = null;
            this._editingEdities = [];
        },

        ready: function () {
            this.tabIndex = EditorUI.getParentTabIndex(this)+1;

            // init pixi grids
            this.pixiGrids = new Fire.PixiGrids();

            // init gizmos
            this.svgGizmos = new Fire.SvgGizmos( this.$.gizmos );

            this.ipc.on('component:enabled', this.updateComponent.bind(this,true) );
            this.ipc.on('component:disabled', this.updateComponent.bind(this,false) );
        },

        detached: function () {
            this.ipc.clear();
        },

        init: function () {
            var clientRect = this.getBoundingClientRect();
            this.view = {
                left: clientRect.left,
                top: clientRect.top,
                width: clientRect.width,
                height: clientRect.height,
            };

            // init interaction context
            this.interactionContext = Fire.Engine.createInteractionContext();

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
            var assetPath = 'assets://Foobar/004.png';
            var uuid = Fire.AssetDB.urlToUuid(assetPath);
            if ( uuid ) {
                Fire.AssetLibrary.loadAssetByUuid(uuid, function ( asset ) {
                    // var sprite;
                    // var ent = new Fire.Entity('Foobar');
                    // sprite = new Fire.Sprite();
                    // sprite.name = "Temp";
                    // sprite.texture = asset;
                    // sprite.x = 0;
                    // sprite.y = 0;
                    // sprite.width = 400;
                    // sprite.height = 300;
                    // ent.addComponent(Fire.SpriteRenderer).sprite = sprite;
                    // ent.transform.position = new Fire.Vec2(-200, 150);

                    // 
                    var camera = new Fire.Entity('camera');
                    camera.addComponent(Fire.Camera);

                    // sprites
                    for ( var x = -5; x < 5; ++x ) {
                        for ( var y = -5; y < 5; ++y ) {
                            var testEnt = new Fire.Entity('sprite ' + x + "," + y );
                            testEnt.transform.position = new Fire.Vec2( x * 400, y * 400 );
                            var sprite = new Fire.Sprite();
                            sprite.texture = asset;
                            sprite.x = 0;
                            sprite.y = 0;
                            sprite.width = 400;
                            sprite.height = 300;
                            testEnt.addComponent(Fire.SpriteRenderer).sprite = sprite;
                        }
                    }
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
                Fire.Engine._scene.updateInteractionContext(this.interactionContext);
            }
        },

        updateGizmos: function () {
            this.svgGizmos.update();
        },

        rebuildGizmos: function () {
            for ( var i = 0; i < this.svgGizmos.gizmos.length; ++i ) {
                var gizmo = this.svgGizmos.gizmos[i];
                if ( gizmo.entity && gizmo.type === "handle" ) {
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

        updateComponent: function ( enabled, id ) {
            if ( enabled ) {

                var comp = Fire._getInstanceById(id);
                if ( comp.entity._objFlags & Fire._ObjectFlags.SceneGizmo ) {
                    return;
                }

                var classname = Fire.getClassName(comp);
                var gizmos = Fire.gizmos[classname];
                if ( gizmos && gizmos.icon ) {
                    var tool = this.newIconTools( comp.entity, 
                                                  gizmos.icon.url, 
                                                  gizmos.icon.width, 
                                                  gizmos.icon.height );
                    this.svgGizmos.add (tool);
                }
            }
        },

        hover: function ( entity ) {
            this._lasthover = entity;
            this.svgGizmos.hover(entity);
        },

        hoverout: function () {
            this._lasthover = null;
            this.svgGizmos.hoverout();
        },

        select: function ( entities ) {
            if ( this._layoutTool ) {
                this.svgGizmos.remove(this._layoutTool);
                this._layoutTool = null;
            }

            this._editingEdities = entities;

            if ( entities.length > 0 ) {
                this._layoutTool = this.newLayoutTools(entities[0]);
                this.svgGizmos.add( this._layoutTool );
            }
        },

        unselect: function ( entities ) {
            for ( var i = 0; i < entities.length; ++i ) {
                var ent = entities[i];

                for ( var j = 0; j < this._editingEdities.length; ++j ) {
                    if ( this._editingEdities[j] === ent ) {
                        this._editingEdities.splice(j,1);
                        break;
                    }
                }
            }

            if ( this._layoutTool ) {
                this.svgGizmos.remove(this._layoutTool);
                this._layoutTool = null;
            }

            if ( this._editingEdities.length > 0 ) {
                this._layoutTool = this.newLayoutTools(this._editingEdities[0]);
                this.svgGizmos.add( this._layoutTool );
            }
        },

        newIconTools: function ( entity, url, w, h ) {
            var tool = this.svgGizmos.icon( url, w, h ); 
            tool.entity = entity;
            tool.type = "icon";
            tool.hitTest = true;

            return tool;
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
            tool.type = "handle";
            tool.hitTest = false;
            tool.handle = Fire.mainWindow.settings.handle;
            tool.pivot = Fire.mainWindow.settings.pivot;
            tool.coordinate = Fire.mainWindow.settings.coordinate;

            return tool;
        },

        hitTest: function ( x, y ) {
            if ( !this.renderContext )
                return null;

            // check if we hit gizmos
            var gizmos = this.svgGizmos.hitTest ( x, y, 1, 1 );
            if ( gizmos.length > 0 )
                return gizmos[0].entity;

            var mousePos = new Fire.Vec2(x,y); 
            var worldMousePos = this.renderContext.camera.screenToWorld(mousePos);

            var entities = []; 
            var i, c, bounding;

            for ( i = 0; i < this.interactionContext.boundings.length; ++i ) {
                bounding = this.interactionContext.boundings[i];
                if ( bounding.aabb.contains(worldMousePos) ) {
                    entities.push(bounding.entity);
                }
            }

            //
            var minDist = null;
            var resultEntity = null;
            for ( i = 0; i < entities.length; ++i ) {
                var entity = entities[i];
                for ( c = 0; c < entity._components.length; ++c ) {
                    var component = entity._components[c];

                    if ( component instanceof Fire.Renderer ) { 
                        var bounds = component.getWorldOrientedBounds();
                        var polygon = new Fire.Polygon(bounds);

                        //
                        if ( polygon.contains( worldMousePos ) ) {
                            var dist = worldMousePos.sub(polygon.center).magSqr();
                            if ( minDist === null || dist < minDist ) {
                                minDist = dist;
                                resultEntity = entity;
                            }
                        }

                        break;
                    }
                }
            }

            return resultEntity;
        },

        rectHitTest: function ( rect ) {
            var v1 = this.renderContext.camera.screenToWorld(new Fire.Vec2(rect.x,rect.y));
            var v2 = this.renderContext.camera.screenToWorld(new Fire.Vec2(rect.xMax,rect.yMax));
            var worldRect = Fire.Rect.fromVec2(v1,v2); 

            var entities = []; 
            var i, c, bounding;

            for ( i = 0; i < this.interactionContext.boundings.length; ++i ) {
                bounding = this.interactionContext.boundings[i];
                if ( bounding.aabb.intersects(worldRect) ) {
                    entities.push(bounding.entity);
                }
            }

            //
            for ( i = 0; i < entities.length; ++i ) {
                var entity = entities[i];
                for ( c = 0; c < entity._components.length; ++c ) {
                    var component = entity._components[c];

                    if ( component instanceof Fire.Renderer ) { 
                        var bounds = component.getWorldOrientedBounds();
                        var polygon = new Fire.Polygon(bounds);

                        //
                        if ( Fire.Intersection.rectPolygon(worldRect,polygon) === false ) {
                            entities.splice( i, 1 );
                            --i;
                        }

                        break;
                    }
                }
            }

            // get hit test from gizmos
            var gizmos = this.svgGizmos.hitTest ( rect.x, rect.y, rect.width, rect.height );
            for ( i = 0; i < gizmos.length; ++i ) {
                entities.push(gizmos[i].entity);
            }

            return entities;
        },

        mousemoveAction: function ( event ) {
            //
            var hoverEntity = this.hitTest(event.offsetX, event.offsetY);

            //
            if ( hoverEntity ) {
                if ( this._lasthover === null || this._lasthover !== hoverEntity ) {
                    Fire.Selection.hoverEntity(hoverEntity.hashKey);
                }
            }
            else {
                Fire.Selection.hoverEntity(null);
            }

            event.stopPropagation();
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

                    //
                    var entities = this.rectHitTest( new Fire.Rect( x, y, w, h ) );
                    if ( entities.length > 0 ) {
                        var ids = [];
                        for ( var i = 0; i < entities.length; ++i ) {
                            ids.push( entities[i].hashKey );
                        }
                        Fire.Selection.selectEntity ( ids, true, false );
                    }
                    else {
                        Fire.Selection.clearEntity ();
                    }

                    //
                    event.stopPropagation();
                }.bind(this);

                var selectexitHandle = function(event) {
                    document.removeEventListener('mousemove', selectmoveHandle);
                    document.removeEventListener('mouseup', selectexitHandle);

                    var x = this._rectSelectStartX - this.view.left; 
                    var y = this._rectSelectStartY - this.view.top; 
                    var w = event.clientX - this._rectSelectStartX;
                    var h = event.clientY - this._rectSelectStartY;

                    this.svgGizmos.fadeoutSelection();
                    EditorUI.removeDragGhost();
                    event.stopPropagation();

                    var magSqr = w*w + h*h;
                    if ( magSqr >= 2.0 * 2.0 ) {
                        Fire.Selection.confirm ();
                    }
                    else {
                        var entity = this.hitTest( x, y );
                        if ( entity ) {
                            Fire.Selection.selectEntity ( entity.hashKey, true );
                        }
                        else {
                            Fire.Selection.clearEntity ();
                        }
                    }
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

        hovergizmosAction: function ( event ) {
            var entity = event.detail.entity;
            if ( entity )
                Fire.Selection.hoverEntity(entity.hashKey);
            else
                Fire.Selection.hoverEntity(null);

            event.stopPropagation();
        },
    });
})();
