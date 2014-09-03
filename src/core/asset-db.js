// assetMng.js
var AssetDB;
(function (AssetDB) {
    var Fs = require('fs');
    var Walk = require('walk');
    var Path = require('path');
    var Uuid = require('node-uuid');

    var _mounts = {};
    var _uuidToRpath = {};
    var _rpathToUuid = {};

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

    var _realpath = function ( path ) {
        var list = path.split(":");
        if ( list.length !== 2 ) {
            console.warn("Invalid path " + path);
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

    var _realmove = function (rsrc, rdest) {
        var rstat = Fs.statSync(rsrc);
        if ( rstat.isDirectory() ) {
            var options = {
                listeners: {
                    file: function ( root, stats, next ) {
                        if ( Path.extname(stats.name) !== '.meta' ) {
                            var rawfile = Path.join(root,stats.name);
                            var rel = Path.relative( rsrc, rawfile );
                            var dest = Path.join(rdest,rel);

                            var uuid = _rpathToUuid[rawfile];
                            delete _rpathToUuid[rawfile];
                            _rpathToUuid[dest] = uuid;
                            _uuidToRpath[uuid] = dest;
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
            var uuid = _rpathToUuid[rsrc];
            delete _rpathToUuid[rsrc];
            delete _uuidToRpath[uuid];

            Fs.renameSync( rsrc, rdest );
            Fs.renameSync( rsrc + ".meta", rdest + ".meta" );
            _rpathToUuid[rdest] = uuid;
            _rpathToUuid[uuid] = rdest;
        }
    };

    var _rmfile = function ( rpath ) {
        var basename = Path.basename(rpath);
        if ( basename[0] !== '.' ) {
            if ( Path.extname(basename) !== '.meta' ) {
                var uuid = _rpathToUuid[rpath];
                delete _rpathToUuid[rpath];
                delete _uuidToRpath[uuid];
            }
        }
        Fs.unlinkSync( rpath );
    };

    var _rmdirRecursively = function ( rpath ) {
        var files = Fs.readdirSync(rpath);
        files.forEach( function( file, index ) {
            var curPath = rpath + "/" + file;

            // recurse
            if ( Fs.statSync(curPath).isDirectory() ) {
                _rmdirRecursively(curPath);
            } 
            // delete file
            else {
                _rmfile(curPath);
            }
        });

        Fs.rmdirSync(rpath);
    };

    var _realdelete = function ( rpath ) {
        var rstat = Fs.statSync(rpath);
        if ( rstat.isDirectory() ) {
            _rmdirRecursively(rpath);
        }
        else {
            _rmfile(rpath);
        }

        if ( Fs.existsSync(rpath + ".meta") ) {
            Fs.unlinkSync( rpath + ".meta" );
        }
    };

    AssetDB.exists = function(path) {
        return Fs.existsSync(path);
    };

    AssetDB.rpath = function (path) {
        return _realpath(path);
    };

    AssetDB.mountname = function (path) {
        var list = path.split(":");
        if ( list.length !== 2 ) {
            throw "Invalid path " + path;
        }

        return list[0];
    };

    // 
    AssetDB.makedirs = function ( path ) {
        var list = path.split(":");
        if ( list.length !== 2 ) {
            throw "Invalid path " + path;
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
            EditorApp.fire( 'folderCreated', { path: mountName + "://" + assetPath } );
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

    AssetDB.newAsset = function (path) {
        var rpath = _realpath(path);
        if ( rpath === null ) {
            console.error("Failed to create new asset: " + path);
            return;
        }

        // TODO: create asset
        // TODO: create asset.json
    };

    AssetDB.deleteAsset = function (path) {
        var rpath = _realpath(path);
        if ( rpath === null ) {
            throw "Failed to delete asset: " + path;
        }

        if ( Fs.existsSync(rpath) === false ) {
            throw "Faield to delete asset: " + path + ", the path not exists.";
        }

        _realdelete( rpath );

        // dispatch event
        EditorApp.fire( 'assetDeleted', { path: path } );
    };

    AssetDB.moveAsset = function (src, dest) {
        var rsrc = _realpath(src);
        if ( rsrc === null ) {
            throw "Failed to move asset: " + src;
        }

        if ( Fs.existsSync(rsrc) === false ) {
            throw "Faield to move asset: " + src + ", the src not exists.";
        }

        var rdest = _realpath(dest);
        if ( rdest === null ) {
            throw "Invalid dest path: " + dest;
        }

        if ( Fs.existsSync(rdest) ) {
            throw "Faield to move asset to: " + dest + ", the dest already exists.";
        }

        // make sure the dest parent path exists 
        AssetDB.makedirs( Path.dirname(dest) );

        //
        _realmove ( rsrc, rdest );

        // dispatch event
        EditorApp.fire( 'assetMoved', { src: src, dest: dest } );
    };

    AssetDB.importAsset = function ( rpath ) {
        // check if we have .meta
        var data = null;
        var meta = null;
        var createNewMeta = false;
        var metaPath = rpath + ".meta";
        var stat = Fs.statSync(rpath);

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
                meta = _newMeta (Path.extname(rpath));
            }
            data = JSON.stringify(meta,null,'  ');
            Fs.writeFileSync(metaPath, data);
        }

        // import asset by its meta data
        if ( meta && stat.isDirectory() === false ) {
            // reimport the asset if we found uuid collision
            if ( _uuidToRpath[meta.uuid] ) {
                Fs.unlinkSync(metaPath);
                AssetDB.importAsset(rpath);
            }
            else {
                _uuidToRpath[meta.uuid] = rpath;
                _rpathToUuid[rpath] = meta.uuid;
            }
        }
    };

    AssetDB.clean = function (rpath) {
        for (var k in _rpathToUuid) {
            if (k.indexOf(rpath) === 0) {
                var uuid = _rpathToUuid[k];
                delete _rpathToUuid[k];
                delete _uuidToRpath[uuid];
            }
        }
    }

    // import any changes
    AssetDB.refresh = function () {
        var doImportAsset = function ( root, name, stat ) {
            AssetDB.importAsset( Path.join(root,name) );
        };

        var doRefresh = function (root, statsArray, next) {
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
                        if ( extname === '.' || extname === '' ) {
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
            var rpath = _realpath( name + ":/" );
            Walk.walk(rpath, options);
        }
    };

    AssetDB.walk = function ( path, callback, finished ) {
        var rpath = _realpath(path);
        if ( rpath === null ) {
            console.error("Failed to walk path: " + path);
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
        Walk.walk(rpath, options);
        // Walk.walkSync(rpath, options);
    };

})(AssetDB || (AssetDB = {}));
