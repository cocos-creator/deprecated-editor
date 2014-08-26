// assetMng.js
var AssetDB;
(function (AssetDB) {
    var Fs = require('fs');
    var Walk = require('walk');
    var Path = require('path');
    var Uuid = require('node-uuid');

    var _mounts = {};

    var _realpath = function ( path ) {
        var list = path.split("://");
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

        return Path.resolve( _mounts[mountName] + "/" + relativePath );
    }; 

    // name://foo/bar/foobar.png
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
            console.error("Failed to move asset: " + rsrc);
            return;
        }

        // TODO: move asset
        // TODO: move asset.meta
    };

    AssetDB.importAsset = function ( rpath ) {
        // check if we have .meta
        var metaPath = rpath + ".meta";
        Fs.exists( metaPath, function ( exists ) {
            if ( exists === false ) {
                // create new .meta file
                var meta = {
                    ver: EditorUtils.metaVer,
                    uuid: Uuid.v4(),
                };
                Fs.writeFile(metaPath, JSON.stringify(meta,null,'  '), function ( err ) {
                    if (err) throw err;
                } );
            }
        } );
    };

    // import any changes
    AssetDB.refresh = function () {
        var doImport = function ( root, name, stat ) {
            if ( stat.isDirectory() === false ) {
                AssetDB.importAsset( root + "/" + name );
            }
            else {
                // do nothing if this is a directory
            }
        };

        var checkMetaExists = function ( exists ) {
            if ( exists === false ) {
                Fs.unlink( root + "/" + stats.name );
            }
        };

        var options = {
            listeners: {
                files: function (root, statsArray, next) {
                    // skip .files
                    for ( var i = 0; i < statsArray.length; ++i ) {
                        var stats = statsArray[i];
                        if ( stats.name[0] !== '.' ) {
                            // skip xxx.meta files
                            if ( Path.extname(stats.name) !== '.meta' ) {
                                doImport( root, stats.name, stats );
                            }
                            else {
                                // remove meta file if its raw data not exists
                                var basename = Path.basename(stats.name,'.meta');
                                Fs.exists( root + "/" + basename, checkMetaExists );
                            }
                        }
                    }
                    next();
                }, 
            },
        };
        for ( var name in _mounts ) {
            // AssetDB.walk ( name + "://", doImport );
            var rpath = _realpath( name + "://" );
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
