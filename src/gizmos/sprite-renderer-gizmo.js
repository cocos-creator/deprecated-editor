Fire.SpriteRendererGizmo = (function () {

    var SpriteRendererGizmo = Fire.define("Fire.SpriteRendererGizmo", 
                                  Fire.Gizmo, 
                                  function ( svg, target ) {

        SpriteRendererGizmo.$super.call(this, svg, target );
        this.hitTest = false;
        this._root = svg.scene.group();
        
        this._selectTools = this._root.polygon();
        this._selectTools.hide();

        this._editTools = null;
    }); 
    Fire.gizmos['Fire.SpriteRenderer'] = SpriteRendererGizmo;

    //
    SpriteRendererGizmo.prototype.update = function () {
        var bounds, v1, v2, v3, v4;
        var radius = 5;

        if ( this.editing && this.target.customSize ) {
            if ( !this._editTools ) {
                var self = this;
                var center, vtable = {};
                var pressx, pressy;
                var worldpos;
                var entity = this.entity;

                var onstart = function ( x, y ) {
                    bounds = self.target.getWorldOrientedBounds();
                    vtable["bottom-left"] = bounds[0];
                    vtable["top-left"] = bounds[1];
                    vtable["top-right"] = bounds[2];
                    vtable["bottom-right"] = bounds[3];
                    vtable["top-middle"] = bounds[1].add(bounds[2]).mul(0.5);
                    vtable["bottom-middle"] = bounds[0].add(bounds[3]).mul(0.5);
                    vtable["middle-left"] = bounds[1].add(bounds[0]).mul(0.5);
                    vtable["middle-right"] = bounds[2].add(bounds[3]).mul(0.5);

                    pressx = x;
                    pressy = y;
                    worldpos = entity.transform.worldPosition;

                    var delta = bounds[3].sub(bounds[1]);
                    var length = delta.mag();
                    delta.normalizeSelf();
                    center = bounds[1].add( delta.mul(length*0.5) );
                };
                var onresize = function ( vname, applyWidth, applyHeight ) {
                    return function ( dx, dy ) {
                        var mousex = pressx + dx;
                        var mousey = pressy + dy;
                        var new_point = self._svg.camera.screenToWorld( new Fire.Vec2(mousex,mousey) );
                        var opposite = vtable[vname];

                        var delta = opposite.sub(new_point);
                        var length = delta.mag();
                        delta.normalizeSelf();
                        var new_center = new_point.add( delta.mul(length*0.5) );

                        var right = new Fire.Vec2(1,0);
                        right.rotate(Math.deg2rad(entity.transform.worldRotation));
                        var theta = right.angle( new Fire.Vec2( delta.x, delta.y ) );

                        if ( applyWidth ) self.target.width = Math.cos(theta) * length;
                        if ( applyHeight ) self.target.height = Math.sin(theta) * length;

                        entity.transform.worldPosition = new Fire.Vec2(
                            worldpos.x + new_center.x - center.x,
                            worldpos.y + new_center.y - center.y 
                        ); 

                        self.dirty();
                    };
                };

                var tl = this._svg.freemoveTool( radius * 2.0, "#09f", {
                    start: onstart,
                    update: onresize("bottom-right", true, true)
                });

                var tm = this._svg.freemoveTool( radius * 2.0, "#09f", {
                    start: onstart,
                    update: onresize("bottom-middle", false, true)
                });

                var tr = this._svg.freemoveTool( radius * 2.0, "#09f", {
                    start: onstart,
                    update: onresize("bottom-left", true, true)
                });

                var ml = this._svg.freemoveTool( radius * 2.0, "#09f", {
                    start: onstart,
                    update: onresize("middle-right", true, false)
                });

                var mr = this._svg.freemoveTool( radius * 2.0, "#09f", {
                    start: onstart,
                    update: onresize("middle-left", true, false)
                });

                var bl = this._svg.freemoveTool( radius * 2.0, "#09f", {
                    start: onstart,
                    update: onresize("top-right", true, true)
                });

                var bm = this._svg.freemoveTool( radius * 2.0, "#09f", {
                    start: onstart,
                    update: onresize("top-middle", false, true)
                });

                var br = this._svg.freemoveTool( radius * 2.0, "#09f", {
                    start: onstart,
                    update: onresize("top-left", true, true)
                });

                this._editTools = this._svg.scene.group();
                this._editTools.add(tl); this._editTools.tl = tl;
                this._editTools.add(tm); this._editTools.tm = tm;
                this._editTools.add(tr); this._editTools.tr = tr;
                this._editTools.add(ml); this._editTools.ml = ml;
                this._editTools.add(mr); this._editTools.mr = mr;
                this._editTools.add(bl); this._editTools.bl = bl;
                this._editTools.add(bm); this._editTools.bm = bm;
                this._editTools.add(br); this._editTools.br = br;
            }
        } 
        else {
            if ( this._editTools ) {
                this._editTools.remove();
                this._editTools = null;
            }
        }

        if ( this.editing ) {
            var color = "#09f";
            if ( this.target.customSize ) {
                color = "#0f9";
            }

            bounds = this.target.getWorldOrientedBounds();
            v1  = this._svg.camera.worldToScreen(bounds[0]); // bottom-left
            v2  = this._svg.camera.worldToScreen(bounds[1]); // top-left
            v3  = this._svg.camera.worldToScreen(bounds[2]); // top-right
            v4  = this._svg.camera.worldToScreen(bounds[3]); // bottom-right

            this._selectTools.show();
            this._selectTools.plot([
                [Fire.GizmosUtils.snapPixel(v1.x), Fire.GizmosUtils.snapPixel(v1.y)],
                [Fire.GizmosUtils.snapPixel(v2.x), Fire.GizmosUtils.snapPixel(v2.y)],
                [Fire.GizmosUtils.snapPixel(v3.x), Fire.GizmosUtils.snapPixel(v3.y)],
                [Fire.GizmosUtils.snapPixel(v4.x), Fire.GizmosUtils.snapPixel(v4.y)],
            ])
            .fill( "none" )
            .stroke( { color: color, width: 1 } )
            ;

            if ( this.target.customSize ) {
                v1.x = v1.x - radius; v1.y = v1.y - radius;
                v2.x = v2.x - radius; v2.y = v2.y - radius;
                v3.x = v3.x - radius; v3.y = v3.y - radius;
                v4.x = v4.x - radius; v4.y = v4.y - radius;

                v12 = v1.add(v2.sub(v1).mul(0.5));
                v23 = v2.add(v3.sub(v2).mul(0.5));
                v34 = v3.add(v4.sub(v3).mul(0.5));
                v41 = v4.add(v1.sub(v4).mul(0.5));

                this._editTools.tl.move( v2.x,  v2.y  );
                this._editTools.tm.move( v23.x, v23.y );
                this._editTools.tr.move( v3.x,  v3.y  );
                this._editTools.mr.move( v34.x, v34.y );
                this._editTools.br.move( v4.x,  v4.y  );
                this._editTools.bm.move( v41.x, v41.y );
                this._editTools.bl.move( v1.x,  v1.y  );
                this._editTools.ml.move( v12.x, v12.y );
            }
        }
        else if ( this.selecting ) {
            bounds = this.target.getWorldOrientedBounds();
            v1  = this._svg.camera.worldToScreen(bounds[0]);
            v2  = this._svg.camera.worldToScreen(bounds[1]);
            v3  = this._svg.camera.worldToScreen(bounds[2]);
            v4  = this._svg.camera.worldToScreen(bounds[3]);

            this._selectTools.show();
            this._selectTools.plot([
                [Fire.GizmosUtils.snapPixel(v1.x), Fire.GizmosUtils.snapPixel(v1.y)],
                [Fire.GizmosUtils.snapPixel(v2.x), Fire.GizmosUtils.snapPixel(v2.y)],
                [Fire.GizmosUtils.snapPixel(v3.x), Fire.GizmosUtils.snapPixel(v3.y)],
                [Fire.GizmosUtils.snapPixel(v4.x), Fire.GizmosUtils.snapPixel(v4.y)],
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
                [Fire.GizmosUtils.snapPixel(v1.x), Fire.GizmosUtils.snapPixel(v1.y)],
                [Fire.GizmosUtils.snapPixel(v2.x), Fire.GizmosUtils.snapPixel(v2.y)],
                [Fire.GizmosUtils.snapPixel(v3.x), Fire.GizmosUtils.snapPixel(v3.y)],
                [Fire.GizmosUtils.snapPixel(v4.x), Fire.GizmosUtils.snapPixel(v4.y)],
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
