var Remote = require('remote');
var remoteDB = Remote.getGlobal('ASSET_DB');

Editor.AssetDB = {
    // remote sync
    get _libraryPath() { return remoteDB._libraryPath; },
    _fspath: function (url) { return remoteDB._fspath(url); },
    isValidUuid: function (uuid) { return remoteDB.isValidUuid(uuid); },
    urlToUuid: function (url) { return remoteDB.urlToUuid(url); },
    loadMetaJson: function (uuid) { return remoteDB.loadMetaJson(uuid); },
    uuidToUrl: function (uuid) { return remoteDB.uuidToUrl(uuid); },

    // ipc
    explore: function ( url ) {
        Editor.sendToCore( 'asset-db:explore', {
            url: url
        });
    },

    exploreLib: function ( url ) {
        Editor.sendToCore( 'asset-db:explore-lib', {
            url: url
        });
    },

    import: function ( destUrl, files ) {
        Editor.sendToCore('asset-db:import', {
            'dest-url': destUrl,
            'files': files
        });
    },

    reimport: function ( url ) {
        Editor.sendToCore('asset-db:reimport', {
            url: url
        });
    },

    delete: function ( url ) {
        Editor.sendToCore('asset-db:delete', {
            url: url
        });
    },

    move: function ( srcUrl, destUrl ) {
        Editor.sendToCore('asset-db:move', {
            'src-url': srcUrl,
            'dest-url': destUrl,
        });
    },

    save: function ( url, json, buffer ) {
        Editor.sendToCore('asset-db:save', {
            url: url,
            json: json,
            buffer: buffer
        });
    },

    saveByUuid: function ( uuid, json, buffer ) {
        Editor.sendToCore('asset-db:save-by-uuid', {
            uuid: uuid,
            json: json,
            buffer: buffer
        });
    },

    newFolder: function ( url ) {
        Editor.sendToCore( 'asset-db:new-folder', {
            url: url
        });
    },

    newScript: function ( url, templateName ) {
        Editor.sendToCore('asset-db:new-script', {
            url: url,
            template: templateName
        });
    },

    apply: function ( options ) {
        Editor.sendToCore('asset-db:apply', options );
    },

    query: function ( url, options, cb ) {
        options = Fire.JS.mixin( options || {}, { url: url } );
        Editor.sendRequestToCore('asset-db:query', options, cb);
    },

    deepQuery: function ( url, cb ) {
        Editor.sendRequestToCore('asset-db:deep-query', {
            url: url
        }, cb);
    },

    generateUniqueUrl: function ( url, cb ) {
        Editor.sendRequestToCore('asset-db:generate-unique-url', {
            url: url
        }, cb);
    },
};
