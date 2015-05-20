var SpriteRendererGizmo = Fire.Class({
    name: "Fire.SpriteRendererGizmo",
    extends: Editor.Gizmo,
    constructor: function () {

        var svg = arguments[0];

        this.hitTest = false;
        this._root = svg.scene.group();

        this._selectTools = this._root.polygon();
        this._selectTools.hide();

        this._editTools = null;
    },
    remove: function () {
        this._root.remove();
        if ( this._editTools ) {
            this._editTools.remove();
        }
    },
    update: function () {
        if (!this.target.isValid)
            return;

        var bounds, v1, v2, v3, v4;
        var radius = 5;

        if (this.editing && this.target.useCustomSize) {
            if (!this._editTools) {
                var self = this;
                var center, vtable = {};
                var pressx, pressy;
                var worldpos, worldrot, worldscale;
                var entity = this.entity;

                var onstart = function (x, y) {
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
                    worldscale = entity.transform.worldScale;

                    var delta = bounds[3].sub(bounds[1]);
                    var length = delta.mag();
                    delta.normalizeSelf();
                    center = bounds[1].add(delta.mul(length * 0.5));
                };
                var onresize = function (name, oppositeName, ratioW, ratioH) {
                    return function (dx, dy) {
                        var delta, length, theta, dir, new_center;

                        var mousex = pressx + dx;
                        var mousey = pressy + dy;
                        var new_point = self._svg.camera.screenToWorld(new Fire.Vec2(mousex, mousey));
                        var old_point = vtable[name];

                        var right = entity.transform.right;
                        var up = entity.transform.up;

                        // calculate new_point by direction
                        if (ratioW === 0.0) {
                            delta = new_point.sub(old_point);
                            length = delta.mag();
                            theta = up.angle(delta);
                            length = length * Math.cos(theta);
                            new_point = old_point.add(up.mul(length));
                        }
                        else if (ratioH === 0.0) {
                            delta = new_point.sub(old_point);
                            length = delta.mag();
                            theta = right.angle(delta);
                            length = length * Math.cos(theta);
                            new_point = old_point.add(right.mul(length));
                        }

                        // calculate center offset
                        var opposite = vtable[oppositeName];
                        delta = opposite.sub(new_point);
                        length = delta.mag();
                        delta.normalizeSelf();
                        new_center = new_point.add(delta.mul(length * 0.5));

                        // calculate width, height
                        theta = right.signAngle(delta);
                        // theta = Math.atan2( right.y, right.x ) - Math.atan2( delta.y, delta.x );
                        if (ratioW !== 0.0)
                            self.target.customWidth = ratioW * Math.cos(theta) * length / worldscale.x;

                        if (ratioH !== 0.0)
                            self.target.customHeight = ratioH * Math.sin(theta) * length / worldscale.y;

                        entity.transform.worldPosition = worldpos.add(new_center.sub(center));
                        self.dirty();
                    };
                };

                var tl = this._svg.freemoveTool(radius * 2.0, "#09f", {
                    start: onstart,
                    update: onresize("top-left", "bottom-right", 1.0, 1.0)
                });

                var tm = this._svg.freemoveTool(radius * 2.0, "#09f", {
                    start: onstart,
                    update: onresize("top-middle", "bottom-middle", 0.0, 1.0)
                });

                var tr = this._svg.freemoveTool(radius * 2.0, "#09f", {
                    start: onstart,
                    update: onresize("top-right", "bottom-left", -1.0, 1.0)
                });

                var ml = this._svg.freemoveTool(radius * 2.0, "#09f", {
                    start: onstart,
                    update: onresize("middle-left", "middle-right", 1.0, 0.0)
                });

                var mr = this._svg.freemoveTool(radius * 2.0, "#09f", {
                    start: onstart,
                    update: onresize("middle-right", "middle-left", -1.0, 0.0)
                });

                var bl = this._svg.freemoveTool(radius * 2.0, "#09f", {
                    start: onstart,
                    update: onresize("bottom-left", "top-right", 1.0, -1.0)
                });

                var bm = this._svg.freemoveTool(radius * 2.0, "#09f", {
                    start: onstart,
                    update: onresize("bottom-middle", "top-middle", 0.0, -1.0)
                });

                var br = this._svg.freemoveTool(radius * 2.0, "#09f", {
                    start: onstart,
                    update: onresize("bottom-right", "top-left", -1.0, -1.0)
                });

                this._editTools = this._svg.scene.group();
                this._editTools.add(tl);
                this._editTools.tl = tl;
                this._editTools.add(tm);
                this._editTools.tm = tm;
                this._editTools.add(tr);
                this._editTools.tr = tr;
                this._editTools.add(ml);
                this._editTools.ml = ml;
                this._editTools.add(mr);
                this._editTools.mr = mr;
                this._editTools.add(bl);
                this._editTools.bl = bl;
                this._editTools.add(bm);
                this._editTools.bm = bm;
                this._editTools.add(br);
                this._editTools.br = br;
            }
        }
        else {
            if (this._editTools) {
                this._editTools.remove();
                this._editTools = null;
            }
        }

        if (this.editing) {
            var color = "#09f";
            if (this.target.useCustomSize) {
                color = "#0f9";
            }

            bounds = this.target.getWorldOrientedBounds();
            v1 = this._svg.camera.worldToScreen(bounds[0]); // bottom-left
            v2 = this._svg.camera.worldToScreen(bounds[1]); // top-left
            v3 = this._svg.camera.worldToScreen(bounds[2]); // top-right
            v4 = this._svg.camera.worldToScreen(bounds[3]); // bottom-right

            this._selectTools.show();
            this._selectTools.plot([
                [Editor.GizmosUtils.snapPixel(v1.x), Editor.GizmosUtils.snapPixel(v1.y)],
                [Editor.GizmosUtils.snapPixel(v2.x), Editor.GizmosUtils.snapPixel(v2.y)],
                [Editor.GizmosUtils.snapPixel(v3.x), Editor.GizmosUtils.snapPixel(v3.y)],
                [Editor.GizmosUtils.snapPixel(v4.x), Editor.GizmosUtils.snapPixel(v4.y)],
            ])
                .fill("none")
                .stroke({color: color, width: 1})
            ;

            if (this.target.useCustomSize) {
                v1.x = v1.x - radius;
                v1.y = v1.y - radius;
                v2.x = v2.x - radius;
                v2.y = v2.y - radius;
                v3.x = v3.x - radius;
                v3.y = v3.y - radius;
                v4.x = v4.x - radius;
                v4.y = v4.y - radius;

                var v12 = v1.add(v2.sub(v1).mul(0.5));
                var v23 = v2.add(v3.sub(v2).mul(0.5));
                var v34 = v3.add(v4.sub(v3).mul(0.5));
                var v41 = v4.add(v1.sub(v4).mul(0.5));

                this._editTools.tl.move(v2.x, v2.y);
                this._editTools.tm.move(v23.x, v23.y);
                this._editTools.tr.move(v3.x, v3.y);
                this._editTools.mr.move(v34.x, v34.y);
                this._editTools.br.move(v4.x, v4.y);
                this._editTools.bm.move(v41.x, v41.y);
                this._editTools.bl.move(v1.x, v1.y);
                this._editTools.ml.move(v12.x, v12.y);
            }
        }
        else if (this.selecting) {
            bounds = this.target.getWorldOrientedBounds();
            v1 = this._svg.camera.worldToScreen(bounds[0]);
            v2 = this._svg.camera.worldToScreen(bounds[1]);
            v3 = this._svg.camera.worldToScreen(bounds[2]);
            v4 = this._svg.camera.worldToScreen(bounds[3]);

            this._selectTools.show();
            this._selectTools.plot([
                [Editor.GizmosUtils.snapPixel(v1.x), Editor.GizmosUtils.snapPixel(v1.y)],
                [Editor.GizmosUtils.snapPixel(v2.x), Editor.GizmosUtils.snapPixel(v2.y)],
                [Editor.GizmosUtils.snapPixel(v3.x), Editor.GizmosUtils.snapPixel(v3.y)],
                [Editor.GizmosUtils.snapPixel(v4.x), Editor.GizmosUtils.snapPixel(v4.y)],
            ])
                .fill("none")
                .stroke({color: "#09f", width: 1})
            ;
        }
        else if (this.hovering) {
            bounds = this.target.getWorldOrientedBounds();
            v1 = this._svg.camera.worldToScreen(bounds[0]);
            v2 = this._svg.camera.worldToScreen(bounds[1]);
            v3 = this._svg.camera.worldToScreen(bounds[2]);
            v4 = this._svg.camera.worldToScreen(bounds[3]);

            this._selectTools.show();
            this._selectTools.plot([
                [Editor.GizmosUtils.snapPixel(v1.x), Editor.GizmosUtils.snapPixel(v1.y)],
                [Editor.GizmosUtils.snapPixel(v2.x), Editor.GizmosUtils.snapPixel(v2.y)],
                [Editor.GizmosUtils.snapPixel(v3.x), Editor.GizmosUtils.snapPixel(v3.y)],
                [Editor.GizmosUtils.snapPixel(v4.x), Editor.GizmosUtils.snapPixel(v4.y)],
            ])
                .fill("none")
                .stroke({color: "#999", width: 1})
            ;
        }
        else {
            this._selectTools.hide();
        }
    }
});
Editor.gizmos['Fire.SpriteRenderer'] = SpriteRendererGizmo;

Editor.SpriteRendererGizmo = SpriteRendererGizmo;
