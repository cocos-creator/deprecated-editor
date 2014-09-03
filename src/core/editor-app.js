var EditorApp;
(function (EditorApp) {
    var nwGUI = require('nw.gui');
    var Fs = require('fs');
    var Path = require('path');
    var Minimist = require('minimist');

    var nativeMainWin = nwGUI.Window.get();
    var eventListeners = {}; 

    EditorApp.options = {};

    EditorApp.start = function () {
        // init and show main window
        EditorApp.init();
        nativeMainWin.show();
        nativeMainWin.focus();
    };

    //
    EditorApp.init = function () {
        console.log('editor-app initializing...');

        // init node.js events
        // handle the error safely
        process.on('uncaughtException', function(err) {
            console.error(err);
        });

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
            var profile = {
                recentlyOpened: [],
            };
            // create default user profile.
            Fs.writeFileSync(profilePath, JSON.stringify(profile, null, 4));
        }

        // TODO:
        // // run user .firerc
        // var rcPath = Path.join(_appPath,'.firerc');
        // if ( Fs.existsSync(rcPath) ) {
        //     // TODO: run user .firerc
        // }

        // TEMP
        var defaultProjectPath = _appPath + "/projects/default";
        if ( !Fs.existsSync(defaultProjectPath) ) {
            EditorApp.newProject(defaultProjectPath);
        }
        EditorApp.openProject(defaultProjectPath);
        // TEMP

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
        document.addEventListener ( 'keydown', function ( event ) {
            switch ( event.keyCode ) {
                // TEST
                // F3
                case 114:
                    // AssetDB.moveAsset( 'assets://Characters/Ashe/Ashe.fbx',
                    //                    'assets://Characters/Ashe1/foo/bar/Foobar.fbx' );
                    // AssetDB.makedirs( 'assets://foo/bar/foobar' );
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

    //
    EditorApp.openProject = function ( path ) {
        _cwd = path;

        // TODO: load settings
        // TODO: load window layouts

        // mounting assets
        AssetDB.mount(path+'/assets', 'assets');
        // AssetDB.mount(appPath+'/shares', 'shares');

        AssetDB.refresh();
    };

})(EditorApp || (EditorApp = {}));
