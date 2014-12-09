(function () {

    function _binaryIndexOf ( elements, key ) {
        var lo = 0;
        var hi = elements.length - 1;
        var mid, el;

        while (lo <= hi) {
            mid = ((lo + hi) >> 1);
            name = elements[mid].name + elements[mid].extname;

            if (name < key) {
                lo = mid + 1;
            } 
            else if (name > key) {
                hi = mid - 1;
            }
            else {
                return mid;
            }
        }
        return lo;
    }

    function _binaryInsert( parentEL, el ) {
        var idx = _binaryIndexOf( parentEL.children, el.name + el.extname );
        if ( idx === -1 ) {
            parentEL.appendChild(el);
        }
        else {
            parentEL.insertBefore(el, parentEL.children[idx]);
        }
    }

    Polymer({
        publish: {
            selected: {
                value: false,
                reflect: true
            },
            conflicted: {
                value: false,
                reflect: true
            },
            highlighted: {
                value: false,
                reflect: true
            },
            invalid: {
                value: false,
                reflect: true
            },
        },

        created: function () {
            this.super();

            this._isToggle = false;
            this._isShift = false;

            this.extname = '';
            this.isFolder = false;
            this.isRoot = false;
        },

        addChild: function (child) {
            _binaryInsert ( this, child );

            this.foldable = true;
        },

        hint: function () {
            var computedStyle = window.getComputedStyle(this.$.bar);
            this.$.bar.animate([
                { background: "white", transform: "scale(1.2)" },
                { background: computedStyle.backgroundColor, transform: "scale(1)" }
            ], {
                duration: 300
            });
        },

        mousedownAction: function ( event ) {
            this.super([event]);
            if (event.cancelBubble) {
                return;
            }

            // if this is not the mouse-left-button
            if ( event.which !== 1 )
                return;

            this._isToggle = false;
            this._isShift = false;

            if ( event.shiftKey ) {
                this._isShift = true;
            }
            else if ( event.metaKey || event.ctrlKey ) {
                this._isToggle = true;
            }

            this.fire('selecting', { 
                toggle: this._isToggle, 
                shift: this._isShift,
                x: event.x,
                y: event.y,
            } );

            event.stopPropagation();
        },

        mouseupAction: function ( event ) {
            this.super([event]);
            if (event.cancelBubble) {
                return;
            }

            // if this is not the mouse-left-button
            if ( event.which !== 1 )
                return;

            this.fire('select', { 
                toggle: this._isToggle, 
                shift: this._isShift
            } );

            event.stopPropagation();
        },
    });
})();
