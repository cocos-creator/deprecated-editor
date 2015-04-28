var _idToPanelInfo = {};
var _url2link = {};

_getPanels = function ( panelEL ) {
    var panels = [];

    for ( var i = 0; i < panelEL.childElementCount; ++i ) {
        var childEL = panelEL.children[i];
        var id = childEL.getAttribute('id');
        panels.push(id);
    }

    return panels;
};

_getDocks = function ( dockEL ) {
    var docks = [];

    for ( var i = 0; i < dockEL.childElementCount; ++i ) {
        var childEL = dockEL.children[i];

        if ( !(childEL instanceof FireDock) )
            continue;

        var rect = childEL.getBoundingClientRect();
        var info = {
            'row': childEL.row,
            'width': rect.width,
            'height': rect.height,
        };

        if ( childEL instanceof FirePanel ) {
            info.type = 'panel';
            info.panels = _getPanels(childEL);
        }
        else {
            info.type = 'dock';
            info.docks = _getDocks(childEL);
        }

        docks.push(info);
    }

    return docks;
};

function _registerIpc ( panelID, viewEL, ipcListener, ipcName ) {
    var fn = viewEL[ipcName];
    if ( !fn || typeof fn !== 'function' ) {
        if ( ipcName !== 'panel:open') {
            Fire.warn('Failed to register ipc message %s in panel %s, Can not find implementation', ipcName, panelID );
        }
        return;
    }

    ipcListener.on( ipcName, function () {
        var fn = viewEL[ipcName];
        if ( !fn || typeof fn !== 'function' ) {
            Fire.warn('Failed to respond ipc message %s in panel %s, Can not find implementation', ipcName, panelID );
            return;
        }
        fn.apply( viewEL, arguments );
    } );
}

function _registerProfile ( panelID, type, profile ) {
    profile.save = function () {
        Editor.sendToCore('panel:save-profile', panelID, type, profile);
    };
}

Editor.Panel = {
    import: function ( url, cb ) {
        var link = _url2link[url];
        if ( link ) {
            link.remove();
            delete _url2link[url];
        }

        link = document.createElement('link');
        link.rel = 'import';
        link.href = url;
        link.onload = cb;
        link.onerror = function(e) {
            Editor.error('Failed to import %s', link.href);
        };

        document.head.appendChild(link);
        _url2link[url] = link;
    },

    load: function ( url, panelID, panelInfo, cb ) {
        Polymer.import([url], function () {
            var viewCtor = window[panelInfo.ctor];
            if ( !viewCtor ) {
                Fire.error('Panel import faield. Can not find constructor %s', panelInfo.ctor );
                return;
            }

            var viewEL = new viewCtor();
            viewEL.setAttribute('id', panelID);
            viewEL.setAttribute('name', panelInfo.title);
            viewEL.setAttribute('fit', '');

            // set size attribute
            if ( panelInfo.width )
                viewEL.setAttribute( 'width', panelInfo.width );

            if ( panelInfo.height )
                viewEL.setAttribute( 'height', panelInfo.height );

            if ( panelInfo['min-width'] )
                viewEL.setAttribute( 'min-width', panelInfo['min-width'] );

            if ( panelInfo['min-height'] )
                viewEL.setAttribute( 'min-height', panelInfo['min-height'] );

            if ( panelInfo['max-width'] )
                viewEL.setAttribute( 'max-width', panelInfo['max-width'] );

            if ( panelInfo['max-height'] )
                viewEL.setAttribute( 'max-height', panelInfo['max-height'] );

            // register ipc events
            var ipcListener = new Editor.IpcListener();

            // always have panel:open message
            if ( panelInfo.messages.indexOf('panel:open') === -1 ) {
                panelInfo.messages.push('panel:open');
            }

            for ( i = 0; i < panelInfo.messages.length; ++i ) {
                _registerIpc( panelID, viewEL, ipcListener, panelInfo.messages[i] );
            }

            //
            _idToPanelInfo[panelID] = {
                element: viewEL,
                messages: panelInfo.messages,
                ipcListener: ipcListener
            };

            viewEL.profiles = panelInfo.profiles;
            for ( var type in panelInfo.profiles ) {
                _registerProfile ( panelID, type, panelInfo.profiles[type] );
            }

            cb ( null, viewEL );
        });
    },

    open: function ( panelID, argv ) {
        Editor.sendToCore('panel:open', panelID, argv);
    },

    close: function ( panelID ) {
        Panel.undock(panelID);
        Editor.sendToCore('panel:close', panelID);
    },

    closeAll: function () {
        for ( var id in _idToPanelInfo ) {
            Editor.Panel.close(id);
        }
    },

    undock: function ( panelID ) {
        // remove panel element from tab
        var viewEL = Editor.Panel.find(panelID);
        if ( viewEL ) {
            var panelEL = viewEL.parentElement;
            var currentTabEL = panelEL.$.tabs.findTab(viewEL);
            panelEL.close(currentTabEL);

            EditorUI.DockUtils.flush();
        }

        // remove panelInfo
        var panelInfo = _idToPanelInfo[panelID];
        if ( panelInfo) {
            panelInfo.ipcListener.clear();
            delete _idToPanelInfo[panelID];
        }
    },

    dispatch: function ( panelID, ipcName ) {
        var panelInfo = _idToPanelInfo[panelID];
        if ( !panelInfo ) {
            Fire.warn( 'Failed to receive ipc %s, can not find panel %s', ipcName, panelID);
            return;
        }

        // messages
        var idx = panelInfo.messages.indexOf(ipcName);
        if ( idx === -1 ) {
            Fire.warn('Can not find ipc message %s register in panel %s', ipcName, panelID );
            return;
        }

        var fn = panelInfo.element[ipcName];
        if ( !fn || typeof fn !== 'function' ) {
            if ( ipcName !== 'panel:open') {
                Fire.warn('Failed to respond ipc message %s in panel %s, Can not find implementation', ipcName, panelID );
            }
            return;
        }
        var args = [].slice.call( arguments, 2 );
        fn.apply( panelInfo.element, args );
    },

    getLayout: function () {
        var root = EditorUI.DockUtils.root;
        if ( !root )
            return null;

        if ( root instanceof FireDock ) {
            return {
                'type': 'dock',
                'row': root.row,
                'no-collapse': true,
                'docks': _getDocks(root),
            };
        }
        else {
            var id = root.getAttribute('id');
            var rect = root.getBoundingClientRect();

            return {
                'type': 'standalone',
                'panel': id,
                'width': rect.width,
                'height': rect.height,
            };
        }
    },

    find: function ( panelID ) {
        var panelInfo = _idToPanelInfo[panelID];
        if ( !panelInfo ) {
            return null;
        }
        return panelInfo.element;
    },
};

// ==========================
// Ipc events
// ==========================

var Ipc = require('ipc');

Ipc.on('panel:close', function ( panelID ) {
    // NOTE: if we don't do this in requestAnimationFrame,
    // the tab will remain, something wrong for Polymer.dom
    // operation when they are in ipc callback.
    window.requestAnimationFrame( function () {
        Editor.Panel.close(panelID);
    });
});

Ipc.on('panel:popup', function ( panelID ) {
    window.requestAnimationFrame( function () {
        Editor.Panel.close(panelID);
        Editor.sendToCore('panel:new', panelID);
    });
});

Ipc.on('panel:undock', function ( panelID ) {
    window.requestAnimationFrame( function () {
        Editor.Panel.undock(panelID);
    });
});
