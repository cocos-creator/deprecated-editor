Polymer({
    keySettings: null,
    popUp: null,
    mask: null,
    avatar: 'fire://src/editor/main-window/img/avatar-placeholder.jpg',

    domReady: function () {
        if ( Editor.userInfo && Editor.userInfo.avatarurl ) {
            this.avatar = Editor.userInfo.avatarurl;
        }
        this.$.popup.topBar = this;
    },

    resetAvatar: function () {
        this.avatar =  'fire://src/editor/main-window/img/avatar-placeholder.jpg';
    },

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
        if ( Editor.token ) {
            this.$.popup.hide = !this.$.popup.hide;
        }
        else {
            Editor.sendToCore('fire-login:open');
        }
    },
});
