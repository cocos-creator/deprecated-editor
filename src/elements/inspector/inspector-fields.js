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

                    // skip editor only when exporting
                    if (self._exporting && attrs.editorOnly) {
                        continue;
                    }

                    // this.target[propName];
                }
            }

            // var fieldEL = new FireField();
            // fieldEL.setAttribute('flex-2','');
            // fieldEL.type = 'int';
            // fieldEL.bind( 'value', new PathObserver(this,'value') );
            // fieldEL.id = "field";
            // this.$.field = fieldEL;

            // this.appendChild( fieldEL );
        },

        targetChanged: function () {
            this.refresh();
        },
    });
})();
