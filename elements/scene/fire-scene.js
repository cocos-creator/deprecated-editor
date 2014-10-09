(function () {
    Polymer({
        created: function () {
            window.addEventListener('resize', function() {
                this.resize();
            }.bind(this));
        },

        initRenderContext: function () {
            this.$.view.init();
        },

        showAction: function ( event ) {
            this.resize();
        },

        resize: function () {
            this.$.view.resize();
        },

    });
})();
