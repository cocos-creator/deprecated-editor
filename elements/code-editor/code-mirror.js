var Fs = require("fire-fs");

Polymer({
    value: null,
    mode: 'javascript',
    theme: 'solarized dark',
    tabSize: 4,
    keyMap: 'sublime',
    lineNumbers: true,
    filePath: "",
    uuid: "",

    created: function () {
        this.cursor = {
            "ln" : 0,
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
            dragDrop: false,
            tabSize: this.tabSize,
            lineNumbers: this.lineNumbers,
            foldGutter: true,
            matchBrackets: true,
            styleActiveLine: true,
            autoCloseBrackets: true,
            showCursorWhenSelecting: true,
            keyMap: this.keyMap,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        });

        this.mirror.on('focus',function () {
        }.bind(this));

        this.mirror.on('change',function () {
        }.bind(this));

        this.mirror.on('cursorActivity',function () {
            this.cursor = this.mirror.getCursor();
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
});
