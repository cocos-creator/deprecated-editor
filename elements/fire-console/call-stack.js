Polymer({
    publish: {
        info: '',
        class: '',
    },

    observe: {
        info: 'infoChanged',
    },

    infoChanged: function () {
        //console.log("info:"+this.info);
    },
});
