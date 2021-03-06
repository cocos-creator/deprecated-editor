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
    this.view = { width: 0, height : 0 };
    this.gizmos = [];
    this.gizmosTable = {}; // entity to gizmo

    this.scene = this.svg.group();
    this.foreground = this.svg.group();
}

SvgGizmos.prototype.setCamera = function ( camera ) {
    this.camera = camera;
};

SvgGizmos.prototype.resize = function ( width, height ) {
    this.svg.size( width, height );
    this.view = { width: width, height : height };
};

SvgGizmos.prototype.update = function () {
    for ( var i = 0; i < this.gizmos.length; ++i ) {
        var gizmo = this.gizmos[i];
        
        if (Array.isArray(gizmo.target)) {
            var invalid = gizmo.target.some(function (target) {
                return !Fire.isValid(target);
            });
            if (invalid) {
                continue;
            }
        }
        if (!Fire.isValid(gizmo.target)) {
            continue;
        }

        gizmo.update();
    }
};

SvgGizmos.prototype.add = function ( id, gizmo ) {
    if ( id ) {
        this.gizmosTable[id] = gizmo;
    }

    this.gizmos.push(gizmo);
};

SvgGizmos.prototype.remove = function ( id, gizmo ) {
    if ( id ) {
        delete this.gizmosTable[id];
    }

    for ( var i = this.gizmos.length-1; i >= 0; --i ) {
        var g = this.gizmos[i];
        if ( g === gizmo ) {
            g.remove();
            this.gizmos.splice( i, 1 );
            break;
        }
    }
};

SvgGizmos.prototype.hitTest = function ( x, y, w, h ) {
    var rect = this.svg.node.createSVGRect();
    rect.x = x;
    rect.y = y;
    rect.width = w;
    rect.height = h;

    var els = this.svg.node.getIntersectionList(rect, null);
    var results = [];

    if ( els.length > 0 ) {
        for ( var i = 0; i < this.gizmos.length; ++i ) {
            var gizmo = this.gizmos[i];
            if ( gizmo.hitTest && gizmo.contains(els) ) {
                results.push(gizmo);
            }
        }
    }

    return results;
};

SvgGizmos.prototype.updateSelection = function ( x, y, w, h ) {
    if ( !this.selectRect ) {
        this.selectRect = this.foreground.rect();
    }

    this.selectRect.move( Editor.GizmosUtils.snapPixel(x), Editor.GizmosUtils.snapPixel(y) )
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

SvgGizmos.prototype.icon = function ( url, w, h, hoverEntity ) {
    var icon = this.scene.image(url)
                         .move( -w * 0.5, -h * 0.5 )
                         .size( w, h )
                         ;

    icon.on( 'mousemove', function ( event ) {
        event.stopPropagation();
    } );
    icon.on( 'mouseover', function ( event ) {
        event.stopPropagation();
        var e = new CustomEvent('gizmoshover', {
            detail: { entity: hoverEntity },
        } );
        this.node.dispatchEvent(e);
    } );

    icon.on( 'mouseout', function ( event ) {
        event.stopPropagation();
    } );

    return icon;
};

SvgGizmos.prototype.scaleSlider = function ( size, color, callbacks ) {
    var group = this.scene.group();
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

    group.on( 'mousemove', function ( event ) {
        event.stopPropagation();
    } );
    group.on( 'mouseover', function ( event ) {
        var lightColor = chroma(color).brighter().hex();
        line.stroke( { color: lightColor } );
        rect.fill( { color: lightColor } );

        event.stopPropagation();
        this.node.dispatchEvent( new CustomEvent('gizmoshover', {
            detail: { entity: null }
        } ) );
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

SvgGizmos.prototype.freemoveTool = function ( size, color, callbacks ) {
    // move rect
    var dragging = false;
    var circle = this.svg.circle( size, size )
                     .move( -size * 0.5, -size * 0.5 )
                     .fill( { color: color, opacity: 0.6 } )
                     .stroke( { width: 2, color: color } )
                     ;
    // swallow mousemove event to prevent scene-view mousemove
    circle.on( 'mousemove', function ( event ) {
        event.stopPropagation();
    } );
    circle.on( 'mouseover', function ( event ) {
        var lightColor = chroma(color).brighter().hex();
        this.fill( { color: lightColor } )
            .stroke( { color: lightColor } )
            ;
        event.stopPropagation();
        this.node.dispatchEvent( new CustomEvent('gizmoshover', {
            detail: { entity: null }
        } ) );
    } );
    circle.on( 'mouseout', function ( event ) {
        if ( !dragging ) {
            this.fill( { color: color } )
                .stroke( { color: color } )
                ;
        }
        event.stopPropagation();
    } );
    _addMoveHandles( circle, {
        start: function ( x, y ) {
            dragging = true;
            this.fill( { color: "#cc5" } )
                .stroke( { color: "#cc5" } )
                ;

            if ( callbacks.start )
                callbacks.start( x, y );
        },

        update: function ( dx, dy ) {
            if ( callbacks.update )
                callbacks.update(dx, dy);
        },

        end: function () {
            dragging = false;
            this.fill( { color: color } )
                .stroke( { color: color } )
                ;

            if ( callbacks.end )
                callbacks.end();
        }
    } );

    return circle;
};

SvgGizmos.prototype.arrowTool = function ( size, color, callbacks ) {
    var group = this.scene.group();
    var line = group.line( 0, 0, size, 0 )
                    .stroke( { width: 1, color: color } )
                    ;
    var arrow = group.polygon ([ [size, 5], [size, -5], [size+15, 0] ])
                     .fill( { color: color } )
                     ;
    var dragging = false;

    group.style( 'pointer-events', 'bounding-box' );

    group.on( 'mousemove', function ( event ) {
        event.stopPropagation();
    } );
    group.on( 'mouseover', function ( event ) {
        var lightColor = chroma(color).brighter().hex();
        line.stroke( { color: lightColor } );
        arrow.fill( { color: lightColor } );

        event.stopPropagation();
        this.node.dispatchEvent( new CustomEvent('gizmoshover', {
            detail: { entity: null }
        } ) );
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

SvgGizmos.prototype.positionTool = function ( callbacks ) {
    var group = this.scene.group();
    var xarrow, yarrow, moveRect;

    group.position = new Fire.Vec2(0,0);
    group.rotation = 0.0;

    // x-arrow
    xarrow = this.arrowTool( 80, "#f00", {
        start: function () {
            if ( callbacks.start )
                callbacks.start.call(group);
        },
        update: function ( dx, dy ) {
            var radius = Math.deg2rad(group.rotation);
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
            var radius = Math.deg2rad(group.rotation + 90.0);
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
    // swallow mousemove event to prevent scene-view mousemove
    moveRect.on( 'mousemove', function ( event ) {
        event.stopPropagation();
    } );
    moveRect.on( 'mouseover', function ( event ) {
        var lightColor = chroma(color).brighter().hex();
        this.fill( { color: lightColor } )
            .stroke( { color: lightColor } )
            ;
        event.stopPropagation();
        this.node.dispatchEvent( new CustomEvent('gizmoshover', {
            detail: { entity: null }
        } ) );
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

SvgGizmos.prototype.rotationTool = function ( callbacks ) {
    var group = this.scene.group();
    var circle, line, arrow, arc, txtDegree;
    var dragging = false;
    var color = "#f00";

    group.position = new Fire.Vec2(0,0);
    group.rotation = 0.0;

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
    group.on( 'mousemove', function ( event ) {
        event.stopPropagation();
    } );
    group.on( 'mouseover', function ( event ) {
        var lightColor = chroma(color).brighter().hex();
        circle.stroke( { color: lightColor } );
        line.stroke( { color: lightColor } );
        arrow.fill( { color: lightColor } );

        event.stopPropagation();
        this.node.dispatchEvent( new CustomEvent('gizmoshover', {
            detail: { entity: null }
        } ) );
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
            var v1 = new Fire.Vec2( x1,    y1    );
            var v2 = new Fire.Vec2( x1+dx, y1+dy );

            var magSqr1 = v1.magSqr();
            var magSqr2 = v2.magSqr();

            //
            if ( magSqr1 > 0 && magSqr2 > 0 ) {
                var dot = v1.dot(v2);
                var cross = v1.cross(v2);
                var alpha = Math.sign(cross) * Math.acos( dot / Math.sqrt(magSqr1 * magSqr2) );

                var dirx = Math.cos(alpha);
                var diry = Math.sin(alpha);
                var angle = Math.rad2deg(alpha);

                txtDegree.rotate(angle, 0, 0);
                if ( alpha > 0.0 ) {
                    arc.plot( 'M40,0 A40,40, 0 0,1 ' + dirx*40 + ',' + diry*40 + ' L0,0' );
                    txtDegree.plain( "+" + angle.toFixed(0) + "\xB0" );
                }
                else {
                    arc.plot( 'M40,0 A40,40, 0 0,0 ' + dirx*40 + ',' + diry*40 + ' L0,0' );
                    txtDegree.plain( angle.toFixed(0) + "\xB0" );
                }
            }

            //
            var theta = Math.atan2( v1.y, v1.x ) - Math.atan2( v2.y, v2.x );
            if ( callbacks.update )
                callbacks.update.call(group, Math.rad2deg(theta) );
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

SvgGizmos.prototype.scaleTool = function ( callbacks ) {
    var group = this.scene.group();
    var xarrow, yarrow, scaleRect;

    group.position = new Fire.Vec2(0,0);
    group.rotation = 0.0;

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
    var color = "#aaa";
    var dragging = false;
    scaleRect = group.rect( 20, 20 )
                        .move( -10, -10 )
                        .fill( { color: color, opacity: 0.4 } )
                        .stroke( { width: 1, color: color } )
                        ;
    scaleRect.on( 'mousemove', function ( event ) {
        event.stopPropagation();
    } );
    scaleRect.on( 'mouseover', function ( event ) {
        var lightColor = chroma(color).brighter().hex();
        this.fill( { color: lightColor } )
            .stroke( { color: lightColor } )
            ;
        event.stopPropagation();
        this.node.dispatchEvent( new CustomEvent('gizmoshover', {
            detail: { entity: null }
        } ) );
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

Editor.SvgGizmos = SvgGizmos;
