var ipc = new Editor.IpcListener();
var hierarchy = {

    // built-in properties

    init: function () {
        ipc.on('main-menu:create-entity', function () {
            Editor.sendToMainWindow('engine:create-entity');
        });
        ipc.on('main-menu:create-child-entity', function () {
            var activeId = Editor.Selection.activeEntityId;
            Editor.sendToMainWindow('engine:create-entity', {
                'parent-id': activeId
            });
        });

        Editor.MainMenu.addTemplate('Entity', this.getMenuTemplate('main-menu'), {
            type: 'window-static',
            index: 3
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

Editor.plugins.hierarchy = hierarchy;
