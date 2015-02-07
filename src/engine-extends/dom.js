if (typeof window !== 'undefined') {

// TODO: move these functions to fireball-x/editor/utils

var _doGetTrimRect = function (pixelBuffer, w, h, trimThreshold) {
    // A B C
    // D x F
    // G H I

    var tx = w, ty = h,
        tw = 0, th = 0,
        ditch = w * 4;

    var x, y, i;
    var index;  // alpha index in pixels

    // trim A B C
    for (y = 0; y < h; y++) {
        index = y * ditch + 3;  // (x + y * w) * 4 + 3
        for (x = 0; x < w; x++, index += 4) {
            if (pixelBuffer[index] >= trimThreshold) {
                ty = y;
                y = h;
                break;
            }
        }
    }
    // trim G H I
    for (y = h - 1; y >= ty; y--) {
        index = y * ditch + 3;
        for (x = 0; x < w; x++, index += 4) {
            if (pixelBuffer[index] >= trimThreshold) {
                th = y - ty + 1;
                y = 0;
                break;
            }
        }
    }
    var skipTrimmedY = ditch * ty;   // skip A B C
    // trim D
    for (x = 0; x < w; x++) {
        index = skipTrimmedY + x * 4 + 3;
        for (i = 0; i < th; i++, index += ditch) {
            if (pixelBuffer[index] >= trimThreshold) {
                tx = x;
                x = w;
                break;
            }
        }
    }
    // trim F
    for (x = w - 1; x >= tx; x--) {
        index = skipTrimmedY + x * 4 + 3;
        for (i = 0; i < th; i++, index += ditch) {
            if (pixelBuffer[index] >= trimThreshold) {
                tw = x - tx + 1;
                x = 0;
                break;
            }
        }
    }

    return new Fire.Rect(tx, ty, tw, th);
};

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
