var Fs = require("fire-fs");

Polymer({
    publish: {
        Cursor: {"line":0,"ch":0},
        keyMapValue: 0,
        themeValue: 30,
    },

    created: function () {
        var url = "";
        var queryString = decodeURIComponent(location.search.substr(1));
        var queryList = queryString.split('&');
        for ( var i = 0; i < queryList.length; ++i ) {
            var pair = queryList[i].split("=");
            if ( pair[0] === "url" ) {
                url = pair[1];
            }
        }

        // DISABLE
        // var client = new XMLHttpRequest();
        // client.open('GET', url);
        // client.onreadystatechange = function() {
        //     this.$.mirror.value = client.responseText;
        // }.bind(this);
        // client.send();

        var fspath = Fire.AssetDB._fspath(url);
        Fs.readFile(fspath, 'utf8', function ( err, data ) {
            this.$.mirror.owner = this;
            this.$.mirror.value = data;
            this.$.mirror.filePath = fspath;
        }.bind(this));

        this.fileName = fspath;
    },

    ready: function () {

        //NOTE: 这里以后改成加载配置文件
        var keyMapOptions = [
            {"name":"sublime","value":0},
            {"name":"vim","value":1},
            {"name":"emacs","value":2},
        ];
        var ThemeOptions = [
            {"name":"3024-day","value":0},
            {"name":"3024-night","value":1},
            {"name":"ambiance-mobile","value":2},
            {"name":"ambiance","value":3},
            {"name":"base16-dark","value":4},
            {"name":"base16-light","value":5},
            {"name":"blackboard","value":6},
            {"name":"cobalt","value":7},
            {"name":"eclipse","value":8},
            {"name":"elegant","value":9},
            {"name":"erlang-dark","value":10},
            {"name":"lesser-dark","value":11},
            {"name":"mbo","value":12},
            {"name":"mdn-like","value":13},
            {"name":"midnight","value":14},
            {"name":"monokai","value":15},
            {"name":"neat","value":16},
            {"name":"neo","value":17},
            {"name":"night","value":18},
            {"name":"paraiso-dark","value":19},
            {"name":"pastel-on-dark","value":20},
            {"name":"rubyblue","value":21},
            {"name":"solarized dark","value":22},
            {"name":"the-matrix","value":23},
            {"name":"tomorrow-night-bright","value":24},
            {"name":"tomorrow-night-righties","value":25},
            {"name":"twilight","value":26},
            {"name":"vibrant-ink","value":27},
            {"name":"xq-dark","value":28},
            {"name":"xq-light","value":29},
            {"name":"zenburn","value":30},
            {"name":"solarized light","value":31},
        ];

        this.updateSize();
        this.$.keymapSelect.options = keyMapOptions;
        this.$.themeSelect.options = ThemeOptions;
        this.$.keymapSelect.value = 0;
        this.$.themeSelect.value = 30;
    },

    updateSize: function () {
        window.requestAnimationFrame ( function () {
            this.$.codeArea.style.height = this.getBoundingClientRect().height-51 +"px";
            this.updateSize();
        }.bind(this) );
    },

    comment: function () {
        this.$.mirror.lineComment();
    },

    autoFormat: function () {
        this.$.mirror.autoFormat();
    },

    keyMapValueChanged: function () {
        var key = this.$.keymapSelect.options[this.keyMapValue].name;
        this.$.mirror.keyMap = key;
    },

    save: function () {
        this.$.mirror.saveModifed();
    },

    themeValueChanged: function () {
        var theme = this.$.themeSelect.options[this.themeValue].name;
        console.log(theme);
        this.$.mirror.theme = theme;
    },

});
