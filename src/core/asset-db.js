// assetMng.js
var AssetDB;
(function (AssetDB) {
    var Fs = require('fs');
    var Walk = require('walk');
    var Path = require('path');
    var Uuid = require('node-uuid');

    var _mounts = {};
    var _uuidToPath = {};
    var _pathToUuid = {};

    var _newMeta = function ( type ) {
        switch ( type ) {
        case 'folder':
            return {
                ver: EditorUtils.metaVer,
            };

        default:
            return {
                ver: EditorUtils.metaVer,
                uuid: Uuid.v4(),
            };
        }
    };

    var _fspath = function ( url ) {
        var list = url.split(":");
        if ( list.length !== 2 ) {
            console.warn("Invalid url " + url);
            return null;
        }

        var mountName = list[0];
        var relativePath = Path.normalize(list[1]);

        if ( !_mounts[mountName] ) {
            console.warn("Can not find the mounting " + mountName);
            return null;
        }

        return Path.resolve( Path.join(_mounts[mountName],relativePath) );
    }; 

    var _fsmove = function (rsrc, rdest) {
        var rstat = Fs.statSync(rsrc);
        if ( rstat.isDirectory() ) {
            var options = {
                listeners: {
                    file: function ( root, stats, next ) {
                        if ( Path.extname(stats.name) !== '.meta' ) {
                            root = Path.resolve(root); // NOTE: bug for windows in Walk
                            var rawfile = Path.join(root,stats.name);
                            var rel = Path.relative( rsrc, rawfile );
                            var dest = Path.join(rdest,rel);

                            var uuid = _pathToUuid[rawfile];
                            delete _pathToUuid[rawfile];
                            _pathToUuid[dest] = uuid;
                            _uuidToPath[uuid] = dest;
                        }
                        next();
                    },
                },
            };
            Walk.walkSync(rsrc, options);

            Fs.renameSync( rsrc, rdest );
            Fs.renameSync( rsrc + ".meta", rdest + ".meta" );
        }
        else {
            var uuid = _pathToUuid[rsrc];
            delete _pathToUuid[rsrc];
            delete _uuidToPath[uuid];

            Fs.renameSync( rsrc, rdest );
            Fs.renameSync( rsrc + ".meta", rdest + ".meta" );
            _pathToUuid[rdest] = uuid;
            _pathToUuid[uuid] = rdest;
        }
    };

    var _rmfile = function ( fspath ) {
        var basename = Path.basename(fspath);
        if ( basename[0] !== '.' ) {
            if ( Path.extname(basename) !== '.meta' ) {
                var uuid = _pathToUuid[fspath];
                delete _pathToUuid[fspath];
                delete _uuidToPath[uuid];
            }
        }
        Fs.unlinkSync( rpath );
    };

    var _rmdirRecursively = function ( fspath ) {
        var files = Fs.readdirSync(fspath);
        files.forEach( function( file, index ) {
            var curPath = fspath + "/" + file;

            // recurse
            if ( Fs.statSync(curPath).isDirectory() ) {
                _rmdirRecursively(curPath);
            } 
            // delete file
            else {
                _rmfile(curPath);
            }
        });

        Fs.rmdirSync(fspath);
    };

    var _fsdelete = function ( fspath ) {
        var rstat = Fs.statSync(fspath);
        if ( rstat.isDirectory() ) {
            _rmdirRecursively(fspath);
        }
        else {
            _rmfile(fspath);
        }

        if ( Fs.existsSync(fspath + ".meta") ) {
            Fs.unlinkSync( fspath + ".meta" );
        }
    };

    //
    AssetDB.registerImporter = function ( extnames, importer ) {
        // TODO:
    };

    AssetDB.importAsset = function ( fspath ) {
        // check if we have .meta
        var data = null;
        var meta = null;
        var createNewMeta = false;
        var metaPath = fspath + ".meta";
        var stat = Fs.statSync(fspath);

        if ( Fs.existsSync(metaPath) ) {
            data = Fs.readFileSync(metaPath);
            try {
                meta = JSON.parse(data);
            }
            catch (err) {
                meta = null;
                createNewMeta = true;
            }
        }
        else {
            createNewMeta = true;
        }

        // create new .meta file if needed
        if (createNewMeta) {
            if ( stat.isDirectory() ) {
                meta = _newMeta ('folder');
            }
            else {
                meta = _newMeta (Path.extname(fspath));
            }
            data = JSON.stringify(meta,null,'  ');
            Fs.writeFileSync(metaPath, data);
        }

        // import asset by its meta data
        if ( meta && stat.isDirectory() === false ) {
            // TODO: copy asset to library

            // reimport the asset if we found uuid collision
            if ( _uuidToPath[meta.uuid] ) {
                Fs.unlinkSync(metaPath);
                AssetDB.importAsset(fspath);
            }
            else {
                _uuidToPath[meta.uuid] = fspath;
                _pathToUuid[fspath] = meta.uuid;
            }
        }
    };

    AssetDB.exists = function (url) {
        var fspath = _fspath(url);
        return Fs.existsSync(fspath);
    };

    AssetDB.fspath = function (url) {
        return _fspath(url);
    };

    AssetDB.uuidToFsysPath = function ( uuid ) {
        return _uuidToPath[uuid];
    };

    AssetDB.fsysPathToUuid = function ( fspath ) {
        return _pathToUuid[fspath];
    };

    AssetDB.urlToUuid = function ( url ) {
        var fspath = _fspath(url);
        return _pathToUuid[fspath];
    };

    AssetDB.mountname = function (url) {
        var list = url.split(":");
        if ( list.length !== 2 ) {
            throw "Invalid url " + url;
        }

        return list[0];
    };

    // 
    AssetDB.makedirs = function ( url ) {
        var list = url.split(":");
        if ( list.length !== 2 ) {
            throw "Invalid url " + url;
        }

        var mountName = list[0];
        var relativePath = Path.normalize(list[1]);
        var mountPath = _mounts[mountName];

        if ( !mountPath ) {
            throw "Can not find the mounting " + mountName;
        }

        if ( relativePath[0] === '/' ) {
            relativePath = relativePath.slice(1);
        }

        var folderNames = relativePath.split('/'); 
        var currentPath = mountPath;
        var metaPath = currentPath + '.meta';
        var assetPath = '';
        for ( var i = 0; i < folderNames.length; ++i ) {
            var folder = folderNames[i];
            assetPath = Path.join(assetPath,folder);
            currentPath = Path.join(currentPath,folder);
            metaPath = currentPath + '.meta';

            if ( Fs.existsSync(currentPath) ) {
                var stat = Fs.statSync(currentPath);
                if ( stat.isDirectory() === false ) {
                    throw "The path " + currentPath + " is not a folder";
                } 
                continue;
            }

            // create new folder
            Fs.mkdirSync(currentPath);
            meta = _newMeta ('folder');
            data = JSON.stringify(meta,null,'  ');
            Fs.writeFileSync(metaPath, data);

            // dispatch event
            EditorApp.fire( 'folderCreated', { url: mountName + "://" + assetPath } );
        }
    };

    // name:/foo/bar/foobar.png
    AssetDB.mount = function ( path, name, replace ) {
        if ( ["http", "https", "files", "ftp" ].indexOf(name) !== -1 ) {
            console.warn("Can not use " + name + " for mounting");
            return;
        }

        if ( _mounts[name] ) {
            if ( replace ) {
                AssetDB.unmount(name);
            }
            else {
                console.warn("the mounting " + name + " already exists!");
                return;
            }
        }
        _mounts[name] = path;
        console.log("mount " + path + " as " + name);
    };

    AssetDB.unmount = function (name) {
        if ( _mounts[name] ) {
            _mounts[name] = null;
        }
    };

    AssetDB.newAsset = function (url) {
        var fspath = _fspath(url);
        if ( fspath === null ) {
            console.error("Failed to create new asset: " + url);
            return;
        }

        // TODO: create asset
        // TODO: create asset.json
    };

    AssetDB.deleteAsset = function (url) {
        var fspath = _fspath(url);
        if ( fspath === null ) {
            throw "Failed to delete asset: " + url;
        }

        if ( Fs.existsSync(fspath) === false ) {
            throw "Faield to delete asset: " + url + ", the url not exists.";
        }

        _fsdelete( fspath );

        // dispatch event
        EditorApp.fire( 'assetDeleted', { url: url } );
    };

    AssetDB.moveAsset = function (srcUrl, destUrl) {
        var rsrc = _fspath(srcUrl);
        if ( rsrc === null ) {
            throw "Failed to move asset: " + srcUrl;
        }

        if ( Fs.existsSync(rsrc) === false ) {
            throw "Faield to move asset: " + srcUrl + ", the src url not exists.";
        }

        var rdest = _fspath(destUrl);
        if ( rdest === null ) {
            throw "Invalid dest url path: " + destUrl;
        }

        if ( Fs.existsSync(rdest) ) {
            throw "Faield to move asset to: " + destUrl + ", the dest url already exists.";
        }

        // make sure the destUrl parent path exists 
        AssetDB.makedirs( Path.dirname(destUrl) );

        //
        _fsmove ( rsrc, rdest );

        // dispatch event
        EditorApp.fire( 'assetMoved', { srcUrl: srcUrl, destUrl: destUrl } );
    };

    AssetDB.loadAsset = function (url) {
        // var fspath = _fspath(url);
    };

    AssetDB.clean = function (url) {
        var fspath = _fspath(url);
        for (var k in _pathToUuid) {
            if (k.indexOf(fspath) === 0) {
                var uuid = _pathToUuid[k];
                delete _pathToUuid[k];
                delete _uuidToPath[uuid];
            }
        }
    };

    AssetDB.copy = function (src, dest) {
        Fs.createReadStream(src).pipe(Fs.createWriteStream(dest));
    };

    AssetDB.copyRecursively = function (src, dest) {

        var exists = Fs.existsSync(src);
        var stats = exists && Fs.statSync(src);
        var isDirectory = exists && stats.isDirectory();

        if (exists && isDirectory) {
            Fs.mkdirSync(dest);
            Fs.readdirSync(src).forEach(function(childItemName) {
                AssetDB.copyRecursively(Path.join(src, childItemName), Path.join(dest, childItemName));
            });
        }
        else {
            AssetDB.copy(src, dest);
        }
        
    };

    // import any changes
    AssetDB.refresh = function () {
        var doImportAsset = function ( root, name, stat ) {
            AssetDB.importAsset( Path.join(root,name) );
        };

        var doRefresh = function (root, statsArray, next) {
            root = Path.resolve(root); // NOTE: bug for windows in Walk
            for ( var i = 0; i < statsArray.length; ++i ) {
                var stats = statsArray[i];

                // skip hidden files
                if ( stats.name[0] !== '.' ) {
                    var extname = Path.extname(stats.name);

                    // check if this is .meta file
                    if ( extname !== '.meta' ) {
                        // NOTE: we don't allow file asset with empty extname.
                        // it will lead to conflicts of .meta file when folder 
                        // and empty-ext file using same name.
                        if ( extname === '.' || (stats.isDirectory() === false && extname === '') ) {
                            continue;
                        }
                        doImportAsset( root, stats.name, stats );
                    }
                    else {
                        // remove .meta file if its raw data does not exist
                        var basename = Path.basename(stats.name,'.meta');
                        var rawfile = Path.join(root,basename);
                        if ( Fs.existsSync(rawfile) === false ) {
                            Fs.unlink( Path.join(root,stats.name) );
                        }
                    }
                }
            }
            next();
        };

        var options = {
            listeners: {
                files: doRefresh,
                directories: doRefresh,
            },
        };
        for ( var name in _mounts ) {
            // AssetDB.walk ( name + ":/", doImport );
            var fspath = _fspath( name + ":/" );
            Walk.walk(fspath, options);
        }
    };

    AssetDB.walk = function ( url, callback, finished ) {
        var fspath = _fspath(url);
        if ( fspath === null ) {
            console.error("Failed to walk url: " + url);
            return;
        }

        //
        var options = {
            listeners: {
                names: function (root, nodeNames) {
                    nodeNames.sort(function (a, b) {
                        if (a > b) return 1;
                        if (a < b) return -1;
                        return 0;
                    });
                }, 

                errors: function (root, nodeStatsArray, next) {
                    next();
                },

                end: function () {
                    if ( finished )
                        finished();
                },

                node: function ( root, stats, next ) {
                    // skip .dirs, .files
                    if ( stats.name[0] !== '.' ) {
                        root = Path.resolve(root); // NOTE: bug for windows in Walk

                        // skip xxx.meta files
                        if ( stats.isFile ) {
                            if ( Path.extname(stats.name) !== '.meta' ) {
                                callback( root, stats.name, stats );
                            }
                        }
                        else {
                            callback( root, stats.name, stats );
                        }
                    }
                    next();
                },

                // directories: function (root, statsArray, next) {
                //     // skip .dirs
                //     for ( var i = 0; i < statsArray.length; ++i ) {
                //         var stats = statsArray[i];
                //         if ( stats.name[0] !== '.' ) {
                //             callback( root, stats.name, stats );
                //         }
                //     }
                //     next();
                // }, 

                // files: function (root, statsArray, next) {
                //     // skip .files
                //     for ( var i = 0; i < statsArray.length; ++i ) {
                //         var stats = statsArray[i];
                //         if ( stats.name[0] !== '.' ) {
                //             // skip xxx.meta files
                //             if ( stats.name.split('.').pop() !== 'meta' ) {
                //                 callback( root, stats.name, stats );
                //             }
                //         }
                //     }
                //     next();
                // }, 
            }
        };
        Walk.walk(fspath, options);
        // Walk.walkSync(fspath, options);
    };

})(AssetDB || (AssetDB = {}));
