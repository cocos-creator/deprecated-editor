//
var Remote = require('remote');
var Util = require('util');
var Ipc = require('ipc');
var Path = require('fire-path');
var Url = require('fire-url');
var Async = require('async');

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
Editor.token = Editor.remote.token;
Editor.userInfo = Editor.remote.userInfo;

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
Fire.log = function ( text ) {
    'use strict';

    if ( arguments.length <= 1 ) {
        text = '' + text;
    } else {
        text = Util.format.apply(Util, arguments);
    }
    console.log(text);
    Editor.sendToCore('console:log', text);
};
Fire.success = function ( text ) {
    'use strict';

    if ( arguments.length <= 1 ) {
        text = '' + text;
    } else {
        text = Util.format.apply(Util, arguments);
    }
    console.log('%c' + text, 'color: green');
    Editor.sendToCore('console:success', text);
};
Fire.failed = function ( text ) {
    'use strict';

    if ( arguments.length <= 1 ) {
        text = '' + text;
    } else {
        text = Util.format.apply(Util, arguments);
    }
    console.log('%c' + text, 'color: red');
    Editor.sendToCore('console:failed', text);
};
Fire.info = function ( text ) {
    'use strict';

    if ( arguments.length <= 1 ) {
        text = '' + text;
    } else {
        text = Util.format.apply(Util, arguments);
    }
    console.info(text);
    Editor.sendToCore('console:info', text);
};
Fire.warn = function ( text ) {
    'use strict';

    if ( arguments.length <= 1 ) {
        text = '' + text;
    } else {
        text = Util.format.apply(Util, arguments);
    }
    console.warn(text);
    Editor.sendToCore('console:warn', text);
};
Fire.error = function ( text ) {
    'use strict';

    if ( arguments.length <= 1 ) {
        text = '' + text;
    } else {
        text = Util.format.apply(Util, arguments);
    }
    console.error(text);
    Editor.sendToCore('console:error', text);
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

// ==========================
// login API
// ==========================

Editor.login = function ( account, passwd, cb ) {
    return Editor.sendRequestToCore( 'editor:login', account, passwd, cb );
};

Editor.tokenLogin = function ( token, userId, cb ) {
    return Editor.sendRequestToCore( 'editor:token-login', token, userId, cb );
};

Editor.cancelLogin = function ( id ) {
    Editor.cancelRequestToCore( id );
};

Editor.logout = function ( cb ) {
    Editor.sendRequestToCore( 'editor:logout', cb );
};

// ==========================
// Layout API
// ==========================

Editor.loadLayout = function ( anchorEL, cb ) {
    Editor.sendRequestToCore( 'window:query-layout', Editor.requireIpcEvent, function (layout) {
        if ( !layout ) {
            cb();
            return;
        }

        Editor.resetLayout( anchorEL, layout, cb );
    });
};

Editor.resetLayout = function ( anchorEL, layoutInfo, cb ) {
    var importList = EditorUI.createLayout( anchorEL, layoutInfo );
    Async.eachSeries( importList, function ( item, done ) {
        Editor.Panel.load (item.panelID, function ( err, viewEL ) {
            var dockAt = item.dockEL;
            dockAt.add(viewEL);
            dockAt.$.tabs.select(0);
            done();
        });
    }, function ( err ) {
        EditorUI.DockUtils.flush();
        Editor.sendToCore('window:save-layout',
                          Editor.Panel.getLayout(),
                          Editor.requireIpcEvent);
        if ( cb ) cb ();
    } );
};

// ==========================
// Ipc events
// ==========================

Ipc.on('editor:user-info-changed', function ( detail ) {
    Editor.token = detail.token;
    Editor.userInfo = detail['user-info'];
});

Ipc.on( 'editor:reset-layout', function ( layoutInfo ) {
    var anchorEL = document.body;
    if ( EditorUI.DockUtils.root ) {
        anchorEL = EditorUI.DockUtils.root.parentElement;
    }

    Editor.resetLayout( anchorEL, layoutInfo );
});

//
Editor.plugins = {}; // TODO: 做成Remote Object，确保全局只有一份?
Editor.gizmos = {};
