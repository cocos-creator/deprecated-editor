var Remote = require('remote');

var _idToPanelInfo = {};


_getTabs = function ( panelEL ) {
    var tabs = [];

    for ( var i = 0; i < panelEL.childElementCount; ++i ) {
        var childEL = panelEL.children[i];
        tabs.push(childEL.tagName.toLowerCase());
    }

    return tabs;
};

_getLayout = function ( dockEL ) {
    var docks = [];

    for ( var i = 0; i < dockEL.childElementCount; ++i ) {
        var childEL = dockEL.children[i];

        if ( childEL instanceof FirePanel ) {
            docks.push({
                type: 'panel',
                row: childEL.row,
                width: childEL.width,
                height: childEL.height,
                'min-width': childEL['min-width'],
                'min-height': childEL['min-height'],
                'max-width': childEL['max-width'],
                'max-height': childEL['max-height'],
                tabs: _getTabs(childEL),
            });
        }
        else if ( childEL instanceof FireDock ) {
            docks.push({
                type: 'dock',
                row: childEL.row,
                width: childEL.width,
                height: childEL.height,
                'min-width': childEL['min-width'],
                'min-height': childEL['min-height'],
                'max-width': childEL['max-width'],
                'max-height': childEL['max-height'],
                docks: _getLayout(childEL),
            });
        }
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
            // TODO: panel min, max width, height

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
        return {
            type: 'dock',
            row: this.root.row,
            docks: _getLayout(this.root),
        };
    },
};

