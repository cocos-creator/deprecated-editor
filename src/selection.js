Fire.Selection = (function () {

    var Selection = {};

    /**
     * @param {string[]} idList
     * @param {string} mode ['top-level','deep','name']
     * @param {function} func 
     */
    Selection.filter = function ( idList, mode, func ) {
        var results = [], id, i, j;
        
        if ( mode === 'name' ) {
            for ( i = 0; i < idList.length; ++i ) {
                id = idList[i];
                if ( func(id) ) {
                    results.push(id);
                }
            }
        }
        else {
            for ( i = 0; i < idList.length; ++i ) {
                id = idList[i];
                var addId = true;

                for ( j = 0; j < results.length; ++j ) {
                    var idTmp = results[j];

                    if ( id === idTmp ) {
                        addId = false;
                        break;
                    }

                    var cmp = func( idTmp, id );
                    if ( cmp > 0 ) {
                        addId = false;
                        break;
                    }
                    else if ( cmp < 0 ) {
                        results.splice(j, 1);
                        --j;
                    }
                }

                if ( addId ) {
                    results.push(id);
                }
            }
        }

        return results;
    };

    return Selection;
})();

// TODO: DELME
var remote = require('remote');
var remoteSelection = remote.getGlobal( 'Selection@' + fireID );
Fire.merge ( remoteSelection, Fire.Selection );
Fire.Selection = remoteSelection;
