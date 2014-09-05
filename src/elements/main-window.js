(function () {
    Polymer({
        ready: function () {
            EditorApp.setMainWindow(this);

            // init project-tree
            this.$.projectView.load("assets://");

            // init engine & game-view
            console.log('fire-engine initializing...');
            var canvas = FIRE.Engine.init( this.$.gameView.$.view.clientWidth,
                                           this.$.gameView.$.view.clientHeight );
            this.$.gameView.setCanvas(canvas);
        },

        resizedAction: function () {
            this.$.gameView.resize();
        },
    });
})();
