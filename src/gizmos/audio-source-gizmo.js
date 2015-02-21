var AudioSourceGizmo = Fire.extend("Fire.AudioSourceGizmo",
                            Fire.Gizmo,
                            function () {

    var svg = arguments[0];
    var target = arguments[1];

    AudioSourceGizmo.$super.call(this, svg, target);
    this.hitTest = true;

    this._icon = svg.icon("fire://static/img/gizmos-audio-source.png", 40, 40, target.entity);
});
Fire.gizmos['Fire.AudioSource'] = AudioSourceGizmo;

//
AudioSourceGizmo.prototype.remove = function () {
    this._icon.remove();
};

//
AudioSourceGizmo.prototype.contains = function (svgElements) {
    for (var j = 0; j < svgElements.length; ++j) {
        if (this._icon.node === svgElements[j]) {
            return true;
        }
    }
};

//
AudioSourceGizmo.prototype.update = function () {
    if (!this.target.isValid)
        return;

    this.target.size = 40;
    var zoom = this._svg.view.height / this._svg.camera.size;

    var localToWorld = this.target.entity.transform.getLocalToWorldMatrix();
    var worldpos = new Fire.Vec2(localToWorld.tx, localToWorld.ty);
    var screenpos = this._svg.camera.worldToScreen(worldpos);
    screenpos.x = Fire.GizmosUtils.snapPixel(screenpos.x);
    screenpos.y = Fire.GizmosUtils.snapPixel(screenpos.y);
    var rotation = -this.target.entity.transform.worldRotation;

    var s = Math.max(zoom, 0.5);
    this._icon.scale(s, s);
    this._icon.translate(screenpos.x, screenpos.y)
              .rotate(rotation, screenpos.x, screenpos.y);
};

Fire.AudioSourceGizmo = AudioSourceGizmo;
