var Fs = require("fire-fs");
var Remote = require("remote");

var keymaps = [
    "sublime",
    "vim",
    "emacs",
];

var themes = [
    "3024-day"                ,
    "3024-night"              ,
    "ambiance"                ,
    "ambiance-mobile"         ,
    "base16-dark"             ,
    "base16-light"            ,
    "blackboard"              ,
    "cobalt"                  ,
    "eclipse"                 ,
    "elegant"                 ,
    "erlang-dark"             ,
    "lesser-dark"             ,
    "mbo"                     ,
    "mdn-like"                ,
    "midnight"                ,
    "monokai"                 ,
    "neat"                    ,
    "neo"                     ,
    "night"                   ,
    "paraiso-dark"            ,
    "pastel-on-dark"          ,
    "rubyblue"                ,
    "solarized dark"          ,
    "solarized light"         ,
    "the-matrix"              ,
    "tomorrow-night-bright"   ,
    "tomorrow-night-righties" ,
    "twilight"                ,
    "vibrant-ink"             ,
    "xq-dark"                 ,
    "xq-light"                ,
    "zenburn"                 ,
];

var modes = [
    "javascript",
    "htmlmixed",
    "css",
    "xml",
];

Polymer({
    created: function () {
        this.ipc = new Fire.IpcListener();
        this.settingsPage = null;
    },

    attached: function () {
        this.ipc.on('asset:changed', function ( uuid, name ) {
            // HACK
            if ( name === 'code-editor' )
                return;

            if ( this.$.mirror.uuid === uuid ) {
                var result = window.confirm(this.url + " was modified, do you want to reload?");
                if (result) {
                    this.loadFile();
                }
            }
        }.bind(this) );
    },

    detached: function () {
        this.ipc.clear();
    },

    ready: function () {
        var url = "";
        var queryString = decodeURIComponent(location.search.substr(1));
        var queryList = queryString.split('&');
        for ( var i = 0; i < queryList.length; ++i ) {
            var pair = queryList[i].split("=");
            if ( pair[0] === "url" ) {
                url = pair[1];
            }
        }
        this.url = url;

        //
        this.updateSize();
        this.loadFile();

        this.$.keymapSelect.options = keymaps.map(function ( item ) {
            return { name: item, value: item };
        });

        this.$.themeSelect.options = themes.map(function ( item ) {
            return { name: item, value: item };
        });

        this.$.modeSelect.options = modes.map(function ( item ) {
            return { name: item, value: item };
        });

        window.addEventListener('resize', function() {
            this.updateSize();
        }.bind(this));

        window.addEventListener('unload', function () {
            this.$.mirror.saveConfig();
            if (this.$.mirror.dirty) {
                var result = window.confirm(this.url + " was modified,do you want to save?");
                if (result) {
                    this.$.mirror.save();
                }
            }
        }.bind(this));

        window.addEventListener('beforeunload', function () {
            this.$.mirror.saveConfig();
            if (this.$.mirror.dirty) {
                var result = window.confirm(this.url + " was modified,do you want to save?");
                if (result) {
                    this.$.mirror.save();
                }
            }
        }.bind(this));
    },

    loadFile: function () {
        this.updateTitle();

        var fspath = Fire.AssetDB._fspath(this.url);
        var uuid = Fire.AssetDB.urlToUuid(this.url);
        Fs.readFile(fspath, 'utf8', function ( err, data ) {
            this.$.mirror.value = data;
            this.$.mirror.filePath = fspath;
            this.$.mirror.uuid = uuid;
            this.$.mirror.setting = this.settingsPage;
        }.bind(this));
    },

    updateTitle: function () {
        var browserWindow = Remote.getCurrentWindow();
        if ( browserWindow ) {
            browserWindow.setTitle( this.url + (this.$.mirror.dirty ? "*" : "") );
        }
    },

    updateSize: function () {
        window.requestAnimationFrame ( function () {
            this.$.codeArea.style.height = this.getBoundingClientRect().height-51 + "px";
            this.$.mirror.refresh();
        }.bind(this) );
    },

    saveAction: function () {
        this.$.mirror.save();
    },

    reloadAction: function () {
        this.loadFile();
        this.$.mirror.reloadAction();
    },

    settingsAction: function () {
        if (this.settingsPage === null){
            this.settingsPage = new SettingsPage();
            this.settingsPage.config = this.$.mirror;
            document.body.appendChild(this.settingsPage);
        }

        if (this.settingsPage.hide){
            this.settingsPage.hide = false;
        }
        else {
            this.settingsPage.hide = true;
        }
    },

    autoFormatAction: function () {
        this.$.mirror.autoFormat();
    },

});
