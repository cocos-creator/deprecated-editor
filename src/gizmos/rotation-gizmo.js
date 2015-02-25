var RotationGizmo = Fire.extend("Fire.RotationGizmo",
                                Fire.Gizmo,
                                function () {
    var svg = arguments[0];
    var target = arguments[1];
    var options = arguments[2];

    this.allowMultiTarget = true;
    this.rotating = false;

    var rotList = [], offsetList = [],
        entities = target,
        self = this,
        center
        ;

    this._root = svg.rotationTool ( {
        start: function () {
            self.rotating = true;
            rotList.length = 0;
            for ( var i = 0; i < entities.length; ++i ) {
                rotList.push(entities[i].transform.rotation);
            }

            if ( self.pivot === "center" ) {
                center = Fire.GizmosUtils.getCenter(entities);
                offsetList.length = 0;
                for ( i = 0; i < entities.length; ++i ) {
                    offsetList.push(entities[i].transform.worldPosition.sub(center));
                }
            }
        },

        update: function ( delta ) {
            var i, rot, deltaInt;

            deltaInt = Math.floor(delta);

            if ( self.pivot === "center" ) {
                for ( i = 0; i < rotList.length; ++i ) {
                    rot = Math.deg180(rotList[i] + deltaInt);
                    rot = Math.floor(rot);

                    var offset = offsetList[i].rotate(Math.deg2rad(deltaInt));
                    entities[i].transform.worldPosition = center.add(offset);
                    entities[i].transform.rotation = rot;

                    this.rotation = -delta;
                }
            }
            else {
                for ( i = 0; i < rotList.length; ++i ) {
                    rot = Math.deg180(rotList[i] + delta);
                    rot = Math.floor(rot);
                    entities[i].transform.rotation = rot;
                }
            }

            self.dirty();
        },

        end: function () {
            if ( self.pivot === "center" ) {
                var worldpos = Fire.GizmosUtils.getCenter(entities);
                var screenpos = self._svg.camera.worldToScreen(worldpos);

                screenpos.x = Fire.GizmosUtils.snapPixel(screenpos.x);
                screenpos.y = Fire.GizmosUtils.snapPixel(screenpos.y);

                this.rotation = 0;
                this.position = screenpos;

                this.translate( this.position.x, this.position.y )
                    .rotate( this.rotation, this.position.x, this.position.y )
                    ;
            }
            self.rotating = false;
        },
    } );
});

//
RotationGizmo.prototype.update = function () {
    var activeTarget = this.entity;
    var worldpos,screenpos,rotation;

    if ( this.pivot === "center" ) {
        if ( this.rotating ) {
            this._root.rotate( this._root.rotation,
                               this._root.position.x,
                               this._root.position.y );
            return;
        }

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

Fire.RotationGizmo = RotationGizmo;

