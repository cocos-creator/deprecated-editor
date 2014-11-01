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

    function Gizmo ( svg, target ) {
        this.target = target;

        this.selecting = false;
        this.editing = false;
        this.hitTest = false;
        this.allowMultiTarget = false;

        this._svg = svg;
        this._root = null;
    }
    Fire.registerClass('Fire.Gizmo', Gizmo);

    // used in hitTest
    Object.defineProperty(Gizmo.prototype, 'entity', { 
        get: function () { 
            if ( this.target instanceof Fire.Entity )
                return this.target; 
            else if ( this.target instanceof Fire.Component )
                return this.target.entity; 

            return null;
        } 
    });

    // used in gizmos update
    Gizmo.prototype.update = function () {
    };

    // 
    Gizmo.prototype.contains = function ( svgElements ) {
        if ( this._root ) {
            for ( var j = 0; j < svgElements.length; ++j ) {
                if ( this._root.node === svgElements[j] ) {
                    return true;
                }
            }
            return _checkContainsRecursively( this._root.node, svgElements );
        }
        return false;
    };

    //
    Gizmo.prototype.remove = function () {
        this._root.remove();
    };

    // 
    Gizmo.prototype.dirty = function () {
        var e = new CustomEvent('gizmosdirty');
        this._root.node.dispatchEvent(e); 
    };

    return Gizmo;
})();

