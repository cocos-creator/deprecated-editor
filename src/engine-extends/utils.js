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

Fire.arrayCmpFilter = function ( items, func ) {
    var results, item, i, j;

    results = [];
    for ( i = 0; i < items.length; ++i ) {
        item = items[i];
        var add = true;

        for ( j = 0; j < results.length; ++j ) {
            var addedItem = results[j];

            if ( item === addedItem ) {
                // existed
                add = false;
                break;
            }

            var cmp = func( addedItem, item );
            if ( cmp > 0 ) {
                add = false;
                break;
            }
            else if ( cmp < 0 ) {
                results.splice(j, 1);
                --j;
            }
        }

        if ( add ) {
            results.push(item);
        }
    }

    return results;
};

Fire.arrayResize = function ( array, newLength ) {
    if ( array.length >= newLength ) {
        array.length = newLength;
        return;
    }

    var start = array.length;
    var lastItem = array[array.length-1];
    array.length = newLength;

    for ( var i = start; i < newLength; ++i ) {
        if ( lastItem.clone ) {
            array[i] = lastItem.clone();
        }
        else {
            array[i] = lastItem;
        }
    }
};

Fire.arrayFillUndefined = function ( array, value ) {
    for ( var i = 0; i < array.length; ++i ) {
        if ( array[i] !== undefined )
            continue;

        if ( value !== null && value.clone ) {
            array[i] = value.clone();
        }
        else {
            array[i] = value;
        }
    }
};
