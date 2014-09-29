(function () {
    Polymer({
        publish: {
            folded: false,
            foldable: {
                value: false,
                reflect: true
            },
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
            this._isToggle = false;
            this._isShift = false;

            this.name = '';
            this.isFolder = false;
            this.isRoot = false;

            this.renaming = false;
        },

        domReady: function () {
            // HACK: to make this.$.rename.select() works
            this.$.rename.value = this.name;
        },

        rename: function () {
            this.$.rename.style.display = '';
            this.$.rename.value = this.name;
            this.$.rename.focus();
            this.$.rename.select();

            this.renaming = true;
        },
    });
})();
