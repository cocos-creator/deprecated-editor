Fire.DragDrop = (function () {
    var Path = require('fire-path');

    var _allowed = false;

    var DragDrop = {};

    DragDrop.start = function ( dataTransfer, effect, type, items ) {
        dataTransfer.effectAllowed = effect;
        dataTransfer.dropEffect = 'none';
        dataTransfer.setData('fire/type', type);
        dataTransfer.setData('fire/items', items.join());

        // TODO: event.dataTransfer.setDragImage( null, 0, 0 );
    };

    DragDrop.drop = function ( dataTransfer ) {
        Fire.Selection.cancel();

        var results = [];
        if ( _allowed ) {
            results = DragDrop.items(dataTransfer);
        }

        _allowed = false;

        return results;
    };

    DragDrop.end = function () {
        _allowed = false;
    };

    DragDrop.updateDropEffect = function ( dataTransfer, dropEffect ) {
        if ( _allowed ) {
            dataTransfer.dropEffect = dropEffect;
        }
        else {
            dataTransfer.dropEffect = 'none';
        }
    };

    DragDrop.allowDrop = function ( dataTransfer, allowed ) {
        _allowed = allowed;
        if ( !_allowed ) {
            dataTransfer.dropEffect = 'none';
        }
    };

    Object.defineProperty( DragDrop, 'allowed', {
        get: function () { return _allowed; }
    });

    DragDrop.type = function ( dataTransfer ) {
        var type = dataTransfer.getData('fire/type');

        if ( type === "" && dataTransfer.files.length > 0 )
            return "file";

        return type;
    };

    DragDrop.items = function ( dataTransfer ) {
        var type = DragDrop.type(dataTransfer);
        var items;

        if ( type === "file" ) {
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
            if ( items !== "" ) {
                items = items.split(',');
            }
            else {
                items = [];
            }
        }

        return items;
    };

    return DragDrop;
})();
