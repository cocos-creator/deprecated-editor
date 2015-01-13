Polymer({
    value: '',
    mode: 'javascript',
    theme: 'zenburn',
    tabSize: 4,
    lineNumbers: true,

    ready: function() {
        this.mirror = CodeMirror(this.shadowRoot, {
            value: this.value,
            mode: this.mode,
            theme: this.theme,
            tabSize: this.tabSize,
            lineNumbers: this.lineNumbers,
            foldGutter: true,
            matchBrackets: true,
            styleActiveLine: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
        });
    },

    refresh: function() {
        this.mirror.refresh();
    },

    valueChanged: function() {
        this.mirror.setValue(this.value);
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
    }
});
