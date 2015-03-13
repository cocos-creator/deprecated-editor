Polymer({
    publish: {
        hide: false,
        hotKeys: [
            {name:"File",
            value:[
                {keys:"⌘+N",discription:"Creat New Scene"},
                {keys:"⌘+S",discription:"Save Scene"},
                {keys:"⌘+B",discription:"Build"},
            ],
            },

            {name:"Edit",
            value:[
                {keys:"⌘+Z",discription:"Undo"},
                {keys:"⇧+⌘+Z",discription:"Redo"},
                {keys:"⌘+X",discription:"Cut"},
                {keys:"⌘+C",discription:"Copy"},
                {keys:"⌘+V",discription:"Paste"},
                {keys:"⌘+A",discription:"Select All"},
            ],
            },

            {name:"Window",
            value:[
                {keys:"⌘+M",discription:"Minimize"},
                {keys:"⌘+W",discription:"Close"},
            ],
            },

            {name:"Developer",
            value:[
                {keys:"⌘+R",discription:"Reload"},
                {keys:"F7",discription:"Recompile"},
                {keys:"⌥+⌘+I",discription:"Developer Tools"},
            ],
            },

            {name:"Code-Editor",
            value:[
                {keys:"Tab",discription:"缩进"},
                {keys:"⌘+C",discription:"Copy"},
                {keys:"⌘+V",discription:"Paste"},
                {keys:"⌘+X",discription:"Cut"},
                {keys:"⌘+Z",discription:"Undo"},
                {keys:"⇧+⌘+Z",discription:"Redo"},
                {keys:"⌘+/",discription:"注释选中内容"},
                {keys:"⌘+O",discription:"Auto Formating"},
                {keys:"⌘+S",discription:"Save"},
                {keys:"⌘+R",discription:"Reload File"},
                {keys:"⌘+[",discription:"向左移动选中行"},
                {keys:"⌘+]",discription:"向右移动选中行"},
                {keys:"⌘+KU",discription:"改为大写"},
                {keys:"⌘+L",discription:"选择整行(按住-继续选择下行)"},
                {keys:"⌘+J",discription:"合并选中行"},
            ],
            },
        ],
    },

    ready: function () {
        this.span = document.createElement('div');
        this.span.style.width = '100%';
        this.span.style.height = '100%';
        this.span.style.position = 'absolute';
        this.span.style.opacity = 0.5;
        this.span.style.zIndex = 998;
        this.span.style.background = 'black';
        document.body.appendChild(this.span);

        this.span.onclick = function () {
            this.closeAction();
        }.bind(this);
    },

    hideChanged: function () {
        if (this.hide) {
            this.span.style.display = "none";
            this.style.display = "none";
        }
        else {
            this.span.style.display = "block";
            this.style.display = "block";
        }
    },

    show: function () {
        this.hide = false;
    },

    closeAction: function () {
        this.hide = !this.hide;
    },
});
