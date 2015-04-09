var GizmosUtils = {};

GizmosUtils.snapPixel = function (p) {
    return Math.floor(p) + 0.5;
};

GizmosUtils.getCenter = function ( entities ) {
    var minX = null, minY = null, maxX = null, maxY = null;
    for ( var i = 0; i < entities.length; ++i ) {
        var v, entity = entities[i], found = false;

        for ( c = 0; c < entity._components.length; ++c ) {
            var component = entity._components[c];
            if ( component instanceof Fire.Renderer ) {
                var bounds = component.getWorldOrientedBounds();

                for ( var j = 0; j < bounds.length; ++j ) {
                    v = bounds[j];

                    if ( minX === null || v.x < minX )
                        minX = v.x;
                    if ( maxX === null || v.x > maxX )
                        maxX = v.x;

                    if ( minY === null || v.y < minY )
                        minY = v.y;
                    if ( maxY === null || v.y > maxY )
                        maxY = v.y;
                }
                found = true;
                break;
            }
        }

        if ( !found ) {
            v = entity.transform.worldPosition;

            if ( !minX || v.x < minX )
                minX = v.x;
            if ( !maxX || v.x > maxX )
                maxX = v.x;

            if ( !minY || v.y < minY )
                minY = v.y;
            if ( !maxY || v.y > maxY )
                maxY = v.y;
        }
    }

    var centerX = (minX + maxX) * 0.5;
    var centerY = (minY + maxY) * 0.5;

    return new Fire.Vec2( centerX, centerY );
};

Editor.GizmosUtils = GizmosUtils;
