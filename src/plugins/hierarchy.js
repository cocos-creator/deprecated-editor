function createEntity() {
    Fire.sendToPages('engine:createEntity');
}

function createChildEntity() {
    var activeId = Fire.Selection.activeEntityId;
    Fire.sendToPages('engine:createEntity', activeId);
}

var ipc = new Fire.IpcListener();

var hierarchy = {

    // built-in properties

    init: function () {
        ipc.on('create:createEntity', createEntity);
        ipc.on('create:createChildEntity', createChildEntity);

        Fire.MainMenu.addTemplate('Entity', this.getMenuTemplate('create'), {
            type: 'window-static'
        });
    },

    destroy: function () {
        ipc.clear();
    },

    // custom properties

    getMenuTemplate: function (type) {
        return [
            {
                label: 'Create Empty',
                message: type + ':createEntity',
            },
            {
                label: 'Create Empty Child',
                message: type + ':createChildEntity',
            },
        ];
    },
};

Fire.plugins.hierarchy = hierarchy;
