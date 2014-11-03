(function () {
    var Path = require('fire-path');
    var Url = require('fire-url');

    var Remote = require('remote');
    var Ipc = require('ipc');
    var Menu = Remote.require('menu');
    var MenuItem = Remote.require('menu-item');

    function _newAssetsItem ( url, type, id, parent ) {
        var extname = Url.extname(url); 
        var basename = Url.basename(url, extname); 
        var img;

        var newEL = new AssetsItem();
        newEL.isRoot = type === 'root';
        newEL.isFolder = (type === 'folder' || newEL.isRoot);
        newEL.extname = extname;

        type = type || extname;
        switch ( type ) {
        case 'root':
            newEL.setIcon('db');
            break;

        case 'folder':
            newEL.setIcon('folder');
            break;

        case '.fire':
            newEL.setIcon('fa fa-fire');
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
        case '.xml':
        case '.json':
            newEL.setIcon('html');
            break;

        case '.css':
        case '.less':
        case '.css':
        case '.styl':
            newEL.setIcon('css');
            break;

        case '.anim':
            newEL.setIcon('anim');
            break;

        case '.png':
        case '.jpg':
            img = new Image();
            img.src = 'uuid://' + id;
            newEL.setIcon(img);
            break;
                
        default:
            newEL.setIcon('fa fa-cube');
            break;
        }

        this.initItem(newEL, basename, id, parent);
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

    Polymer({
        created: function () {
            this.super();

            this.contextmenuAt = null;

            // dragging
            this.startDragging = false;
            this.startDragAt = [-1,-1];
            this.dragging = false;
            this.curDragoverEL = null; 
            this.dragenterCnt = 0;
            this.lastDragoverEL = null;

            // confliction
            this.isValidForDrop = true;
            this.confliction = [];

            this._ipc_newItem = this.newItem.bind(this);
            this._ipc_newFolder = function ( url, id, parentId ) {
                this.newItem( url, id, parentId, true );
            }.bind(this);
            this._ipc_newAsset = function ( url, id, parentId ) {
                this.newItem( url, id, parentId, false );
            }.bind(this);
            this._ipc_deleteItem = this.deleteItemById.bind(this);
            this._ipc_finishLoading = this.finishLoading.bind(this);
            this._ipc_moveItem = this.moveItem.bind(this);
        },

        ready: function () {
            this.super();
            this.initContextMenu();

            // register events
            this.addEventListener('mousemove', function ( event ) {
                if ( this.startDragging ) {
                    var dx = event.x - this.startDragAt[0]; 
                    var dy = event.y - this.startDragAt[1]; 
                    if ( dx * dx  + dy * dy >= 100.0 ) {
                        this.dragging = true;
                        this.startDragging = false;
                    }
                    event.stopPropagation();
                }
                else if ( this.dragging ) {
                    // do nothing here
                }
                else {
                    event.stopPropagation();
                }
            }, true );

            this.addEventListener('mouseleave', function ( event ) {
                if ( this.dragging ) {
                    this.cancelHighligting();
                    this.cancelConflictsHighliting();

                    this.curDragoverEL = null;
                    this.lastDragoverEL = null;
                    this.isValidForDrop = true;

                    event.stopPropagation();
                }
            }, true );

            this.addEventListener('mouseup', function ( event ) {
                this.startDragging = false;
                if ( this.dragging ) {
                    // check
                    if ( this.isValidForDrop && this.curDragoverEL ) {
                        this.moveSelection( this.curDragoverEL );
                        Fire.Selection.confirm();
                    }

                    this.cancelHighligting();
                    this.cancelConflictsHighliting();

                    this.curDragoverEL = null;
                    this.lastDragoverEL = null;
                    this.isValidForDrop = true;
                    this.dragging = false;

                    event.stopPropagation();
                }
            }, true );

            this.addEventListener( "dragenter", function (event) {
                ++this.dragenterCnt;
            }, true);

            this.addEventListener( "dragleave", function (event) {
                --this.dragenterCnt;
                if ( this.dragenterCnt === 0 ) {
                    this.cancelHighligting();
                    this.cancelConflictsHighliting();

                    this.curDragoverEL = null;
                    this.lastDragoverEL = null;
                    this.isValidForDrop = true;
                }
            }, true);

            // register Ipc
            Ipc.on('fire-assets:newItem', this._ipc_newItem );
            Ipc.on('fire-assets:deleteItem', this._ipc_deleteItem );
            Ipc.on('fire-assets:finishLoading', this._ipc_finishLoading );

            Ipc.on('folder:created', this._ipc_newFolder );
            Ipc.on('asset:created', this._ipc_newAsset );
            Ipc.on('asset:moved', this._ipc_moveItem );
            Ipc.on('asset:deleted', this._ipc_deleteItem );
        },

        detached: function () {
            Ipc.removeListener('fire-assets:newItem', this._ipc_newItem );
            Ipc.removeListener('fire-assets:deleteItem', this._ipc_deleteItem );
            Ipc.removeListener('fire-assets:finishLoading', this._ipc_finishLoading );

            Ipc.removeListener('folder:created', this._ipc_newFolder );
            Ipc.removeListener('asset:created', this._ipc_newAsset );
            Ipc.removeListener('asset:moved', this._ipc_moveItem );
            Ipc.removeListener('asset:deleted', this._ipc_deleteItem );
        },

        initContextMenu: function () {
            var template = [
                // New Scene
                {
                    label: 'New Scene',
                    click: function () {
                        if ( this.contextmenuAt instanceof AssetsItem ) {
                            var url = this.getUrl(this.contextmenuAt);
                            var newScene = new Fire._Scene();
                            Fire.command( 'asset-db:save', 
                                          Url.join( url, 'New Scene.fire' ), 
                                          Fire.serialize(newScene) );
                        }
                    }.bind(this)
                },

                // New Folder
                {
                    label: 'New Folder',
                    click: function () {
                        if ( this.contextmenuAt instanceof AssetsItem ) {
                            var url = this.getUrl(this.contextmenuAt);
                            Fire.rpc( 'asset-db:makedirs', Url.join( url, 'New Folder' ) );
                        }
                    }.bind(this)
                },

                // =====================
                { type: 'separator' },

                // Show in finder
                {
                    label: 'Show in finder',
                    click: function () {
                        if ( this.contextmenuAt instanceof AssetsItem ) {
                            Fire.command( 'asset-db:explore', this.getUrl(this.contextmenuAt) );
                        }
                    }.bind(this)
                },


                // Rename
                {
                    label: 'Rename',
                    click: function () {
                        if ( this.contextmenuAt instanceof AssetsItem ) {
                            this.contextmenuAt.rename();
                        }
                    }.bind(this),
                    //enable: this.contextmenuAt && this.contextmenuAt.isRoot === false && Fire.Selection.assets.length === 1,
                },

                // Delete
                {
                    label: 'Delete',
                    click: this.deleteSelection.bind(this),
                    //enable: this.contextmenuAt && this.contextmenuAt.isRoot === false,
                },
                
                // =====================
                { type: 'separator' },

                // Reimport
                { 
                    label: 'Reimport',
                    click: function () {
                        if ( this.contextmenuAt instanceof AssetsItem ) {
                            var selectedItemEl = this.contextmenuAt;
                            var url = this.getUrl(selectedItemEl);

                            // remove childnodes
                            if (selectedItemEl.isFolder) {
                                while (selectedItemEl.firstChild) {
                                    selectedItemEl.removeChild(selectedItemEl.firstChild);
                                }
                                selectedItemEl.foldable = false;
                            }
                            Fire.command( 'asset-db:reimport', url );
                        }
                    }.bind(this)
                },
            ];
            this.contextmenu = Menu.buildFromTemplate(template);
        },

        load: function ( url ) {
            console.time('fire-assets:load');
            Fire.hint('start browsing ' + url);

            _newAssetsItem.call(this, url, 'root', Fire.UUID.AssetsRoot, this);

            Fire.command('asset-db:browse', url);
        },

        finishLoading: function ( url ) {
            Fire.hint('finish browsing ' + url);
            console.timeEnd('fire-assets:load');
        },

        newItem: function ( url, id, parentId, isDirectory ) {
            var parentEL = this.idToItem[parentId];
            if ( !parentEL ) {
                Fire.warn('Can not find element for ' + parentId);
                return;
            }
            var type = isDirectory ? 'folder' : '';
            _newAssetsItem.call(this, url, type, id, parentEL);
        },
        
        moveItem: function ( id, destUrl, destDirId ) {
            var srcEL = this.idToItem[id];
            if ( !srcEL ) {
                Fire.warn( 'Can not find source element: ' + id );
                return;
            }
            
            this.setItemParentById(id, destDirId);
            
            var destExtname = Path.extname(destUrl);
            var destBasename = Path.basename(destUrl, destExtname);
            srcEL.extname = destExtname;
            srcEL.name = destBasename;
        },

        deleteSelection: function () {
            var elements = this.getToplevelElements(Fire.Selection.assets);
            for (var i = 0; i < elements.length; i++) {
                Fire.command( 'asset-db:delete', elements[i].userId );
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
                    url = Url.join( parentEL.name, url );
                    parentEL = parentEL.parentElement;
                }
            }
            return url;
        },

        getToplevelElements: function ( uuids ) {
            var resultIDs = Fire.Selection.filter( uuids, 'top-level', function ( idA, idB ) {
                var elA = this.idToItem[idA];
                var elB = this.idToItem[idA];

                if ( elA.contains(elB) ) {
                    return 1;
                }
                if ( elB.contains(elA) ) {
                    return -1;
                }
                return 0;
            } );

            var resultELs = [];
            for ( var i = 0; i < resultIDs.length; ++i ) {
                var el = this.idToItem[resultIDs[i]];
                resultELs.push(el);
            }

            return resultELs;
        },

        highlight: function ( item ) {
            if ( item ) {
                this.$.highlightMask.style.display = "block";
                this.$.highlightMask.style.left = item.offsetLeft + "px";
                this.$.highlightMask.style.top = item.offsetTop + "px";
                this.$.highlightMask.style.width = item.offsetWidth + "px";
                this.$.highlightMask.style.height = item.offsetHeight + "px";

                item.highlighted = true;
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

            this.$.highlightMask.setAttribute('invalid','');
        },

        cancelHighligting: function () {
            if ( this.curDragoverEL ) {
                this.curDragoverEL.highlighted = false;
                this.$.highlightMask.style.display = "none";
            }
        },

        cancelConflictsHighliting: function () {
            for ( var i = 0; i < this.confliction.length; ++i ) {
                this.confliction[i].conflicted = false;
            }
            this.confliction = [];
            if ( this.curDragoverEL ) {
                this.curDragoverEL.invalid = false;
                this.$.highlightMask.removeAttribute('invalid');
            }
        },

        moveSelection: function ( targetEL ) {
            var elements = this.getToplevelElements(Fire.Selection.assets);
            var targetUrl = this.getUrl(targetEL);

            for ( var i = 0; i < elements.length; ++i ) {
                var el = elements[i];

                // do nothing if we already here
                if ( el === targetEL || el.parentElement === targetEL )
                    continue;

                if ( el.contains(targetEL) === false ) {
                    var srcUrl = this.getUrl(el);
                    var destUrl = Url.join( targetUrl, el.name + el.extname );
                    Fire.command('asset-db:move', srcUrl, destUrl );
                }
            }
        },
        
        selectingAction: function (event) {
            this.focus();

            if ( event.target instanceof AssetsItem ) {
                if ( event.detail.shift ) {
                    //if ( !this.lastActive ) {
                    //}
                    //else {
                    //}
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
                    this.startDragging = true;
                    this.startDragAt = [event.detail.x, event.detail.y];
                    if ( !event.target.selected ) {
                        Fire.Selection.selectAsset(event.target.userId, true, false);
                    }
                }
            }
            event.stopPropagation();
        },

        selectAction: function (event) {
            if ( event.target instanceof AssetsItem ) {
                if ( event.detail.shift ) {
                    // TODO:
                }
                else if ( event.detail.toggle ) {
                    // TODO:
                }
                else {
                    if (Fire.Selection.assets.indexOf(event.target.userId) !== -1) {
                        Fire.Selection.selectAsset(event.target.userId, true);
                    }
                }
                Fire.Selection.confirm();
            }
            event.stopPropagation();
        },

        namechangedAction: function (event) {
            if ( event.target instanceof AssetsItem ) {
                this.focus();
                var srcUrl = this.getUrl(event.target);
                var destUrl = Url.join( Url.dirname(srcUrl), event.detail.name + event.target.extname );
                Fire.command('asset-db:move', srcUrl, destUrl );
            }
            event.stopPropagation();
        },

        openAction: function (event) {
            if ( event.target instanceof AssetsItem ) {
                // TODO: Fire.broadcast( 'scene:load', uuid );
                Fire.Engine.loadScene(event.target.userId, function (scene) {});
            }
            event.stopPropagation();
        },

        draghoverAction: function (event) {
            if ( event.target ) {
                this.lastDragoverEL = this.curDragoverEL;
                var target = event.target;
                if ( event.target.isFolder === false )
                    target = event.target.parentElement;

                if ( target !== this.lastDragoverEL ) {

                    this.cancelHighligting();
                    this.cancelConflictsHighliting();

                    this.isValidForDrop = true;
                    this.curDragoverEL = target;
                    this.highlight(this.curDragoverEL);

                    // name collision check
                    var names = [];
                    var i = 0;
                    if (event.detail.files) {
                        var files = event.detail.files;
                        for (i = 0; i < files.length; i++) {
                            names.push(files[i].name);
                        }
                    }
                    else {
                        var srcELs = this.getToplevelElements(Fire.Selection.assets);
                        for (i = 0; i < srcELs.length; i++) {
                            var srcEL = srcELs[i];
                            if (target !== srcEL.parentElement) {
                                names.push(srcEL.name + srcEL.extname);
                            }
                        }
                    }

                    // check if we have conflicts names
                    if ( names.length > 0 ) {
                        var collisions = _getNameCollisions( target, names );
                        if ( collisions.length > 0 ) {
                            this.highlightConflicts(collisions);
                            this.isValidForDrop = false;
                        }
                    }
                }


            }
            event.stopPropagation();
        },

        dragcancelAction: function (event) {
            this.cancelHighligting();
            this.cancelConflictsHighliting();

            this.curDragoverEL = null;
            this.lastDragoverEL = null;
            this.isValidForDrop = true;
        },

        contextmenuAction: function (event) {
            this.cancelHighligting();
            this.cancelConflictsHighliting();

            this.curDragoverEL = null;
            this.lastDragoverEL = null;
            this.isValidForDrop = true;
            this.startDragging = false;
            this.dragging = false;

            //
            this.contextmenuAt = null;
            if ( event.target instanceof AssetsItem ) {
                this.contextmenuAt = event.target;
                var unselectOther = (Fire.Selection.assets.indexOf(event.target.userId) === -1);
                Fire.Selection.selectAsset(event.target.userId, unselectOther, true);
            }

            this.contextmenu.popup(Remote.getCurrentWindow());
            event.stopPropagation();
        },

        keydownAction: function (event) {
            if ( this.dragging ) {
                switch ( event.which ) {
                    // esc
                    case 27:
                        this.cancelHighligting();
                        this.cancelConflictsHighliting();

                        this.curDragoverEL = null;
                        this.lastDragoverEL = null;
                        this.isValidForDrop = true;
                        this.dragging = false;
                        event.stopPropagation();

                        Fire.Selection.cancel();
                    break;
                }
            }
            else {
                var activeId = Fire.Selection.activeAssetUuid;
                var activeEL = activeId && this.idToItem[activeId];
                
                this.super([event, activeEL]);
                if (event.cancelBubble) {
                    return;
                }
                switch ( event.which ) {
                    // delete
                    case 46:
                        this.deleteSelection();
                        event.stopPropagation();
                    break;

                    // key-up
                    case 38:
                        if ( activeEL ) {
                            var prev = this.prevItem(activeEL);
                            if ( prev ) {
                                // Todo toggle?
                                Fire.Selection.selectAsset(prev.userId, true, true);
                                
                                if (prev !== activeEL) {
                                    if ( prev.offsetTop <= this.scrollTop ) {
                                        this.scrollTop = prev.offsetTop;
                                    }
                                }
                            }
                        }
                        event.preventDefault();
                        event.stopPropagation();
                    break;

                    // key-down
                    case 40:
                        if ( activeEL ) {
                            var next = this.nextItem(activeEL, false);
                            if ( next ) {
                                // Todo toggle?
                                Fire.Selection.selectAsset(next.userId, true, true);
                                
                                if ( next !== activeEL ) {
                                    if ( next.offsetTop + 16 >= this.scrollTop + this.offsetHeight ) {
                                        this.scrollTop = next.offsetTop + 16 - this.offsetHeight;
                                    }
                                }
                            }
                        }
                        event.preventDefault();
                        event.stopPropagation();
                    break;
                }
            }
        },

        dropAction: function ( event ) {
            event.preventDefault();
            event.stopPropagation();

            var targetEl = this.curDragoverEL;

            this.cancelHighligting();
            this.cancelConflictsHighliting();

            this.curDragoverEL = null;
            this.lastDragoverEL = null;
            this.startDragging = false;
            this.dragging = false;
            this.dragenterCnt = 0;

            // check
            if( !this.isValidForDrop ) {
                this.isValidForDrop = true;
                return;
            }
            
            // TODO: we should have better solution { 
            // var url = this.getUrl(targetEl);
            // var files = event.dataTransfer.files;
            // var dstFsDir = Fire.AssetDB.fspath(url);

            // for ( var i = 0; i < files.length; i++ ) {
            //     Fs.copySync(files[i].path, dstFsDir);
            // }

            // Fire.AssetDB.clean(url);

            // while (targetEl.firstChild) {
            //     targetEl.removeChild(targetEl.firstChild);
            // }
            // targetEl.foldable = false;

            // if( !targetEl.isRoot ) {
            //     Fire.AssetDB.importAsset(dstFsDir);
            // }

            // var folderElements = {};
            // Fire.AssetDB.walk( 
            //     url, 

            //     function ( root, name, isDirectory ) {
            //         var itemEL = null;
            //         var fspath = Path.join(root, name);

            //         var parentEL = folderElements[root];
            //         parentEL = parentEL || targetEl;
            //         if ( isDirectory ) {
            //             itemEL = _newAssetsItem.call( this, fspath, 'folder', id, parentEL );
            //             folderElements[fspath] = itemEL;
            //         }
            //         else {
            //             itemEL = _newAssetsItem.call( this, fspath, null, id, parentEL );
            //         }

            //         // reimport
            //         Fire.AssetDB.importAsset(fspath);

            //     }.bind(targetEl), 

            //     function () {
            //         // console.log("finish walk");
            //     }.bind(targetEl)
            // );
            // TODO }: 

        },

    });
})();
