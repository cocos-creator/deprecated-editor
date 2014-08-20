(function () {
    Polymer('main-window', {
        ready: function () {
            console.log('starting fireball-x');

            // init node-webkit
            if (FIRE.isNw) {
                var nwgui = require('nw.gui');
                var nativeWin = nwgui.Window.get();

                document.onkeydown = function (e) { 
                    switch ( e.keyCode ) {
                        // F12
                        case 123:
                            nativeWin.showDevTools();
                            e.stopPropagation();
                        break;

                        // F5
                        case 116:
                            nativeWin.reload();
                        break;
                    }
                };

                if (FIRE.isDarwin) {
                    var nativeMenuBar = new nwgui.Menu({ type: "menubar" });
                    nativeMenuBar.createMacBuiltin("Fireball-X");
                    nativeWin.menu = nativeMenuBar;
                }
            }

            // init document events
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

            // init project-tree
            // this.$.projectView.load("test/foo/bar/");

            // init engine & game-view
            // FIRE.Engine.init();
            // this.$.gameView.init();
        },
    });
})();
