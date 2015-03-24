function _fieldSection ( name, target, closable ) {
    //
    var fireSectionEL = new FireSection();
    fireSectionEL.name = name;
    fireSectionEL.closable = closable;
    fireSectionEL.$ = {};

    var isBuiltin = true;
    var isComponent = false;
    if ( target instanceof Fire.Component ) {
        isComponent = true;
        var uuid = target.getScriptUuid();
        if ( uuid ) {
            isBuiltin = false;
        }
    }

    var klass = target.constructor;
    if (klass.__props__) {
        for (var p = 0; p < klass.__props__.length; p++) {
            var propName = klass.__props__[p];
            var attrs = Fire.attr(klass, propName);

            // skip hide-in-inspector
            if ( attrs.hideInInspector ) {
                continue;
            }

            if ( isComponent && isBuiltin && propName === '_scriptUuid' ) {
                continue;
            }

            var propEL = new FireProp();
            propEL.initWithAttrs(target, propName, attrs);

            fireSectionEL.$[propName] = propEL;
            fireSectionEL.appendChild( propEL );
        }
    }

    if ( fireSectionEL.closable ) {
        fireSectionEL.addEventListener('close', function ( event ) {
            event.stopPropagation();
            Fire.sendToMainWindow('engine:remove-component', {
                componentId: target.id
            });
        });
    }

    return fireSectionEL;
}

Polymer({
    created: function () {
        this.target = null;
    },

    refresh: function () {
        // remove all children
        while (this.firstElementChild) {
            this.removeChild(this.firstElementChild);
        }

        if ( !this.target ) {
            return;
        }

        //
        var el;
        if ( this.target instanceof Fire.Asset ) {
            el = _fieldSection( "Asset", this.target, false );
            this.appendChild( el );
        }
        else if ( this.target instanceof Fire.AssetMeta ) {
            el = _fieldSection( "Meta", this.target, false );
            this.appendChild( el );
        }
        else if ( this.target instanceof Fire.Entity ) {
            var docfrag = document.createDocumentFragment();

            for ( var i = 0; i < this.target._components.length; ++i ) {
                var comp = this.target._components[i];
                el = _fieldSection( Fire.JS.getClassName(comp), comp, true );
                docfrag.appendChild(el);
            }

            this.appendChild( docfrag );
        }
    },
});
