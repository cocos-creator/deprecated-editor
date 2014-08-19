console.log('starting fireball-x');

// document events
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

if (FIRE.isNw) {
    var nwgui = require('nw.gui');
    var nativeWin = nwgui.Window.get();
}

document.onkeydown = function (e) { 
    switch ( e.keyCode ) {
        // F12
        case 123:
            if (FIRE.isNw) {
                nativeWin.showDevTools();
                e.stopPropagation();
            }
        break;

        // F5
        case 116:
            if (FIRE.isNw) {
                nativeWin.reload();
            }
        break;
    }
};

if ( FIRE.isNw ) {
    var nwgui = require('nw.gui');
    var nativeWin = nwgui.Window.get();

    if (FIRE.isDarwin) {
        var nativeMenuBar = new nwgui.Menu({ type: "menubar" });
        nativeMenuBar.createMacBuiltin("Atlas Editor");
        nativeWin.menu = nativeMenuBar;
    }

    // TODO: node-webkit custom contextmenu
    // function Menu(cutLabel, copyLabel, pasteLabel) {
    //     var gui = require('nw.gui');
    //     var menu = new gui.Menu();

    //     var cut = new gui.MenuItem({
    //         label: cutLabel || "Cut", 
    //         click: function() {
    //           document.execCommand("cut");
    //           console.log('Menu:', 'cutted to clipboard');
    //         }
    //     });

    //     var copy = new gui.MenuItem({
    //         label: copyLabel || "Copy",
    //         click: function() {
    //           document.execCommand("copy");
    //           console.log('Menu:', 'copied to clipboard');
    //         }
    //     });

    //     var paste = new gui.MenuItem({
    //         label: pasteLabel || "Paste",
    //         click: function() {
    //           document.execCommand("paste");
    //           console.log('Menu:', 'pasted to textarea');
    //         }
    //     });

    //     menu.append(cut);
    //     menu.append(copy);
    //     menu.append(paste);

    //     return menu;
    // }

    // var menu = new Menu([> pass cut, copy, paste labels if you need i18n<]);
    // $(document).on("contextmenu", function(e) {
    //     e.preventDefault();
    //     menu.popup(e.originalEvent.x, e.originalEvent.y);
    // });
}
