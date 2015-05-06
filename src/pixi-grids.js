function _snapPixel (p) {
    return Math.floor(p);
}

function _smooth (t) {
    return t;
    // return ( t === 1.0 ) ? 1.0 : 1.001 * ( 1.0 - Math.pow( 2, -10 * t ) );
}

function Grids () {
    this.view = {
        width: 0,
        height: 0,
    };
}

Grids.prototype.setGraphics = function ( graphics ) {
    this.graphics = graphics;
};

Grids.prototype.setCamera = function ( camera ) {
    this.camera = camera;
};

Grids.prototype.resize = function ( width, height ) {
    this.view.width = width;
    this.view.height = height;
};

Grids.prototype.update = function () {
    var i = 0;
    // var center = this.renderContext.camera.worldToScreen( 0.0, 0.0 );
    // origin.center( center.x, center.y );

    var tickUnit = 100;
    var tickCount = 10;
    var tickDistance = 10;

    var nextTickCount = 1;
    var curTickUnit = tickUnit;
    var ratio = 1.0;
    var trans;
    var camera = {
        position: {
            x: this.camera.transform.position.x,
            y: this.camera.transform.position.y
        },
        scale: this.view.height / this.camera.size,
        screenToWorld: this.camera.screenToWorld.bind(this.camera),
        worldToScreen: this.camera.worldToScreen.bind(this.camera),
    };

    if ( camera.scale >= 1.0 ) {
        while ( tickDistance*nextTickCount < tickUnit*camera.scale ) {
            nextTickCount = nextTickCount * tickCount;
        }
        curTickUnit = tickUnit/nextTickCount * tickCount;
        ratio = (tickUnit*camera.scale) / (tickDistance*nextTickCount);
    }
    else if ( camera.scale < 1.0 ) {
        while ( tickDistance/nextTickCount > tickUnit*camera.scale ) {
            nextTickCount = nextTickCount * tickCount;
        }
        curTickUnit = tickUnit*nextTickCount;
        ratio = (tickUnit*camera.scale) / (tickDistance/nextTickCount);
        ratio /= 10.0;
    }
    ratio = (ratio - 1.0/tickCount) / (1.0 - 1.0/tickCount);

    var start = camera.screenToWorld ( new Fire.Vec2(0, 0) );
    var end = camera.screenToWorld ( new Fire.Vec2(this.view.width, this.view.height) );

    var start_x = Math.ceil(start.x/curTickUnit) * curTickUnit;
    var end_x = end.x;
    var start_y = Math.ceil(end.y/curTickUnit) * curTickUnit;
    var end_y = start.y;

    this.graphics.clear();
    this.graphics.beginFill(0x555555);

    // draw x lines
    var tickIndex = Math.round(start_x/curTickUnit);
    for ( var x = start_x; x < end_x; x += curTickUnit ) {
        if ( tickIndex % tickCount === 0 ) {
            this.graphics.lineStyle(1, 0x555555, 1.0);
        }
        else {
            this.graphics.lineStyle(1, 0x555555, _smooth(ratio));
        }
        ++tickIndex;

        trans = camera.worldToScreen( new Fire.Vec2(x, 0.0) );
        this.graphics.moveTo( _snapPixel(trans.x), -1.0 );
        this.graphics.lineTo( _snapPixel(trans.x), this.view.height );
    }

    // draw y lines
    tickIndex = Math.round(start_y/curTickUnit);
    for ( var y = start_y; y < end_y; y += curTickUnit ) {
        if ( tickIndex % tickCount === 0 ) {
            this.graphics.lineStyle(1, 0x555555, 1.0);
        }
        else {
            this.graphics.lineStyle(1, 0x555555, _smooth(ratio));
        }
        ++tickIndex;

        trans = camera.worldToScreen( new Fire.Vec2(0.0, y) );
        this.graphics.moveTo( 0.0, _snapPixel(trans.y) );
        this.graphics.lineTo( this.view.width, _snapPixel(trans.y) );
    }
    this.graphics.endFill();
};

Editor.Grids = Grids;
