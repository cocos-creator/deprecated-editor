Polymer({
    keySettings: null,
    popUp: null,
    mask: null,
    helpAction: function () {
        if (!this.keySettings) {
            this.keySettings = new KeySettings();
            document.body.appendChild(this.keySettings);
        }
        else {
            this.keySettings.show();
        }

    },

    popUpSettings: function () {
        if ( !this.popUp ) {
            this.popUp = new PopUp();
            this.popUp.userObj = Editor.userInfo;
            document.body.appendChild(this.popUp);
        }
        else {
            if ( !this.popUp.hide ) {
                this.popUp.hide = true;
            }
            else {
                this.popUp.hide = false;
            }
        }

        EditorUI.addHitGhost('cursor', '998', function () {
            this.popUp.hide = true;
            EditorUI.removeHitGhost();
        }.bind(this));

    },
});
