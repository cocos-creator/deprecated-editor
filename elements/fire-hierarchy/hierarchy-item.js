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
        hover: {
            value: false,
            reflect: true
        },
    },

    created: function () {
        this.super();

        this._isToggle = false;
        this._isShift = false;

        this.renaming = false;
    },

    mouseenterAction: function ( event ) {
        Editor.Selection.hoverEntity(this.userId);
        event.stopPropagation();
    },

    mouseleaveAction: function ( event ) {
        Editor.Selection.hoverEntity(null);
        event.stopPropagation();
    },
});
