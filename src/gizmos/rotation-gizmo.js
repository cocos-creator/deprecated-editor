Fire.RotationGizmo = (function () {

    var RotationGizmo = Fire.define("Fire.RotationGizmo", 
                                    Fire.Gizmo, 
                                    function ( svg, target, options ) {

        RotationGizmo.$super.call(this, svg, target, options );
        this.allowMultiTarget = true;

        var localToWorld = target.transform.getLocalToWorldMatrix();
        var worldpos = new Fire.Vec2(localToWorld.tx, localToWorld.ty);
        var screenpos = this._svg.camera.worldToScreen(worldpos);
        screenpos.x = Fire.SvgGizmos.snapPixel(screenpos.x);
        screenpos.y = Fire.SvgGizmos.snapPixel(screenpos.y);
        var rotation = Math.rad2deg(-localToWorld.getRotation());

        var self = this;
        var worldrot;
        this._root = svg.rotationTool ( screenpos, rotation, {
            start: function () {
                worldrot = self.target.transform.worldRotation;
            },

            update: function ( delta ) {
                var rot = Math.deg180(worldrot + delta);
                rot = Math.floor(rot);
                self.target.transform.worldRotation = rot;
                self.dirty();
            }, 
        } ); 
    }); 

    //
    RotationGizmo.prototype.update = function () {
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

    return RotationGizmo;
})();

