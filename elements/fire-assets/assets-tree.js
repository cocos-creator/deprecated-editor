var Path = require('fire-path');
var Url = require('fire-url');

var Remote = require('remote');
var Menu = Remote.require('menu');
var dialog = Remote.require('dialog');

function _isTexture ( extname ) {
    return extname === '.png' || extname === '.jpg';
}

function _newAssetsItem ( url, type, id, parentEL ) {
    var newEL = new AssetsItem();
    newEL.isRoot = type === 'root';
    newEL.isFolder = (type === 'folder' || newEL.isRoot);
    newEL.isSubAsset = !parentEL.isFolder;

    var extname = "";
    var basename = Url.basename(url);

    if ( !newEL.isFolder ) {
        extname = Url.extname(url);
        basename = Url.basename(url, extname);
    }

    var img;

    newEL.extname = extname;
    type = type || extname.toLowerCase();
    switch ( type ) {
    case 'root':
        newEL.setIcon('db');
        break;

    case 'folder':
        newEL.setIcon('folder');
        break;

    case '.fire':
        newEL.setIcon('fire');
        break;

    case '.js':
        newEL.setIcon('js');
        break;

    case '.coffee':
        newEL.setIcon('co');
        break;

    case '.ts':
        newEL.setIcon('ts');
        break;

    case '.txt':
        newEL.setIcon('txt');
        break;

    case '.html':
    case '.htm':
    case '.xml':
    case '.json':
        newEL.setIcon('html');
        break;

    case '.css':
    case '.less':
    case '.styl':
        newEL.setIcon('css');
        break;

    case '.anim':
        newEL.setIcon('anim');
        break;

    case '.sprite':
        newEL.setIcon('sprite');
        break;

    case '.fnt':
    case '.bmf':
    case '.bmfont':
        newEL.setIcon('bmfont');
        break;

    case '.atlas':
        newEL.setIcon('atlas');
        break;

    case '.mp3':
    case '.wav':
    case '.ogg':
        newEL.setIcon('audio');
        break;

    case '.png':
    case '.jpg':
        img = new Image();
        img.src = 'uuid://' + id + "?thumb";
        newEL.setIcon(img);
        break;

    case '.asset':
        newEL.setIcon('fa fa-cube');
        break;

    default:
        newEL.setIcon('fa fa-question-circle');
        break;
    }

    this.initItem(newEL, basename, id, parentEL);
    return newEL;
}

function _getNameCollisions ( target, list ) {

    var nodes = target.childNodes;

    var nodesLen = nodes.length;
    var len = list.length;
    var i,j;
    var name;
    var node;
    var collisions = [];

    for(i = 0; i < len; i++) {
        name = list[i];

        for(j = 0; j < nodesLen; j++) {

            node = nodes[j];
            if (node.name + node.extname === name) {
                collisions.push(node);
            }

        }
    }

    return collisions;
}

function _addCustomAssetMenu(target, template) {
    function findMenu(menuArray, label) {
        for (var i = 0; i < menuArray.length; i++) {
            if (menuArray[i].label === label) {
                return menuArray[i];
            }
        }
        return null;
    }

    function onclick() {
        var contextSelection = Fire.Selection.contextAssets;
        if (contextSelection.length > 0) {
            var targetEL = target.idToItem[contextSelection[0]];
            if (!targetEL.isFolder) {
                targetEL = targetEL.parentElement;
            }
            var url = target.getUrl(targetEL);
            var newCustomAsset = new item.customAsset();
            var newAssetUrl = Url.join(url, fileName + '.asset');
            target._focusUrl = newAssetUrl;
            Fire.sendToCore('asset-db:save', newAssetUrl, Fire.serialize(newCustomAsset));
        }
    }

    // Custom Asset Menu Item
    var items = Fire._customAssetMenuItems;
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var subPathes = item.menuPath.split('/');
        var fileName = subPathes.length > 0 ? subPathes[subPathes.length - 1] : subPathes[0];
        if (fileName === "") {
            Fire.error('Invalid custom asset menu path: ' + item.menuPath);
            continue;
        }
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
                        Fire.error('Custom Asset menu path %s conflict', item.menuPath);
                        break;
                    }
                }
            }
            // create
            newMenu = {
                label: label,
            };
            if (!parentMenuArray) {
                parent.submenu = [newMenu];
            }
            else {
                parentMenuArray.splice(3, 0, newMenu);
            }
            parent = newMenu;
        }
        if (newMenu && !newMenu.submenu) {
            newMenu.click = onclick;
        }
        else {
            Fire.error('Invalid custom asset menu path: ' + item.menuPath);
        }
    }
}


Polymer({
    created: function () {
        this.super();

        this.contextmenu = null;

        // dragging
        this.curDragoverEL = null;
        this.lastDragoverEL = null;
        this.dragenterCnt = 0;

        // confliction
        this.confliction = [];

        this.ipc = new Fire.IpcListener();

        this._focusUrl = null;
    },

    ready: function () {
        this.super();

        this.addEventListener( "dragenter", function (event) {
            ++this.dragenterCnt;
        }, true);

        this.addEventListener( "dragleave", function (event) {
            --this.dragenterCnt;
            if ( this.dragenterCnt === 0 ) {
                this.resetDragState();
            }
        }, true);
    },

    attached: function () {
        // register Ipc
        this.ipc.on('folder:created', function ( url, id, parentId ) {
            this.newItem( url, id, parentId, true );
        }.bind(this) );
        this.ipc.on('asset:created', function ( url, id, parentId ) {
            this.newItem( url, id, parentId, false );
        }.bind(this) );
        this.ipc.on('asset:moved', this.moveItem.bind(this) );
        this.ipc.on('assets:created', function ( results ) {
            for ( var i = 0; i < results.length; ++i ) {
                var info = results[i];
                this.newItem( info.url, info.uuid, info.parentUuid, info.isDir );
            }
        }.bind(this) );
        this.ipc.on('assets:deleted', function (results) {
            var filterResults = Fire.arrayCmpFilter ( results, function ( a, b ) {
                if ( Path.contains( a.url, b.url ) ) {
                    return 1;
                }
                if ( Path.contains( b.url, a.url ) ) {
                    return -1;
                }
                return 0;
            } );

            for ( var i = 0; i < filterResults.length; ++i ) {
                this.deleteItemById(filterResults[i].uuid);
            }
        }.bind(this) );
        this.ipc.on('asset-db:deep-query-results', function ( url, results ) {
            for ( var i = 0; i < results.length; ++i ) {
                var info = results[i];
                this.newItem( info.url, info.uuid, info.parentUuid, info.isDir );
            }
        }.bind(this) );
        this.ipc.on('asset:refresh-context-menu', function () {
            // make context menu dirty
            this.contextmenu = null;
        }.bind(this) );
    },

    detached: function () {
        this.ipc.clear();
    },

    getCreateMenuTemplate: function () {
        return [
            // New Scene
            {
                label: 'New Scene',
                click: function () {
                    var url = "assets://";
                    var contextSelection = Fire.Selection.contextAssets;
                    if ( contextSelection.length > 0 ) {
                        var targetEL = this.idToItem[contextSelection[0]];
                        if ( !targetEL.isFolder )
                            targetEL = targetEL.parentElement;
                        url = this.getUrl(targetEL);
                    }

                    var newScene = new Fire._Scene();
                    var newAssetUrl = Url.join( url, 'New Scene.fire' );
                    this._focusUrl = newAssetUrl;
                    Fire.sendToCore( 'asset-db:save',
                                  newAssetUrl,
                                  Fire.serialize(newScene) );
                }.bind(this)
            },

            // New Folder
            {
                label: 'New Folder',
                click: function () {
                    var url = "assets://";
                    var contextSelection = Fire.Selection.contextAssets;
                    if ( contextSelection.length > 0 ) {
                        var targetEL = this.idToItem[contextSelection[0]];
                        if ( !targetEL.isFolder )
                            targetEL = targetEL.parentElement;
                        url = this.getUrl(targetEL);
                    }

                    var newAssetUrl = Url.join( url, 'New Folder' );
                    this._focusUrl = newAssetUrl;
                    Fire.rpc( 'asset-db:makedirs', newAssetUrl );
                }.bind(this)
            },

            // New Sprite (Standalone)
            {
                label: 'New Sprite (Standalone)',
                click: function () {
                    var targetEL = null;
                    var contextSelection = Fire.Selection.contextAssets;
                    if ( contextSelection.length > 0 ) {
                        targetEL = this.idToItem[contextSelection[0]];
                    }

                    if ( targetEL && _isTexture(targetEL.extname) ) {
                        var textureName = targetEL.name;

                        Fire.AssetLibrary.loadAsset ( targetEL.userId, function ( error, asset ) {
                            var newSprite = new Fire.Sprite();
                            newSprite.texture = asset;
                            newSprite.width = asset.width;
                            newSprite.height = asset.height;

                            var url = this.getUrl(targetEL.parentElement);
                            var newAssetUrl = Url.join( url, textureName + '.sprite' );
                            this._focusUrl = newAssetUrl;
                            Fire.sendToCore( 'asset-db:save',
                                          newAssetUrl,
                                          Fire.serialize(newSprite) );
                        }.bind(this) );
                    }
                    else {
                        Fire.warn( "Can not create sprite from non-texture element, please select a texture first." );
                    }
                }.bind(this)
            },

            // New Atlas
            {
                label: 'New Atlas',
                click: function () {
                    var contextSelection = Fire.Selection.contextAssets;
                    if ( contextSelection.length > 0 ) {
                        var targetEL = this.idToItem[contextSelection[0]];
                        if ( !targetEL.isFolder )
                            targetEL = targetEL.parentElement;

                        var newAtlas = new Fire.Atlas();
                        var url = this.getUrl(targetEL);
                        var newAssetUrl = Url.join( url, 'New Atlas.atlas' );
                        this._focusUrl = newAssetUrl;
                        Fire.sendToCore( 'asset-db:save',
                                        newAssetUrl,
                                        Fire.serialize(newAtlas) );
                    }
                }.bind(this)
            },
        ];
    },

    createContextMenu: function () {
        var template = [
            // Create
            {
                label: 'Create',
                submenu: this.getCreateMenuTemplate(),
            },

            // =====================
            { type: 'separator' },

            // Rename
            {
                label: 'Rename',
                click: function () {
                    var contextSelection = Fire.Selection.contextAssets;
                    if ( contextSelection.length > 0 ) {
                        var targetEL = this.idToItem[contextSelection[0]];
                        this.rename(targetEL);
                    }
                }.bind(this),
            },

            // Delete
            {
                label: 'Delete',
                click: function () {
                    var contextSelection = Fire.Selection.contextAssets;
                    var elements = this.getToplevelElements(contextSelection);
                    for (var i = 0; i < elements.length; i++) {
                        Fire.sendToCore( 'asset-db:delete', this.getUrl(elements[i]) );
                    }
                }.bind(this),
            },

            // Reimport
            {
                label: 'Reimport',
                click: function () {
                    var contextSelection = Fire.Selection.contextAssets;
                    if ( contextSelection.length > 0 ) {
                        var selectedItemEl = this.idToItem[contextSelection[0]];
                        var url = this.getUrl(selectedItemEl);

                        // remove childnodes
                        if (selectedItemEl.isFolder) {
                            while (selectedItemEl.firstChild) {
                                selectedItemEl.removeChild(selectedItemEl.firstChild);
                            }
                            selectedItemEl.foldable = false;
                        }
                        Fire.sendToCore( 'asset-db:reimport', url );
                    }
                }.bind(this)
            },

            // =====================
            { type: 'separator' },

            // Show in finder
            {
                label: 'Show in ' + (Fire.isWin32 ? 'Explorer' : 'Finder'),
                click: function () {
                    var contextSelection = Fire.Selection.contextAssets;
                    if ( contextSelection.length > 0 ) {
                        var targetEL = this.idToItem[contextSelection[0]];
                        Fire.sendToCore( 'asset-db:explore', this.getUrl(targetEL) );
                    }
                }.bind(this)
            },

            // Show in library
            {
                label: 'Show in Library',
                click: function () {
                    var contextSelection = Fire.Selection.contextAssets;
                    if ( contextSelection.length > 0 ) {
                        var targetEL = this.idToItem[contextSelection[0]];
                        Fire.sendToCore( 'asset-db:explore-lib', this.getUrl(targetEL) );
                    }
                }.bind(this)
            },

            // Print uuid
            {
                label: 'Show Uuid',
                click: function () {
                    var contextSelection = Fire.Selection.contextAssets;
                    for ( var i = 0; i < contextSelection.length; ++i ) {
                        var targetEL = this.idToItem[contextSelection[i]];
                        Fire.log( targetEL.userId );
                    }
                }.bind(this)
            },
        ];

        _addCustomAssetMenu(this, template);

        this.contextmenu = Menu.buildFromTemplate(template);
    },

    browse: function ( url ) {
        var rootEL = _newAssetsItem.call(this, url, 'root', Fire.UUID.AssetsRoot, this);
        rootEL.folded = false;

        Fire.sendToCore('asset-db:deep-query', url);
    },

    newItem: function ( url, id, parentId, isDirectory ) {
        var parentEL = this.idToItem[parentId];
        if ( !parentEL ) {
            Fire.warn('Can not find element for ' + parentId + " when import " + url);
            return;
        }
        var type = isDirectory ? 'folder' : '';
        var newEL = _newAssetsItem.call(this, url, type, id, parentEL);

        if ( this._focusUrl === url ) {
            this._focusUrl = null;
            this.expand(newEL.userId);
            this.scrollToItem(newEL);
            Fire.Selection.selectAsset(newEL.userId, true, true);
        }
    },

    moveItem: function ( id, destUrl, destDirId ) {
        var srcEL = this.idToItem[id];
        if ( !srcEL ) {
            Fire.warn( 'Can not find source element: ' + id );
            return;
        }

        // rename it first
        var destExtname = Path.extname(destUrl);
        var destBasename = Path.basename(destUrl, destExtname);
        srcEL.extname = destExtname;
        srcEL.name = destBasename;

        // insert it
        this.setItemParentById(id, destDirId);

        // expand parent
        var parentEL = this.idToItem[destDirId];
        if ( parentEL.isFolder ) {
            parentEL.folded = false;
        }
    },

    deleteSelection: function () {
        var elements = this.getToplevelElements(Fire.Selection.assets);
        for (var i = 0; i < elements.length; i++) {
            Fire.sendToCore( 'asset-db:delete', this.getUrl(elements[i]) );
        }
    },

    getUrl: function ( element ) {
        if ( element.isRoot ) {
            return element.name + "://";
        }

        var url = element.name + element.extname;
        var parentEL = element.parentElement;
        while ( parentEL instanceof AssetsItem ) {
            if ( parentEL.isRoot ) {
                url = parentEL.name + "://" + url;
                break;
            }
            else {
                url = Url.join( parentEL.name + parentEL.extname, url );
                parentEL = parentEL.parentElement;
            }
        }
        return url;
    },

    highlightBorder: function ( item ) {
        if ( item && item instanceof AssetsItem ) {
            var style = this.$.highlightBorder.style;
            style.display = "block";
            style.left = (item.offsetLeft-2) + "px";
            style.top = (item.offsetTop-1) + "px";
            style.width = (item.offsetWidth+4) + "px";
            style.height = (item.offsetHeight+3) + "px";

            item.highlighted = true;
        }
    },

    highlightInsert: function ( item, parentEL, position ) {
        var style = this.$.insertLine.style;
        if ( item === this ) {
            item = this.firstChild;
        }

        if ( item === parentEL ) {
            style.display = "none";
        }
        else if ( item && parentEL ) {
            style.display = "block";
            style.left = parentEL.offsetLeft + "px";
            if ( position === 'before' )
                style.top = (item.offsetTop) + "px";
            else
                style.top = (item.offsetTop+item.offsetHeight) + "px";
            style.width = parentEL.offsetWidth + "px";
            style.height = "0px";
        }
    },

    highlightConflicts: function ( items ) {
        for ( var i = 0; i < items.length; ++i ) {
            var item = items[i];
            if ( item.conflicted === false ) {
                item.conflicted = true;
                this.confliction.push(item);
            }
        }

        if ( this.curDragoverEL ) {
            this.curDragoverEL.invalid = true;
        }

        this.$.highlightBorder.setAttribute('invalid','');
    },

    cancelHighligting: function () {
        if ( this.curDragoverEL ) {
            this.curDragoverEL.highlighted = false;
            this.$.highlightBorder.style.display = "none";
            this.$.insertLine.style.display = "none";
        }
    },

    cancelConflictsHighliting: function () {
        for ( var i = 0; i < this.confliction.length; ++i ) {
            this.confliction[i].conflicted = false;
        }
        this.confliction = [];
        if ( this.curDragoverEL ) {
            this.curDragoverEL.invalid = false;
            this.$.highlightBorder.removeAttribute('invalid');
        }
    },

    resetDragState: function () {
        this.cancelHighligting();
        this.cancelConflictsHighliting();

        this.curDragoverEL = null;
        this.lastDragoverEL = null;
        this.dragenterCnt = 0;
    },

    moveAssets: function ( targetEL, assets ) {
        var elements = this.getToplevelElements(assets);
        var targetUrl = this.getUrl(targetEL);

        for ( var i = 0; i < elements.length; ++i ) {
            var el = elements[i];

            // do nothing if we already here
            if ( el === targetEL || el.parentElement === targetEL )
                continue;

            if ( el.contains(targetEL) === false ) {
                var srcUrl = this.getUrl(el);
                var destUrl = Url.join( targetUrl, el.name + el.extname );
                Fire.sendToCore('asset-db:move', srcUrl, destUrl );
            }
        }
    },

    select: function ( element ) {
        Fire.Selection.selectAsset(element.userId, true, true);
    },

    clearSelect: function () {
        Fire.Selection.clearAsset();
        this.activeElement = null;
        this.shiftStartElement = null;
    },

    selectingAction: function (event) {
        event.stopPropagation();
        this.focus();

        var shiftStartEL = this.shiftStartElement;
        this.shiftStartElement = null;

        if ( event.detail.shift ) {
            if ( shiftStartEL === null ) {
                shiftStartEL = this.activeElement;
            }

            this.shiftStartElement = shiftStartEL;

            var el = this.shiftStartElement;
            var userIds = [];

            if ( shiftStartEL !== event.target ) {
                if ( this.shiftStartElement.offsetTop < event.target.offsetTop ) {
                    while ( el !== event.target ) {
                        userIds.push(el.userId);
                        el = this.nextItem(el);
                    }
                }
                else {
                    while ( el !== event.target ) {
                        userIds.push(el.userId);
                        el = this.prevItem(el);
                    }
                }
            }
            userIds.push(event.target.userId);
            Fire.Selection.selectAsset(userIds, true, false);
        }
        else if ( event.detail.toggle ) {
            if ( event.target.selected ) {
                Fire.Selection.unselectAsset(event.target.userId, false);
            }
            else {
                Fire.Selection.selectAsset(event.target.userId, false, false);
            }
        }
        else {
            // if target already selected, do not unselect others
            if ( !event.target.selected ) {
                Fire.Selection.selectAsset(event.target.userId, true, false);
            }
        }
    },

    selectAction: function (event) {
        event.stopPropagation();

        if ( event.detail.shift ) {
            Fire.Selection.confirm();
        }
        else if ( event.detail.toggle ) {
            Fire.Selection.confirm();
        }
        else {
            Fire.Selection.selectAsset(event.target.userId, true);
        }
    },

    renameConfirmAction: function (event) {
        event.stopPropagation();

        var renamingEL = this.$.nameInput.renamingEL;

        this.$.nameInput.style.display = 'none';
        this.$.content.appendChild(this.$.nameInput);
        this.$.nameInput.renamingEL = null;

        // NOTE: the rename confirm will invoke focusoutAction
        window.requestAnimationFrame( function () {
            this.focus();
        }.bind(this));

        renamingEL._renaming = false;

        if ( renamingEL.name !== event.target.value ) {
            var srcUrl = this.getUrl(renamingEL);
            var destUrl = Url.join( Url.dirname(srcUrl), event.target.value + renamingEL.extname );
            Fire.sendToCore('asset-db:move', srcUrl, destUrl );
        }
    },

    openAction: function (event) {
        if ( event.target instanceof AssetsItem ) {
            if ( event.target.extname === '.fire' ) {
                var defaultEvent = event.target.userId;
                if ( Fire.AssetDB.isValidUuid(Fire.Engine._scene._uuid) ) {
                    dialog.showMessageBox( {
                        type: "warning",
                        buttons: ["yes","no","cancel"],
                        title: "this scene has changed,do you want to saving it?",
                        message: "this scene has changed,do you want to saving it?",
                        detail: Fire.AssetDB.uuidToUrl(Fire.Engine._scene._uuid)},
                        function (res) {
                            if (res === 2) {
                                return;
                            }
                            else {
                                if (res === 0) {
                                    Fire.sendToPages('scene:save');
                                }
                                Fire.sendToMainPage('engine:openScene', defaultEvent);
                            }
                    } );
                }
                else {
                    Fire.sendToMainPage('engine:openScene', event.target.userId);
                }
            }
            Fire.sendToCore('asset:open', event.target.userId);
            return;
        }
        event.stopPropagation();
    },

    contextmenuAction: function (event) {
        event.preventDefault();
        event.stopPropagation();

        //
        this.resetDragState();

        //
        var curContextID = Fire.UUID.AssetsRoot;
        if ( event.target instanceof AssetsItem ) {
            curContextID = event.target.userId;
        }

        Fire.Selection.setContextAsset(curContextID);

        if (!this.contextmenu) {
            this.createContextMenu();
        }

        this.contextmenu.popup(Remote.getCurrentWindow());
    },

    keydownAction: function (event) {
        this.super([event]);
        if (event.cancelBubble) {
            return;
        }

        switch ( event.which ) {
            // delete (Windows)
            case 46:
                this.deleteSelection();
                event.stopPropagation();
            break;

            // command + delete (Mac)
            case 8:
                if ( event.metaKey ) {
                    this.deleteSelection();
                }
                event.stopPropagation();
            break;
        }
    },

    dragstartAction: function ( event ) {
        event.stopPropagation();

        EditorUI.DragDrop.start( event.dataTransfer, 'copyMove', 'asset', Fire.Selection.assets.map(function (item) {
            var uuid = item;
            var itemEL = this.idToItem[uuid];
            return { name: itemEL.name, id: item };
        }.bind(this)) );
    },

    dragendAction: function (event) {
        EditorUI.DragDrop.end();

        this.resetDragState();
        Fire.Selection.cancel();
    },

    dragoverAction: function (event) {
        var dragType = EditorUI.DragDrop.type(event.dataTransfer);
        if ( dragType !== "file" && dragType !== "asset" ) {
            EditorUI.DragDrop.allowDrop( event.dataTransfer, false );
            return;
        }

        //
        event.preventDefault();
        event.stopPropagation();

        //
        if ( event.target ) {
            this.lastDragoverEL = this.curDragoverEL;
            var dragoverTraget = event.target;
            if ( event.target.isFolder === false )
                dragoverTraget = event.target.parentElement;

            if ( event.target === this ) {
                dragoverTraget = this.firstChild;
            }

            //
            if ( dragoverTraget !== this.lastDragoverEL ) {
                this.cancelHighligting();
                this.cancelConflictsHighliting();
                this.curDragoverEL = dragoverTraget;

                this.highlightBorder(dragoverTraget);

                // name collision check
                var names = [];
                var i = 0;
                var dragItems = EditorUI.DragDrop.items(event.dataTransfer);

                if ( dragType === "file" ) {
                    for (i = 0; i < dragItems.length; i++) {
                        names.push(Path.basename(dragItems[i]));
                    }
                }
                else if ( dragType === "asset" ) {
                    var srcELs = this.getToplevelElements(dragItems);
                    for (i = 0; i < srcELs.length; i++) {
                        var srcEL = srcELs[i];
                        if (dragoverTraget !== srcEL.parentElement) {
                            names.push(srcEL.name + srcEL.extname);
                        }
                    }
                }

                // check if we have conflicts names
                var valid = true;
                if ( names.length > 0 ) {
                    var collisions = _getNameCollisions( dragoverTraget, names );
                    if ( collisions.length > 0 ) {
                        this.highlightConflicts(collisions);
                        valid = false;
                    }
                }
                EditorUI.DragDrop.allowDrop(event.dataTransfer, valid);
            }

            // highlight insert
            var bounding = this.getBoundingClientRect();
            var offsetY = event.clientY - bounding.top + this.scrollTop;
            var position = 'before';
            if ( offsetY >= (event.target.offsetTop + event.target.offsetHeight * 0.5) )
                position = 'after';
            this.highlightInsert( event.target, dragoverTraget, position );
        }

        //
        var dropEffect = "none";
        if ( dragType === "file" ) {
            dropEffect = "copy";
        }
        else if ( dragType === "asset" ) {
            dropEffect = "move";
        }
        EditorUI.DragDrop.updateDropEffect(event.dataTransfer, dropEffect);
    },

    dropAction: function ( event ) {
        var dragType = EditorUI.DragDrop.type(event.dataTransfer);
        if ( dragType !== 'asset' && dragType !== 'entity' && dragType !== 'file' )
            return;

        event.preventDefault();
        event.stopPropagation();

        var items = EditorUI.DragDrop.drop(event.dataTransfer);
        var targetEL = this.curDragoverEL;

        this.resetDragState();
        Fire.Selection.cancel();

        if ( items.length > 0 ) {
            if ( dragType === 'file' ) {
                var dstUrl = this.getUrl(targetEL);
                Fire.sendToCore('asset-db:import', dstUrl, items );
            }
            else if ( dragType === 'asset' ) {
                this.moveAssets( targetEL, items );
            }
        }
    },

});
