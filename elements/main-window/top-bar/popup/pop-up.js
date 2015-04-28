Polymer({
    publish: {
        userObj: null,
    },
    userName: "",
    hide: false,
    topBar: null,

    domReady: function () {
        if (this.userObj) {
            this.userName = this.userObj.username;
        }
    },

    hideChanged: function () {
        if (this.hide) {
            this.style.display = 'none';
            EditorUI.removeHitGhost();
        }
        else {
            this.style.display = 'block';
        }
    },

    AccountManage: function () {
        this.hide = true;
        var shell = require('shell');
        shell.openExternal('http://fireball-x.com/user/edit');
    },

    loginOut: function () {
        this.hide = true;
        Editor.logout(function (res){
            Editor.sendToWindows('editor:user-info-changed', {
                'token': null,
                'user-info': null,
            });

            this.userObj = Editor.userInfo;
            this.userName = "";
            this.topBar.resetAvatar();
        }.bind(this));
    },
});
