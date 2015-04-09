Polymer({
    publish: {
        name: "",
        path: "",
        blink: false,
    },

    created: function () {
        this.blink = false;
    },

    domReady: function () {
        if ( this.blink ) {
            var computedStyle = window.getComputedStyle(this);
            this.animate([
                { background: "white" },
                { background: computedStyle.backgroundColor }
            ], {
                duration: 200
            });
        }
    },

    openAction: function ( event ) {
        Editor.sendToCore('dashboard:open-project', this.path);
    },

    closeAction: function ( event ) {
        Editor.sendToCore('dashboard:remove-project', this.path);
    },
});
