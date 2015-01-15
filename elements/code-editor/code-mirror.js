var Fs = require("fire-fs");

Polymer({
    value: '',
    mode: 'javascript',
    theme: 'zenburn',
    tabSize: 4,
    keyMap: 'sublime',
    lineNumbers: true,
    owner: null,
    filePath: "",
    uuid: "",

    ready: function () {
    },

    domReady: function () {
    },

    refresh: function() {
        this.mirror.refresh();
    },

    valueChanged: function() {
        if (this.mirror !== undefined){
            this.mirror.setValue(this.value);
        }
        else {
            this.createEditor();
        }
    },

    createEditor: function () {
        this.mirror = CodeMirror(this.shadowRoot, {
            value: this.value,
            mode: this.mode,
            theme: this.theme,
            scroll: false,
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
        });

        this.mirror.on('change',function () {
        }.bind(this));

        this.mirror.on('cursorActivity',function () {
            this.owner.cursor = this.mirror.getCursor();
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

    //NOTE: 统一修改右下角通知
    tipToast: function (text) {
        this.owner.$.tip.innerHTML = text;
    },

    focus: function() {
        this.mirror.focus();
    },

    //NOTE:comment your select line(注释选中行)
    lineComment: function () {
        var range = { from: this.mirror.getCursor(true), to: this.mirror.getCursor(false) };
        this.mirror.lineComment(range.from, range.to);
    },

    //NOTE: auto format
    autoFormat: function () {
        var range = { from: this.mirror.getCursor(true), to: this.mirror.getCursor(false) };
        this.mirror.autoFormatRange(range.from, range.to);
    },

    //NOTE: Save to file
    saveModifed: function () {
        Fs.writeFile(this.filePath, this.mirror.getValue(), 'utf8', function ( err ) {
            if ( err ) {
                Fire.error( err.message );
                return;
            }

            this.tipToast("save success!");

            // TEMP HACK
            Fire.sendToAll('asset:changed', this.uuid);
            Fire.sendToAll('asset-db:synced');
        }.bind(this));
    },
});
