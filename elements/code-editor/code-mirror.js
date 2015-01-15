Polymer({
    value: '',
    mode: 'javascript',
    theme: 'solarized dark',
    tabSize: 4,
    lineNumbers: true,

    refresh: function() {
        this.mirror.refresh();
    },

    ready: function () {
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
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        });


        this.mirror.on('focus',function () {
            console.log('focus');
        });
    },

    domReady: function () {
        this.mirror.on('change',function () {
            this.updateLineCount();
        }.bind(this));
    },

    valueChanged: function() {
        this.mirror.setValue(this.value);
    },

    updateLineCount: function () {
        console.log(this.mirror.lineCount());
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

    focus: function() {
        this.mirror.focus();
    },
});
