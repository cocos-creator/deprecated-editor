var ScaleGizmo = Fire.extend("Fire.ScaleGizmo",
                              Editor.Gizmo,
                              function () {

    var svg = arguments[0];
    var target = arguments[1];
    var options = arguments[2];

    this.allowMultiTarget = true;

    var localscaleList = [], offsetList = [],
        entities = target,
        self = this,
        center
        ;

    this._root = svg.scaleTool ( {
        start: function () {
            var i;

            localscaleList.length = 0;
            for ( i = 0; i < entities.length; ++i ) {
                localscaleList.push(entities[i].transform.scale);
            }

            if ( self.pivot === "center" ) {
                center = Editor.GizmosUtils.getCenter(entities);
                offsetList.length = 0;
                for ( i = 0; i < entities.length; ++i ) {
                    offsetList.push(entities[i].transform.worldPosition.sub(center));
                }
            }
        },

        update: function ( dx, dy ) {
            var i, scale;

            scale = new Fire.Vec2( 1.0 + dx, 1.0 - dy );

            if ( self.pivot === "center" ) {
                for ( i = 0; i < localscaleList.length; ++i ) {
                    entities[i].transform.scale = new Fire.Vec2(
                        localscaleList[i].x * scale.x,
                        localscaleList[i].y * scale.y
                    );

                    var offset = new Fire.Vec2(
                        offsetList[i].x * scale.x,
                        offsetList[i].y * scale.y
                    );
                    entities[i].transform.worldPosition = center.add(offset);
                }
            }
            else {
                for ( i = 0; i < localscaleList.length; ++i ) {
                    entities[i].transform.scale = new Fire.Vec2(
                        localscaleList[i].x * scale.x,
                        localscaleList[i].y * scale.y
                    );
                }
            }

            self.dirty();
        },
    } );
});

//
ScaleGizmo.prototype.update = function () {
    var activeTarget = this.entity;
    var worldpos,screenpos,rotation;

    if ( this.pivot === "center" ) {
        worldpos = Editor.GizmosUtils.getCenter(this.target);
        screenpos = this._svg.camera.worldToScreen(worldpos);
        rotation = 0.0;

        screenpos.x = Editor.GizmosUtils.snapPixel(screenpos.x);
        screenpos.y = Editor.GizmosUtils.snapPixel(screenpos.y);

        this._root.position = screenpos;
        this._root.rotation = 0.0;
    }
    else {
        var localToWorld = activeTarget.transform.getLocalToWorldMatrix();
        worldpos = new Fire.Vec2(localToWorld.tx, localToWorld.ty);
        screenpos = this._svg.camera.worldToScreen(worldpos);
        rotation = -activeTarget.transform.worldRotation;

        screenpos.x = Editor.GizmosUtils.snapPixel(screenpos.x);
        screenpos.y = Editor.GizmosUtils.snapPixel(screenpos.y);

        this._root.position = screenpos;
        this._root.rotation = rotation;
    }

    this._root.translate( this._root.position.x, this._root.position.y )
              .rotate( this._root.rotation, this._root.position.x, this._root.position.y )
              ;
};

Editor.ScaleGizmo = ScaleGizmo;

