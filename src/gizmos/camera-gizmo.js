var CameraGizmo = Fire.define("Fire.CameraGizmo",
                              Fire.Gizmo,
                              function () {

    var svg = arguments[0];
    var target = arguments[1];

    CameraGizmo.$super.call(this, svg, target );
    this.hitTest = true;

    this._icon = svg.icon( "fire://static/img/gizmos-camera.png", 40, 40, target.entity );

    //
    var selectTools = svg.scene.group();
    var color = "#ff0";

    var rect = selectTools.rect ()
         .fill( "none" )
         .stroke( { width: 1, color: color } )
         ;
    var l1 = selectTools.line().stroke( { width: 1, color: color } );
    var l2 = selectTools.line().stroke( { width: 1, color: color } );
    var l3 = selectTools.line().stroke( { width: 1, color: color } );
    var l4 = selectTools.line().stroke( { width: 1, color: color } );
    selectTools.hide();

    selectTools.update = function ( w, h ) {
        rect.size( w, h )
            .move( -0.5 * w, -0.5 * h )
            ;

        var len = 10;
        l1.plot(  0.0, -0.5 * h, 0, -0.5 * h + len );
        l2.plot(  0.0,  0.5 * h, 0,  0.5 * h - len );
        l3.plot( -0.5 * w, 0.0, -0.5 * w + len, 0 );
        l4.plot(  0.5 * w, 0.0,  0.5 * w - len, 0 );
    };

    this._selectTools = selectTools;
});
Fire.gizmos['Fire.Camera'] = CameraGizmo;

//
CameraGizmo.prototype.remove = function () {
    this._icon.remove();
    this._selectTools.remove();
};

//
CameraGizmo.prototype.contains = function ( svgElements ) {
    for ( var j = 0; j < svgElements.length; ++j ) {
        if ( this._icon.node === svgElements[j] ) {
            return true;
        }
    }
};

//
CameraGizmo.prototype.update = function () {
    if ( !this.target.isValid )
        return;

    var zoom = this._svg.view.height / this._svg.camera.size;

    var localToWorld = this.target.entity.transform.getLocalToWorldMatrix();
    var worldpos = new Fire.Vec2(localToWorld.tx, localToWorld.ty);
    var screenpos = this._svg.camera.worldToScreen(worldpos);
    screenpos.x = Fire.GizmosUtils.snapPixel(screenpos.x);
    screenpos.y = Fire.GizmosUtils.snapPixel(screenpos.y);
    var rotation = -this.target.entity.transform.worldRotation;

    var s = Math.max( zoom, 0.5 );
    this._icon.scale(s,s);
    this._icon.translate( screenpos.x, screenpos.y )
              .rotate( rotation, screenpos.x, screenpos.y )
              ;

    if ( this.hovering || this.selecting ) {
        var gameViewSize = Fire.Engine.screenSize;
        var height = this.target.size * zoom;
        var width = gameViewSize.x/gameViewSize.y * height;

        this._selectTools.show();
        this._selectTools.update( width, height );
        this._selectTools.translate( screenpos.x, screenpos.y )
                       .rotate( rotation, screenpos.x, screenpos.y )
                       ;
    }
    else {
        this._selectTools.hide();
    }
};

Fire.CameraGizmo = CameraGizmo;
