var Remote = require('remote');

var _idToPanelInfo = {};

Fire.PanelMng = {
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

            //
            cb ( null, viewEL );
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
};

