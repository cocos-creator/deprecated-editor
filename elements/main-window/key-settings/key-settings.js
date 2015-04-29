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

            {name:"Scene View",
            value:[
                {keys:"Shift+Mouse Left",discription:"Panning"},
                {keys:"Mouse Scroll",discription:"Zoom In/Out"},
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
                {keys:"Tab",discription:"Indent"},
                {keys:"⌘+C",discription:"Copy"},
                {keys:"⌘+V",discription:"Paste"},
                {keys:"⌘+X",discription:"Cut"},
                {keys:"⌘+Z",discription:"Undo"},
                {keys:"⇧+⌘+Z",discription:"Redo"},
                {keys:"⌘+/",discription:"Select Comment Contents"},
                {keys:"⌘+O",discription:"Auto Formating"},
                {keys:"⌘+S",discription:"Save"},
                {keys:"⌘+R",discription:"Reload File"},
                {keys:"⌘+[",discription:"Indent Left"},
                {keys:"⌘+]",discription:"Indent Right"},
                {keys:"⌘+KU",discription:"Convert to uppercase"},
                {keys:"⌘+L",discription:"Line Selection"},
                {keys:"⌘+J",discription:"Merge Selected Lines"},
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
