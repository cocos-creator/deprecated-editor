Fire.SvgGizmos = (function () {
    function _snapPixel (p) {
        return Math.floor(p) + 0.5; 
    }

    function SvgGizmos ( svgEL ) {
        this.svg = SVG(svgEL);
        this.hoverRect = this.svg.polyline();
        this.hoverRect.hide();
    }

    SvgGizmos.prototype.setCamera = function ( camera ) {
        this.camera = camera;
    };

    SvgGizmos.prototype.resize = function ( width, height ) {
        this.svg.size( width, height );
    };

    SvgGizmos.prototype.update = function () {
        this.select( this.currentSelect );
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
                [_snapPixel(v1.x), _snapPixel(v1.y)]
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

    SvgGizmos.prototype.select = function ( entity ) {
        if ( !entity ) {
            return;
        }

        if ( !this.translateGizmo ) {
            this.translateGizmo = this.positionTool();
        }
        this.currentSelect = entity;

        var localToWorld = entity.transform.getLocalToWorldMatrix();
        var pos = new Fire.Vec2(localToWorld.tx, localToWorld.ty);
        pos = this.camera.worldToScreen(pos);
        var rotation = localToWorld.getRotation() * 180.0 / Math.PI;

        this.translateGizmo.translate( _snapPixel(pos.x), _snapPixel(pos.y) ) 
                           .rotate( -rotation, _snapPixel(pos.x), _snapPixel(pos.y)  )
                           ;
    };

    // SvgGizmos.prototype.arrow = function ( x, y, angle, size ) {
    //     this.svg.polyline
    // };
    
    SvgGizmos.prototype.positionTool = function () {
        var group = this.svg.group();

        // x-arrow
        group.line( 0, 0, 100, 0 )
             .stroke( { width: 1, color: "#f00" } )
             .marker( 'end', 10, 10, function (add) {
                 add.path( 10, 10 )
                    .fill( { color: "#f00" } )
                 ;
             });

        // y-arrow
        group.line( 0, 0, 0, -100 )
             .stroke( { width: 1, color: "#5c5" } )
             .marker( 'end', 10, 10, function (add) {
                 add.rect( 10, 10 )
                    .fill( { color: "#5c5" } )
                 ;
             });

        // move rect
        group.rect( 20, 20 )
             .move( 0, -20 )
             .fill( { color: "#05f", opacity: 0.4 } )
             .stroke( { width: 1, color: "#05f" } )
             ;


        return group;
    };

    return SvgGizmos;
})();
