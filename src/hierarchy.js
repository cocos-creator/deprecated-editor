(function () {

    var Ipc = require('ipc');

    function createEntity() {
        Fire.broadcast('engine:createEntity');
    }

    function createChildEntity() {
        var activeId = Fire.Selection.activeEntityId;
        Fire.broadcast('engine:createEntity', activeId);
    }
    
    var hierarchy = {

        // built-in callbacks

        onEnable: function () {
            // register main menu
            Fire.MainMenu.addTemplate('Entity', this.getCreateMenuTemplate('main-menu'));

            Ipc.on('main-menu:createEntity', createEntity);
            Ipc.on('main-menu:createChildEntity', createChildEntity);
        },

        onDisable: function () {
            Ipc.removeListener('main-menu:createEntity', createEntity);
            Ipc.removeListener('main-menu:createChildEntity', createChildEntity);
        },

        // custom properties

        getCreateMenuTemplate: function (type) {
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

})();
