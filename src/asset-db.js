var Remote = require('remote');
var remoteDB = Remote.getGlobal('ASSET_DB');

Fire.AssetDB = {
    // remote sync
    get _libraryPath() { return remoteDB._libraryPath; },
    _fspath: function (url) { return remoteDB._fspath; },
    isValidUuid: function (uuid) { return remoteDB.isValidUuid(uuid); },
    urlToUuid: function (url) { return remoteDB.urlToUuid(url); },
    loadMetaJson: function (uuid) { return remoteDB.loadMetaJson(uuid); },
    uuidToUrl: function (uuid) { return remoteDB.uuidToUrl(uuid); },

    // ipc
    explore: function ( url ) {
        Fire.sendToCore( 'asset-db:explore', url );
    },

    exploreLib: function ( url ) {
        Fire.sendToCore( 'asset-db:explore-lib', url );
    },

    import: function ( destUrl, files ) {
        Fire.sendToCore('asset-db:import', destUrl, files );
    },

    reimport: function ( url ) {
        Fire.sendToCore('asset-db:reimport', url );
    },

    delete: function ( url ) {
        Fire.sendToCore('asset-db:delete', url );
    },

    move: function ( srcUrl, destUrl ) {
        Fire.sendToCore('asset-db:move', srcUrl, destUrl );
    },

    save: function ( url, options ) {
        Fire.sendToCore('asset-db:save', url, options );
    },

    saveByUuid: function ( uuid, options ) {
        Fire.sendToCore('asset-db:save-by-uuid', uuid, options );
    },

    apply: function ( options ) {
        Fire.sendToCore('asset-db:apply', options );
    },

    query: function ( url, options ) {
        Fire.sendToCore('asset-db:query', url, options);
    },

    deepQuery: function ( url ) {
        Fire.sendToCore('asset-db:deep-query', url);
    },
};
