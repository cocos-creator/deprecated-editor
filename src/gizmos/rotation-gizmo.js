Fire.RotationGizmo = (function () {

    var RotationGizmo = Fire.define("Fire.RotationGizmo", 
                                    Fire.Gizmo, 
                                    function ( svg, target, options ) {

        RotationGizmo.$super.call(this, svg, target, options );
        this.allowMultiTarget = true;

        var worldrotList = [];
        var entities = target;
        var self = this;

        this._root = svg.rotationTool ( {
            start: function () {
                worldrotList.length = 0;
                for ( var i = 0; i < entities.length; ++i ) {
                    worldrotList.push(entities[i].transform.worldRotation);
                }
            },

            update: function ( delta ) {
                for ( var i = 0; i < worldrotList.length; ++i ) {
                    var rot = Math.deg180(worldrotList[i] + delta);
                    rot = Math.floor(rot);
                    entities[i].transform.worldRotation = rot;
                }

                self.dirty();
            }, 
        } ); 
    }); 

    //
    RotationGizmo.prototype.update = function () {
        var activeTarget = this.entity;
        var worldpos,screenpos,rotation;

        if ( this.pivot === "center" ) {
            worldpos = Fire.GizmosUtils.getCenter(this.target);
            screenpos = this._svg.camera.worldToScreen(worldpos);

            screenpos.x = Fire.GizmosUtils.snapPixel(screenpos.x);
            screenpos.y = Fire.GizmosUtils.snapPixel(screenpos.y);

            this._root.position = screenpos;
        }
        else {
            var localToWorld = activeTarget.transform.getLocalToWorldMatrix();
            worldpos = new Fire.Vec2(localToWorld.tx, localToWorld.ty);
            screenpos = this._svg.camera.worldToScreen(worldpos);
            rotation = -activeTarget.transform.worldRotation;

            screenpos.x = Fire.GizmosUtils.snapPixel(screenpos.x);
            screenpos.y = Fire.GizmosUtils.snapPixel(screenpos.y);

            this._root.position = screenpos;
            this._root.rotation = rotation;
        }

        this._root.translate( this._root.position.x, this._root.position.y ) 
                  .rotate( this._root.rotation, this._root.position.x, this._root.position.y )
                  ;
    };

    return RotationGizmo;
})();

