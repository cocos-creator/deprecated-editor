(function () {
    Polymer({
        publish: {
            focused: {
                value: false,
                reflect: true
            },
        },

        created: function () {
            this.focused = false;
        },

        ready: function () {
            this.tabIndex = EditorUI.getParentTabIndex(this)+1;
        },

        inspect: function ( obj ) {
            if ( this.$.fields.target !== obj ) {
                this.$.fields.target = obj;
            }
        },
    });
})();
