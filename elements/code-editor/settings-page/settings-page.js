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

Polymer({
    publish: {
        hide: true,
        config: null,
    },

    ready: function () {
        this.span = document.createElement('div');
        this.span.style.width = '100%';
        this.span.style.height = '100%';
        this.span.style.position = 'absolute';
        this.span.style.opacity = 0.5;
        this.span.style.marginTop = '20px';
        this.span.style.zIndex = 998;
        // this.span.style.display = "none";
        this.span.style.background = 'black';
        this.span.addEventListener('click',function (event) {
            this.hide = true;
        }.bind(this));
        document.body.appendChild(this.span);

        this.$.keymapSelect.options = keymaps.map(function ( item ) {
            return { name: item, value: item };
        });

        this.$.themeSelect.options = themes.map(function ( item ) {
            return { name: item, value: item };
        });
    },

    hideChanged: function () {
        if (this.hide) {
            this.animate([
                { marginTop: "20px" },
                { marginTop: "-400px"},
                ], {
                    duration: 400
                });
            this.style.marginTop = "-400px";
            this.span.style.display = "none";
        }
        else {
            this.span.style.display = "block";
            this.animate([
                { marginTop: "-400px" },
                { marginTop: "20px"}
                ], {
                    duration: 400
                });
            this.style.marginTop = "20px";
        }
    },

    focusedAction: function (e) {
        for (var i=0; i<e.target.parentNode.children.length; i++) {
            e.target.parentNode.children[i].setAttribute("focused","");
        }
    },

    blurAction: function (e) {
        for (var i=0; i<e.target.parentNode.children.length; i++) {
            e.target.parentNode.children[i].removeAttribute("focused");
        }
    },

});
