var Fs = require("fire-fs");
var Path = require('fire-path');
var Remote = require("remote");

Polymer({
    value: null,
    mode: 'htmlmixed',
    theme: 'zenburn',
    tabSize: 4,
    keyMap: 'sublime',
    lineNumbers: true,
    jshintError: "",
    lineCount: 0,
    fontSize: 12,
    filePath: "",
    uuid: "",
    dirty: false,
    fontFamily: "Arial",
    setting: null,

    created: function () {
        this.cursor = {
            "line" : 0,
            "ch" : 0
        };
    },

    ready: function () {
        var projectPath = Remote.getGlobal('FIRE_PROJECT_PATH');
        this.settingPath = Path.join( projectPath, 'settings' ) + "/code-editor-settings.json";
    },

    domReady: function () {
    },

    refresh: function() {
        if ( this.mirror )
            this.mirror.refresh();
    },

    valueChanged: function() {
        if ( this.mirror ) {
            this.mirror.setValue(this.value);
        }
        else {
            this.createEditor();
        }
    },

    createEditor: function () {
        CodeMirror.commands.save = function () {
            this.save();
        }.bind(this);

        CodeMirror.commands.autoformat = function () {
            this.autoFormat();
        }.bind(this);

        CodeMirror.commands.customSearch = function () {
            alert('serach');
        }.bind(this);

        CodeMirror.commands.increaseFontSize = function () {
            this.fontSize = Math.max( this.fontSize+1, 30 );
        }.bind(this);

        CodeMirror.commands.decreaseFontSize = function () {
            this.fontSize = Math.min( this.fontSize-1, 8 );
        }.bind(this);

        CodeMirror.commands.resetFontSize = function () {
                this.fontSize = 12;
            }.bind(this);

        var mac = CodeMirror.keyMap.default == CodeMirror.keyMap.macDefault;

        var autoformat = (mac ? "Cmd" : "Ctrl") + "-O";
        var search = (mac ? "Cmd" : "Ctrl") + "-F";
        var increaseFontSize = (mac ? "Cmd" : "Ctrl") + "-=";
        var decreaseFontSize = (mac ? "Cmd" : "Ctrl") + "--";
        var resetFontSize = (mac ? "Cmd" : "Ctrl") + "-0";
        var extraKeys = {};

        extraKeys[autoformat] = "autoformat";
        extraKeys[search] = "customSearch";
        extraKeys[increaseFontSize] = "increaseFontSize";
        extraKeys[decreaseFontSize] = "decreaseFontSize";
        extraKeys[resetFontSize] = "resetFontSize";

        this.options = {
            value: this.value,
            mode: this.mode,
            theme: this.theme,
            scroll: false,
            tabSize: this.tabSize,
            lineNumbers: this.lineNumbers,
            foldGutter: true,
            autoCloseTags: true,
            matchBrackets: true,
            styleActiveLine: true,
            autoCloseBrackets: true,
            showCursorWhenSelecting: true,
            keyMap: this.keyMap,
            extraKeys: extraKeys,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-lint-markers","CodeMirror-foldgutter","breakpoints"],
        };
        this.loadConfig(function (err,exists,data){
            this.mirror = CodeMirror(this.shadowRoot,this.options);
            if (err !== null){
                return;
            }

            if (exists){
                this.theme = data.theme;
                this.keyMap = data.keyMap;
                this.tabSize = data.tabSize;
                this.fontSize = data.fontSize;
                this.fontFamily = data.fontFamily;
            }
        }.bind(this));

        this.lineCount = this.mirror.lineCount();
        this.mirror.on('change',function () {
            if (this.mode === "javascript") {
                this.updateHints();
            }
            this.dirty = true;
            this.lineCount = this.mirror.lineCount();
        }.bind(this));

        this.mirror.on('cursorActivity',function () {
            this.cursor = this.mirror.getCursor();
        }.bind(this));
        switch (Path.extname(this.filePath).toLowerCase()) {
            case ".js" :
                this.mode = "javascript";
                break;
            case ".html" :
                this.mode = "htmlmixed";
                break;
            case ".css" :
                this.mode = "css";
                break;
            case ".json" :
                this.mode = "css";
                break;
            case ".xml",".xaml":
                this.mode = "xml";
                break;
            default:
                this.mode = "";
                break;
        }

        if (this.mode === "javascript") {
            this.updateHints();
        }
        this.mirror.focus();
    },

    fontFamilyChanged: function () {
        this.shadowRoot.getElementsByClassName('CodeMirror')[0].style.fontFamily = this.fontFamily;
    },

    keyMapChanged: function () {
        this.mirror.setOption('keyMap', this.keyMap);
    },

    modeChanged: function() {
        this.mirror.setOption('mode', this.mode);
    },

    fontSizeChanged: function () {
        this.shadowRoot.getElementsByClassName('CodeMirror')[0].style.fontSize = this.fontSize + "px";
    },

    themeChanged: function() {
        this.mirror.setOption('theme', this.theme);
    },

    tabSizeChanged: function() {
        this.mirror.setOption('tabSize', this.tabSize);
    },

    lineNumbersChanged: function() {
        this.mirror.setOption('lineNumbers', this.lineNumbers);
    },

    dirtyChanged: function () {
        this.fire('dirty-changed');
    },

    lineComment: function () {
        var range = { from: this.mirror.getCursor(true), to: this.mirror.getCursor(false) };
        this.mirror.lineComment(range.from, range.to);
    },

    autoFormat: function () {
        switch (this.mode) {
            case "javascript":
                this.mirror.setValue(js_beautify(this.mirror.getValue(),this.tabSize,''));
            break;
            case "css":
                var options = {
                    indent: '    ',
                };
                this.mirror.setValue(cssbeautify(this.mirror.getValue(),options));
            break;
            case "htmlmixed":
                this.mirror.setValue(style_html(this.mirror.getValue(),this.tabSize,' ',80));
            break;
        }
    },

    save: function () {
        Fs.writeFile(this.filePath, this.mirror.getValue(), 'utf8', function ( err ) {
            if ( err ) {
                Fire.error( err.message );
                return;
            }

            this.dirty = false;

            // TEMP HACK
            Fire.sendToAll('asset:changed', this.uuid, 'code-editor');
            Fire.sendToAll('asset-db:synced');
        }.bind(this));
    },

    updateHints: function() {
        this.mirror.operation(function(){
            JSHINT(this.mirror.getValue());
            if (JSHINT.errors.length > 0) {
                var errorMsg = "Jshint: [ line " +
                               JSHINT.errors[0].line +
                               " column " + JSHINT.errors[0].character +
                               " " +  JSHINT.errors[0].reason + " ]"
                               ;
                this.jshintError = errorMsg;
                this.jshint = JSHINT;
            }
            else {
                this.jshintError = "";
            }
        }.bind(this));
    },

    saveConfig: function () {
        var config = {
            theme: this.theme,
            tabSize: this.tabSize,
            keyMap: this.keyMap,
            fontSize: this.fontSize,
            fontFamily: this.fontFamily,
        };

        var configValue = JSON.stringify(config, null, 4);
        Fs.writeFile(this.settingPath, configValue, 'utf8', function ( err ) {
            if ( err ) {
                Fire.error( err.message );
                return;
            }
            Fire.log("Save code-editor-config.json");
        }.bind(this));
    },

    loadConfig: function (callback) {
        var result = Fs.existsSync(this.settingPath);
        var data = null;
        var err = null;
        if (result) {
            data = Fs.readFileSync(this.settingPath, 'utf8');
        }
        try{
            data = JSON.parse(data);
        }
        catch (e) {
            data = null;
            err = e;
        }
        callback(err,result,data);
    },
});
