Polymer({
    publish: {
        userObj: null,
    },
    hide: false,
    mask: null,

    domReady: function () {
        this.mask = document.createElement('div');
        this.mask.style.width = '100%';
        this.mask.style.height = '100%';
        this.mask.style.position = 'absolute';
        this.mask.style.top = '0px';
        this.mask.style.zIndex = '998';
        this.mask.style.left = '0px';
        this.mask.onclick = function () {
            this.mask.style.display = 'none';
            this.hide = true;
        }.bind(this);
        document.body.appendChild(this.mask);
    },

    hideChanged: function () {
        if (this.hide) {
            this.style.display = 'none';
            this.mask.style.display = 'none';
        }
        else {
            this.style.display = 'block';
            this.mask.style.display = 'block';
        }
    },

    AccountManage: function () {
        this.hide = true;
        var shell = require('shell');
        shell.openExternal('http://fireball-x.com/user/edit');
    },

    loginOut: function () {
        this.hide = true;
        Editor.logout(function (){
            console.log('log out');
        });
    },
});
