var Fs = require("fire-fs");
var Path = require('fire-path');
var Watch = require('node-watch');

Polymer({
    value: null,
    mode: 'htmlmixed',
    theme: 'solarized dark',
    tabSize: 4,
    keyMap: 'sublime',
    lineNumbers: true,
    filePath: "",
    uuid: "",
    jshintError: "",

    created: function () {
        this.cursor = {
            "line" : 0,
            "ch" : 0
        };
    },

    ready: function () {

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

        this.mirror = CodeMirror(this.shadowRoot, {
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
            lint: true,
            autoCloseBrackets: true,
            showCursorWhenSelecting: true,
            keyMap: this.keyMap,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-lint-markers","CodeMirror-foldgutter","breakpoints"],
        });

        this.mirror.on('change',function () {
            this.updateHints();
        }.bind(this));

        this.mirror.on('focus',function () {
            console.log('focus');
        }.bind(this));

        this.mirror.on('blur',function () {
            console.log('blur');
        }.bind(this));

        this.mirror.on('cursorActivity',function () {
            this.cursor = this.mirror.getCursor();
        }.bind(this));

        switch (Path.extname(this.filePath).toLowerCase()) {
            case ".js" || ".json":
                this.mode = "javascript";
                break;
            case ".html" || ".htm":
                this.mode = "htmlmixed";
                break;
            case ".css" || ".styl":
                this.mode = "css";
                break;
            case ".xml" || ".xaml":
                this.mode = "xml";
                break;
            default:
                this.mode = "";
                break;
        }

        Watch(this.filePath, function(filename) {
            var result = confirm("'"+Path.basename(filename)+"' was modified,do you want to reload?");
            if (result) {
                // NOTE: 这里要发消息给code-editor 实现reload
            }
        }.bind(this));
    },

    keyMapChanged: function () {
        this.mirror.setOption('keyMap', this.keyMap);
    },

    modeChanged: function() {
        this.mirror.setOption('mode', this.mode);
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

    lineComment: function () {
        var range = { from: this.mirror.getCursor(true), to: this.mirror.getCursor(false) };
        this.mirror.lineComment(range.from, range.to);
    },

    autoFormat: function () {
        var range = { from: this.mirror.getCursor(true), to: this.mirror.getCursor(false) };
        this.mirror.autoFormatRange(range.from, range.to);
    },

    save: function () {
        Fs.writeFile(this.filePath, this.mirror.getValue(), 'utf8', function ( err ) {
            if ( err ) {
                Fire.error( err.message );
                return;
            }

            Fire.log( this.filePath + " saved!");

            // TEMP HACK
            Fire.sendToAll('asset:changed', this.uuid);
            Fire.sendToAll('asset-db:synced');
        }.bind(this));
    },

    //
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

                // for (var i =0; i<JSHINT.errors.length; i++) {
                //     var marker = document.createElement("div");
                //     marker.style.color = "red";
                //     marker.innerHTML = "✘";
                //     marker.style.marginLeft = "-10px";
                //     this.mirror.setGutterMarker(JSHINT.errors[i].line, "breakpoints", marker);
                // }
            }
            else {
                this.jshintError = "";
            }
        }.bind(this));
    },
});
