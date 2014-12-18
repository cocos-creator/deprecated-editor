(function () {
    Polymer(EditorUI.mixin({
        ready: function () {
            this._initResizable();
        },

        itemAddedAction: function ( event ) {
            event.stopPropagation();

            // to make sure after layout and before render
            window.requestAnimationFrame ( function () {
                this.scrollTop = this.scrollHeight;
            }.bind(this) );
        },
    }, EditorUI.resizable));
})();
