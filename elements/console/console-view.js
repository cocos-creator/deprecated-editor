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
            this.scrollTop = this.scrollHeight;
            event.stopPropagation();
        },
    });
})();
