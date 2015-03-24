//
var Util = require('util');
var Remote = require('remote');
var RemoteFire = Remote.getGlobal('Fire');

// init argument list sending from core by url?queries
// format: "?foo=bar&hell=world"
// skip "?"
var queryString = decodeURIComponent(location.search.substr(1));
var queryList = queryString.split('&');
var queries = {};
for ( var i = 0; i < queryList.length; ++i ) {
    var pair = queryList[i].split("=");
    if ( pair.length === 2) {
        queries[pair[0]] = pair[1];
    }
}
Fire.argv = queries;


Fire.url = function (url) {
    return RemoteFire.url(url);
};

// console
Fire.log = function ( text ) {
    'use strict';
    if (arguments.length <= 1) {
        text = "" + text;
    }
    else {
        text = Util.format.apply(Util, arguments);
    }
    console.log(text);
    Fire.sendToCore('console:log', text);
};
Fire.warn = function ( text ) {
    'use strict';
    if (arguments.length <= 1) {
        text = "" + text;
    }
    else {
        text = Util.format.apply(Util, arguments);
    }
    console.warn(text);
    Fire.sendToCore('console:warn', text);
};
Fire.error = function ( text ) {
    'use strict';
    if (arguments.length <= 1) {
        text = "" + text;
    }
    else {
        text = Util.format.apply(Util, arguments);
    }
    console.error(text);
    Fire.sendToCore('console:error', text);
};
Fire.success = function ( text ) {
    'use strict';
    if (arguments.length <= 1) {
        text = "" + text;
    }
    else {
        text = Util.format.apply(Util, arguments);
    }
    console.log('%c' + text, "color: green");
    Fire.sendToCore('console:success', text);
};
Fire.failed = function ( text ) {
    'use strict';
    if (arguments.length <= 1) {
        text = "" + text;
    }
    else {
        text = Util.format.apply(Util, arguments);
    }
    console.log('%c' + text, "color: red");
    Fire.sendToCore('console:failed', text);
};
Fire.info = function ( text ) {
    'use strict';
    if (arguments.length <= 1) {
        text = "" + text;
    }
    else {
        text = Util.format.apply(Util, arguments);
    }
    console.info(text);
    Fire.sendToCore('console:info', text);
};

Fire.observe = function ( target, enabled ) {
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

Fire.hintObjectById = function ( type, id ) {
    if ( Fire.isChildClassOf( type, Fire.Entity ) ) {
        Fire.sendToWindows('entity:hint', id );
    }
    else if ( Fire.isChildClassOf( type, Fire.Component ) ) {
        Fire.sendToWindows('entity:hint', id );
    }
    else if ( Fire.isChildClassOf( type, Fire.Asset ) ) {
        Fire.sendToWindows('asset:hint', id );
    }
};

Fire.hintObject = function ( target ) {
    if ( target instanceof Fire.Entity ) {
        Fire.sendToWindows('entity:hint', target.id );
    }
    else if ( target instanceof Fire.Component ) {
        Fire.sendToWindows('entity:hint', target.entity.id );
    }
    else if ( target instanceof Fire.Asset ) {
        Fire.sendToWindows('asset:hint', target._uuid );
    }
};

var _isBrowsing = false;
Fire.browseObject = function ( type, fobjectEL ) {
    if ( _isBrowsing )
        return;

    _isBrowsing = true;
    var ipc = new Fire.IpcListener();

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
        Fire.sendToCore('window:open', 'quick-assets', 'fire://static/quick-assets.html', {
            title: "Quick Assets",
            width: 800,
            height: 600,
            show: true,
            resizable: true,
            closeWhenBlur: true,
            argv: { typeID: typeID, id: fobjectEL.value ? fobjectEL.value._uuid : "" },
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

Fire.serializeMeta = function ( meta ) {
    if ( !meta.subRawData ) {
        return Fire.serialize(meta);
    }

    var subUuids = meta.subRawData.map ( function ( item ) {
        var uuid = item.asset._uuid;
        item.asset._uuid = null;
        return uuid;
    });

    var json = Fire.serialize(meta);

    for ( var i = 0; i < meta.subRawData.length; ++i ) {
        meta.subRawData[i].asset._uuid = subUuids[i];
    }

    return json;
};

//
Fire.plugins = {}; // TODO: 做成Remote Object，确保全局只有一份?
Fire.gizmos = {};

