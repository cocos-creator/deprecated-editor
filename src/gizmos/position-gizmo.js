Fire.PositionGizmo = (function () {

    var PositionGizmo = Fire.define("Fire.PositionGizmo", 
                                    Fire.Gizmo, 
                                    function ( svg, target ) {

        PositionGizmo.$super.call(this, svg, target );
        this.allowMultiTarget = true;

        var activeTarget = this.entity;
        var worldposList = [];
        var entities = target;
        var self = this;

        this._root = svg.positionTool ( {
            start: function () {
                worldposList.length = 0;
                for ( var i = 0; i < entities.length; ++i ) {
                    worldposList.push(entities[i].transform.worldPosition);
                }
            },

            update: function ( dx, dy ) {
                var cameraScale = svg.camera.size / svg.view.height;
                var delta = new Fire.Vec2( dx/cameraScale, -dy/cameraScale );

                for ( var i = 0; i < worldposList.length; ++i ) {
                    entities[i].transform.worldPosition = worldposList[i].add(delta);
                }

                self.dirty();
            }, 
        } ); 
    }); 

    //
    PositionGizmo.prototype.update = function () {
        var ent = this.entity;

        var localToWorld = ent.transform.getLocalToWorldMatrix();
        var worldpos = new Fire.Vec2(localToWorld.tx, localToWorld.ty);
        var screenpos = this._svg.camera.worldToScreen(worldpos);
        var rotation = -ent.transform.worldRotation;

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
