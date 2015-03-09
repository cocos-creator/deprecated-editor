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

        this._editTool = null;
        this._editingEdityIds = [];
    },

    ready: function () {
        this.tabIndex = EditorUI.getParentTabIndex(this)+1;

        // init pixi grids
        //this.pixiGrids = new Fire.PixiGrids();

        // init gizmos
        this.svgGizmos = new Fire.SvgGizmos( this.$.gizmos );
    },

    attached: function () {
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
            this.pixiGrids = new cc.Sprite();
            this.renderContext.getBackgroundNode().addChild(this.pixiGrids);

            //this.initSceneCamera();
            this.resize(); // make sure we apply the size to all canvas
        }
    },

    initSceneCamera: function () {
        if ( !Fire.Engine._scene )
            return;

        var camera = null;
        var cameraEnt = Fire.Engine._scene.findEntityWithFlag('/Scene Camera',
                                                           Fire._ObjectFlags.Hide | Fire._ObjectFlags.EditorOnly);
        // create editor camera
        if ( cameraEnt === null ) {
            // TODO: add this code to EditorUtils
            cameraEnt = new Fire.Entity.createWithFlags('Scene Camera',
                                Fire._ObjectFlags.Hide | Fire._ObjectFlags.EditorOnly);
            camera = cameraEnt.addComponent(Fire.Camera);
        }
        else {
            camera = cameraEnt.getComponent(Fire.Camera);
            if ( camera === null ) {
                Fire.error( "Can not find camera component in Scene Camera." );
                return;
            }
        }

        //
        camera.size = this.view.height;
        this.renderContext.camera = camera;
        this.svgGizmos.setCamera(camera);
        //this.pixiGrids.setCamera(camera);
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
            //this.renderContext.size = new Fire.Vec2( this.view.width, this.view.height );
            this.renderContext.view.setFrame(this.renderContext.game.container);
            this.renderContext.view.setDesignResolutionSize( this.view.width, this.view.height, cc.ResolutionPolicy.SHOW_ALL );
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
        return;

        if ( !Fire.Engine._scene )
            return;

        if ( !this.renderContext )
            return;

        this.renderContext.camera.size = this.view.height / this.sceneCamera.scale;
        this.renderContext.camera.transform.position =
            new Vec2 ( this.sceneCamera.position.x,
                       this.sceneCamera.position.y );
    },

    updateScene: function () {
        if ( !Fire.Engine._scene )
            return;

        if ( !this.renderContext )
            return;

        // this.pixiGrids.update();
        // Fire.Engine._scene.render(this.renderContext);
        // this.interactionContext.update(Fire.Engine._scene.entities);
    },

    updateGizmos: function () {
        if ( !Fire.Engine._scene )
            return;

        if ( !this.renderContext )
            return;

        this.svgGizmos.update();
    },

    rebuildGizmos: function () {
        if ( this._editingEdityIds.length > 0 ) {
            if ( this._editTool ) {
                this.svgGizmos.remove(null, this._editTool);
            }
            this.edit(this._editingEdityIds);
        }
    },

    updateComponent: function ( enabled, compID ) {
        var gizmo = null;

        if ( enabled ) {
            var comp = Fire._getInstanceById(compID);
            if ( !comp ) {
                return;     // 就算是enabled消息，由于是异步处理，也有可能已经销毁
            }
            if ( comp.entity._objFlags & Fire._ObjectFlags.HideInEditor ) {
                return;
            }

            var classname = Fire.JS.getClassName(comp);
            var gizmosDef = Fire.gizmos[classname];
            if ( gizmosDef ) {
                gizmo = new gizmosDef( this.svgGizmos, comp );
                gizmo.update();
                this.svgGizmos.add (compID, gizmo);
            }
        }
        else {
            gizmo = this.svgGizmos.gizmosTable[compID];
            if ( gizmo ) {
                this.svgGizmos.remove (compID, gizmo);
            }
        }
    },

    updateComponentGizmos: function ( entity, options ) {
        for (var c = 0; c < entity._components.length; ++c) {
            var component = entity._components[c];
            if ( component.isValid ) {
                var gizmo = this.svgGizmos.gizmosTable[component.id];
                if ( gizmo ) {
                    Fire.JS.mixin( gizmo, options );
                    gizmo.update();
                }
            }
        }
    },

    hover: function ( entityID ) {
        var entity = Fire._getInstanceById(entityID);
        // NOTE: entity might be destroyed
        if ( entity ) {
            this.updateComponentGizmos( entity, {
                hovering: true
            });
        }
    },

    hoverout: function ( entityID ) {
        var entity = Fire._getInstanceById(entityID);
        // NOTE: entity might be destroyed
        if ( entity ) {
            this.updateComponentGizmos( entity, {
                hovering: false
            });
        }
    },

    select: function ( entityIDs ) {
        if ( this._editTool ) {
            this.svgGizmos.remove(null, this._editTool);
            this._editTool = null;
        }

        this._editingEdityIds = this._editingEdityIds.concat(entityIDs);

        if ( this._editingEdityIds.length > 0 ) {
            this.edit(this._editingEdityIds);
        }
    },

    unselect: function ( entityIDs ) {
        for ( var i = 0; i < entityIDs.length; ++i ) {
            var id = entityIDs[i];

            for ( var j = 0; j < this._editingEdityIds.length; ++j ) {
                if ( this._editingEdityIds[j] === id ) {
                    this._editingEdityIds.splice(j,1);
                    break;
                }
            }

            var entity = Fire._getInstanceById(entityIDs[i]);
            // NOTE: entity might be destroyed
            if ( entity ) {
                this.updateComponentGizmos( entity, {
                    selecting: false,
                    editing: false,
                });
            }
        }

        if ( this._editTool ) {
            this.svgGizmos.remove(null, this._editTool);
            this._editTool = null;
        }

        if ( this._editingEdityIds.length > 0 ) {
            this.edit(this._editingEdityIds);
        }
    },

    edit: function ( entityIDs ) {
        var i, gizmo, entities = [], entity = null;
        for ( i = 0; i < entityIDs.length; ++i ) {
            entity = Fire._getInstanceById(entityIDs[i]);
            if (entity) {
                entities.push( entity );
            }
        }

        switch ( Fire.mainWindow.settings.handle ) {
            case "move":
                gizmo = new Fire.PositionGizmo( this.svgGizmos, entities );
                break;

            case "rotate":
                gizmo = new Fire.RotationGizmo( this.svgGizmos, entities );
                break;

            case "scale":
                gizmo = new Fire.ScaleGizmo( this.svgGizmos, entities );
                break;
        }

        gizmo.hitTest = false;
        gizmo.pivot = Fire.mainWindow.settings.pivot;
        gizmo.coordinate = Fire.mainWindow.settings.coordinate;
        gizmo.update();

        this._editTool = gizmo;
        this.svgGizmos.add( null, gizmo );

        //
        var c, component;
        if ( entities.length === 1 ) {
            entity = entities[0];
            for (c = 0; c < entity._components.length; ++c) {
                component = entity._components[c];
                if ( component.isValid ) {
                    gizmo = this.svgGizmos.gizmosTable[component.id];
                    if ( gizmo && (gizmo.selecting === false || gizmo.editing === false) ) {
                        gizmo.selecting = true;
                        gizmo.editing = true;
                        gizmo.update();
                    }
                }
            }
        }
        else {
            for ( i = 0; i < entities.length; ++i ) {
                entity = entities[i];
                for (c = 0; c < entity._components.length; ++c) {
                    component = entity._components[c];
                    if ( component.isValid ) {
                        gizmo = this.svgGizmos.gizmosTable[component.id];
                        if ( gizmo && (gizmo.selecting === false || gizmo.editing === true) ) {
                            gizmo.selecting = true;
                            gizmo.editing = false;
                            gizmo.update();
                        }
                    }
                }

            }
        }
    },

    hitTest: function ( x, y ) {
        if ( this.renderContext )
            return null;

        // check if we hit gizmos
        var gizmos = this.svgGizmos.hitTest ( x, y, 1, 1 );
        if ( gizmos.length > 0 ) {
            return gizmos[0].entity;
        }

        var mousePos = new Fire.Vec2(x,y);
        var worldMousePos = this.renderContext.camera.screenToWorld(mousePos);

        // pick the nearest one, ignore z

        var minDist = Number.MAX_VALUE;
        var resultEntity = null;

        for ( var i = 0, entities = this.interactionContext.entities; i < entities.length; ++i ) {
            var entity = entities[i];
            var aabb = this.interactionContext.getAABB(entity);
            if ( aabb.contains(worldMousePos) ) {
                var dist = worldMousePos.sub(aabb.center).magSqr();
                if ( dist < minDist ) {
                    var obb = this.interactionContext.getOBB(entity);
                    var polygon = new Fire.Polygon(obb);
                    if ( polygon.contains( worldMousePos ) ) {
                        minDist = dist;
                        resultEntity = entity;
                    }
                }
            }
        }

        return resultEntity;
    },

    rectHitTest: function ( rect ) {
        var v1 = this.renderContext.camera.screenToWorld(new Fire.Vec2(rect.x,rect.y));
        var v2 = this.renderContext.camera.screenToWorld(new Fire.Vec2(rect.xMax,rect.yMax));
        var worldRect = Fire.Rect.fromVec2(v1,v2);

        var result = [];
        var i, entities;

        for ( i = 0, entities = this.interactionContext.entities; i < entities.length; ++i ) {
            var entity = entities[i];
            var aabb = this.interactionContext.getAABB(entity);
            if ( aabb.intersects(worldRect) ) {
                var obb = this.interactionContext.getOBB(entity);
                var polygon = new Fire.Polygon(obb);
                if ( Fire.Intersection.rectPolygon(worldRect, polygon) ) {
                    result.push(entity);
                }
            }
        }

        // get hit test from gizmos
        var gizmos = this.svgGizmos.hitTest ( rect.x, rect.y, rect.width, rect.height );
        for ( i = 0; i < gizmos.length; ++i ) {
            result.push(gizmos[i].entity);
        }

        return result;
    },

    mousemoveAction: function ( event ) {
        //
        var hoverEntity = this.hitTest(event.offsetX, event.offsetY);
        Fire.Selection.hoverEntity(hoverEntity && hoverEntity.id);

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
                        ids.push( entities[i].id );
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
                        Fire.Selection.selectEntity ( entity.id, true );
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

    mouseleaveAction: function ( event ) {
        Fire.Selection.hoverEntity(null);
        event.stopPropagation();
    },

    gizmoshoverAction: function ( event ) {
        var entity = event.detail.entity;
        if ( entity )
            Fire.Selection.hoverEntity(entity.id);
        else
            Fire.Selection.hoverEntity(null);

        event.stopPropagation();
    },

    gizmosdirtyAction: function ( event ) {
        this.repaint();
        event.stopPropagation();
    },

    dragoverAction: function ( event ) {
        var dragType = EditorUI.DragDrop.type(event.dataTransfer);
        if ( dragType !== "asset" ) {
            EditorUI.DragDrop.allowDrop( event.dataTransfer, false );
            return;
        }

        EditorUI.DragDrop.allowDrop( event.dataTransfer, true );
        EditorUI.DragDrop.updateDropEffect(event.dataTransfer, "copy");

        event.preventDefault();
        event.stopPropagation();
    },

    dropAction: function ( event ) {
        var dragType = EditorUI.DragDrop.type(event.dataTransfer);

        if ( dragType !== 'asset' && dragType !== 'entity' )
            return;

        event.preventDefault();
        event.stopPropagation();

        Fire.Selection.cancel();

        var items = EditorUI.DragDrop.drop(event.dataTransfer);
        var clientRect = this.getBoundingClientRect();

        var onload = function ( err, asset ) {
            if ( asset && asset.createEntity ) {
                asset.createEntity( function ( ent ) {
                    var mousePos = new Fire.Vec2(event.clientX - clientRect.left, event.clientY - clientRect.top);
                    var worldMousePos = this.renderContext.camera.screenToWorld(mousePos);
                    ent.transform.worldPosition = worldMousePos;
                    Fire.Selection.selectEntity( ent.id, true, true );
                    Fire.AssetLibrary.cacheAsset( asset );
                    this.repaint();
                }.bind(this) );
            }
        }.bind(this);

        if ( items.length > 0 ) {
            if ( dragType === 'asset' ) {
                for ( var i = 0; i < items.length; ++i ) {
                    Fire.AssetLibrary.loadAsset( items[i], onload );
                }
            }
        }
    },
});
