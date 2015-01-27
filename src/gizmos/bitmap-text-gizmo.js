var BitmapTextGizmo = Fire.define("Fire.BitmapTextGizmo", Fire.Gizmo, function () {

    var svg = arguments[0];
    var target = arguments[1];

    BitmapTextGizmo.$super.call(this, svg, target);
    this.hitTest = false;
    this._root = svg.scene.group();

    this._selectTools = this._root.polygon();
    this._selectTools.hide();
});
Fire.gizmos['Fire.BitmapText'] = BitmapTextGizmo;

BitmapTextGizmo.prototype.remove = function () {
    this._selectTools.remove();
};

BitmapTextGizmo.prototype.update = function () {
    if (!this.target.isValid)
        return;

    var bounds, v1, v2, v3, v4;

    if (this.editing) {
        bounds = this.target.getWorldOrientedBounds();
        v1 = this._svg.camera.worldToScreen(bounds[0]); // bottom-left
        v2 = this._svg.camera.worldToScreen(bounds[1]); // top-left
        v3 = this._svg.camera.worldToScreen(bounds[2]); // top-right
        v4 = this._svg.camera.worldToScreen(bounds[3]); // bottom-right

        this._selectTools.show();
        this._selectTools.plot([
            [Fire.GizmosUtils.snapPixel(v1.x), Fire.GizmosUtils.snapPixel(v1.y)],
            [Fire.GizmosUtils.snapPixel(v2.x), Fire.GizmosUtils.snapPixel(v2.y)],
            [Fire.GizmosUtils.snapPixel(v3.x), Fire.GizmosUtils.snapPixel(v3.y)],
            [Fire.GizmosUtils.snapPixel(v4.x), Fire.GizmosUtils.snapPixel(v4.y)],
        ])
        .fill("none")
        .stroke({ color: "#09f", width: 1 })
        ;
    }
    else if (this.selecting) {
        bounds = this.target.getWorldOrientedBounds();
        v1 = this._svg.camera.worldToScreen(bounds[0]);
        v2 = this._svg.camera.worldToScreen(bounds[1]);
        v3 = this._svg.camera.worldToScreen(bounds[2]);
        v4 = this._svg.camera.worldToScreen(bounds[3]);

        this._selectTools.show();
        this._selectTools.plot([
            [Fire.GizmosUtils.snapPixel(v1.x), Fire.GizmosUtils.snapPixel(v1.y)],
            [Fire.GizmosUtils.snapPixel(v2.x), Fire.GizmosUtils.snapPixel(v2.y)],
            [Fire.GizmosUtils.snapPixel(v3.x), Fire.GizmosUtils.snapPixel(v3.y)],
            [Fire.GizmosUtils.snapPixel(v4.x), Fire.GizmosUtils.snapPixel(v4.y)],
        ])
        .fill("none")
        .stroke({ color: "#09f", width: 1 })
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
            [Fire.GizmosUtils.snapPixel(v1.x), Fire.GizmosUtils.snapPixel(v1.y)],
            [Fire.GizmosUtils.snapPixel(v2.x), Fire.GizmosUtils.snapPixel(v2.y)],
            [Fire.GizmosUtils.snapPixel(v3.x), Fire.GizmosUtils.snapPixel(v3.y)],
            [Fire.GizmosUtils.snapPixel(v4.x), Fire.GizmosUtils.snapPixel(v4.y)],
        ])
        .fill("none")
        .stroke({ color: "#999", width: 1 })
        ;
    }
    else {
        this._selectTools.hide();
    }
};

Fire.BitmapTextGizmo = BitmapTextGizmo;
