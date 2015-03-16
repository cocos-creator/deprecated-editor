Polymer({
    publish: {
        items : [],
    },

    platform: function (value) {
        if ( !Fire.isDarwin ) {
            value = value.replace('⌘','Ctrl').replace('⇧','Shift').replace('⌥','Alt');
        }
        return value;
    },
});
