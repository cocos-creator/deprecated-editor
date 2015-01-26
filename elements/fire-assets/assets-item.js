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

        this.extname = '';
        this.isRoot = false;
        this.isFolder = false;
        this.isSubAsset = false;
    },

    addChild: function (child) {
        _binaryInsert ( this, child );
        this.foldable = true;
    },
});
