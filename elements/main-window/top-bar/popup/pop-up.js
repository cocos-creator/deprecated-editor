var Ipc = require('ipc');

Polymer({
    userName: "",
    hide: true,
    isLogin: false,
    topBar: null,

    domReady: function () {
        if (Editor.userInfo && Editor.userInfo.username) {
            this.userName = Editor.userInfo.username;
        }

        Ipc.on('popup:login',function(detail) {
            if (Editor.userInfo && Editor.userInfo.username) {
                this.userName = Editor.userInfo.username;
            }

            if (Editor.userInfo && Editor.userInfo.avatarurl) {
                this.topBar.avatar = Editor.userInfo.avatarurl;
            }
        }.bind(this));
    },

    hideChanged: function () {
        if (this.hide) {
            this.style.display = 'none';
            EditorUI.removeHitGhost();
        }
        else {
            this.style.display = 'block';
            EditorUI.addHitGhost('cursor', '998', function () {
                this.hide = true;
                EditorUI.removeHitGhost();
            }.bind(this));
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

            this.userName = "";
            this.topBar.resetAvatar();
            this.isLogin = false;
        }.bind(this));
    },
});
