//
var Remote = require('remote');
var Util = require('util');
var Ipc = require('ipc');
var Path = require('fire-path');
var Url = require('fire-url');

/**
 * Global object with classes, properties and methods you can access from anywhere.
 *
 * See [methods and properties](../classes/Editor.html).
 * @module Editor
 * @main Editor
 */
/**
 * Global object with classes, properties and methods you can access from anywhere
 *
 * See [classes in Editor module](../modules/Editor.html).
 * @class Editor
 * @static
 */
window.Editor = window.Editor || {};

// init argument list sending from core by url?queries
// format: '?foo=bar&hell=world'
// skip '?'
var queryString = decodeURIComponent(location.search.substr(1));
var queryList = queryString.split('&');
var queries = {};
for ( var i = 0; i < queryList.length; ++i ) {
    var pair = queryList[i].split('=');
    if ( pair.length === 2) {
        queries[pair[0]] = pair[1];
    }
}
Editor.argv = queries;

// init & cache remote
Editor.remote = Remote.getGlobal('Editor');
Editor.cwd = Editor.remote.url('fire://');
Editor.isDev = Editor.remote.isDev;

//
Editor.url = function (url) {
    // NOTE: we cache editor:// protocol to get rid of ipc-sync function calls
    var urlInfo = Url.parse(url);
    if ( urlInfo.protocol === 'editor:' ) {
        if ( urlInfo.pathname ) {
            return Path.join( Editor.cwd, urlInfo.host, urlInfo.pathname );
        }
        return Path.join( Editor.cwd, urlInfo.host );
    }

    // try ipc-sync function
    return Editor.remote.url(url);
};

// console
Fire.log = function () {
    'use strict';
    console.log.apply( console, arguments );
    var args = [].slice.call(arguments);
    Editor.sendToCore.apply( Editor, ['console:log'].concat(args) );
};
Fire.success = function () {
    'use strict';

    var text = arguments.length > 0 ?  arguments[0] : '';
    if (arguments.length <= 1) {
        text = '' + text;
    }
    else {
        text = Util.format.apply(Util, arguments);
    }
    console.log('%c' + text, 'color: green');

    var args = [].slice.call(arguments);
    Editor.sendToCore.apply( Editor, ['console:success'].concat(args) );
};
Fire.failed = function () {
    'use strict';

    var text = arguments.length > 0 ?  arguments[0] : '';
    if (arguments.length <= 1) {
        text = '' + text;
    }
    else {
        text = Util.format.apply(Util, arguments);
    }
    console.log('%c' + text, 'color: red');

    var args = [].slice.call(arguments);
    Editor.sendToCore.apply( Editor, ['console:failed'].concat(args) );
};
Fire.info = function () {
    'use strict';
    console.info.apply( console, arguments );
    var args = [].slice.call(arguments);
    Editor.sendToCore.apply( Editor, ['console:info'].concat(args) );
};
Fire.warn = function () {
    'use strict';
    console.warn.apply( console, arguments );
    var args = [].slice.call(arguments);
    Editor.sendToCore.apply( Editor, ['console:warn'].concat(args) );
};
Fire.error = function () {
    'use strict';
    console.error.apply( console, arguments );
    var args = [].slice.call(arguments);
    Editor.sendToCore.apply( Editor, ['console:error'].concat(args) );
};

/**
 * show error stacks in editor
 * @method _throw
 * @param {Error} error
 * @private
 */
Fire._throw = function (error) {
    console.error(error.stack);
    var resolvedStack = Editor._SourceMap.resolveStack(error.stack);
    if (Ipc._events['console:error']) {
        Ipc.emit('console:error', resolvedStack);
    }
    else {
        Editor.sendToMainWindow('console:error', resolvedStack);
    }
};

Editor.observe = function ( target, enabled ) {
    if ( !target.isValid ) {
        return;
    }
    target._observing = enabled;
    if ( target instanceof Fire.Entity ) {
        for ( var i = 0; i < target._components.length; ++i ) {
            var comp = target._components[i];
            comp._observing = enabled;
        }
    }
};

Editor.hintObjectById = function ( type, id ) {
    if ( Fire.isChildClassOf( type, Fire.Entity ) ) {
        Editor.sendToWindows('entity:hint', {
            'entity-id': id
        });
    }
    else if ( Fire.isChildClassOf( type, Fire.Component ) ) {
        Editor.sendToWindows('entity:hint', {
            'entity-id': id
        });
    }
    else if ( Fire.isChildClassOf( type, Fire.Asset ) ) {
        Editor.sendToWindows('asset:hint', {
            uuid: id
        });
    }
};

Editor.hintObject = function ( target ) {
    if ( target instanceof Fire.Entity ) {
        Editor.sendToWindows('entity:hint', {
            'entity-id': target.id
        });
    }
    else if ( target instanceof Fire.Component ) {
        Editor.sendToWindows('entity:hint', {
            'entity-id': target.entity.id
        });
    }
    else if ( target instanceof Fire.Asset ) {
        Editor.sendToWindows('asset:hint', {
            uuid: target._uuid
        });
    }
};

Editor.openObjectById = function ( type, id ) {
    if ( Fire.isChildClassOf( type, Fire.Entity ) ) {
    }
    else if ( Fire.isChildClassOf( type, Fire.Component ) ) {
    }
    else if ( Fire.isChildClassOf( type, Fire.Asset ) ) {
        Editor.sendToAll('asset:open', {
            uuid: id,
            url: Editor.AssetDB.uuidToUrl(id),
        } );
    }
};

Editor.openObject = function ( target ) {
    if ( target instanceof Fire.Entity ) {
        // TODO:
        // Editor.sendToWindows('scene:focus-entity', {
        //     'entity-id': target.id
        // } );
    }
    else if ( target instanceof Fire.Component ) {
        // TODO
        // Editor.sendToWindows('scene:focus-entity', {
        //     'entity-id': target.entity.id
        // } );
    }
    else if ( target instanceof Fire.Asset ) {
        Editor.sendToAll('asset:open', {
            uuid: target._uuid,
            url: Editor.AssetDB.uuidToUrl(target._uuid),
        } );
    }
};

var _isBrowsing = false;
Editor.browseObject = function ( type, fobjectEL ) {
    if ( _isBrowsing )
        return;

    _isBrowsing = true;
    var ipc = new Editor.IpcListener();

    if ( Fire.isChildClassOf( type, Fire.Entity ) ) {
        Fire.warn('TODO: ask johnny how to do this.');
        _isBrowsing = false;
    }
    else if ( Fire.isChildClassOf( type, Fire.Component ) ) {
        Fire.warn('TODO: ask johnny how to do this.');
        _isBrowsing = false;
    }
    else if ( Fire.isChildClassOf( type, Fire.Asset ) ) {
        var typeID = Fire.JS._getClassId(type);

        Editor.sendToCore('quick-view:open', {
            'type-id': typeID,
            'id': fobjectEL.value ? fobjectEL.value._uuid : '',
        });
        ipc.on('quick-view:selected', function ( uuid ) {
            fobjectEL.setAsset(uuid);
        });
        ipc.on('quick-view:closed', function () {
            _isBrowsing = false;
            ipc.clear();
        });
    }
};

Editor.serializeMeta = function ( meta ) {
    if ( !meta.subRawData ) {
        return Editor.serialize(meta);
    }

    var subUuids = meta.subRawData.map ( function ( item ) {
        var uuid = item.asset._uuid;
        item.asset._uuid = null;
        return uuid;
    });

    var json = Editor.serialize(meta);

    for ( var i = 0; i < meta.subRawData.length; ++i ) {
        meta.subRawData[i].asset._uuid = subUuids[i];
    }

    return json;
};

//
Editor.plugins = {}; // TODO: 做成Remote Object，确保全局只有一份?
Editor.gizmos = {};

