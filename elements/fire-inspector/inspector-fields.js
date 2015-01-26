function _getTypeName ( target, propName, attrs ) {
    var type = attrs.type;
    if ( type === 'object' ) {
        type = Fire.getClassName( attrs.objectType );
    }
    type = type || '';
    return type;
}

function _makeWatcher ( attrs, target, propEL ) {
    return function () {
        attrs.watchCallback( target, propEL );
    };
}

function _fieldSection ( name, target ) {
    //
    var fireSectionEL = new FireSection();
    fireSectionEL.setAttribute('name', name );
    fireSectionEL.$ = {};

    var klass = target.constructor;
    if (klass.__props__) {
        for (var p = 0; p < klass.__props__.length; p++) {
            var propName = klass.__props__[p];
            var attrs = Fire.attr(klass, propName);

            // skip hide-in-inspector
            if ( attrs.hideInInspector ) {
                continue;
            }

            var type = _getTypeName(target, propName, attrs);
            var propEL = new FireProp();
            if ( attrs.displayName ) {
                propEL.name = attrs.displayName;
            }
            else {
                propEL.name = EditorUI.camelCaseToHuman(propName);
            }

            propEL.textMode = attrs.textMode;

            //
            propEL.bind( 'value', new Fire._PathObserver( target, propName ) );
            propEL.type = type;
            propEL.setAttribute( 'value', '{{target.'+propName+'}}' );
            if ( type ) {
                propEL.setAttribute( 'type', type );

                if ( type === 'enum' ) {
                    propEL.enumList = attrs.enumList;
                }
            }
            propEL.id = propName;

            //
            if ( attrs.watch && attrs.watchCallback ) {
                if ( attrs.watch.length > 0 ) {
                    var observer = new CompoundObserver();
                    for ( var i = 0; i < attrs.watch.length; ++i ) {
                        observer.addObserver( new Fire._PathObserver( target, attrs.watch[i] ) );
                    }
                    var watcher = _makeWatcher( attrs, target, propEL );
                    observer.open(watcher);

                    // NOTE: we need to invoke it once to make sure our propEL intialize correctly
                    propEL.onFieldCreated = watcher;
                }
            }

            fireSectionEL.$[propName] = propEL;
            fireSectionEL.appendChild( propEL );
        }
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
        if ( this.target instanceof Fire.AssetInspector ||
             this.target instanceof Fire.CustomAsset ) {
            el = _fieldSection( "Properties", this.target );
            this.appendChild( el );
        }
        else if ( this.target instanceof Fire.Entity ) {
            var docfrag = document.createDocumentFragment();

            for ( var i = 0; i < this.target._components.length; ++i ) {
                var comp = this.target._components[i];
                el = _fieldSection( Fire.getClassName(comp), comp );
                docfrag.appendChild(el);
            }

            this.appendChild( docfrag );
        }
    },
});
