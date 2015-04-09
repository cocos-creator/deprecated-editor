function _smooth (t) {
    return ( t === 1.0 ) ? 1.0 : 1.001 * ( 1.0 - Math.pow( 2, -10 * t ) );
}

function SvgGrids ( svgEL ) {
    this.svg = SVG(svgEL);

    var xaxis = this.svg.group();
    xaxis.addClass("x-axis");
    this.xaxis = xaxis;

    var yaxis = this.svg.group();
    yaxis.addClass("y-axis");
    this.yaxis = yaxis;

    this.xlines = [];
    this.ylines = [];

    this.view = {
        width: 0,
        height: 0,
    };
}

SvgGrids.prototype.setCamera = function ( camera ) {
    this.camera = camera;
};

SvgGrids.prototype.resize = function ( width, height ) {
    this.svg.size( width, height );
    this.view.width = width;
    this.view.height = height;
};

SvgGrids.prototype.update = function () {
    var i = 0;
    var cur_idx = 0;
    var line = null;
    var xlines = this.xlines;
    var ylines = this.ylines;
    var xaxis = this.xaxis;
    var yaxis = this.yaxis;

    // var center = this.renderContext.camera.worldToScreen( 0.0, 0.0 );
    // origin.center( center.x, center.y );

    var tickUnit = 100;
    var tickCount = 10;
    var tickDistance = 50;

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

    // draw x lines
    var tickIndex = Math.round(start_x/curTickUnit);
    for ( var x = start_x; x < end_x; x += curTickUnit ) {
        if ( cur_idx < xlines.length ) {
            line = xlines[cur_idx];
        }
        else {
            line = this.svg.line( 0, 0, 0, this.view.height );
            xlines.push(line);
            xaxis.add(line);
        }
        ++cur_idx;

        if ( tickIndex % tickCount === 0 ) {
            line.opacity(1.0);
        }
        else {
            line.opacity(_smooth(ratio));
        }
        ++tickIndex;

        trans = camera.worldToScreen( new Fire.Vec2(x, 0.0) );
        trans.y = 0.0;
        line.plot( 0, 0, 0, this.view.height ).stroke("#555").transform(trans);
    }
    // remove unused x lines
    for ( i = cur_idx; i < xlines.length; ++i ) {
        xlines[i].remove();
    }
    xlines.splice(cur_idx);

    // draw y lines
    cur_idx = 0;
    tickIndex = Math.round(start_y/curTickUnit);
    for ( var y = start_y; y < end_y; y += curTickUnit ) {
        if ( cur_idx < ylines.length ) {
            line = ylines[cur_idx];
        }
        else {
            line = this.svg.line( 0, 0, this.view.width, 0 );
            ylines.push(line);
            yaxis.add(line);
        }
        ++cur_idx;

        if ( tickIndex % tickCount === 0 ) {
            line.opacity(1.0);
        }
        else {
            line.opacity(_smooth(ratio));
        }
        ++tickIndex;

        trans = camera.worldToScreen( new Fire.Vec2(0.0, y) );
        trans.x = 0.0;
        line.plot( 0, 0, this.view.width, 0 ).stroke("#555").transform(trans);
    }
    // remove unused y lines
    for ( i = cur_idx; i < ylines.length; ++i ) {
        ylines[i].remove();
    }
    ylines.splice(cur_idx);
};

Editor.SvgGrids = SvgGrids;
