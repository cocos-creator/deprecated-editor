(function () {

    function createEntity() {
        Fire.broadcast('engine:createEntity');
    }

    function createChildEntity() {
        var activeId = Fire.Selection.activeEntityId;
        Fire.broadcast('engine:createEntity', activeId);
    }

    var ipc = new Fire.IpcListener();
    
    var hierarchy = {

        // built-in properties

        init: function () {
            ipc.on('create:createEntity', createEntity);
            ipc.on('create:createChildEntity', createChildEntity);
        },

        destroy: function () {
            ipc.clear();
        },

        mainMenu: {
            path: 'Entity',
            template: null,
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

    hierarchy.mainMenu.template = hierarchy.getMenuTemplate('create');

    Fire.plugins.hierarchy = hierarchy;
})();
