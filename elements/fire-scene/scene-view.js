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

        this.ipc = new Editor.IpcListener();

        this._editTool = null;
        this._editingEdityIds = [];
    },

    ready: function () {
        this.tabIndex = EditorUI.getParentTabIndex(this)+1;

        // init pixi grids
        this.pixiGrids = new Editor.PixiGrids();

        // init gizmos
        this.svgGizmos = new Editor.SvgGizmos( this.$.gizmos );
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
        if ( this.renderContext ) {
            var graphics = new PIXI.Graphics();
            this.renderContext.getBackgroundNode().addChild(graphics);
            this.pixiGrids.setGraphics(graphics);

            // make sure we apply the size to all canvas
            this.resize();
        }
    },

    initSceneCamera: function () {
        if ( !Fire.Engine._scene ) {
            Fire.error( "Failed to init camera, can not find current scene in Fire.Engine." );
            return;
        }

        var camera = null;
        var cameraEnt = Fire.Engine._scene.findEntityWithFlag('/Scene Camera', Fire._ObjectFlags.Hide | Fire._ObjectFlags.EditorOnly);

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
        this.pixiGrids.setCamera(camera);
        this.svgGizmos.setCamera(camera);

        //
        this.repaint();
    },

    resize: function () {
        if ( this.renderContext ) {
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
        if ( !this.renderContext || !this.renderContext.camera )
            return;

        this.renderContext.camera.size = this.view.height / this.sceneCamera.scale;
        this.renderContext.camera.transform.position =
            new Vec2 ( this.sceneCamera.position.x,
                       this.sceneCamera.position.y );
    },

    updateScene: function () {
        if ( !this.renderContext || !this.renderContext.camera )
            return;

        this.pixiGrids.update();
        Fire.Engine._scene.render(this.renderContext);
        this.interactionContext.update(Fire.Engine._scene.entities);
    },

    updateGizmos: function () {
        if ( !this.renderContext || !this.renderContext.camera )
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
            var comp = Editor.getInstanceById(compID);
            if ( !comp ) {
                return;     // 就算是enabled消息，由于是异步处理，也有可能已经销毁
            }
            if ( comp.entity._objFlags & Fire._ObjectFlags.HideInEditor ) {
                return;
            }

            var classname = Fire.JS.getClassName(comp);
            var gizmosDef = Editor.gizmos[classname];
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

    deleteSelection: function () {
        Editor.sendToMainWindow('engine:delete-entities', {
            'entity-id-list': Editor.Selection.entities
        });
    },

    hover: function ( entityID ) {
        var entity = Editor.getInstanceById(entityID);
        // NOTE: entity might be destroyed
        if ( entity ) {
            this.updateComponentGizmos( entity, {
                hovering: true
            });
        }
    },

    hoverout: function ( entityID ) {
        var entity = Editor.getInstanceById(entityID);
        // NOTE: entity might be destroyed
        if ( entity ) {
            this.updateComponentGizmos( entity, {
                hovering: false
            });
        }
    },

    select: function ( entityIds ) {
        if ( this._editTool ) {
            this.svgGizmos.remove(null, this._editTool);
            this._editTool = null;
        }

        this._editingEdityIds = this._editingEdityIds.concat(entityIds);

        if ( this._editingEdityIds.length > 0 ) {
            this.edit(this._editingEdityIds);
        }
    },

    unselect: function ( entityIds ) {
        for ( var i = 0; i < entityIds.length; ++i ) {
            var id = entityIds[i];

            for ( var j = 0; j < this._editingEdityIds.length; ++j ) {
                if ( this._editingEdityIds[j] === id ) {
                    this._editingEdityIds.splice(j,1);
                    break;
                }
            }

            var entity = Editor.getInstanceById(entityIds[i]);
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

    edit: function ( entityIds ) {
        var i, gizmo, entities = [], entity = null;
        for ( i = 0; i < entityIds.length; ++i ) {
            entity = Editor.getInstanceById(entityIds[i]);
            if (entity) {
                entities.push( entity );
            }
        }

        if ( entities.length <= 0 )
            return;

        switch ( Editor.mainWindow.settings.handle ) {
            case "move":
                gizmo = new Editor.PositionGizmo( this.svgGizmos, entities );
                break;

            case "rotate":
                gizmo = new Editor.RotationGizmo( this.svgGizmos, entities );
                break;

            case "scale":
                gizmo = new Editor.ScaleGizmo( this.svgGizmos, entities );
                break;
        }

        gizmo.hitTest = false;
        gizmo.pivot = Editor.mainWindow.settings.pivot;
        gizmo.coordinate = Editor.mainWindow.settings.coordinate;
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
        var worldRect = Fire.Rect.fromMinMax(v1,v2);

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
        if ( !this.renderContext || !this.renderContext.camera )
            return;

        //
        var hoverEntity = this.hitTest(event.offsetX, event.offsetY);
        Editor.Selection.hoverEntity(hoverEntity && hoverEntity.id);

        event.stopPropagation();
    },

    mousedownAction: function ( event ) {
        if ( !this.renderContext || !this.renderContext.camera )
            return;

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
            var toggleMode = false;
            var lastSelection = Editor.Selection.entities;
            if ( event.metaKey || event.ctrlKey ) {
                toggleMode = true;
            }

            //
            var selectmoveHandle = function(event) {
                var x = this._rectSelectStartX - this.view.left;
                var y = this._rectSelectStartY - this.view.top;
                var w = event.clientX - this._rectSelectStartX;
                var h = event.clientY - this._rectSelectStartY;

                var magSqr = w*w + h*h;
                if ( magSqr < 2.0 * 2.0 ) {
                    return;
                }

                if ( w < 0.0 ) {
                    x += w;
                    w = -w;
                }
                if ( h < 0.0 ) {
                    y += h;
                    h = -h;
                }

                this.svgGizmos.updateSelection( x, y, w, h);
                var i, ids;
                var entities = this.rectHitTest( new Fire.Rect( x, y, w, h ) );

                // toggle mode will always act added behaviour when we in rect-select-state
                if ( toggleMode ) {
                    ids = lastSelection.slice();

                    for ( i = 0; i < entities.length; ++i ) {
                        if ( ids.indexOf(entities[i].id) === -1 )
                            ids.push( entities[i].id );
                    }
                }
                else {
                    ids = [];

                    for ( i = 0; i < entities.length; ++i ) {
                        ids.push( entities[i].id );
                    }
                }
                Editor.Selection.selectEntity ( ids, true, false );

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
                    Editor.Selection.confirm ();
                }
                else {
                    var entity = this.hitTest( x, y );

                    if ( toggleMode ) {
                        if ( entity ) {
                            if ( lastSelection.indexOf(entity.id) === -1 ) {
                                Editor.Selection.selectEntity ( entity.id, false, true );
                            }
                            else {
                                Editor.Selection.unselectEntity ( entity.id, true );
                            }
                        }
                    }
                    else {
                        if ( entity ) {
                            Editor.Selection.selectEntity ( entity.id, true, true );
                        }
                        else {
                            Editor.Selection.clearEntity ();
                        }
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
        if ( !this.renderContext || !this.renderContext.camera )
            return;

        var scale = this.sceneCamera.scale;
        scale = Math.pow( 2, event.wheelDelta * 0.002) * scale;
        scale = Math.max( 0.01, Math.min( scale, 1000 ) );
        this.sceneCamera.scale = scale;

        this.repaint();

        event.stopPropagation();
    },

    mouseleaveAction: function ( event ) {
        if ( !this.renderContext || !this.renderContext.camera )
            return;

        Editor.Selection.hoverEntity(null);
        event.stopPropagation();
    },

    keydownAction: function (event) {
        if ( !this.renderContext || !this.renderContext.camera )
            return;

        switch ( event.which ) {
            // delete (Windows)
            case 46:
                this.deleteSelection();
                event.stopPropagation();
            break;

            // command + delete (Mac)
            case 8:
                if ( event.metaKey ) {
                    this.deleteSelection();
                }
                event.stopPropagation();
            break;
        }
    },

    gizmoshoverAction: function ( event ) {
        if ( !this.renderContext || !this.renderContext.camera )
            return;

        var entity = event.detail.entity;
        if ( entity )
            Editor.Selection.hoverEntity(entity.id);
        else
            Editor.Selection.hoverEntity(null);

        event.stopPropagation();
    },

    gizmosdirtyAction: function ( event ) {
        if ( !this.renderContext || !this.renderContext.camera )
            return;

        Editor.sendToMainWindow( 'gizmos:dirty' );
        this.repaint();
        event.stopPropagation();
    },

    dragoverAction: function ( event ) {
        if ( !this.renderContext || !this.renderContext.camera )
            return;

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
        if ( !this.renderContext || !this.renderContext.camera )
            return;

        var dragType = EditorUI.DragDrop.type(event.dataTransfer);

        if ( dragType !== 'asset' && dragType !== 'entity' )
            return;

        event.preventDefault();
        event.stopPropagation();

        Editor.Selection.cancel();

        var items = EditorUI.DragDrop.drop(event.dataTransfer);
        var clientRect = this.getBoundingClientRect();

        var onload = function ( err, asset ) {
            if ( asset && asset.createEntity ) {
                asset.createEntity( function ( ent ) {
                    var mousePos = new Fire.Vec2(event.clientX - clientRect.left, event.clientY - clientRect.top);
                    var worldMousePos = this.renderContext.camera.screenToWorld(mousePos);
                    ent.transform.worldPosition = worldMousePos;
                    Editor.Selection.selectEntity( ent.id, true, true );
                    Fire.AssetLibrary.cacheAsset( asset );
                    this.repaint();
                }.bind(this) );
            }
        }.bind(this);

        if ( items.length > 0 ) {
            if ( dragType === 'asset' ) {
                for ( var i = 0; i < items.length; ++i ) {
                    Fire.AssetLibrary.loadAssetInEditor( items[i], onload );
                }
            }
        }
    },
});
