Polymer({
    publish: {
        items: [],
        isMac: false
    },

    created: function () {
        if (Fire.isDarwin) {
            this.isMac = true;
        }
    },

    platform: function (value) {
        if (!this.isMac) {
            return value = value.replace('⌘','Ctrl').replace('⇧','Shift').replace('⌥','Alt');
        }
        return value;
    },
});
