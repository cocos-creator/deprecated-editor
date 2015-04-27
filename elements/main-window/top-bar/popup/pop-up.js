Polymer({
    publish: {
        userObj: null,
    },
    hide: false,

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

    doAction: function () {

    },

    loginOut: function () {
        this.hide = true;
        Editor.logout(function (){
            console.log('log out');
        });
    },
});
