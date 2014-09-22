// chokidar.js

var fs = require('fs');
var path = require('path');

var chokidar = require('chokidar');

var TEST_DIR = 'test_project/assets';

var main = function() {

    var watcherOptions = {
        ignored: function(fspath) {
            if (path.basename(fspath).indexOf('.') === 0) {
                return true;
            }
        },
        ignoreInitial: true,
        usePolling: true,
        persistent: true
    };

    var watcher = chokidar.watch(TEST_DIR, watcherOptions);

    watcher
    .on('add', function(path) {console.log('File', path, 'has been added');})
    .on('addDir', function(path) {console.log('Directory', path, 'has been added');})
    .on('change', function(path) {console.log('File', path, 'has been changed');})
    .on('unlink', function(path) {console.log('File', path, 'has been removed');})
    .on('unlinkDir', function(path) {console.log('Directory', path, 'has been removed');})
    .on('error', function(error) {console.error('Error happened', error);});

    var filePath = path.join(TEST_DIR, 'testfile');

    setTimeout(function(){ 
        fs.writeFileSync(filePath, 'something');
    }, 500);

    // 立即关闭 watcher
    setTimeout(function(){
        fs.unlinkSync(filePath);
        watcher.close();
    }, 1000);

    setTimeout(function(){
        //watcher.close();
        console.log("over");
    }, 3000);

};

// main
main();

