(function () {
    var Remote = require('remote');

    Polymer({
        created: function () {
        },

        ready: function () {
            this.selectItem(0);

            // init document events
            document.addEventListener( "dragstart", function (event) {
                event.preventDefault(); 
            } );
            document.addEventListener( "drop", function (event) {
                event.preventDefault(); 
            } );
            document.addEventListener( "dragover", function (event) {
                event.preventDefault(); 
            } );
            document.addEventListener( "contextmenu", function (event) {
                event.preventDefault();
                event.stopPropagation();
            } );
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

        recentAction: function ( event ) {
            this.selectItem(0);
        },

        newAction: function ( event ) {
            this.selectItem(1);
        },

        helpAction: function ( event ) {
            this.selectItem(2);
        },
    });
})();
