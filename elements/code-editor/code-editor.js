var Fs = require("fire-fs");

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
    blur: true,

    created: function () {
        this.loadFile();
        this.settingpage = null;
    },

    ready: function () {
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

        this.updateSize();
    },

    loadFile: function (e) {
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

        var fspath = Fire.AssetDB._fspath(url);
        var uuid = Fire.AssetDB.urlToUuid(url);
        Fs.readFile(fspath, 'utf8', function ( err, data ) {
            this.$.mirror.value = data;
            if (e !== undefined) {
                this.$.mirror.resetValue();
            }
            this.$.mirror.filePath = fspath;
            this.$.mirror.uuid = uuid;
        }.bind(this));
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

    modifiedSave: function () {
        if (this.$.mirror.editStatus) {
            var result = confirm((this.$.mirror.filePath) + " was modified,do you want to save?");
            if (result) {
                this.$.mirror.save();
            }
        }
    },

    blurChanged: function () {
        this.$.mirror.blur = this.blur;
    },

    settings: function () {
        if (this.settingpage === null){
            this.settingpage = new SettingPage()
            this.settingpage.config = this.$.mirror;
            document.body.appendChild(this.settingpage);
        }

        if (this.settingpage.hide){
            this.settingpage.hide = false;
        }
        else {
            this.settingpage.hide = true;
        }
    },

});
