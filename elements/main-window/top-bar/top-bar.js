Polymer({
    publish: {
        keySettings: null,
    },
    helpAction: function () {
        if (!this.keySettings) {
            this.keySettings = new KeySettings();
            document.body.appendChild(this.keySettings);
        }else {
            this.keySettings.show();
        }

    },
});
