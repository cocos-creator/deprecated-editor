Fire.ScaleGizmo = (function () {

    var ScaleGizmo = Fire.define("Fire.ScaleGizmo", 
                                    Fire.Gizmo, 
                                    function ( svg, target, options ) {

        ScaleGizmo.$super.call(this, svg, target, options );
        this.allowMultiTarget = true;

        var activeTarget = this.entity;
        var localscaleList = [];
        var entities = target;
        var self = this;

        this._root = svg.scaleTool ( {
            start: function () {
                localscaleList.length = 0;
                for ( var i = 0; i < entities.length; ++i ) {
                    localscaleList.push(entities[i].transform.scale);
                }
            },

            update: function ( dx, dy ) {
                for ( var i = 0; i < localscaleList.length; ++i ) {
                    var localscale = localscaleList[i];
                    entities[i].transform.scale = new Fire.Vec2 ( 
                        localscale.x * (1.0 + dx),
                        localscale.y * (1.0 - dy)
                    ); 
                }
                self.dirty();
            }, 
        } ); 
    }); 

    //
    ScaleGizmo.prototype.update = function () {
        var ent = this.entity;

        var localToWorld = ent.transform.getLocalToWorldMatrix();
        var worldpos = new Fire.Vec2(localToWorld.tx, localToWorld.ty);
        var screenpos = this._svg.camera.worldToScreen(worldpos);
        var rotation = -ent.transform.worldRotation;

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

