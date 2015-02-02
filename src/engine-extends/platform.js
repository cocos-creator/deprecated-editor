//

if (Fire.isNode) {
    var Fs = require('fs');
    var Path = require('path');

    var _readDirRecursively = function ( dirPath, resultArray ) {
        var fileList = Fs.readdirSync(dirPath);
        var stat = null;
        var path = '';
        for (var i = 0; i < fileList.length; i++) {
            path = Path.join(dirPath, fileList[i]);
            try {
                stat = Fs.statSync(path);
            }
            catch (e) {
                continue;
            }
            if (stat.isFile()) {
                resultArray.push(path);
            }
            else if (stat.isDirectory()) {
                _readDirRecursively(path, resultArray);
            }
        }
    };
    Fire.readDirRecursively = function ( path ) {
        var retval = [];
        if (Array.isArray(path)) {
            for (var i = 0; i < path.length; i++) {
                retval = retval.concat(Fire.readDirRecursively(path[i]));
            }
            return retval;
        }
        var stat = null;
        //var entry = event.dataTransfer.items[i].webkitGetAsEntry();
        try {
            stat = Fs.statSync(path);
        }
        catch (e) {
            return [];
        }
        if (stat.isFile()) {
            retval.push(path);
        }
        else if (stat.isDirectory()) {
            _readDirRecursively(path, retval);
        }
        return retval;
    };
}
else {
    var error = function () {
        throw new Error("This function can only be used in node-webkit or server");
    };
    Fire.readDirRecursively = error;
}

if (Fire.isNodeWebkit && Fire.isWeb) {
    Fire.askSavePath = function (defaultFilename, persistDirKey, title, callback) {
        if (typeof title === 'function') {
            Fire.error('Fire.askSavePath: swap title and callback please');
        }
        var persistentId = 'SaveFileDialog';
        var chooser = document.getElementById(persistentId);
        if (chooser) {
            // remove the old one or change event may not fired
            document.body.removeChild(chooser);
        }
        chooser = document.createElement('input');
        document.body.appendChild(chooser);
        chooser.id = persistentId;
        chooser.style.display = 'none';
        chooser.type = 'file';

        chooser.nwsaveas = defaultFilename;
        var defaultDir = localStorage[persistDirKey];
        chooser.nwworkingdir = defaultDir || '';

        chooser.onchange = function (evt) {
            document.body.removeChild(chooser);
            //chooser.removeEventListener("change", arguments.callee);
            chooser.onchange = null;
            //Fire.log('value ' + this.value);
            localStorage[persistDirKey] = this.value;
            callback(this.value);
        };
        chooser.click();
        //chooser.value = '';
        //chooser.files = new FileList();
        //chooser.files.append(new File('',''));
        //chooser.files = null;
    };
    Fire.getSavePath = function () {
        Fire.error('Fire.getSavePath is deprecated, use Fire.askSavePath plz');
    };
    var nwgui = require('nw.gui');
    Fire.showItemInFolder = nwgui.Shell.showItemInFolder;
}
else if (Fire.isAtomShell) {

    if (typeof localStorage === 'undefined') {
        localStorage = Fire.userProfile || {};
    }

    /**
     * @param {BrowserWindow} [browserWindow]
     */
    Fire.askSavePath = function (defaultFilename, persistDirKey, title, callback, browserWindow) {
        var defaultDir = localStorage[persistDirKey];
        var defaultPath = null;
        if (defaultDir && typeof defaultDir === 'string') {
            defaultDir = Fire.Path.dirname(defaultDir);
            defaultPath = Fire.Path.join(defaultDir, defaultFilename);
        }

        var dialog;
        if (Fire.isWeb) {
            var remote = require('remote');
            dialog = remote.require('dialog');
            if (!browserWindow) {
                browserWindow = remote.getCurrentWindow();
            }
        }
        else {
            dialog = require('dialog');
            if (!browserWindow) {
                var BrowserWindow = require('browser-window');
                browserWindow = BrowserWindow.getFocusedWindow();
            }
        }
        var options = {
            title: title,
            defaultPath: defaultPath,
        };

        dialog.showSaveDialog(browserWindow, options, function (path) {
            if (path) {
                localStorage[persistDirKey] = path;
            }
            callback(path);
        });
    };

    /**
     * @param {BrowserWindow} [browserWindow]
     */
    Fire.askDirPath = function (defaultDir, persistDirKey, title, callback, browserWindow) {
        var lastDir = localStorage[persistDirKey];
        if (lastDir && typeof lastDir === 'string') {
            defaultDir = lastDir;
        }
        var dialog;
        if (Fire.isWeb) {
            var remote = require('remote');
            dialog = remote.require('dialog');
            if (!browserWindow) {
                browserWindow = remote.getCurrentWindow();
            }
        }
        else {
            dialog = require('dialog');
            if (!browserWindow) {
                var BrowserWindow = require('browser-window');
                browserWindow = BrowserWindow.getFocusedWindow();
            }
        }
        var options = {
            title: title,
            defaultPath: defaultDir,
            properties: ['openDirectory'],
        };
        dialog.showOpenDialog(browserWindow, options, function (path) {
            path = path && path[0];
            if (path) {
                localStorage[persistDirKey] = path;
            }
            callback(path);
        });
    };

    Fire.showItemInFolder = require('shell').showItemInFolder;
}
else {
    var error = function () {
        throw new Error("This function can only be used in node-webkit or atom-shell");
    };
    Fire.askSavePath = error;
    Fire.askDirPath = error;
    Fire.showItemInFolder = error;
}
