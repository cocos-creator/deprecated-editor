// Fire.MainMenu

Fire.MainMenu = {};

/**
 * @param {string} menuPath - the menu path name. Eg. "Entity/So Cool"
 * @param {string} message
 * @param {*[]} [params]
 * @param {number} [priority] - the order which the menu item are displayed
 */
Fire.MainMenu.addCommandItem = function (menuPath, message, params, priority) {
    Fire.rpc('menu:main-add-item', menuPath, message, params, {
        priority: priority,
        type: 'window-dynamic'
    });
};

///**
// * @param {string} menuPath - the menu path name. Eg. "Entity/So Cool"
// */
//Fire.MainMenu.remove = function (menuPath) {
//    Fire.rpc('menu:main-remove-item', menuPath);
//};

Fire.MainMenu.reset = function () {
    Fire.rpc('menu:main-reset', 'window-dynamic');
};

///**
// * @param {string} menuPath - the menu path name. Eg. "Entity/So Cool"
// * @param {function} callback
// * @param {number} [priority] - the order which the menu item are displayed
// */
//Fire.MainMenu.addCallbackItem = function (menuPath, callback, priority) {
//    // TODO 自动注册命令并触发回调
//};

function checkTemplate(template) {
    // ensure no click
    for (var i = 0; i < template.length; i++) {
        var item = template[0];
        if (item.click) {
            Fire.error('Not support to use click in web-side menu declaration, it may caused dead lock due to ipc problem of atom-shell');
            return false;
        }
        if (item.submenu && !checkTemplate(item.submenu)) {
            return false;
        }
    }
    return true;
}

/**
 * @param {string} menuPath - the menu path name. Eg. "Entity/So Cool"
 * @param {object[]} template -  the template is just an array of options for constructing MenuItem,
 *                               see https://github.com/atom/atom-shell/blob/master/docs/api/menu.md
 * @param {object} [options]
 *
 * available options: {
 *     type: ['window-dynamic' | 'window-static'],    // indicates the menu type
 * }
 */
Fire.MainMenu.addTemplate = function (menuPath, template, options) {
    if (checkTemplate(template)) {
        options = options || {};
        options.type = options.type || 'window-dynamic';
        Fire.rpc('menu:main-add-template', menuPath, template, options);
    }
};

/**
 * @param {object[]} template -  the template is just an array of options for constructing MenuItem
 */
Fire.popupMenu = function (template, x, y) {
    Fire.rpc('menu:popup', template, x, y);
};
