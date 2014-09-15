var EditorApp;
(function (EditorApp) {
    var nwGUI = require('nw.gui');
    var Fs = require('fs');
    var Path = require('path');
    var Minimist = require('minimist');

    var nativeMainWin = nwGUI.Window.get();
    var eventListeners = {}; 

    EditorApp.options = {};
    EditorApp.userProfile = {};
    EditorApp.projectProfile = {};
    EditorApp.projectName = '';

    EditorApp.start = function () {
        console.log("%cWelcome to Fireball-x!\n%cThe next-gen html5 game engine.",
                    "font-size:1.5em;color:#4558c9;", "color:#d61a7f;font-size:1em;");

        // handle the error safely
        process.on('uncaughtException', function(err) {
            console.error(err.stack);
        });

        // init EditorApp
        console.log( 'Initializing EditorApp...' );
        EditorApp.init();
        // DISABLE
        // try {
        //     console.log( 'Initializing EditorApp...' );
        //     EditorApp.init();
        // }
        // catch ( err ) {
        //     console.error(err);
        //     process.exit(1);
        // }

        // show native main window
        nativeMainWin.show();
        nativeMainWin.focus();
    };

    //
    EditorApp.init = function () {
        // init native functions
        _appPath = process.cwd();

        // parse arguments
        // -D, --showdevtools
        EditorApp.options = Minimist( nwGUI.App.argv );

        // process arguments
        if ( EditorApp.options.D || EditorApp.options.showdevtools ) {
            nativeMainWin.showDevTools();
        }

        // TODO: login
        // TODO: choose project

        // load user profile
        var profilePath = Path.join(_appPath,'profile.json');
        if ( !Fs.existsSync(profilePath) ) {
            EditorApp.userProfile = {
                recentlyOpened: [],
            };
            // create default user profile.
            Fs.writeFileSync(profilePath, JSON.stringify(EditorApp.userProfile, null, 4));
        }
        else {
            EditorApp.userProfile = JSON.parse(Fs.readFileSync(profilePath));
        }

        // TODO:
        // // run user .firerc
        // var rcPath = Path.join(_appPath,'.firerc');
        // if ( Fs.existsSync(rcPath) ) {
        //     // TODO: run user .firerc
        // }

        var projectFile = EditorApp.options._[0];
        if ( !projectFile ) {
            throw 'No project file to open!';
        }

        if ( Path.extname(projectFile) !== '.fireball' ) {
            throw 'Invalid project ' + projectFile;
        }

        // change to fullpath projectFile
        projectFile = Path.join(process.cwd(), projectFile); 
        EditorApp.checkProject(projectFile);
        EditorApp.openProject(projectFile);

        // init menu
        if ( FIRE.isDarwin ) {
            var nativeMenuBar = new nwGUI.Menu({ type: "menubar" });
            nativeMenuBar.createMacBuiltin("Fireball-X");
            nativeMainWin.menu = nativeMenuBar;
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
        document.addEventListener( "keydown", function ( event ) {
            switch ( event.keyCode ) {
                // TEST
                // F3
                case 114:
                break;

                // F5
                case 116:
                    nativeMainWin.reload();
                break;

                // F12
                case 123:
                    nativeMainWin.showDevTools();
                    event.stopPropagation();
                break;
            }
        }, true );
    };

    var _mainWin = null;
    Object.defineProperty(EditorApp, 'mainWin', {
        get: function () {
            return _mainWin;
        }
    });

    var _cwd = null; // the path of current opened project
    Object.defineProperty(EditorApp, 'cwd', {
        get: function () {
            return _cwd;
        }
    });

    var _appPath = null; // the path of fireball-x editor 
    Object.defineProperty(EditorApp, 'appPath', {
        get: function () {
            return _appPath;
        }
    });

    //
    EditorApp.setMainWindow = function ( mainWin ) {
        _mainWin = mainWin;
    };

    // event operation

    //
    EditorApp.on = function ( name, fn ) {
        var list = eventListeners[name];
        if ( !list ) {
            list = [];
            eventListeners[name] = list;
        }
        if ( list.indexOf(fn) === -1 ) {
            list.push(fn);
        }
    };

    //
    EditorApp.off = function ( name, fn ) {
        var list = eventListeners[name];
        if ( !list ) {
            return;
        }

        if ( !fn ) {
            eventListeners[name] = [];
            return;
        }

        var idx = list.indexOf(fn);
        if ( idx === -1 ) {
            return;
        }
        list.splice(idx,1);
    };

    //
    EditorApp.fire = function ( name, params ) {
        var list = eventListeners[name];
        if ( !list ) {
            return;
        }
        for ( var i = 0; i < list.length; ++i ) {
            var fn = list[i];
            if ( fn ) {
                fn ( { type: name, detail: params } );
            }
        }
    };

    // project operation

    //
    EditorApp.checkProject = function ( projectFile ) {
        var projectDir = Path.dirname(projectFile);

        // if project dir not eixsts
        if ( !Fs.existsSync(projectDir) || !Fs.statSync(projectDir).isDirectory() ) {
            EditorUtils.mkdirpSync(projectDir);
        }

        // if project file not exists
        if ( !Fs.existsSync(projectFile) || Fs.statSync(projectFile).isDirectory() ) {
            var profile = {};
            Fs.writeFileSync(projectFile, JSON.stringify(profile, null, 4));
        }

        // if assets/ not exists
        var assetsPath = Path.join(projectDir, 'assets');
        if ( !Fs.existsSync(assetsPath) || !Fs.statSync(assetsPath).isDirectory() ) {
            Fs.mkdirSync(assetsPath);
        }

        // if settings/ not exists
        var settingsPath = Path.join(projectDir, 'settings');
        if ( !Fs.existsSync(settingsPath) || !Fs.statSync(settingsPath).isDirectory() ) {
            Fs.mkdirSync(settingsPath);
        }

        // if library/ not exists
        var libraryPath = Path.join(projectDir, 'library');
        if ( !Fs.existsSync(libraryPath) || !Fs.statSync(libraryPath).isDirectory() ) {
            Fs.mkdirSync(libraryPath);
        }

        // if local/ not exists
        var localPath = Path.join(projectDir, 'local');
        if ( !Fs.existsSync(localPath) || !Fs.statSync(localPath).isDirectory() ) {
            Fs.mkdirSync(localPath);
        }
    };

    //
    EditorApp.openProject = function ( projectFile ) {
        var projectDir = Path.dirname(projectFile);
        _cwd = projectDir;
        EditorApp.projectName = Path.basename( projectFile, Path.extname(projectFile) );

        // load project profile
        var data = Fs.readFileSync(projectFile);
        try {
            EditorApp.projectProfile = JSON.parse(data);
        }
        catch ( err ) {
            throw 'Failed to load project ' + projectFile;
        }

        // TODO: load settings
        // TODO: load window layouts

        // init asset-db
        AssetDB.init(projectDir);

        // mounting assets
        // AssetDB.mount( Path.join(appPath,'shares'), 'shares');

        AssetDB.refresh();
    };

})(EditorApp || (EditorApp = {}));
