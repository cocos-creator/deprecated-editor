Fire.Selection = (function () {

    var Ipc = require('ipc');

    // messages
    var APP_CONFIRM = 'selection:confirm';
    var APP_CANCEL = 'selection:cancel';
    var APP_SELECT_ENTITY = 'selection:select-entity';
    var APP_UNSELECT_ENTITY = 'selection:unselect-entity';
    var APP_HOVER_ENTITY = 'selection:hover-entity';
    var APP_SELECT_ASSET = 'selection:select-asset';
    var APP_UNSELECT_ASSET = 'selection:unselect-asset';
    var APP_HOVER_ASSET = 'selection:hover-asset';
    var APP_CLEAR_ENTITY = 'selection:clear-entity';
    var APP_CLEAR_ASSET = 'selection:clear-asset';

    var WEB_ENTITY_SELECTED = 'selection:entity:selected';
    var WEB_ASSET_SELECTED = 'selection:asset:selected';
    var WEB_ENTITY_UNSELECTED = 'selection:entity:unselected';
    var WEB_ASSET_UNSELECTED = 'selection:asset:unselected';
    var WEB_ENTITY_ACTIVATED = 'selection:entity:activated';
    var WEB_ASSET_ACTIVATED = 'selection:asset:activated';
    var WEB_ENTITY_DEACTIVATED = 'selection:entity:deactivated';
    var WEB_ASSET_DEACTIVATED = 'selection:asset:deactivated';
    //var WEB_ENTITY_HOVER = 'selection:entity:hover';
    //var WEB_ASSET_HOVER = 'selection:asset:hover';
    //var WEB_ENTITY_HOVEROUT = 'selection:entity:hoverout';
    //var WEB_ASSET_HOVEROUT = 'selection:asset:hoverout';
    

    /**
     * 这个模块负责将事件转发给 app 处理，selection 事件最终还是由 app 发出，收到 app 的事件后该模块会在本地缓存数据
     * 这么做的原因是 atom-shell 在执行浏览器事件时，如果进行同步 ipc 调用将导致死锁。
     */
    var Selection = {

        /**
         * Confirms all current selecting objects, no matter which type they are.
         * This operation may trigger deactivated and activated events.
         */
        confirm: function () {
            Fire.command(APP_CONFIRM);
        },

        /**
         * Cancels all current selecting objects, no matter which type they are.
         * This operation may trigger selected and unselected events.
         */
        cancel: function () {
            Fire.command(APP_CANCEL);
        },

        /**
         * 如果 confirm 为 false，则表示按下鼠标左键或者开始拖动，但未松开鼠标时的状态。
         * 此时不会触发 activated 消息，但是会广播 selected 事件。
         * 此时如果被 confirm 才会触发 activated 消息，如果被 cancel 则会触发 unselected 事件。
         * 如果 confirm 为 true (默认)，则 activated 消息会同时被触发。
         * @param {string|string[]} id
         * @param {boolean} [unselectOthers=true]
         * @param {boolean} [confirm=true]
         */
        selectEntity: function (id, unselectOthers, confirm) {
            unselectOthers = (typeof unselectOthers !== 'undefined') ? unselectOthers : true;
            confirm = (typeof confirm !== 'undefined') ? confirm : true;

            Fire.command(APP_SELECT_ENTITY, id, unselectOthers, confirm);
        },

        /**
         * @param {string|string[]} id
         * @param {boolean} [confirm=true]
         */
        unselectEntity: function (id, confirm) {
            confirm = (typeof confirm !== 'undefined') ? confirm : true;

            Fire.command(APP_UNSELECT_ENTITY, id, confirm);
        },

        /**
         * 如果 confirm 为 false，则表示按下鼠标左键或者开始拖动，但未松开鼠标时的状态。
         * 此时不会触发 activated 消息，但是会广播 selected 事件。
         * 此时如果被 confirm 才会触发 activated 消息，如果被 cancel 则会触发 unselected 事件。
         * 如果 confirm 为 true (默认)，则 activated 消息会同时被触发。
         * @param {string|string[]} id
         * @param {boolean} [unselectOthers=true]
         * @param {boolean} [confirm=true]
         */
        selectAsset: function (id, unselectOthers, confirm) {
            unselectOthers = (typeof unselectOthers !== 'undefined') ? unselectOthers : true;
            confirm = (typeof confirm !== 'undefined') ? confirm : true;

            Fire.command(APP_SELECT_ASSET, id, unselectOthers, confirm);
        },

        /**
         * @param {string|string[]} id
         * @param {boolean} [confirm=true]
         */
        unselectAsset: function (id, confirm) {
            confirm = (typeof confirm !== 'undefined') ? confirm : true;

            Fire.command(APP_UNSELECT_ASSET, id, confirm);
        },

        hoverEntity: function (id) {
            if ( !id ) id = "";
            Fire.command(APP_HOVER_ENTITY, id);
        },

        hoverAsset: function (id) {
            if ( !id ) id = "";
            Fire.command(APP_HOVER_ASSET, id);
        },

        clearEntity: function () {
            Fire.command(APP_CLEAR_ENTITY);
        },

        clearAsset: function () {
            Fire.command(APP_CLEAR_ASSET);
        },

        /**
         * @property {string} activeEntityId - (Read Only)
         */
        activeEntityId: '',

        /**
         * @property {string} activeAssetUuid - (Read Only)
         */
        activeAssetUuid: '',
        
        /**
         * @property {string[]} entities - the array of entities id (Read Only)
         */
        entities: [],
        
        /**
         * @property {string[]} assets - the array of assets uuids (Read Only)
         */
        assets: [],
    };
    
    // 接收广播并且缓存数据，这样本地才能同步读取
    
    Ipc.on( WEB_ENTITY_SELECTED, function (ids) {
        Selection.entities = Selection.entities.concat(ids);
    });
    Ipc.on( WEB_ASSET_SELECTED, function (ids) {
        Selection.assets = Selection.assets.concat(ids);
    });
    Ipc.on( WEB_ENTITY_UNSELECTED, function (ids) {
        Selection.entities = Selection.entities.filter( function (x) {
            return ids.indexOf(x) === -1;
        });
    });
    Ipc.on( WEB_ASSET_UNSELECTED, function (ids) {
        Selection.assets = Selection.assets.filter( function (x) {
            return ids.indexOf(x) === -1;
        });
    });
    Ipc.on( WEB_ENTITY_ACTIVATED, function (id) {
        Selection.activeEntityId = id;
    });
    Ipc.on( WEB_ASSET_ACTIVATED, function (id) {
        Selection.activeAssetUuid = id;
    });
    Ipc.on( WEB_ENTITY_DEACTIVATED, function (id) {
        Selection.activeEntityId = '';
    });
    Ipc.on( WEB_ASSET_DEACTIVATED, function (id) {
        Selection.activeAssetUuid = '';
    });



    /**
     * @param {string[]} idList
     * @param {string} mode ['top-level','deep','name']
     * @param {function} func 
     */
    Selection.filter = function ( idList, mode, func ) {
        var results = [], id, i, j;
        
        if ( mode === 'name' ) {
            for ( i = 0; i < idList.length; ++i ) {
                id = idList[i];
                if ( func(id) ) {
                    results.push(id);
                }
            }
        }
        else {
            for ( i = 0; i < idList.length; ++i ) {
                id = idList[i];
                var addId = true;

                for ( j = 0; j < results.length; ++j ) {
                    var idTmp = results[j];

                    if ( id === idTmp ) {
                        addId = false;
                        break;
                    }

                    var cmp = func( idTmp, id );
                    if ( cmp > 0 ) {
                        addId = false;
                        break;
                    }
                    else if ( cmp < 0 ) {
                        results.splice(j, 1);
                        --j;
                    }
                }

                if ( addId ) {
                    results.push(id);
                }
            }
        }

        return results;
    };

    return Selection;
})();
