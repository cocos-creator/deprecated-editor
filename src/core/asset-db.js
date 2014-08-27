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

    var _realpath = function ( path ) {
        var list = path.split(":/");
        if ( list.length !== 2 ) {
            console.warn("Invalid path " + path);
            return null;
        }

        var mountName = list[0];
        var relativePath = list[1];

        if ( !_mounts[mountName] ) {
            console.warn("Can not find the mounting " + mountName);
            return null;
        }

        return Path.resolve( Path.join(_mounts[mountName],relativePath) );
    }; 

    var _realmove = function (rsrc, rdest) {
        // if dest file exists, delete it first
        if ( Fs.existsSync(rdest) ) {
            // TODO: delete rdest
            // AssetDB.deleteAsset(rdest);
        }

        var uuid = _rpathToUuid[rsrc];
        delete _rpathToUuid[rsrc];
        delete _uuidToRpath[uuid];

        Fs.renameSync( rsrc, rdest );
        Fs.renameSync( rsrc + ".meta", rdest + ".meta" );
        _rpathToUuid[rdest] = uuid;
        _rpathToUuid[uuid] = rdest;
    };

    AssetDB.rpath = function (path) {
        return _realpath(path);
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
            console.error("Failed to delete asset: " + path);
            return;
        }

        // TODO: delete asset
        // TODO: delete asset.json
    };

    AssetDB.moveAsset = function (src, dest) {
        var rsrc = _realpath(src);
        if ( rsrc === null ) {
            console.error("Failed to move asset: " + src);
            return false;
        }

        var rdest = _realpath(dest);
        if ( rdest === null ) {
            console.error("Invalid dest path: " + dest);
            return false;
        }

        try {
            _realmove ( rsrc, rdest );
        }
        catch ( err ) {
            console.error(err);
            return false;
        }

        // dispatch event
        EditorApp.fire( 'assetMoved', { src: src, dest: dest } );
        return true;
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
                meta = {
                    ver: EditorUtils.metaVer,
                };
            }
            else {
                meta = {
                    ver: EditorUtils.metaVer,
                    uuid: Uuid.v4(),
                };
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
