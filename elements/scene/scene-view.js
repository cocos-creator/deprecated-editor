(function () {
    function _smooth (t) {
        return ( t === 1.0 ) ? 1.0 : 1.001 * ( 1.0 - Math.pow( 2, -10 * t ) );
    }

    Polymer({
        created: function () {
            this.renderContext = null;
            this.svgGrids = null;
            this.svgGizmos = null;
            this.view = { width: 0, height: 0 };
        },

        ready: function () {
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
            this.svgGizmos = SVG( this.$.gizmos );
        },

        init: function () {
            this.view = {
                width: this.clientWidth,
                height: this.clientHeight,
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
                }
            }

            // TEMP {
            var assetPath = 'assets://Foobar/004.png';
            var uuid = Fire.AssetDB.urlToUuid(assetPath);
            if ( uuid ) {
                Fire.AssetLibrary.loadAssetByUuid(uuid, function ( asset ) {
                    var ent = new Fire.Entity();
                    var renderer = ent.addComponent(Fire.SpriteRenderer);

                    var sprite = new Fire.Sprite();
                    sprite.texture = asset;
                    sprite.width = 400;
                    sprite.height = 300;
                    renderer.sprite = sprite;

                    ent.transform.position = { x: -200, y: -150 }; 
                });
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

            this.repaint();
        }, 

        resize: function () {
            if ( this.renderContext !== null ) {
                this.view = {
                    width: this.clientWidth,
                    height: this.clientHeight,
                };
                this.renderContext.size = new Fire.Vec2( this.view.width, this.view.height );
                this.svgGrids.size( this.view.width, this.view.height );

                this.repaint();
            }
        },

        repaint: function () {
            this.updateGrid();
            this.updateScene();
        },

        updateScene: function () {
            if ( this.renderContext ) {
                Fire.Engine._scene.render(this.renderContext);
            }
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

            var camera = {
                position: { 
                    x: this.renderContext.camera.transform.position.x, 
                    y: this.renderContext.camera.transform.position.y 
                },
                scale: this.renderContext.camera.size/this.view.height
            };

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
            var start_x = Math.ceil(start.x/curTickUnit) * curTickUnit;
            var end_x = start.x + this.view.width / camera.scale;
            var start_y = Math.ceil(start.y/curTickUnit) * curTickUnit;
            var end_y = start.y + this.view.height / camera.scale;

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

        mousedownAction: function ( event ) {

            if ( event.which === 1 ) {
                var mouseMoveHandle = function(event) {
                    var dx = event.clientX - lastClientX;
                    var dy = event.clientY - lastClientY;

                    lastClientX = event.clientX;
                    lastClientY = event.clientY;

                    var camera = this.renderContext.camera;
                    var scale = camera.size/this.view.height;

                    camera.transform.position = 
                        new Vec2 ( camera.transform.position.x - dx/scale,
                                   camera.transform.position.y - dy/scale );

                    event.stopPropagation();

                    this.repaint();
                }.bind(this);

                var mouseUpHandle = function(event) {
                    document.removeEventListener('mousemove', mouseMoveHandle);
                    document.removeEventListener('mouseup', mouseUpHandle);

                    EditorUI.removeDragGhost();
                    event.stopPropagation();
                }.bind(this);

                //
                lastClientX = event.clientX;
                lastClientY = event.clientY;

                EditorUI.addDragGhost("default");
                document.addEventListener ( 'mousemove', mouseMoveHandle );
                document.addEventListener ( 'mouseup', mouseUpHandle );

                event.stopPropagation();
            }
        },

        mousewheelAction: function ( event ) {
            var camera = this.renderContext.camera;
            var scale = camera.size/this.view.height;
            scale = Math.pow( 2, event.wheelDelta * 0.002) * scale;
            scale = Math.max( 0.01, Math.min( scale, 1000 ) );
            camera.size = scale * this.view.height;

            event.stopPropagation();

            this.repaint();
        },
    });
})();
