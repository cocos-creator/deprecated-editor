var Remote = require('remote');
var Menu = Remote.require('menu');

Polymer({
    created: function () {
        this.target = null;
    },

    refresh: function () {
        this.$.fields.refresh();
    },

    targetChanged: function () {
        this.$.fields.target = this.target;
        this.refresh();
    },

    getAddCompMenuTemplate: function () {
        function findMenu (menuArray, label) {
            for (var i = 0; i < menuArray.length; i++) {
                if (menuArray[i].label === label) {
                    return menuArray[i];
                }
            }
            return null;
        }
        var template = [];
        var items = Fire._componentMenuItems;
        // enumerate components
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var subPathes = item.menuPath.split('/');

            var prio = item.priority || 0;
            // enumerate menu path
            var newMenu = null;
            for (var p = 0, parent = template; p < subPathes.length; p++) {
                var label = subPathes[p];
                if (!label) {
                    continue;
                }
                var parentMenuArray = parent === template ? template : parent.submenu;
                var menu;
                if (parentMenuArray) {
                    if (parentMenuArray.length > 0) {
                         menu = findMenu(parentMenuArray, label);
                    }
                    if (menu) {
                        if (menu.submenu) {
                            parent = menu;
                            continue;
                        }
                        else {
                            Fire.error('Component menu path %s conflict', item.menuPath);
                            break;
                        }
                    }
                }
                // create
                newMenu = {
                    label: label,
                    priority: prio
                };
                if ( !parentMenuArray ) {
                    parent.submenu = [newMenu];
                }
                else {
                    var length = parentMenuArray.length;
                    if (length > 0) {
                        // find from back to front to get the one less than supplied priority,
                        // then return the last one.
                        for (var j = length - 1; j >= 0; j--) {
                            if (parentMenuArray[j].priority > newMenu.priority) {
                                // end loop
                                if (j === 0) {
                                    parentMenuArray.unshift(newMenu);
                                }
                            }
                            else {
                                parentMenuArray.splice(j + 1, 0, newMenu);
                                break;
                            }
                        }
                    }
                    else {
                        parentMenuArray.push(newMenu);
                    }
                }
                parent = newMenu;
            }
            if (newMenu && !newMenu.submenu) {
                // click callback
                // jshint ignore:start
                newMenu.click = (function (component) {
                    setImmediate(function () {
                        this.addComponent(component);
                    }.bind(this));
                }).bind(this, item.component);
                // jshint ignore:end
            }
            else {
                Fire.error('Invalid component menu path: ' + item.menuPath);
            }
        }
        return template;
    },

    addComponent: function (componentCtor) {
        Fire.sendToMainWindow('engine:addComponent', this.target.id, Fire.JS._getClassId(componentCtor) );
    },

    fieldsChangedAction: function ( event, detail ) {
        event.stopPropagation();

        if ( detail instanceof Fire.Asset ) {
            Fire.AssetLibrary.cacheAsset(detail);
        }

        Fire.sendToMainWindow( 'entity:inspector-dirty' );
        Fire.sendToWindows( 'scene:dirty' );
    },

    addComponentAction: function ( event ) {
        event.stopPropagation();

        var rect = this.$.btnAddComp.getBoundingClientRect();
        var x = rect.left;
        var y = rect.bottom;

        var template = this.getAddCompMenuTemplate();
        var menu = Menu.buildFromTemplate(template);
        menu.popup(Remote.getCurrentWindow(), Math.floor(x), Math.floor(y));
    },
});
