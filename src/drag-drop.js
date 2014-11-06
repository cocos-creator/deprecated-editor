Fire.DragDrop = (function () {
    var Path = require('fire-path');

    var _effectAllowed = 'copy';
    var _allowed = false;

    var DragDrop = {};

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

    DragDrop.end = function () {
        _effectAllowed = 'copy';
        _allowed = false;
    };

    DragDrop.updateDropEffect = function ( dataTransfer ) {
        if ( _allowed ) {
            dataTransfer.dropEffect = _effectAllowed;
        }
        else {
            dataTransfer.dropEffect = 'invalid';
        }
    };

    DragDrop.allowDrop = function ( dataTransfer, allowed ) {
        _allowed = allowed;
        DragDrop.updateDropEffect(dataTransfer);
    };

    Object.defineProperty( DragDrop, 'allowed', {
        get: function () { return _allowed; }
    });

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
