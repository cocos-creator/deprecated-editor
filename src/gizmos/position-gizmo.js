Fire.PositionGizmo = (function () {

    var PositionGizmo = Fire.define("Fire.PositionGizmo", 
                                    Fire.Gizmo, 
                                    function ( svg, target ) {

        PositionGizmo.$super.call(this, svg, target );
        this.allowMultiTarget = true;

        var localToWorld = target.transform.getLocalToWorldMatrix();
        var worldpos = new Fire.Vec2(localToWorld.tx, localToWorld.ty);
        var screenpos = this._svg.camera.worldToScreen(worldpos);
        screenpos.x = Fire.SvgGizmos.snapPixel(screenpos.x);
        screenpos.y = Fire.SvgGizmos.snapPixel(screenpos.y);
        var rotation = Math.rad2deg(-localToWorld.getRotation());

        var self = this;
        this._root = svg.positionTool ( screenpos, rotation, {
            start: function () {
                worldpos = self.target.transform.worldPosition;
            },

            update: function ( dx, dy ) {
                var cameraScale = svg.camera.size / svg.view.height;
                var delta = new Fire.Vec2( dx/cameraScale, -dy/cameraScale );
                self.target.transform.worldPosition = worldpos.add(delta);
                self.dirty();
            }, 
        } ); 
    }); 

    //
    PositionGizmo.prototype.update = function () {
        localToWorld = this.target.transform.getLocalToWorldMatrix();
        worldpos = new Fire.Vec2(localToWorld.tx, localToWorld.ty);
        screenpos = this._svg.camera.worldToScreen(worldpos);
        rotation = -this.target.transform.worldRotation;

        screenpos.x = Fire.SvgGizmos.snapPixel(screenpos.x);
        screenpos.y = Fire.SvgGizmos.snapPixel(screenpos.y);

        this._root.position = screenpos;
        this._root.rotation = 0.0; 

        if ( this.coordinate !== "global" ) {
            this._root.rotation = rotation;
        }

        this._root.translate( this._root.position.x, this._root.position.y ) 
                  .rotate( this._root.rotation, this._root.position.x, this._root.position.y )
                  ;
    };

    return PositionGizmo;
})();
