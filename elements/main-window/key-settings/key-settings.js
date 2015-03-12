Polymer({
    publish: {
        hide: false,
    },

    ready: function () {
        this.span = document.createElement('div');
        this.span.style.width = '100%';
        this.span.style.height = '100%';
        this.span.style.position = 'absolute';
        this.span.style.opacity = 0.2;
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
