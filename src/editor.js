//
var Util = require('util');
var Ipc = require('ipc');
var Remote = require('remote');
var RemoteEditor = Remote.getGlobal('Editor');

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


Editor.url = function (url) {
    return RemoteEditor.url(url);
};

// console
Fire.log = function ( text ) {
    'use strict';
    if (arguments.length <= 1) {
        text = '' + text;
    }
    else {
        text = Util.format.apply(Util, arguments);
    }
    console.log(text);
    Editor.sendToCore('console:log', text);
};
Fire.warn = function ( text ) {
    'use strict';
    if (arguments.length <= 1) {
        text = '' + text;
    }
    else {
        text = Util.format.apply(Util, arguments);
    }
    console.warn(text);
    Editor.sendToCore('console:warn', text);
};
Fire.error = function ( text ) {
    'use strict';
    if (arguments.length <= 1) {
        text = '' + text;
    }
    else {
        text = Util.format.apply(Util, arguments);
    }
    console.error(text);
    Editor.sendToCore('console:error', text);
};
Fire.success = function ( text ) {
    'use strict';
    if (arguments.length <= 1) {
        text = '' + text;
    }
    else {
        text = Util.format.apply(Util, arguments);
    }
    console.log('%c' + text, 'color: green');
    Editor.sendToCore('console:success', text);
};
Fire.failed = function ( text ) {
    'use strict';
    if (arguments.length <= 1) {
        text = '' + text;
    }
    else {
        text = Util.format.apply(Util, arguments);
    }
    console.log('%c' + text, 'color: red');
    Editor.sendToCore('console:failed', text);
};
Fire.info = function ( text ) {
    'use strict';
    if (arguments.length <= 1) {
        text = '' + text;
    }
    else {
        text = Util.format.apply(Util, arguments);
    }
    console.info(text);
    Editor.sendToCore('console:info', text);
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
        Editor.sendToWindows('entity:hint', id );
    }
    else if ( Fire.isChildClassOf( type, Fire.Component ) ) {
        Editor.sendToWindows('entity:hint', id );
    }
    else if ( Fire.isChildClassOf( type, Fire.Asset ) ) {
        Editor.sendToWindows('asset:hint', id );
    }
};

Editor.hintObject = function ( target ) {
    if ( target instanceof Fire.Entity ) {
        Editor.sendToWindows('entity:hint', target.id );
    }
    else if ( target instanceof Fire.Component ) {
        Editor.sendToWindows('entity:hint', target.entity.id );
    }
    else if ( target instanceof Fire.Asset ) {
        Editor.sendToWindows('asset:hint', target._uuid );
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
        Editor.sendToCore('window:open', 'quick-assets', 'fire://static/quick-assets.html', {
            // atom-window options
            'title': 'Quick Assets',
            'width': 800,
            'height': 600,
            'show': true,
            'resizable': true,

            // fire-window options
            'close-when-blur': true,
            'panel-window': true,
            'argv': { typeID: typeID, id: fobjectEL.value ? fobjectEL.value._uuid : '' },
        } );
        ipc.on('quick-asset:selected', function ( uuid ) {
            fobjectEL.setAsset(uuid);
        });
        ipc.on('quick-asset:closed', function () {
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

