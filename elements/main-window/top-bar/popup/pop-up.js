Polymer({
    publish: {
        userObj: null,
    },

    AccountManage: function () {
        var shell = require('shell');
        shell.openExternal('http://fireball-x.com/user/edit');
        this.style.display = 'none';
    },

    loginOut: function () {
        this.style.display = 'none';
        Editor.logout(function (){
            console.log('log out');
        });
    },
});
