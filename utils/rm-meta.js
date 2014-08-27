var Path = require('path');
var Fs = require('fs');
var Walk = require('walk');

var checkErr = function (err, path) {
    if ( err ) {
        throw err;
    }
    else {
        console.log("Delete file: " + err);
    }
};

var options = {
    listeners: {
        end: function () {
            console.log('done!');
        },

        files: function (root, statsArray, next) {
            try {
                // skip .files
                for ( var i = 0; i < statsArray.length; ++i ) {
                    var stats = statsArray[i];
                    if ( Path.extname(stats.name) === '.meta' ) {
                        var path = Path.join( root, stats.name );
                        Fs.unlinkSync( path );
                        console.log("Delete file: " + path);
                    }
                }
                next();
            }
            catch (err) {
                console.log(err);
            }
        }, 
    },
};

var rpath = './bin/projects/default/assets/'; 
Walk.walkSync(rpath, options);
