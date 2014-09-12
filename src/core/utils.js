var EditorUtils;
(function (EditorUtils) {
    var Fs = require('fs');
    var Path = require('path');

    EditorUtils.metaVer = 0;

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

    EditorUtils.copy = function ( src, dest ) {
        Fs.createReadStream(src).pipe(Fs.createWriteStream(dest));
    };

    EditorUtils.copyRecursively = function ( src, dest ) {

        var exists = Fs.existsSync(src);
        var stats = exists && Fs.statSync(src);
        var isDirectory = exists && stats.isDirectory();

        if (exists && isDirectory) {
            Fs.mkdirSync(dest);
            Fs.readdirSync(src).forEach(function(childItemName) {
                EditorUtils.copyRecursively(Path.join(src, childItemName), Path.join(dest, childItemName));
            });
        }
        else {
            EditorUtils.copy(src, dest);
        }
        
    };

})(EditorUtils || (EditorUtils = {}));
