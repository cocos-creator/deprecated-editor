var ipc = new Editor.IpcListener();
var hierarchy = {

    // built-in properties

    init: function () {
        ipc.on('main-menu:create-entity', function () {
            Editor.sendToMainWindow('engine:create-entity', {
                'options': {
                    'select-in-hierarchy': true
                }
            });
            Editor.sendToMainWindow( 'scene:dirty' );
        });
        ipc.on('main-menu:create-child-entity', function () {
            var activeId = Editor.Selection.activeEntityId;
            Editor.sendToMainWindow('engine:create-entity', {
                'parent-id': activeId,
                'options': {
                    'select-in-hierarchy': true
                }
            });
            Editor.sendToMainWindow( 'scene:dirty' );
        });

        ipc.on('main-menu:create-input-field', function () {
            var activeId = Editor.Selection.activeEntityId;
            Editor.sendToMainWindow('engine:create-input-field', {
                'parent-id': activeId,
                'options': {
                    'select-in-hierarchy': true
                }
            });
            Editor.sendToMainWindow( 'scene:dirty' );
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
            {
                label: 'Create Input Field',
                message: menuType + ':create-input-field',
            },
        ];
    },
};

Editor.plugins.hierarchy = hierarchy;
