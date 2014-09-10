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
            console.log("refresh...");
            var klass = this.target.constructor;
            if (klass.__props__) {
                for (var p = 0; p < klass.__props__.length; p++) {
                    var propName = klass.__props__[p];
                    var attrs = FIRE.attr(klass, propName);

                    // skip nonSerialized
                    if (attrs.serializable === false) {
                        continue;
                    }

                    var propEL = new FireProp();
                    if ( attrs.displayName ) {
                        propEL.name = attrs.displayName;
                    }
                    else {
                        propEL.name = EditorUI.camelCaseToHuman(propName);
                    }
                    propEL.bind( 'value', new PathObserver( this.target, propName ) );
                    propEL.setAttribute( 'type', attrs.type );
                    if ( attrs.type === 'enum' ) {
                        propEL.enumList = attrs.enumList;
                    }
                    propEL.id = propName;
                    this.$[propName] = propEL;
                    this.appendChild( propEL );
                }
            }
        },

        targetChanged: function () {
            this.refresh();
        },
    });
})();
