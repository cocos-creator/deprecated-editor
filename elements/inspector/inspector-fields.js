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

    
    function _getTypeName ( target, propName, attrs ) {
        var type = attrs.type;
        if ( type === 'object' ) {
            type = Fire.getClassName( attrs.objectType );
        }
        type = type || '';
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

                var type = _getTypeName(target, propName, attrs);
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

    function _entitySection ( target ) {
        var sectionEL = document.createElement('div'); 
        sectionEL.classList.add('entity-section');
        sectionEL.setAttribute('flex-row','');

        var el = new FireCheckbox();
        el.bind( 'value', new PathObserver(target,'active') );
        el.setAttribute( 'value', '{{value}}' );
        sectionEL.appendChild( el );

        el = document.createElement('span'); 
        el.classList.add('space');
        sectionEL.appendChild( el );

        el = new FireTextInput();
        el.bind( 'value', new PathObserver(target,'name') );
        el.setAttribute( 'value', '{{value}}' );
        el.setAttribute('flex-1','');
        el.placeholder = "No Name";
        sectionEL.appendChild( el );

        return sectionEL;
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
                el = _entitySection( this.target );
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
