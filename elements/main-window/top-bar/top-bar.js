Polymer({
    keySettings: null,
    popUp: null,

    helpAction: function () {
        if (!this.keySettings) {
            this.keySettings = new KeySettings();
            document.body.appendChild(this.keySettings);
        }
        else {
            this.keySettings.show();
        }

    },

    profile: function () {
        if (!this.popUp) {
            this.popUp = new PopUp();
            this.popUp.userObj = Editor.userInfo;
            document.body.appendChild(this.popUp);
        }
        else {
            if (this.popUp.style.display !== 'none') {
                this.popUp.style.display = 'none';
            }
            else {
                this.popUp.style.display = 'block';
            }
        }

    },
});
