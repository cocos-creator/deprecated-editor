var ipc = new Fire.IpcListener();
var hierarchy = {

    // built-in properties

    init: function () {
        ipc.on('main-menu:create-entity', function () {
            Fire.sendToMainPage('engine:createEntity');
        });
        ipc.on('main-menu:create-child-entity', function () {
            var activeId = Fire.Selection.activeEntityId;
            Fire.sendToMainPage('engine:createEntity', activeId);
        });

        Fire.MainMenu.addTemplate('Entity', this.getMenuTemplate('main-menu'), {
            type: 'window-static'
        });
    },

    destroy: function () {
        ipc.clear();
    },

    // custom properties

    getMenuTemplate: function ( menuType ) {
        return [
            {
                label: 'Create Empty',
                message: menuType + ':create-entity',
            },
            {
                label: 'Create Empty Child',
                message: menuType + ':create-child-entity',
            },
        ];
    },
};

Fire.plugins.hierarchy = hierarchy;
