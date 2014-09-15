var EditorUtils;
(function (EditorUtils) {
    var Fs = require('fs');
    var Path = require('path');

    function _mkdirp (p, opts, f) {
        if (typeof opts === 'function') {
            f = opts;
        }
        
        var mode = opts;
        
        if (!mode) {
            mode = 0777 & (~process.umask());
        }
        
        var cb = f || function () {};
        p = Path.resolve(p);
        
        Fs.mkdir(p, mode, function (er) {
            if (!er) {
                return cb(null);
            }
            switch (er.code) {
                case 'ENOENT':
                    _mkdirp(Path.dirname(p), opts, function (er) {
                        if (er) cb(er);
                        else _mkdirp(p, opts, cb);
                    });
                    break;

                // In the case of any other error, just see if there's a dir
                // there already.  If so, then hooray!  If not, then something
                // is borked.
                default:
                    Fs.stat(p, function (er2, stat) {
                        // if the stat fails, then that's super weird.
                        // let the original error be the failure reason.
                        if (er2 || !stat.isDirectory()) cb(er);
                        else cb(null);
                    });
                    break;
            }
        });
    }
    EditorUtils.mkdirp = _mkdirp;

    function _mkdirpSync (p, opts) {
        if (!opts || typeof opts !== 'object') {
            opts = { mode: opts };
        }
        
        var mode = opts;
        
        if (mode === undefined) {
            mode = 0777 & (~process.umask());
        }

        p = Path.resolve(p);

        try {
            Fs.mkdirSync(p, mode);
        }
        catch (err0) {
            switch (err0.code) {
                case 'ENOENT' :
                    _mkdirpSync(Path.dirname(p), opts);
                    _mkdirpSync(p, opts);
                    break;

                // In the case of any other error, just see if there's a dir
                // there already.  If so, then hooray!  If not, then something
                // is borked.
                default:
                    var stat;
                    try {
                        stat = Fs.statSync(p);
                    }
                    catch (err1) {
                        throw err0;
                    }
                    if (!stat.isDirectory()) throw err0;
                    break;
            }
        }
    }
    EditorUtils.mkdirpSync = _mkdirpSync;

    // pathA = foo/bar,         pathB = foo/bar/foobar, return true
    // pathA = foo/bar,         pathB = foo/bar,        return true
    // pathA = foo/bar/foobar,  pathB = foo/bar,        return false
    // pathA = foo/bar/foobar,  pathB = foobar/bar/foo, return false
    EditorUtils.includePath = function ( pathA, pathB ) {
        if ( pathA.length < pathB.length &&
             pathB.indexOf (pathA) === 0 ) 
        {
            return true;
        }

        if ( pathA === pathB ) {
            return true;
        }

        return false;
    };

    // TODO: async version
    // function _copy ( src, dest ) {
    //     Fs.createReadStream(src).pipe(Fs.createWriteStream(dest));
    // }

    // EditorUtils.copy = function ( src, dest, callback ) {
    //     if ( Fs.existsSync(src) ) {
    //         var stats = Fs.statSync(src);
    //         if ( stats.isDirectory() ) {
    //             Fs.mkdirSync(dest);
    //             Fs.readdirSync(src).forEach(function(name) {
    //                 EditorUtils.copy ( Path.join(src, name), Path.join(dest, name) );
    //             });
    //         }
    //         else {
    //             _copy(src, dest);
    //         }
    //     }
    // };

    function _copySync ( src, dest ) {
        Fs.writeFileSync(dest, Fs.readFileSync(src));
    }

    function _copySyncR ( src, dest ) {
        if ( Fs.statSync(src).isDirectory() ) {
            Fs.mkdirSync(dest);
            Fs.readdirSync(src).forEach(function(name) {
                _copySyncR ( Path.join(src, name), Path.join(dest, name) );
            });
        }
        else {
            _copySync ( src, dest );
        }
    }

    // a copy function just like bash's cp 
    EditorUtils.copySync = function ( src, dest ) {
        if ( Fs.existsSync(src) ) {
            if ( Fs.statSync(src).isDirectory() ) {
                if ( Fs.existsSync(dest) && Fs.statSync(dest).isDirectory() ) {
                    _copySyncR ( src, Path.join(dest, Path.basename(src)) );
                }
                else {
                    _mkdirpSync(Path.dirname(dest));
                    _copySyncR ( src, dest );
                }
            }
            else {
                if ( Fs.existsSync(dest) && Fs.statSync(dest).isDirectory() ) {
                    _copySync ( src, Path.join(dest, Path.basename(src)) );
                }
                else {
                    _mkdirpSync(Path.dirname(dest));
                    _copySync ( src, dest );
                }
            }
        }
    };

})(EditorUtils || (EditorUtils = {}));
