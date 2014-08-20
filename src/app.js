var EditorApp;
(function (EditorApp) {
    var nwGUI = null;
    var Fs = null;

    if ( FIRE.isNw ) {
        nwGUI = require('nw.gui');
        Fs = require('fs');
    }

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
            var nativeWin = nwGUI.Window.get();

            // TODO: login
            // TODO: choose project

            // load user-profile
            if ( !Fs.existsSync(_appPath+"/user-profile.json") ) {
                // TODO: create default user profile.
            }

            //
            var defaultProjectPath = _appPath + "/bin/projects/default";
            if ( !Fs.existsSync(defaultProjectPath) ) {
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
                var nativeMenuBar = new nwGUI.Menu({ type: "menubar" });
                nativeMenuBar.createMacBuiltin("Fireball-X");
                nativeWin.menu = nativeMenuBar;
            }
        }

        // init project-tree
        _mainWin.$.projectView.load("assets://");

        // init engine & game-view
        console.log('fire-engine initializing...');
        var canvas = FIRE.Engine.init( _mainWin.$.gameView.$.view.clientWidth,
                                       _mainWin.$.gameView.$.view.clientHeight );
        _mainWin.$.gameView.setCanvas(canvas);
    };

    //
    EditorApp.newProject = function ( path ) {
        EditorUtils.mkdirpSync(path);

        var assetsPath = path+'/assets';
        Fs.mkdirSync(assetsPath);

        var settingsPath = path+'/settings';
        Fs.mkdirSync(settingsPath);

        var projectFile = path+'/.fireball';
        Fs.writeFileSync(projectFile, '');
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
