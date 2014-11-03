Fire.SpriteRendererGizmo = (function () {

    var SpriteRendererGizmo = Fire.define("Fire.SpriteRendererGizmo", 
                                  Fire.Gizmo, 
                                  function ( svg, target ) {

        SpriteRendererGizmo.$super.call(this, svg, target );
        this.hitTest = false;
        
        this._selectTools = svg.scene.polygon();
        this._selectTools.hide();

    }); 
    Fire.gizmos['Fire.SpriteRenderer'] = SpriteRendererGizmo;

    //
    SpriteRendererGizmo.prototype.update = function () {
        var bounds, v1, v2, v3, v4;

        if ( this.selecting ) {
            bounds = this.target.getWorldOrientedBounds();
            v1  = this._svg.camera.worldToScreen(bounds[0]);
            v2  = this._svg.camera.worldToScreen(bounds[1]);
            v3  = this._svg.camera.worldToScreen(bounds[2]);
            v4  = this._svg.camera.worldToScreen(bounds[3]);

            this._selectTools.show();
            this._selectTools.plot([
                [Fire.SvgGizmos.snapPixel(v1.x), Fire.SvgGizmos.snapPixel(v1.y)],
                [Fire.SvgGizmos.snapPixel(v2.x), Fire.SvgGizmos.snapPixel(v2.y)],
                [Fire.SvgGizmos.snapPixel(v3.x), Fire.SvgGizmos.snapPixel(v3.y)],
                [Fire.SvgGizmos.snapPixel(v4.x), Fire.SvgGizmos.snapPixel(v4.y)],
            ])
            .fill( "none" )
            .stroke( { color: "#09f", width: 1 } )
            ;
        }
        else if ( this.hovering ) {
            bounds = this.target.getWorldOrientedBounds();
            v1  = this._svg.camera.worldToScreen(bounds[0]);
            v2  = this._svg.camera.worldToScreen(bounds[1]);
            v3  = this._svg.camera.worldToScreen(bounds[2]);
            v4  = this._svg.camera.worldToScreen(bounds[3]);

            this._selectTools.show();
            this._selectTools.plot([
                [Fire.SvgGizmos.snapPixel(v1.x), Fire.SvgGizmos.snapPixel(v1.y)],
                [Fire.SvgGizmos.snapPixel(v2.x), Fire.SvgGizmos.snapPixel(v2.y)],
                [Fire.SvgGizmos.snapPixel(v3.x), Fire.SvgGizmos.snapPixel(v3.y)],
                [Fire.SvgGizmos.snapPixel(v4.x), Fire.SvgGizmos.snapPixel(v4.y)],
            ])
            .fill( "none" )
            .stroke( { color: "#999", width: 1 } )
            ;
        }
        else {
            this._selectTools.hide();
        }
    };


    return SpriteRendererGizmo;
})();
