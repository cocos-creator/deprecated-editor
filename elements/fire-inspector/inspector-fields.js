var warningMessage = 'The property %s can not show in inspector, \
because it keeps return new object. \
Please set visible to false in properties define in this class.';

function _fieldSection ( name, target, closable ) {
    //
    var fireSectionEL = new FireSection();
    fireSectionEL.name = name;
    fireSectionEL.closable = closable;
    fireSectionEL.$ = {};

    var isComponent = target instanceof Fire.Component;
    var isBuiltinComp = isComponent && !target._scriptUuid;

    var klass = target.constructor;
    if (klass.__props__) {
        for (var p = 0; p < klass.__props__.length; p++) {
            var propName = klass.__props__[p];
            var attrs = Fire.attr(klass, propName);

            // skip hide-in-inspector
            if ( attrs.hideInInspector ) {
                continue;
            }

            if ( isBuiltinComp && propName === '_scriptUuid' ) {
                continue;
            }

            // NOTE: this protects issues like fireball-x/dev#483
            if ( attrs.hasGetter ) {
                var val1 = target[propName];
                if ( typeof val1 === 'object' && !val1.equals ) {
                    var val2 = target[propName];
                    if ( val1 !== val2 ) {
                        Fire.warn( warningMessage, propName );
                        continue;
                    }
                }
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
                'component-id': target.id
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
            el = _fieldSection( 'Asset', this.target, false );
            this.appendChild( el );
        }
        else if ( this.target instanceof Fire.AssetMeta ) {
            el = _fieldSection( 'Meta', this.target, false );
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
