Fire.Gizmo = (function () {

    function _checkContainsRecursively ( el, svgElements ) {
        for ( var i = 0; i < el.children; ++i ) {
            var childEL = el.children[i];
            for ( var j = 0; j < svgElements.length; ++j ) {
                if ( childEL === svgElements[j] ) {
                    return true;
                }
            }
            if ( _checkContainsRecursively( childEL, svgElements ) ) {
                return false;
            }
        }

        return false;
    }

    function Gizmo ( svg, target, options ) {
        this.target = target;

        if ( options ) {
            Fire.merge( this, options );
        }

        if ( this.selecting === undefined ) this.selecting = false;
        if ( this.editing === undefined ) this.editing = false;
        if ( this.hitTest === undefined ) this.hitTest = false;

        this._svg = svg;
        this._root = null;
        this._position = new Fire.Vec2(0,0);
        this._rotation = 0;
        this._scale = new Fire.Vec2(1,1);
    }
    Fire.registerClass('Fire.Gizmos', Gizmos);

    // used in hitTest
    Object.defineProperty(Gizmo.prototype, 'entity', { get: function () { return null; } });

    // used in gizmos update
    Gizmo.prototype.update = function () {
    };

    // 
    Gizmo.prototype.contains = function ( svgElements ) {
        if ( this._root ) {
            return _checkContainsRecursively( this._root, svgElements );
        }
        return false;
    };

    // 
    Gizmo.prototype.dirty = function () {
        var e = new CustomEvent('gizmosdirty');
        this._root.dispatchEvent(e); 
    };

    return Gizmo;
})();

