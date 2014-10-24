(function () {
    var Path = require('fire-path');
    var Url = require('fire-url');

    var Remote = require('remote');
    var Ipc = require('ipc');
    var Menu = Remote.require('menu');
    var MenuItem = Remote.require('menu-item');

    function _binaryIndexOf ( elements, key ) {
        var lo = 0;
        var hi = elements.length - 1;
        var mid, el;

        while (lo <= hi) {
            mid = ((lo + hi) >> 1);
            el = elements[mid];

            if (el.name < key) {
                lo = mid + 1;
            } 
            else if (el.name > key) {
                hi = mid - 1;
            } 
            else {
                return mid;
            }
        }
        return lo;
    }

    function _binaryInsert( parentEL, el ) {
        var idx = _binaryIndexOf( parentEL.children, el.name );
        if ( idx === -1 ) {
            parentEL.appendChild(el);
        }
        else {
            parentEL.insertBefore(el, parentEL.children[idx]);
        }
    }

    function _findElement ( elements, name ) {
        for ( var i = 0; i < elements.length; ++i ) {
            var el = elements[i];
            var fullname = el.name + el.extname;
            if ( fullname === name )
                return el;
        }
        return null;
    }

    function _newAssetsItem ( url, type ) {
        var extname = Url.extname(url); 
        var basename = Url.basename(url,extname); 

        var newEL = new AssetsItem();
        if ( !type ) {
            type = extname;
        }

        newEL.isFolder = (type === 'folder' || type === 'root');
        newEL.isRoot = type === 'root';
        newEL.extname = extname;
        newEL.name = basename;

        switch ( type ) {
        case 'root':
            newEL.setIcon('fa-database');
            break;

        case 'folder':
            newEL.setIcon('fa-folder');
            break;

        case '.png':
        case '.jpg':
            var img = new Image();
            img.src = url;
            newEL.setIcon(img);
            break;

        case '.fire':
            newEL.setIcon('fa-fire');
            break;
                
        default:
            newEL.setIcon('fa-cube');
            break;
        }

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

            // selection
            this.selection = [];
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
            this._ipc_newFolder = function ( url ) {
                this.newItem( url, true );
            }.bind(this);
            this._ipc_newAsset = function ( url ) {
                this.newItem( url, false );
            }.bind(this);
            this._ipc_deleteItem = this.deleteItem.bind(this);
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
                    if ( this.isValidForDrop ) {
                        if ( this.curDragoverEL ) {
                            this.moveSelection( this.curDragoverEL );
                        }
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
                    }.bind(this)
                },

                // Delete
                {
                    label: 'Delete',
                    click: function () {
                        if ( this.contextmenuAt instanceof AssetsItem ) {
                            var url = this.getUrl(this.contextmenuAt);
                            Fire.command( 'asset-db:delete', url );
                        }
                    }.bind(this)
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

            var rootEL = _newAssetsItem( url, 'root' );
            this.appendChild(rootEL);

            Fire.command( 'asset-db:browse', url );
        },

        finishLoading: function ( url ) {
            Fire.hint('finish browsing ' + url);
            console.timeEnd('fire-assets:load');
        },

        newItem: function ( url, isDirectory ) {
            var newEL = _newAssetsItem( url, isDirectory ? 'folder' : null );

            //
            var parentUrl = Url.dirname(url);
            var parentEL = this.getElement(parentUrl);
            if ( parentEL === null ) {
                Fire.warn('Can not find element for ' + parentUrl);
                return;
            }

            // binary insert
            _binaryInsert ( parentEL, newEL );
            parentEL.foldable = true;
        },

        deleteItem: function ( url ) {
            var el = this.getElement(url);
            if ( el === null ) {
                Fire.warn( 'Can not find source element: ' + url );
                return;
            }
            this.super([el]);
        },

        onDeleteItem: function (item) {
            // unselect
            if (item.selected) {
                var idx = this.selection.indexOf(item); 
                this.selection.splice(idx, 1);
            }
        },

        moveItem: function ( srcUrl, destUrl ) {
            var srcEL = this.getElement( srcUrl );
            if ( srcEL === null ) {
                Fire.warn( 'Can not find source element: ' + srcUrl );
                return;
            }

            var destEL = this.getElement( Path.dirname(destUrl) );
            if ( destEL === null ) {
                Fire.warn( 'Can not find dest element: ' + destUrl );
                return;
            }

            var destExtname = Path.extname(destUrl);
            var destBasename = Path.basename(destUrl, destExtname);
            srcEL.extname = destExtname;
            srcEL.name = destBasename;

            // binary insert
            var oldParent = srcEL.parentElement;
            _binaryInsert ( destEL, srcEL );
            destEL.foldable = true;
            oldParent.foldable = oldParent.hasChildNodes();
        },

        toggle: function ( items ) {
            for ( var i = 0; i < items.length; ++i ) {
                var item = items[i];
                if ( item.selected === false ) {
                    item.selected = true;
                    this.selection.push(item);
                }
                else {
                    item.selected = false;

                    var idx = this.selection.indexOf(item); 
                    this.selection.splice(idx,1);
                }
            }
        },

        select: function ( items ) {
            for ( var i = 0; i < items.length; ++i ) {
                var item = items[i];
                if ( item.selected === false ) {
                    item.selected = true;
                    this.selection.push(item);
                }
            }
        },

        unselectRecursively: function ( item ) {
            if ( item.selected ) {
                var idx = this.selection.indexOf(item); 
                this.selection.splice(idx, 1);
            }
            var children = item.children;
            for ( var i = 0; i < children.length; ++i ) {
                this.unselectRecursively(children[i]);
            }
        },

        unselect: function ( items ) {
            for ( var i = 0; i < items.length; ++i ) {
                var item = items[i];
                if ( item.selected ) {
                    item.selected = false;

                    var idx = this.selection.indexOf(item); 
                    this.selection.splice(idx,1);
                }
            }
        },

        clearSelect: function () {
            for ( var i = 0; i < this.selection.length; ++i ) {
                this.selection[i].selected = false;
            }
            this.selection = [];
        },

        confirmSelect: function () {
            if ( this.selection.length > 0 ) {
                var promise = new Promise(function(resolve, reject) {
                    var confirmSelection = this.lastConfirmSelection = this.selection[0];
                    var url = this.getUrl(confirmSelection);
                    var uuid = Fire.AssetDB.urlToUuid(url);

                    if ( this.lastConfirmSelection === confirmSelection ) {
                        resolve(uuid);
                    }
                    else {
                        reject();
                    }
                }.bind(this));
                promise.then ( function ( uuid ) {
                    // TODO: should we change this to selection:changed ?? and use global Selection
                    Fire.broadcast( 'asset:selected', uuid );
                }.bind(this));
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
                    url = Path.join( parentEL.name, url );
                    parentEL = parentEL.parentElement;
                }
            }
            return url;
        },

        getElement: function ( url ) {
            var list = url.split(":");
            if ( list.length !== 2 ) {
                console.warn("Invalid url " + url);
                return null;
            }
            var relativePath = Path.normalize(list[1]);
            if ( relativePath[0] === '/' ) {
                relativePath = relativePath.slice(1);
            }
            var names = relativePath.split(Path.sep);
            names.unshift(list[0]);
            var el = this;

            for ( var i = 0; i < names.length; ++i ) {
                var name = names[i];

                if ( name === '' || name === '.' )
                    continue;

                el = _findElement ( el.children, name );
                if ( !el )
                    return null;
            }

            return el;
        },

        getMostIncludeElements: function ( elements ) {
            var i, j;
            var resultELs = [];

            for ( i = 0; i < elements.length; ++i ) {
                var el = elements[i];
                var addEL = true;
                var resultEL = null;

                for ( j = 0; j < resultELs.length; ++j ) {
                    resultEL = resultELs[j];
                    if ( resultEL === el ) {
                        addEL = false;
                        break;
                    }
                    else if ( resultEL.contains(el) ) {
                        // url is child of resultUrl
                        addEL = false;
                        break;
                    }
                    else if ( el.contains(resultEL) ) {
                        // url is parent or same of resultUrl
                        resultELs.splice(j, 1);
                        --j;
                    }
                    // url is not relative with resultUrl
                }

                if ( addEL ) {
                    resultELs.push(el);
                }
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
            var elements = this.getMostIncludeElements(this.selection);
            var targetUrl = this.getUrl(targetEL);

            for ( var i = 0; i < elements.length; ++i ) {
                var el = elements[i];

                // do nothing if we already here
                if ( el === targetEL || el.parentElement === targetEL )
                    continue;

                if ( el.contains(targetEL) === false ) {
                    var srcUrl = this.getUrl(el);
                    var destUrl = Path.join( targetUrl, el.name + el.extname );
                    Fire.command('asset-db:move', srcUrl, destUrl );
                }
            }
        },
        
        selectingAction: function (event) {
            this.focus();

            if ( event.target instanceof AssetsItem ) {
                if ( event.detail.shift ) {
                    if ( !this.lastActive ) {
                        this.lastActive = event.target;
                        this.select( [event.target] );
                    }
                    else {
                        // TODO:
                    }
                }
                else if ( event.detail.toggle ) {
                    this.toggle( [event.target] );
                }
                else {
                    this.startDragging = true;
                    this.startDragAt = [event.detail.x, event.detail.y];
                    if ( this.selection.indexOf(event.target) === -1 ) {
                        this.clearSelect();
                        this.select( [event.target] );
                    }
                } 
                this.lastActive = event.target;
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
                    if ( this.selection.indexOf(event.target) !== -1 ) {
                        this.clearSelect();
                        this.select( [event.target] );
                    }
                } 

                this.confirmSelect();
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
                var url = this.getUrl(event.target);
                var uuid = Fire.AssetDB.urlToUuid(url);
                Fire.Engine.loadScene(uuid, function (scene) {});
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
                        var srcELs = this.getMostIncludeElements(this.selection);
                        for (i = 0; i < srcELs.length; i++) {
                            var srcEL = srcELs[i];
                            if (target !== srcEL.parentElement) {
                                names.push(srcEL.name + srcEL.extname);
                            }
                        }
                    }

                    // check if we have conflicts names
                    if ( names.length > 0 ) {
                        var collisions = _getNameCollisions( target, names);
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
                this.lastActive = this.contextmenuAt;
                this.clearSelect();
                this.select([this.contextmenuAt]);
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
                    break;
                }
            }
            else {
                this.super([event]);
                if (event.cancelBubble) {
                    return;
                }
                switch ( event.which ) {
                    // key-up
                    case 38:
                        if ( this.lastActive ) {
                            var prev = this.prevItem(this.lastActive);
                            if ( prev === null ) {
                                prev = this.lastActive;
                            }
                            if ( prev !== this.lastActive ) {
                                if ( prev.offsetTop <= this.scrollTop ) {
                                    this.scrollTop = prev.offsetTop;
                                }
                                this.clearSelect();
                                this.lastActive = prev;
                                this.select([this.lastActive]);
                                this.confirmSelect();
                            }
                        }
                        event.preventDefault();
                        event.stopPropagation();
                    break;

                    // key-down
                    case 40:
                        if ( this.lastActive ) {
                            var next = this.nextItem(this.lastActive, false);
                            if ( next === null ) {
                                next = this.lastActive;
                            }
                            if ( next !== this.lastActive ) {
                                if ( next.offsetTop + 16 >= this.scrollTop + this.offsetHeight ) {
                                    this.scrollTop = next.offsetTop + 16 - this.offsetHeight;
                                }
                                this.clearSelect();
                                this.lastActive = next;
                                this.select([this.lastActive]);
                                this.confirmSelect();
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

            //         if ( isDirectory ) {
            //             itemEL = _newAssetsItem( fspath, 'folder' );
            //             folderElements[fspath] = itemEL;
            //         }
            //         else {
            //             itemEL = _newAssetsItem( fspath );
            //         }

            //         var parentEL = folderElements[root];
            //         if ( parentEL ) {
            //             parentEL.appendChild(itemEL);
            //         }
            //         else {
            //             targetEl.appendChild(itemEL);
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
