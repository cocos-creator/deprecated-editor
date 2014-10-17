(function () {
    function _smooth (t) {
        return ( t === 1.0 ) ? 1.0 : 1.001 * ( 1.0 - Math.pow( 2, -10 * t ) );
    }

    Polymer({
        created: function () {
            this.renderContext = null;
            this.svgGrids = null;
            this.gizmosMng = null;
            this.view = { width: 0, height: 0 };
            this.sceneCamera = {
                position: { 
                    x: 0.0,
                    y: 0.0,
                },
                scale: 1.0,
            };
        },

        ready: function () {
            this.tabIndex = EditorUI.getParentTabIndex(this)+1;

            // init svg grids
            this.svgGrids = SVG( this.$.grids );

            var xaxis = this.svgGrids.group();
            xaxis.addClass("x-axis");
            this.svgGrids.xaxis = xaxis;

            var yaxis = this.svgGrids.group();
            yaxis.addClass("y-axis");
            this.svgGrids.yaxis = yaxis;

            this.svgGrids.xlines = [];
            this.svgGrids.ylines = [];

            // init gizmos
            this.gizmosMng = new Fire.GizmosMng( this.$.gizmos );
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
                    this.gizmosMng.camera = camera;
                }
            }

            // TEMP {
            var assetPath = 'assets://Foobar/004.png';
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

                    var pivot = new Fire.Entity('老子在原点');
                    sprite = new Fire.Sprite();
                    sprite.texture = asset;
                    sprite.x = 20;
                    sprite.y = 40;
                    sprite.width = 200;
                    sprite.height = 150;
                    pivot.addComponent(Fire.SpriteRenderer).sprite = sprite;
                    //pivot.addComponent(Fire.Camera);

                    // global variable： wei
                    wei = new Fire.Entity('喂~~ 你还好吗？');
                    wei.transform.scale = new Fire.Vec2(3, 1);
                    wei.transform.rotation = 90;
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
                    hao.transform.rotation = 90;
                    hao.transform.position = new Fire.Vec2(12, 31);
                }.bind(this) );
            }
            else {
                Fire.error('Failed to load ' + assetPath);
            }
            // // create a new graphics object
            // var graphics = new PIXI.Graphics();
            // // begin a green fill..
            // graphics.beginFill(0x00aaff, 0.5);
            // graphics.lineStyle(1, 0x00aaff);
            // // draw a rectangle
            // graphics.drawRect(0, 0, 400, 400);
            // // end the fill
            // graphics.endFill();
            // // add it the stage so we see it on our screens..
            // this.renderContext.stage.addChild(graphics);
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
                this.svgGrids.size( this.view.width, this.view.height );
                this.gizmosMng.resize( this.view.width, this.view.height );

                this.repaint();
            }
        },

        repaint: function () {
            this.updateCamera();
            this.updateGrid();
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
                Fire.Engine._scene.render(this.renderContext);
            }
        },

        updateGizmos: function () {
            this.gizmosMng.update();
        },

        updateGrid: function () {
            var i = 0;
            var cur_idx = 0;
            var line = null; 
            var xlines = this.svgGrids.xlines;
            var ylines = this.svgGrids.ylines;
            var xaxis = this.svgGrids.xaxis;
            var yaxis = this.svgGrids.yaxis;

            // var center = this.renderContext.camera.worldToScreen( 0.0, 0.0 );
            // origin.center( center.x, center.y ); 

            var tickUnit = 100;
            var tickCount = 10;
            var tickDistance = 50;

            var nextTickCount = 1;
            var curTickUnit = tickUnit;
            var ratio = 1.0;
            var trans;
            var camera = this.sceneCamera;

            if ( camera.scale >= 1.0 ) {
                while ( tickDistance*nextTickCount < tickUnit*camera.scale ) {
                    nextTickCount = nextTickCount * tickCount;
                }
                curTickUnit = tickUnit/nextTickCount * tickCount;
                ratio = (tickUnit*camera.scale) / (tickDistance*nextTickCount);
            }
            else if ( camera.scale < 1.0 ) {
                while ( tickDistance/nextTickCount > tickUnit*camera.scale ) {
                    nextTickCount = nextTickCount * tickCount;
                }
                curTickUnit = tickUnit*nextTickCount;
                ratio = (tickUnit*camera.scale) / (tickDistance/nextTickCount);
                ratio /= 10.0;
            }
            ratio = (ratio - 1.0/tickCount) / (1.0 - 1.0/tickCount);

            var start = this.renderContext.camera.screenToWorld ( new Fire.Vec2(0, 0) );
            var end = this.renderContext.camera.screenToWorld ( new Fire.Vec2(this.view.width, this.view.height) );

            var start_x = Math.ceil(start.x/curTickUnit) * curTickUnit;
            var end_x = end.x;
            var start_y = Math.ceil(end.y/curTickUnit) * curTickUnit;
            var end_y = start.y;

            // draw x lines
            var tickIndex = Math.round(start_x/curTickUnit);
            for ( var x = start_x; x < end_x; x += curTickUnit ) {
                if ( cur_idx < xlines.length ) {
                    line = xlines[cur_idx];
                }
                else {
                    line = this.svgGrids.line( 0, 0, 0, this.view.height );
                    xlines.push(line);
                    xaxis.add(line);
                }
                ++cur_idx;

                if ( tickIndex % tickCount === 0 ) {
                    line.opacity(1.0);
                }
                else {
                    line.opacity(_smooth(ratio));
                }
                ++tickIndex;

                trans = this.renderContext.camera.worldToScreen( new Fire.Vec2(x, 0.0) );
                trans.y = 0.0;
                line.plot( 0, 0, 0, this.view.height ).stroke("#555").transform(trans);
            }
            // remove unused x lines
            for ( i = cur_idx; i < xlines.length; ++i ) {
                xlines[i].remove();
            }
            xlines.splice(cur_idx);

            // draw y lines
            cur_idx = 0;
            tickIndex = Math.round(start_y/curTickUnit);
            for ( var y = start_y; y < end_y; y += curTickUnit ) {
                if ( cur_idx < ylines.length ) {
                    line = ylines[cur_idx];
                }
                else {
                    line = this.svgGrids.line( 0, 0, this.view.width, 0 );
                    ylines.push(line);
                    yaxis.add(line);
                }
                ++cur_idx;

                if ( tickIndex % tickCount === 0 ) {
                    line.opacity(1.0);
                }
                else {
                    line.opacity(_smooth(ratio));
                }
                ++tickIndex;

                trans = this.renderContext.camera.worldToScreen( new Fire.Vec2(0.0, y) );
                trans.x = 0.0;
                line.plot( 0, 0, this.view.width, 0 ).stroke("#555").transform(trans);
            }
            // remove unused y lines
            for ( i = cur_idx; i < ylines.length; ++i ) {
                ylines[i].remove();
            }
            ylines.splice(cur_idx);
        },

        hover: function ( entity ) {
            this.gizmosMng.hover(entity);
        },

        hoverout: function () {
            this.gizmosMng.hoverout();
        },

        select: function ( entity ) {
            this.gizmosMng.select(entity);
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
                    this.gizmosMng.updateSelection( x, y, w, h);

                    event.stopPropagation();
                }.bind(this);

                var selectexitHandle = function(event) {
                    document.removeEventListener('mousemove', selectmoveHandle);
                    document.removeEventListener('mouseup', selectexitHandle);

                    this.gizmosMng.fadeoutSelection();
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
