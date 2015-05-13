var Remote = require('remote');

Polymer({
    created: function () {
    },

    ready: function () {
        this.selectItem(0);
        Editor.sendToCore('metrics:dashboard-open');
    },

    detached: function () {
    },

    selectItem: function ( index ) {
        for ( var i = 0; i < this.$.menu.children.length; ++i ) {
            if ( i === index ) {
                this.$.menu.children[i].classList.add('active');
                this.$.content.children[i].style.display = "";
            }
            else {
                this.$.menu.children[i].classList.remove('active');
                this.$.content.children[i].style.display = "none";
            }
        }
    },

    openAction: function ( event ) {
        var dialog = Remote.require('dialog');

        var result = dialog.showOpenDialog ( {
            title: "Choose a project",
            properties: [ 'openDirectory' ]
        } );

        if ( result ) {
            Editor.sendToCore( 'dashboard:add-project', result[0], true );
        }
        this.selectItem(2);
    },

    projectAddedAction: function ( event ) {
        event.stopPropagation();

        this.selectItem(0);
    },

    recentAction: function ( event ) {
        event.stopPropagation();

        this.selectItem(0);
    },

    newAction: function ( event ) {
        event.stopPropagation();

        this.selectItem(1);
    },

    helpAction: function ( event ) {
        event.stopPropagation();

        this.selectItem(3);
    },
});
