var Remote = require('remote');

var _idToPanelInfo = {};


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
            'auto-layout': childEL['auto-layout'],
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

Fire.PanelMng = {
    root: null, // The mainDock, init by panel-init.js or main-window.js

    load: function ( url, panelID, panelInfo, cb ) {
        Polymer.import([url], function () {
            var viewEL = new window[panelInfo.ctor]();
            viewEL.setAttribute('id', panelID);
            viewEL.setAttribute('name', panelInfo.title);
            viewEL.setAttribute('fit', '');

            // jshint ignore:start
            // register ipc events
            var ipcListener = new Fire.IpcListener();
            for ( var ipcName in panelInfo.messages ) {
                ipcListener.on( ipcName, function () {
                    var detail = {};
                    if ( arguments.length > 0 ) {
                        detail = arguments[0];
                    }
                    viewEL.fire( panelInfo.messages[ipcName], detail );
                } );
            }
            // jshint ignore:end

            //
            _idToPanelInfo[panelID] = {
                element: viewEL,
                messages: panelInfo.messages,
                ipcListener: ipcListener
            };
            Fire.sendToCore('panel:dock', panelID, Fire.RequireIpcEvent);
            Fire.sendRequestToCore('panel:query-settings', {
                id: panelID,
                settings: viewEL.settings
            }, function ( settings ) {
                viewEL.settings = settings;
                viewEL.settings.save = function () {
                    Fire.sendToCore('panel:save-settings', {
                        id: panelID,
                        settings: viewEL.settings,
                    } );
                };
                cb ( null, viewEL );
            } );
        });
    },

    closeAll: function () {
        for ( var id in _idToPanelInfo ) {
            Fire.PanelMng.close(id);
        }
    },

    close: function ( panelID ) {
        var panelInfo = _idToPanelInfo[panelID];

        if ( panelInfo) {
            panelInfo.ipcListener.clear();
            delete _idToPanelInfo[panelID];
        }

        Fire.sendToCore('panel:undock', panelID, Fire.RequireIpcEvent);
    },

    dispatch: function ( pluginName, panelName, ipcMessage ) {
        var panelID = panelName + '@' + pluginName;
        var panelInfo = _idToPanelInfo[panelID];
        if ( !panelInfo ) {
            Fire.warn( 'Failed to receive ipc %s, can not find panel %s', ipcMessage, panelID);
            return;
        }

        var detail;

        // special message
        if ( ipcMessage === 'panel:open' ) {
            detail = {};
            if ( arguments.length > 3 ) {
                detail = arguments[3];
            }
            panelInfo.element.fire( 'open', detail );
            return;
        }

        // other messages
        var domEvent = panelInfo.messages[ipcMessage];
        if ( domEvent ) {
            detail = {};
            if ( arguments.length > 3 ) {
                detail = arguments[3];
            }
            panelInfo.element.fire( domEvent, detail );
        }
    },

    getLayout: function () {
        if ( this.root instanceof FireDock ) {
            return {
                type: 'dock',
                row: this.root.row,
                'no-collapse': true,
                docks: _getDocks(this.root),
            };
        }
        else {
            var id = this.root.getAttribute('id');
            var rect = this.root.getBoundingClientRect();

            return {
                type: 'standalone',
                panel: id,
                width: rect.width,
                height: rect.height,
            };
        }
    },
};

