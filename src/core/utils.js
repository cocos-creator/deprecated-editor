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

    // foo/bar, foo/bar/foobar ==> 1
    // foo/bar/foobar, foo/bar ==> -1
    // foo/bar, foo/bar ==> 0
    // foo/bar/foobar, foobar/bar/foo ==> null
    EditorUtils.comparePath = function ( pathA, pathB ) {
        if ( pathA.length < pathB.length ) {
            if ( pathB.indexOf (pathA) === 0 )
                return 1;
        }
        else if ( pathA.length > pathB.length ) {
            if ( pathA.indexOf (pathB) === 0 )
                return -1;
        }
        else {
            if ( pathA === pathB )
                return 0;
        }

        return null;
    };

})(EditorUtils || (EditorUtils = {}));
