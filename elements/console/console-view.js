(function () {
    Polymer({
        created: function () {
            this.logs = [];
        },

        add: function ( type, text ) {
            this.logs.push({
                type: type,
                text: text
            });
        },

        itemAddedAction: function ( event ) {
            // to make sure after layout and before render  
            window.requestAnimationFrame ( function () {
                this.scrollTop = this.scrollHeight;
            }.bind(this) );
            event.stopPropagation();
        },
    });
})();
