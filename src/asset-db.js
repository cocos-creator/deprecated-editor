// assetMng.js
var AssetDB;
(function (AssetDB) {
    var Fs = require('fs');
    var Walk = require('walk');
    var Path = require('path');

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
        // TODO: move asset.json
    };

    AssetDB.walk = function ( path, callback ) {
        var rpath = _realpath(path);
        if ( rpath === null ) {
            console.error("Failed to walk path: " + path);
            return;
        }

        //
        options = {
            listeners: {
                names: function (root, nodeNamesArray) {
                    nodeNamesArray.sort(function (a, b) {
                        if (a > b) return 1;
                        if (a < b) return -1;
                        return 0;
                    });
                }, 
                directories: function (root, dirStatsArray, next) {
                    // dirStatsArray is an array of `stat` objects with the additional attributes
                    // * type
                    // * error
                    // * name

                    // skip .dirs
                    for ( var i = 0; i < dirStatsArray.length; ++i ) {
                        var dirStats = dirStatsArray[i];
                        if ( dirStats.name[0] !== '.' ) {
                            callback( root, dirStats );
                        }
                    }

                    next();
                }, 
                file: function (root, fileStats, next) {
                    // skip .files
                    if ( fileStats.name[0] !== '.' ) {
                        // skip xxx.meta files
                        if ( fileStats.name.split('.').pop() !== 'meta' ) {
                            callback( root, fileStats );
                        }
                    }

                    next();
                }, 
                errors: function (root, nodeStatsArray, next) {
                    next();
                }
            }
        };
        walker = Walk.walk(rpath, options);
        // walker = Walk.walkSync(rpath, options);
    };

})(AssetDB || (AssetDB = {}));
