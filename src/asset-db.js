var Remote = require('remote');
var remoteDB = Remote.getGlobal('ASSET_DB');

Fire.AssetDB = {
    // remote sync
    get _libraryPath() { return remoteDB._libraryPath; },
    _fspath: function (url) { return remoteDB._fspath(url); },
    isValidUuid: function (uuid) { return remoteDB.isValidUuid(uuid); },
    urlToUuid: function (url) { return remoteDB.urlToUuid(url); },
    loadMetaJson: function (uuid) { return remoteDB.loadMetaJson(uuid); },
    uuidToUrl: function (uuid) { return remoteDB.uuidToUrl(uuid); },

    // ipc
    explore: function ( url ) {
        Fire.sendToCore( 'asset-db:explore', {
            url: url
        });
    },

    exploreLib: function ( url ) {
        Fire.sendToCore( 'asset-db:explore-lib', {
            url: url
        });
    },

    import: function ( destUrl, files ) {
        Fire.sendToCore('asset-db:import', {
            destUrl: destUrl,
            files: files
        });
    },

    reimport: function ( url ) {
        Fire.sendToCore('asset-db:reimport', {
            url: url
        });
    },

    delete: function ( url ) {
        Fire.sendToCore('asset-db:delete', {
            url: url
        });
    },

    move: function ( srcUrl, destUrl ) {
        Fire.sendToCore('asset-db:move', {
            srcUrl: srcUrl,
            destUrl: destUrl,
        });
    },

    save: function ( url, json, buffer ) {
        Fire.sendToCore('asset-db:save', {
            url: url,
            json: json,
            buffer: buffer
        });
    },

    saveByUuid: function ( uuid, json, buffer ) {
        Fire.sendToCore('asset-db:save-by-uuid', {
            uuid: uuid,
            json: json,
            buffer: buffer
        });
    },

    apply: function ( options ) {
        Fire.sendToCore('asset-db:apply', options );
    },

    query: function ( url, options ) {
        options = Fire.JS.mixin( options || {}, { url: url } );
        Fire.sendToCore('asset-db:query', options);
    },

    deepQuery: function ( url ) {
        Fire.sendToCore('asset-db:deep-query', {
            url: url
        });
    },
};
