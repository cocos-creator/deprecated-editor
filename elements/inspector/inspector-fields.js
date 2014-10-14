(function () {
    var numberIsNaN = global.Number.isNaN || function(value) {
        return typeof value === 'number' && global.isNaN(value);
    };
    function _fireEquals(left, right) {
        if ( left.equals )
            return left.equals(right);

        if ( right.equals )
            return right.equals(left);

        if ( left === right )
            return left !== 0 || 1 / left === 1 / right;

        if ( numberIsNaN(left) && numberIsNaN(right) )
            return true;

        return left !== left && right !== right;
    }

    function FireObserver ( object, path ) {
        PathObserver.call(this, object, path);
    }
    Fire.extend( FireObserver, PathObserver );
    FireObserver.prototype.check_ = function(changeRecords, skipChanges) {
        var oldValue = this.value_;
        this.value_ = this.path_.getValueFrom(this.object_);
        if (skipChanges || _fireEquals(this.value_, oldValue))
            return false;

        this.report_([this.value_, oldValue, this]);
        return true;
    };

    
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

    function _fieldSection ( name, target ) {
        //
        var fireSectionEL = new FireSection();
        fireSectionEL.setAttribute('name', name );

        var klass = target.constructor;
        if (klass.__props__) {
            for (var p = 0; p < klass.__props__.length; p++) {
                var propName = klass.__props__[p];
                var attrs = Fire.attr(klass, propName);

                // skip hide-in-inspector
                if ( attrs.hideInInspector ) {
                    continue;
                }

                var type = _getType(target, propName, attrs);
                var propEL = new FireProp();
                if ( attrs.displayName ) {
                    propEL.name = attrs.displayName;
                }
                else {
                    propEL.name = EditorUI.camelCaseToHuman(propName);
                }
                
                //
                propEL.bind( 'value', new FireObserver( target, propName ) );
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

        return fireSectionEL;
    }

    Polymer({
        created: function () {
            this.target = null;
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
            var el;
            if ( this.target instanceof Fire.Importer ) {
                el = _fieldSection( "Properties", this.target );
                this.appendChild( el );
            }
            else if ( this.target instanceof Fire.Entity ) {
                el = _fieldSection( "Entity", this.target );
                this.appendChild( el );

                for ( var i = 0; i < this.target._components.length; ++i ) {
                    var comp = this.target._components[i];
                    el = _fieldSection( Fire.getClassName(comp), comp );
                    this.appendChild( el );
                }
            }
        },

        paintEntity: function () {
        },
    });
})();
