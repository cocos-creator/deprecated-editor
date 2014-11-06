Fire.DragDrop = (function () {
    var Path = require('fire-path');

    var _effectAllowed = 'copy';
    var _allowed = false;

    var DragDrop = {};

    Object.defineProperty( DragDrop, 'valid', {
        get: function () { return _allowed; }
    });

    DragDrop.start = function ( dataTransfer, effect, type, items ) {
        _effectAllowed = effect;
        dataTransfer.effectAllowed = effect;
        dataTransfer.setData('fire/type', type);
        dataTransfer.setData('fire/items', items.join());

        // event.dataTransfer.setDragImage( null, 0, 0 );
    };

    DragDrop.drop = function ( dataTransfer ) {
        var results = [];
        if ( _allowed ) {
            results = DragDrop.items(dataTransfer);
        }

        _effectAllowed = 'copy';
        _allowed = false;

        return results;
    };

    DragDrop.cancel = function () {
        _effectAllowed = 'copy';
        _allowed = false;
    };

    DragDrop.allow = function ( dataTransfer, allowed ) {
        if ( allowed ) {
            dataTransfer.dropEffect = _effectAllowed;
        }
        else {
            dataTransfer.dropEffect = 'invalid';
        }
        _allowed = allowed;
    };

    DragDrop.type = function ( dataTransfer ) {
        var type = dataTransfer.getData('fire/type');

        if ( type === "" && dataTransfer.files.length > 0 )
            return "files";

        return type;
    };

    DragDrop.items = function ( dataTransfer ) {
        var type = DragDrop.type(dataTransfer);
        var items;

        if ( type === "files" ) {
            var files = dataTransfer.files;
            items = [];

            for ( var i = 0; i < files.length; ++ i) {
                var exists = false;

                for ( var j = 0; j < items.length; ++j ) {
                    if ( Path.contains( items[j], files[i].path ) ) {
                        exists = true;
                        break;
                    }
                }

                if ( !exists ) {
                    items.push( files[i].path );
                }
            }
        }
        else {
            items = dataTransfer.getData('fire/items');
            items = items.split(',');
        }

        return items;
    };

    return DragDrop;
})();
