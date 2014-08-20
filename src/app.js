var EditorApp;
(function (EditorApp) {
    var nwgui = require('nw.gui');
    var fs = require('fs');


    var _mainWin = null;
    EditorApp.__defineGetter__('mainWin', function () { return _mainWin; } );

    var _cwd = null; // the path of current opened project
    EditorApp.__defineGetter__('cwd', function () { return _cwd; } );

    var _appPath = null; // the path of fireball-x editor 
    EditorApp.__defineGetter__('appPath', function () { return _appPath; } );

    EditorApp.init = function ( mainWindow ) {
        console.log('editor-app initializing...');

        _mainWin = mainWindow;

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

        // init native functions
        if (FIRE.isNw) {
            _appPath = process.cwd();
            var nativeWin = nwgui.Window.get();

            // TODO: login
            // TODO: choose project

            // load user-profile
            if ( !fs.existsSync(_appPath+"/user-profile.json") ) {
                // TODO: create default user profile.
            }

            //
            var defaultProjectPath = "bin/projects/default";
            if ( !fs.existsSync(defaultProjectPath) ) {
                EditorApp.newProject(defaultProjectPath);
            }
            EditorApp.openProject(defaultProjectPath);

            // init hot-keys
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

            // init menu
            if (FIRE.isDarwin) {
                var nativeMenuBar = new nwgui.Menu({ type: "menubar" });
                nativeMenuBar.createMacBuiltin("Fireball-X");
                nativeWin.menu = nativeMenuBar;
            }
        }

        // init project-tree
        // _mainWin.$.projectView.load("test/foo/bar/");

        // init engine & game-view
        // FIRE.Engine.init();
        // _mainWin.$.gameView.init();
    };

    //
    EditorApp.newProject = function ( path ) {
        EditorUtils.mkdirpSync(path);

        var assetsPath = path+'/assets';
        fs.mkdirSync(assetsPath);

        var settingsPath = path+'/settings';
        fs.mkdirSync(settingsPath);

        var projectFile = path+'/.fireball';
        fs.writeFileSync(projectFile, '');
    };

    EditorApp.openProject = function ( path ) {
        _cwd = path;

        // TODO: load settings
        // TODO: load window layouts

        // mounting assets
        AssetDB.mount(path+'/assets', 'assets');
        // AssetDB.mount(appPath+'/shares', 'shares');
    };

})(EditorApp || (EditorApp = {}));
