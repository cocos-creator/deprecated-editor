var Remote = require('remote');
var Ipc = require('ipc');
var Path = require('fire-path');
var Fs = require('fire-fs');

function _getUserDoc() {
    if (!process.env.USERPROFILE) {
        return '';
    }
    var win8 = Path.join(process.env.USERPROFILE, 'Documents');
    if (Fs.existsSync(win8)) {
        return win8;
    }
    var win7 = Path.join(process.env.USERPROFILE, 'My Documents');
    if (Fs.existsSync(win7)) {
        return win7;
    }
    return process.cwd();
}

function _getUserHome() {
    if (Fire.isWin32) {
        return _getUserDoc();
    }
    return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
}

Polymer({
    ready: function () {
        this.name = "New Project";
        this.path = _getUserHome();

        this.items = [];
        this.curSelect = null;

        this._templates = [
            { name: "Fireball", icon: "img/dashboard/fireball.png" },
            { name: "Cocos2D", icon: "img/dashboard/cocos-html5.png" },
        ];
        this._gamekits = [];
    },

    select: function ( item ) {
        if ( this.curSelect )
            this.curSelect.selected = false;

        this.curSelect = item;

        if ( this.curSelect ) {
            this.curSelect.selected = true;
        }
    },

    browseAction: function ( event ) {
        event.stopPropagation();

        var dialog = Remote.require('dialog');

        var result = dialog.showOpenDialog ( {
            title: "Choose a project",
            properties: [ 'openDirectory', 'createDirectory' ]
        } );

        if ( result ) {
            this.path = result[0];
        }
    },

    createAction: function ( event ) {
        event.stopPropagation();

        if ( this.path === '' || this.name === '' )
            return;

        var projectPath = Path.join( this.path, this.name );
        if (Fs.existsSync(projectPath) && Fs.statSync(projectPath).isDirectory()) {
            alert("File already exists!");
            return;
        }

        Fire.sendToCore( 'dashboard:create-project', projectPath );
    },

    templateAction: function ( event ) {
        event.stopPropagation();

        this.items = this._templates;
        this.select(this.items.length > 0 ? this.items[0] : null);
    },

    gamekitsAction: function ( event ) {
        event.stopPropagation();

        this.items = this._gamekits;
        this.select(this.items.length > 0 ? this.items[0] : null);
    },

    selectAction: function ( event ) {
        event.stopPropagation();
        this.select(event.target.item);
    },
});
