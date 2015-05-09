var ParticleSystemGizmo = Fire.Class({

    name: "Fire.ParticleSystemGizmo",

    extends: Editor.Gizmo,

    constructor: function () {
        var svg = arguments[0];
        var target = arguments[1];

        ParticleSystemGizmo.$super.call(this, svg, target);
        this.hitTest = true;

        this._icon = svg.icon( "fire://static/img/gizmos-particles.png", 40, 40, this.target.entity );
    },

    contains: function (svgElements) {
        for (var j = 0; j < svgElements.length; ++j) {
            if (this._icon.node === svgElements[j]) {
                return true;
            }
        }
    },

    remove: function () {
        this._icon.remove();
    },

    update: function () {
        if (!this.target.isValid)
            return;

        this.target.size = 40;
        var zoom = this._svg.view.height / this._svg.camera.size;

        var localToWorld = this.target.entity.transform.getLocalToWorldMatrix();
        var worldpos = new Fire.Vec2(localToWorld.tx, localToWorld.ty);
        var screenpos = this._svg.camera.worldToScreen(worldpos);
        screenpos.x = Editor.GizmosUtils.snapPixel(screenpos.x);
        screenpos.y = Editor.GizmosUtils.snapPixel(screenpos.y);
        var rotation = -this.target.entity.transform.worldRotation;

        var s = Math.max(zoom, 0.5);
        this._icon.scale(s, s);
        this._icon.translate(screenpos.x, screenpos.y)
            .rotate(rotation, screenpos.x, screenpos.y);
    }
});
Editor.gizmos['Fire.ParticleSystem'] = ParticleSystemGizmo;

Editor.ParticleSystemGizmo = ParticleSystemGizmo;
