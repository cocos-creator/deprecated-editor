if (typeof window !== 'undefined') {

// TODO: move these functions to fireball-x/editor/utils

//
Fire.getTrimRect = function (img, trimThreshold) {
    var canvas, ctx;
    if (img instanceof Image || img instanceof HTMLImageElement) {
        // create temp canvas
        canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx = canvas.getContext('2d');
        ctx.drawImage( img, 0, 0, img.width, img.height );
    }
    else {
        canvas = img;
        ctx = canvas.getContext('2d');
    }
    var pixelBuffer = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    // get trim
    return _doGetTrimRect(pixelBuffer, img.width, img.height, trimThreshold);
};

var _readDir = function (dirReader, callback) {
    var onReadDir = function (entries) {
        if (!entries.length) {
            return; // readed
        }
        else {
            // recursive directory read
            _readEntries(entries, callback);

            // Keep calling readEntries() until no more results are returned.
            // This is needed to get all directory entries as one
            // call of readEntries may not return all items. Works a
            // bit like stream reader.
            _readDir(dirReader, callback);
        }
    };
    dirReader.readEntries(onReadDir);
};
// Recursive directory read
var _readEntries = function (entries, callback) {
    var files = [];
    var processingFile = 0;
    var onLoadFile = function (file) {
        --processingFile;
        files.push(file);
        if (processingFile === 0) {
            callback(files);
        }
    };
    var dirReader;
    for (var i = 0; i < entries.length; i++) {
        if (entries[i].isDirectory) {
            dirReader = entries[i].createReader();
            _readDir(dirReader, callback);
        }
        else {
            ++processingFile;
            entries[i].file(onLoadFile);
        }
    }
};

// 获得浏览器拖进来的文件，当包含文件夹时，callback将被多次调用
// recursive read all the files and (sub-)folders which dragged and dropped to browser
Fire.getDraggingFiles = function (event, callback) {
    //var paths = [];
    //for (var i = 0; i < files.length; i++) {
    //    paths.push(files[i].path);
    //}
    //files = Fire.readDirRecursively(paths);
    var items = event.dataTransfer.items;
    if (!items) {
        callback(event.dataTransfer.files);
        return;
    }
    var files = [];
    var entry;
    for (var i = 0; i < items.length; i++) {
        if (items[i].getAsEntry) {
            entry = items[i].getAsEntry();
        }
        else if (items[i].webkitGetAsEntry) {
            entry = items[i].webkitGetAsEntry();
        }
        else {
            entry = null;
        }
        if (entry !== null && entry.isDirectory) {
            _readEntries([entry], callback);
        }
        else {
            files.push(event.dataTransfer.files[i]);
        }
    }
    if (files.length > 0) {
        callback(files);
    }
};

// not supported by IE
var _downloadDataUrl = function (url, filename) {
    var a = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
    a.href = url;
    a.download = filename;
    a.click();
};

window.navigator.saveBlob = window.navigator.saveBlob || window.navigator.msSaveBlob;
window.URL = window.URL || window.webkitURL;

Fire.downloadBlob = function (blob, filename) {
    if (window.navigator.saveBlob) {
        window.navigator.saveBlob(blob, filename);
    }
    else {
        var dataURL = window.URL.createObjectURL(blob);
        _downloadDataUrl(dataURL, filename);
        window.URL.revokeObjectURL(dataURL);    // Chrome中可立刻revokeObjectURL，其它浏览器需要进一步测试
    }
};

Fire.downloadCanvas = function (canvas, filename) {
    canvas.toBlob = canvas.toBlob || canvas.msToBlob;
    if (canvas.toBlob && window.navigator.saveBlob) {
        window.navigator.saveBlob(canvas.toBlob(), filename);
    }
    else {
        var dataURL = canvas.toDataURL("image/png");
        _downloadDataUrl(dataURL, filename);
    }
};

Fire.imgDataUrlToBase64 = function (dataUrl) {
    return dataUrl.replace(/^data:image\/\w+;base64,/, "");
};

}
