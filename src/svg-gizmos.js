Fire.SvgGizmos = (function () {
    function _snapPixel (p) {
        return Math.floor(p) + 0.5; 
    }

    function _updateGizmo ( gizmo, camera ) {
        if ( gizmo.entity ) {
            var localToWorld = gizmo.entity.transform.getLocalToWorldMatrix();
            var worldpos = new Fire.Vec2(localToWorld.tx, localToWorld.ty);
            var screenpos = camera.worldToScreen(worldpos);
            screenpos.x = _snapPixel(screenpos.x);
            screenpos.y = _snapPixel(screenpos.y);
            gizmo.position = screenpos;

            gizmo.rotation = 0.0; 
            if ( gizmo.handle === "move" && gizmo.coordinate === "global" ) {
                gizmo.rotation = 0.0;
            }
            else {
                var worldrot = gizmo.entity.transform.worldRotation;
                gizmo.rotation = -worldrot;
            }
        }

        gizmo.translate( gizmo.position.x, gizmo.position.y ) 
             .rotate( gizmo.rotation, gizmo.position.x, gizmo.position.y )
             ;
    }

    function _addMoveHandles ( gizmo, callbacks ) {
        var pressx, pressy;

        //
        var mousemoveHandle = function(event) {
            var dx = event.clientX - pressx;
            var dy = event.clientY - pressy;

            if ( callbacks.update ) {
                callbacks.update.call( gizmo, dx, dy );
            }

            event.stopPropagation();
        }.bind(gizmo);

        var mouseupHandle = function(event) {
            document.removeEventListener('mousemove', mousemoveHandle);
            document.removeEventListener('mouseup', mouseupHandle);
            EditorUI.removeDragGhost();

            if ( callbacks.end ) {
                callbacks.end.call( gizmo );
            }

            event.stopPropagation();
        }.bind(gizmo);

        gizmo.on( 'mousedown', function ( event ) {
            if ( event.which === 1 ) {
                pressx = event.clientX;
                pressy = event.clientY;

                EditorUI.addDragGhost("default");
                document.addEventListener ( 'mousemove', mousemoveHandle );
                document.addEventListener ( 'mouseup', mouseupHandle );

                if ( callbacks.start ) {
                    callbacks.start.call ( gizmo, event.offsetX, event.offsetY );
                }
            }
            event.stopPropagation();
        } );
    } 

    function SvgGizmos ( svgEL ) {
        this.svg = SVG(svgEL);
        this.hoverRect = this.svg.polygon();
        this.hoverRect.hide();
        this.gizmos = [];
    }

    SvgGizmos.prototype.setCamera = function ( camera ) {
        this.camera = camera;
    };

    SvgGizmos.prototype.resize = function ( width, height ) {
        this.svg.size( width, height );
    };

    SvgGizmos.prototype.update = function () {
        for ( var i = 0; i < this.gizmos.length; ++i ) {
            var gizmo = this.gizmos[i];
            _updateGizmo( gizmo, this.camera );
        }
    };

    SvgGizmos.prototype.updateSelection = function ( x, y, w, h ) {
        if ( !this.selectRect ) {
            this.selectRect = this.svg.rect();
        }

        this.selectRect.move( _snapPixel(x), _snapPixel(y) ) 
                       .size( w, h )
                       .fill( { color: "#09f", opacity: 0.4 } )
                       .stroke( { width: 1, color: "#09f", opacity: 1.0 } )
                       ;
    };

    SvgGizmos.prototype.fadeoutSelection = function () {
        if ( !this.selectRect ) {
            return;
        }

        this.selectRect.animate( 100, '-' ).opacity(0.0)
        .after( function () {
            this.remove();
        }.bind(this.selectRect) );
        this.selectRect = null;
    };

    SvgGizmos.prototype.hover = function ( entity ) {
        var renderer = entity.getComponent( Fire.Renderer );
        if ( renderer ) {
            var bounds = renderer.getWorldOrientedBounds();
            var v1  = this.camera.worldToScreen(bounds[0]);
            var v2  = this.camera.worldToScreen(bounds[1]);
            var v3  = this.camera.worldToScreen(bounds[2]);
            var v4  = this.camera.worldToScreen(bounds[3]);

            this.hoverRect.show();
            this.hoverRect.plot([
                [_snapPixel(v1.x), _snapPixel(v1.y)],
                [_snapPixel(v2.x), _snapPixel(v2.y)],
                [_snapPixel(v3.x), _snapPixel(v3.y)],
                [_snapPixel(v4.x), _snapPixel(v4.y)],
            ])
            .fill( "none" )
            .stroke( { color: "#999", width: 1 } )
            ;
        }
        else {
            this.hoverout();
        }
    };

    SvgGizmos.prototype.hoverout = function () {
        this.hoverRect.hide();
    };

    SvgGizmos.prototype.add = function ( gizmo ) {
        _updateGizmo( gizmo, this.camera );
        this.gizmos.push(gizmo);
    };

    SvgGizmos.prototype.remove = function ( gizmo ) {
        for ( var i = this.gizmos.length-1; i >= 0; --i ) {
            var g = this.gizmos[i];
            if ( g === gizmo ) {
                g.remove();
                this.gizmos.splice( i, 1 );
                break;
            }
        }
    };

    SvgGizmos.prototype.scaleSlider = function ( size, color, callbacks ) {
        var group = this.svg.group();
        var line = group.line( 0, 0, size, 0 )
                        .stroke( { width: 1, color: color } )
                        ;
        var rect = group.polygon ([ [size, 5], [size, -5], [size+10, -5], [size+10, 5] ])
                        .fill( { color: color } )
                        ;
        var dragging = false;

        group.style( 'pointer-events', 'bounding-box' );

        group.resize = function ( size ) {
            line.plot( 0, 0, size, 0 );
            rect.plot([ [size, 5], [size, -5], [size+10, -5], [size+10, 5] ]);
        };

        group.on( 'mouseover', function ( event ) {
            var lightColor = chroma(color).brighter().hex();
            line.stroke( { color: lightColor } );
            rect.fill( { color: lightColor } );

            event.stopPropagation();
        } );

        group.on( 'mouseout', function ( event ) {
            if ( !dragging ) {
                line.stroke( { color: color } );
                rect.fill( { color: color } );
            }

            event.stopPropagation();
        } );

        _addMoveHandles( group, {
            start: function () {
                dragging = true;
                line.stroke( { color: "#ff0" } );
                rect.fill( { color: "#ff0" } );

                if ( callbacks.start )
                    callbacks.start ();
            },

            update: function ( dx, dy ) {
                if ( callbacks.update )
                    callbacks.update ( dx, dy );
            },

            end: function () {
                dragging = false;
                line.stroke( { color: color } );
                rect.fill( { color: color } );

                if ( callbacks.end )
                    callbacks.end ();
            }
        }  );

        return group;
    };

    SvgGizmos.prototype.arrowTool = function ( size, color, callbacks ) {
        var group = this.svg.group();
        var line = group.line( 0, 0, size, 0 )
                        .stroke( { width: 1, color: color } )
                        ;
        var arrow = group.polygon ([ [size, 5], [size, -5], [size+15, 0] ])
                         .fill( { color: color } )
                         ;
        var dragging = false;

        group.style( 'pointer-events', 'bounding-box' );

        group.on( 'mouseover', function ( event ) {
            var lightColor = chroma(color).brighter().hex();
            line.stroke( { color: lightColor } );
            arrow.fill( { color: lightColor } );

            event.stopPropagation();
        } );

        group.on( 'mouseout', function ( event ) {
            if ( !dragging ) {
                line.stroke( { color: color } );
                arrow.fill( { color: color } );
            }

            event.stopPropagation();
        } );

        _addMoveHandles( group, {
            start: function () {
                dragging = true;
                line.stroke( { color: "#ff0" } );
                arrow.fill( { color: "#ff0" } );

                if ( callbacks.start )
                    callbacks.start ();
            },

            update: function ( dx, dy ) {
                if ( callbacks.update )
                    callbacks.update ( dx, dy );
            },

            end: function () {
                dragging = false;
                line.stroke( { color: color } );
                arrow.fill( { color: color } );

                if ( callbacks.end )
                    callbacks.end ();
            }
        }  );

        return group;
    };
    
    SvgGizmos.prototype.positionTool = function ( position, rotation, callbacks ) {
        var group = this.svg.group();
        var xarrow, yarrow, moveRect;

        group.position = position;
        group.rotation = rotation;

        // x-arrow
        xarrow = this.arrowTool( 80, "#f00", {
            start: function () {
                if ( callbacks.start )
                    callbacks.start.call(group);
            },
            update: function ( dx, dy ) {
                var radius = group.rotation * Math.PI / 180.0;
                var dirx = Math.cos(radius);
                var diry = Math.sin(radius);

                var length = Math.sqrt(dx * dx + dy * dy);
                var theta = Math.atan2( diry, dirx ) - Math.atan2( dy, dx );
                length = length * Math.cos(theta);

                if ( callbacks.update ) {
                    callbacks.update.call(group, dirx * length, diry * length );
                }
            },
            end: function () {
                if ( callbacks.end )
                    callbacks.end.call(group);
            },
        } );
        xarrow.translate( 20, 0 );
        group.add(xarrow);

        // y-arrow
        yarrow = this.arrowTool( 80, "#5c5", {
            start: function () {
                if ( callbacks.start )
                    callbacks.start.call(group);
            },
            update: function ( dx, dy ) {
                var radius = (group.rotation + 90.0) * Math.PI / 180.0;
                var dirx = Math.cos(radius);
                var diry = Math.sin(radius);

                var length = Math.sqrt(dx * dx + dy * dy);
                var theta = Math.atan2( diry, dirx ) - Math.atan2( dy, dx );
                length = length * Math.cos(theta);

                if ( callbacks.update ) {
                    callbacks.update.call(group, dirx * length, diry * length );
                }
            },
            end: function () {
                if ( callbacks.end )
                    callbacks.end.call(group);
            },
        } );
        yarrow.translate( 20, 0 );
        yarrow.rotate(-90, 0, 0 );
        group.add(yarrow);

        // move rect
        var color = "#05f";
        var dragging = false;
        moveRect = group.rect( 20, 20 )
                            .move( 0, -20 )
                            .fill( { color: color, opacity: 0.4 } )
                            .stroke( { width: 1, color: color } )
                            ;
        moveRect.on( 'mouseover', function ( event ) {
            var lightColor = chroma(color).brighter().hex();
            this.fill( { color: lightColor } )
                .stroke( { color: lightColor } )
                ;
            event.stopPropagation();
        } );
        moveRect.on( 'mouseout', function ( event ) {
            if ( !dragging ) {
                this.fill( { color: color } )
                    .stroke( { color: color } )
                    ;
            }
            event.stopPropagation();
        } );
        _addMoveHandles( moveRect, {
            start: function () {
                dragging = true;
                this.fill( { color: "#cc5" } )
                    .stroke( { color: "#cc5" } )
                    ;

                if ( callbacks.start )
                    callbacks.start.call(group);
            },

            update: function ( dx, dy ) {
                if ( callbacks.update )
                    callbacks.update.call(group, dx, dy );
            },

            end: function () {
                dragging = false;
                this.fill( { color: color } )
                    .stroke( { color: color } )
                    ;

                if ( callbacks.end )
                    callbacks.end.call(group);
            }
        } );

        return group;
    };

    SvgGizmos.prototype.rotationTool = function ( position, rotation, callbacks ) {
        var group = this.svg.group();
        var circle, line, arrow, arc, txtDegree;
        var dragging = false;
        var color = "#f00";

        group.position = position;
        group.rotation = rotation;

        // circle
        circle = group.path('M50,-10 A50,50, 0 1,0 50,10')
                      .fill( "none" )
                      .stroke( { width: 2, color: color } )
                      ;

        arc = group.path()
                   .fill( {color: color, opacity: 0.4} )
                   .stroke( { width: 1, color: color } )
                   ;
        arc.hide();

        // arrow
        var size = 50;
        line = group.line( 0, 0, size, 0 )
                    .stroke( { width: 1, color: color } )
                    ;
        arrow = group.polygon ([ [size, 5], [size, -5], [size+15, 0] ])
                     .fill( { color: color } )
                     ;

        //
        txtDegree = group.text("0")
                         .plain("")
                         .fill( { color: "white" } )
                         .font( {
                             anchor: 'middle',
                         })
                         .hide()
                         .translate( 30, 0 )
                         ;

        group.style( 'pointer-events', 'visibleFill' );
        group.on( 'mouseover', function ( event ) {
            var lightColor = chroma(color).brighter().hex();
            circle.stroke( { color: lightColor } );
            line.stroke( { color: lightColor } );
            arrow.fill( { color: lightColor } );

            event.stopPropagation();
        } );
        group.on( 'mouseout', function ( event ) {
            if ( !dragging ) {
                circle.stroke( { color: color } );
                line.stroke( { color: color } );
                arrow.fill( { color: color } );
            }
            event.stopPropagation();
        } );

        var x1, y1;
        _addMoveHandles( group, {
            start: function ( x, y ) {
                dragging = true;
                circle.stroke( { color: "#cc5" } );
                line.stroke( { color: "#cc5" } );
                arrow.fill( { color: "#cc5" } );

                arc.show();
                arc.plot( 'M40,0 A40,40, 0 0,1 40,0 L0,0 Z' );

                txtDegree.plain("0\xB0");
                txtDegree.rotate(0, 0, 0);
                txtDegree.show();

                x1 = x - group.position.x;
                y1 = y - group.position.y;

                if ( callbacks.start )
                    callbacks.start.call(group);
            },

            update: function ( dx, dy ) {
                var x2 = x1 + dx;
                var y2 = y1 + dy;
                var len1 = Math.sqrt(x1 * x1 + y1 * y1);
                var len2 = Math.sqrt(x2 * x2 + y2 * y2);

                //
                if ( len1 > 0 && len2 > 0 ) {
                    var dot = x1 * x2 + y1 * y2;
                    var cross = y1 * x2 - x1 * y2;

                    var alpha = Math.acos( dot / (len1 * len2) );
                    alpha = Math.sign(cross) * alpha;

                    var dirx = Math.cos(alpha);
                    var diry = Math.sin(alpha);
                    var angle = alpha * 180.0 / Math.PI;

                    txtDegree.rotate(alpha * 180.0 / Math.PI, 0, 0);
                    if ( alpha > 0.0 ) {
                        arc.plot( 'M40,0 A40,40, 0 0,1 ' + dirx*40 + ',' + diry*40 + ' L0,0 Z' );
                        txtDegree.plain( "+" + angle.toFixed(0) + "\xB0" );
                    }
                    else {
                        arc.plot( 'M40,0 A40,40, 0 0,0 ' + dirx*40 + ',' + diry*40 + ' L0,0 Z' );
                        txtDegree.plain( angle.toFixed(0) + "\xB0" );
                    }
                }

                //
                var theta = Math.atan2( y1, x1 ) - Math.atan2( y2, x2 );
                if ( callbacks.update )
                    callbacks.update.call(group, theta * 180.0 / Math.PI );
            },

            end: function () {
                dragging = false;
                circle.stroke( { color: color } );
                line.stroke( { color: color } );
                arrow.fill( { color: color } );

                arc.hide();
                txtDegree.hide();

                if ( callbacks.end )
                    callbacks.end.call(group);
            }
        } );

        return group;
    };

    SvgGizmos.prototype.scaleTool = function ( position, rotation, callbacks ) {
        var group = this.svg.group();
        var xarrow, yarrow, scaleRect;

        group.position = position;
        group.rotation = rotation;

        // x-slider
        xarrow = this.scaleSlider( 100, "#f00", {
            start: function () {
                if ( callbacks.start )
                    callbacks.start.call(group);
            },
            update: function ( dx, dy ) {
                var radius = group.rotation * Math.PI / 180.0;
                var dirx = Math.cos(radius);
                var diry = Math.sin(radius);

                var length = Math.sqrt(dx * dx + dy * dy);
                var theta = Math.atan2( diry, dirx ) - Math.atan2( dy, dx );
                length = length * Math.cos(theta);

                xarrow.resize( length + 100 );

                if ( callbacks.update ) {
                    callbacks.update.call(group, length/100.0, 0.0 );
                }
            },
            end: function () {
                xarrow.resize( 100 );

                if ( callbacks.end )
                    callbacks.end.call(group);
            },
        } );
        group.add(xarrow);

        // y-slider
        yarrow = this.scaleSlider( 100, "#5c5", {
            start: function () {
                if ( callbacks.start )
                    callbacks.start.call(group);
            },
            update: function ( dx, dy ) {
                var radius = (group.rotation + 90.0) * Math.PI / 180.0;
                var dirx = Math.cos(radius);
                var diry = Math.sin(radius);

                var length = Math.sqrt(dx * dx + dy * dy);
                var theta = Math.atan2( diry, dirx ) - Math.atan2( dy, dx );
                length = length * Math.cos(theta);

                yarrow.resize( -1.0 * length + 100 );

                if ( callbacks.update ) {
                    callbacks.update.call(group, 0.0, length/100.0 );
                }
            },
            end: function () {
                yarrow.resize( 100 );

                if ( callbacks.end )
                    callbacks.end.call(group);
            },
        } );
        yarrow.rotate(-90, 0, 0 );
        group.add(yarrow);


        // scaleRect
        var color = "#fff";
        var dragging = false;
        scaleRect = group.rect( 20, 20 )
                            .move( -10, -10 )
                            .fill( { color: color, opacity: 0.4 } )
                            .stroke( { width: 1, color: color } )
                            ;
        scaleRect.on( 'mouseover', function ( event ) {
            var lightColor = chroma(color).brighter().hex();
            this.fill( { color: lightColor } )
                .stroke( { color: lightColor } )
                ;
            event.stopPropagation();
        } );
        scaleRect.on( 'mouseout', function ( event ) {
            if ( !dragging ) {
                this.fill( { color: color } )
                    .stroke( { color: color } )
                    ;
            }
            event.stopPropagation();
        } );
        _addMoveHandles( scaleRect, {
            start: function () {
                dragging = true;
                this.fill( { color: "#cc5" } )
                    .stroke( { color: "#cc5" } )
                    ;

                if ( callbacks.start )
                    callbacks.start.call(group);
            },

            update: function ( dx, dy ) {
                var dirx = 1.0;
                var diry = -1.0;

                var length = Math.sqrt(dx * dx + dy * dy);
                var theta = Math.atan2( diry, dirx ) - Math.atan2( dy, dx );
                length = length * Math.cos(theta);

                xarrow.resize( length + 100 );
                yarrow.resize( length + 100 );

                if ( callbacks.update )
                    callbacks.update.call(group, dirx * length/100.0, diry * length/100.0 );
            },

            end: function () {
                dragging = false;
                this.fill( { color: color } )
                    .stroke( { color: color } )
                    ;

                xarrow.resize( 100 );
                yarrow.resize( 100 );

                if ( callbacks.end )
                    callbacks.end.call(group);
            }
        } );

        return group;
    };

    return SvgGizmos;
})();
