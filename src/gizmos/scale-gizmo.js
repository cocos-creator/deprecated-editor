Fire.ScaleGizmo = (function () {

    var ScaleGizmo = Fire.define("Fire.ScaleGizmo", 
                                    Fire.Gizmo, 
                                    function ( svg, target, options ) {

        ScaleGizmo.$super.call(this, svg, target, options );
        this.allowMultiTarget = true;

        var localToWorld = target.transform.getLocalToWorldMatrix();
        var worldpos = new Fire.Vec2(localToWorld.tx, localToWorld.ty);
        var screenpos = this._svg.camera.worldToScreen(worldpos);
        screenpos.x = Fire.SvgGizmos.snapPixel(screenpos.x);
        screenpos.y = Fire.SvgGizmos.snapPixel(screenpos.y);
        var rotation = Math.rad2deg(-localToWorld.getRotation());

        var self = this;
        var localscale = this.target.transform.scale;
        this._root = svg.scaleTool ( screenpos, rotation, {
            start: function () {
                localscale = self.target.transform.scale;
            },

            update: function ( dx, dy ) {
                self.target.transform.scale = new Fire.Vec2 ( 
                    localscale.x * (1.0 + dx),
                    localscale.y * (1.0 - dy)
                ); 
                self.dirty();
            }, 
        } ); 
    }); 

    //
    ScaleGizmo.prototype.update = function () {
        localToWorld = this.target.transform.getLocalToWorldMatrix();
        worldpos = new Fire.Vec2(localToWorld.tx, localToWorld.ty);
        screenpos = this._svg.camera.worldToScreen(worldpos);
        rotation = -this.target.transform.worldRotation;

        screenpos.x = Fire.SvgGizmos.snapPixel(screenpos.x);
        screenpos.y = Fire.SvgGizmos.snapPixel(screenpos.y);

        this._root.position = screenpos;
        this._root.rotation = rotation;

        this._root.translate( this._root.position.x, this._root.position.y ) 
                  .rotate( this._root.rotation, this._root.position.x, this._root.position.y )
                  ;
    };

    return ScaleGizmo;
})();

