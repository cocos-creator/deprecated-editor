var SkeletonGizmo = Fire.Class({

    name: "Fire.Spine.SkeletonGizmo",

    extends: Editor.Gizmo,

    constructor: function () {
        var svg = arguments[0];
        this.target = arguments[1];

        this.hitTest = false;
        this._root = svg.scene.group();

        this._selectTools = this._root.polygon();
        this._selectTools.hide();
    },

    properties: { },

    remove: function () {
        this._selectTools.remove();
    },

    update: function () {
        if (!this.target.isValid)
            return;

        if (this.editing || this.selecting || this.hovering) {
            var snap = Editor.GizmosUtils.snapPixel;
            var camera = this._svg.camera;

            var bounds = this.target.getWorldOrientedBounds();
            var v1 = camera.worldToScreen(bounds[0]); // bottom-left
            var v2 = camera.worldToScreen(bounds[1]); // top-left
            var v3 = camera.worldToScreen(bounds[2]); // top-right
            var v4 = camera.worldToScreen(bounds[3]); // bottom-right

            this._selectTools.show();
            this._selectTools.plot([
                [snap(v1.x), snap(v1.y)],
                [snap(v2.x), snap(v2.y)],
                [snap(v3.x), snap(v3.y)],
                [snap(v4.x), snap(v4.y)]
            ]).fill("none");

            if (this.editing) {
                this._selectTools.stroke({ color: "#09f", width: 1 });
            }
            else if (this.selecting) {
                this._selectTools.stroke({ color: "#09f", width: 1 });
            }
            else if (this.hovering) {
                this._selectTools.stroke({ color: "#999", width: 1 });
            }
        }
        else {
            this._selectTools.hide();
        }
    }
});
Editor.gizmos['Fire.Spine.Skeleton'] = SkeletonGizmo;

Editor.SkeletonGizmo = SkeletonGizmo;
