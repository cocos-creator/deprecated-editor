(function () {
    Polymer({
        publish: {
            target: null,
        },

        created: function () {
        },

        ready: function () {
        },

        refresh: function () {
            if ( !this.target ) {
                return;
            }

            // remove all children
            while (this.firstElementChild) {
                this.removeChild(this.firstElementChild);
            }

            //
            var fireSectionEL = new FireSection();
            fireSectionEL.setAttribute('name', 'Properties' );
            this.appendChild( fireSectionEL );

            var klass = this.target.constructor;
            if (klass.__props__) {
                for (var p = 0; p < klass.__props__.length; p++) {
                    var propName = klass.__props__[p];
                    var attrs = Fire.attr(klass, propName);

                    // skip hide-in-inspector
                    if ( attrs.hideInInspector ) {
                        continue;
                    }

                    var type = _getType(this.target, propName, attrs);
                    var propEL = new FireProp();
                    if ( attrs.displayName ) {
                        propEL.name = attrs.displayName;
                    }
                    else {
                        propEL.name = EditorUI.camelCaseToHuman(propName);
                    }
                    propEL.bind( 'value', new PathObserver( this.target, propName ) );
                    propEL.setAttribute( 'value', '{{target.'+propName+'}}' );
                    propEL.setAttribute( 'type', type );
                    if ( type === 'enum' ) {
                        propEL.enumList = attrs.enumList;
                    }
                    propEL.id = propName;
                    fireSectionEL.$[propName] = propEL;
                    fireSectionEL.appendChild( propEL );
                }
            }
        },

        targetChanged: function () {
            this.refresh();
        },
    });

    function _getType ( target, propName, attrs ) {
        var type = attrs.type;
        if (!type) {
            if ('default' in attrs) {
                // declared by prop
                type = typeof attrs.default;
            }
            else {
                // declared by get
                type = typeof target[propName];
            }
        }
        if ( type === 'number' ) {
            type = 'float';
        }
        return type;
    }
})();
