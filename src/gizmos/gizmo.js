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

    this.hovering = false;
    this.selecting = false;
    this.editing = false;
    this.hitTest = false;
    this.allowMultiTarget = false;

    this._svg = svg;
    this._root = null;
}
Fire.JS.setClassName('Fire.Gizmo', Gizmo);

// used in hitTest
Object.defineProperty(Gizmo.prototype, 'entity', {
    get: function () {
        var target = this.target;
        if ( Array.isArray(target) ) {
            target = target[0];
        }

        if ( target instanceof Fire.Entity )
            return target;
        else if ( target instanceof Fire.Component )
            return target.entity;

        return null;
    }
});

Object.defineProperty(Gizmo.prototype, 'entities', {
    get: function () {
        var entities = [];
        var target = this.target;
        if ( Array.isArray(target) ) {
            for ( var i = 0; i < target.length; ++i ) {
                var t = target[i];
                if ( t instanceof Fire.Entity )
                    entities.push(t);
                else if ( t instanceof Fire.Component )
                    entities.push(t.entity);
            }
        }
        else {
            if ( target instanceof Fire.Entity )
                entities.push(target);
            else if ( target instanceof Fire.Component )
                entities.push(target.entity);
        }

        return entities;
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

Fire.Gizmo = Gizmo;

