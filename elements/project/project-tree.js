(function () {
    var Path = require('fire-path');
    var Url = require('fire-url');

    var Remote = require('remote');
    var Ipc = require('ipc');
    var Menu = Remote.require('menu');
    var MenuItem = Remote.require('menu-item');

    // pathA = foo/bar,         pathB = foo/bar/foobar, return true
    // pathA = foo/bar,         pathB = foo/bar,        return true
    // pathA = foo/bar/foobar,  pathB = foo/bar,        return false
    // pathA = foo/bar/foobar,  pathB = foobar/bar/foo, return false
    function _includePath ( pathA, pathB ) {
        if ( pathA.length < pathB.length &&
             pathB.indexOf (pathA) === 0 ) 
        {
            return true;
        }

        if ( pathA === pathB ) {
            return true;
        }

        return false;
    }

    function _binaryIndexOf ( elements, key ) {
        var lo = 0;
        var hi = elements.length - 1;
        var mid, el;

        while (lo <= hi) {
            mid = ((lo + hi) >> 1);
            el = elements[mid];

            if (el.basename < key) {
                lo = mid + 1;
            } 
            else if (el.basename > key) {
                hi = mid - 1;
            } 
            else {
                return mid;
            }
        }
        return lo;
    }

    function _binaryInsert( parentEL, el ) {
        var idx = _binaryIndexOf( parentEL.children, el.basename );
        if ( idx === -1 ) {
            parentEL.appendChild(el);
        }
        else {
            parentEL.insertBefore(el,parentEL.children[idx]);
        }
    }

    function _findElement ( elements, name ) {
        for ( var i = 0; i < elements.length; ++i ) {
            var el = elements[i];
            var fullname = el.basename + el.extname;
            if ( fullname === name )
                return el;
        }
        return null;
    }

    function _newProjectItem ( url, type ) {
        var extname = Url.extname(url); 
        var basename = Url.basename(url,extname); 

        var newEL = new ProjectItem();
        if ( !type ) {
            type = extname;
        }

        newEL.isFolder = (type === 'folder' || type === 'root');
        newEL.isRoot = type === 'root';
        newEL.extname = extname;
        newEL.basename = basename;

        switch ( type ) {
        case 'root':
            newEL.setIcon('fa-database');
            newEL.foldable = true;
            break;

        case 'folder':
            newEL.setIcon('fa-folder');
            newEL.foldable = true;
            break;

        case '.png':
        case '.jpg':
            var img = new Image();
            // TODO: make this possible
            // img.src = Url.format({
            //     protocol: 'assets',
            //     pathname: fspath, 
            //     slashes: true
            // });
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
                if (node.basename + node.extname === name) {
                    collisions.push(node);
                }

            }
        }

        return collisions;
    }

    Polymer({
        publish: {
            focused: {
                value: false,
                reflect: true
            },
        },

        created: function () {
            this.focused = false;

            // selection
            this.selection = [];
            this.lastActive = null;
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
            this._ipc_finishLoading = this.finishLoading.bind(this);
        },

        ready: function () {
            this.tabIndex = EditorUI.getParentTabIndex(this)+1;

            Ipc.on('project-tree:newItem', this._ipc_newItem );
            Ipc.on('project-tree:finishLoading', this._ipc_finishLoading );

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

            // TODO
            // FireApp.on('assetMoved', function ( event ) {
            //     var srcEL = this.getElement( event.detail.srcUrl );
            //     if ( srcEL === null ) {
            //         console.warn( 'Can not find source element: ' + event.detail.srcUrl );
            //         return;
            //     }

            //     var destEL = this.getElement( Path.dirname(event.detail.destUrl) );
            //     if ( destEL === null ) {
            //         console.warn( 'Can not find dest element: ' + event.detail.destUrl );
            //         return;
            //     }

            //     var destExtname = Path.extname(event.detail.destUrl);
            //     var destBasename = Path.basename(event.detail.destUrl, destExtname);
            //     srcEL.extname = destExtname;
            //     srcEL.basename = destBasename;

            //     // binary insert
            //     _binaryInsert ( destEL, srcEL );
            // }.bind(this) );

            // FireApp.on('assetDeleted', function ( event ) {
            //     var el = this.getElement( event.detail.url );
            //     if ( el === null ) {
            //         console.warn( 'Can not find source element: ' + event.detail.url );
            //         return;
            //     }
            //     el.parentElement.removeChild(el);
            // }.bind(this) );

            // FireApp.on('folderCreated', function ( event ) {
            //     var parentUrl = Path.dirname(event.detail.url);
            //     var parentEL = this.getElement(parentUrl);
            //     if ( parentEL === null ) {
            //         console.warn( 'Can not find element at ' + parentUrl );
            //         return;
            //     }

            //     // create new folder
            //     var fspath = AssetDB.fspath(event.detail.url);
            //     var newEL = _newProjectItem( fspath, 'folder' );

            //     // binary insert
            //     _binaryInsert ( parentEL, newEL );
            // }.bind(this) );

            // FireApp.on('assetCreated', function ( event ) {
            //     var parentUrl = Path.dirname(event.detail.url);
            //     var parentEL = this.getElement(parentUrl);
            //     if ( parentEL === null ) {
            //         console.warn( 'Can not find element at ' + parentUrl );
            //         return;
            //     }
            //     var extname = Path.extname(event.detail.url);

            //     // create new folder
            //     var fspath = AssetDB.fspath(event.detail.url);
            //     var newEL = _newProjectItem( fspath, extname );

            //     // binary insert
            //     _binaryInsert ( parentEL, newEL );
            // }.bind(this) );

            this.initContextMenu();
        },

        detached: function () {
            Ipc.removeListener('project-tree:newItem', this._ipc_newItem );
            Ipc.removeListener('project-tree:finishLoading', this._ipc_finishLoading );
        },

        initContextMenu: function () {
            var template = [
                // New Scene
                {
                    label: 'New Scene',
                    click: function () {
                        if ( this.contextmenuAt instanceof ProjectItem ) {
                            var url = this.getUrl(this.contextmenuAt);
                            AssetDB.saveAsset( Url.join( url, 'New Scene.fire' ), new FIRE._Scene() );
                        }
                    }.bind(this)
                },

                // New Folder
                {
                    label: 'New Folder',
                    click: function () {
                        if ( this.contextmenuAt instanceof ProjectItem ) {
                            var url = this.getUrl(this.contextmenuAt);
                            AssetDB.makedirs( Url.join( url, 'New Folder' ) );
                        }
                    }.bind(this)
                },

                // =====================
                { type: 'separator' },

                // Show in finder
                {
                    label: 'Show in finder',
                    click: function () {
                        if ( this.contextmenuAt instanceof ProjectItem ) {
                            FireApp.command( 'asset-db:explore', this.getUrl(this.contextmenuAt) );
                        }
                    }.bind(this)
                },


                // Rename
                {
                    label: 'Rename',
                    click: function () {
                        if ( this.contextmenuAt instanceof ProjectItem ) {
                            this.contextmenuAt.rename();
                        }
                    }.bind(this)
                },

                // Delete
                {
                    label: 'Delete',
                    click: function () {
                        if ( this.contextmenuAt instanceof ProjectItem ) {
                            var url = this.getUrl(this.contextmenuAt);
                            AssetDB.deleteAsset(url);
                        }
                    }.bind(this)
                },
                
                // =====================
                { type: 'separator' },

                // Reimport
                { 
                    label: 'Reimport',
                    click: function () {
                        if ( this.contextmenuAt instanceof ProjectItem ) {
                            var selectedItemEl = this.contextmenuAt;
                            var url = this.getUrl(selectedItemEl);
                            
                            // check url whether exists
                            if (!AssetDB.exists(url)) {
                                selectedItemEl.remove();
                                return;
                            }
                            var fspath = AssetDB.fspath(url);

                            if (selectedItemEl.isFolder) {

                                // remove assetdb items
                                AssetDB.clean(url);

                                // remove childnodes
                                while (selectedItemEl.firstChild) {
                                    selectedItemEl.removeChild(selectedItemEl.firstChild);
                                }

                                // reimport self
                                if( !selectedItemEl.isRoot ) {
                                    AssetDB.importAsset(fspath);
                                }

                                var folderElements = {};
                                AssetDB.walk( 
                                    url, 

                                    function ( root, name, isDirectory ) {
                                        var itemEL = null;
                                        var fspath = Path.join(root, name);

                                        if ( isDirectory ) {
                                            itemEL = _newProjectItem( fspath, 'folder' );
                                            folderElements[fspath] = itemEL;
                                        }
                                        else {
                                            itemEL = _newProjectItem( fspath );
                                        }

                                        var parentEL = folderElements[root];
                                        if ( parentEL ) {
                                            parentEL.appendChild(itemEL);
                                        }
                                        else {
                                            selectedItemEl.appendChild(itemEL);
                                        }

                                        // reimport
                                        AssetDB.importAsset(fspath);

                                    }.bind(this), 

                                    function () {
                                        // console.log("finish walk");
                                    }.bind(this)
                                );

                            }
                            else {
                                // reimport file
                                AssetDB.importAsset(fspath);
                            }
                            
                        }
                    }.bind(this)
                },
            ];
            this.contextmenu = Menu.buildFromTemplate(template);
        },

        load: function ( url ) {
            console.time('project-tree:loading');
            FireConsole.hint('start loading ' + url);

            var rootEL = _newProjectItem( url, 'root' );
            rootEL.style.marginLeft = "0px";
            this.appendChild(rootEL);

            FireApp.command( 'asset-db:browse', url );
        },

        finishLoading: function ( url ) {
            FireConsole.hint('finish loading ' + url);
            console.timeEnd('project-tree:loading');
        },

        newItem: function ( url, isDirectory ) {
            var newEL = _newProjectItem( url, isDirectory ? 'folder' : null );

            //
            var parentUrl = Url.dirname(url);
            var parentEL = this.getElement(parentUrl);
            if ( parentEL === null ) {
                FireConsole.warn('Can not find element for ' + parentUrl);
                return;
            }

            // binary insert
            _binaryInsert ( parentEL, newEL );
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
                var uuid = AssetDB.urlToUuid(this.getUrl(this.selection[0]));

                // TEMP TODO 
                // FireApp.fire( 'selected', { uuid: uuid } );
            }
        },

        getUrl: function ( element ) {
            if ( element.isRoot ) {
                return element.basename + "://"; 
            }

            var url = element.basename + element.extname;
            var parentEL = element.parentElement;
            while ( parentEL instanceof ProjectItem ) {
                if ( parentEL.isRoot ) {
                    url = parentEL.basename + "://" + url;
                    break;
                }
                else {
                    url = Path.join( parentEL.basename, url );
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
            var names = relativePath.split("/");
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
            var i,j;
            var resultELs = [];

            for ( i = 0; i < elements.length; ++i ) {
                var el = elements[i];
                var url = this.getUrl(el);
                var addEL = true;
                var resultEL = null;
                var resultUrl = null;
                var cmp = null;

                if ( el.isFolder ) {
                    for ( j = 0; j < resultELs.length; ++j ) {
                        resultEL = resultELs[j];
                        resultUrl = this.getUrl(resultEL);

                        // url is child of resultUrl
                        cmp = _includePath( resultUrl, url );
                        if ( cmp ) {
                            addEL = false;
                            break;
                        }

                        // url is parent or same of resultUrl
                        cmp = _includePath( url, resultUrl );
                        if ( cmp ) {
                            resultELs.splice(j,1);
                            --j;
                        }

                        // url is not relative with resultUrl
                    }

                    if ( addEL ) {
                        resultELs.push(el);
                    }
                }
                else {
                    for ( j = 0; j < resultELs.length; ++j ) {
                        resultEL = resultELs[j];
                        resultUrl = this.getUrl(resultEL);

                        // url is child of resultUrl
                        cmp = _includePath( resultUrl, url );
                        if ( cmp ) {
                            addEL = false;
                            break;
                        }

                        // url is not relative with resultUrl
                    }

                    if ( addEL ) {
                        resultELs.push(el);
                    }
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
                if ( el.parentElement === targetEL )
                    continue;

                var url = this.getUrl(el);
                if ( _includePath(url,targetUrl) === false ) {
                    var srcUrl = url;
                    var destUrl = Path.join( targetUrl, el.basename + el.extname );

                    //
                    try {
                        AssetDB.moveAsset( srcUrl, destUrl );
                    }
                    catch (err) {
                        console.error(err);
                        // TODO: failed
                    }
                }
            }
        },

        nextItem: function ( curItem, checkFolded ) {
            if ( checkFolded &&
                 curItem.foldable && 
                 curItem.folded === false && 
                 curItem.children.length > 0 ) 
            {
                return curItem.firstElementChild;
            }

            if ( curItem.nextElementSibling )
                return curItem.nextElementSibling;

            var parentEL = curItem.parentElement;
            if ( parentEL instanceof ProjectItem === false ) {
                return null;
            }

            return this.nextItem(parentEL,false);
        },

        prevItem: function ( curItem ) {
            if ( curItem.previousElementSibling ) {
                if ( curItem.previousElementSibling.foldable && 
                     curItem.previousElementSibling.folded === false && 
                     curItem.previousElementSibling.children.length > 0 ) 
                {
                    return this.getLastElementRecursively(curItem.previousElementSibling);
                }

                return curItem.previousElementSibling;
            }

            var parentEL = curItem.parentElement;
            if ( parentEL instanceof ProjectItem === false ) {
                return null;
            }

            return parentEL;
        },

        getLastElementRecursively: function ( curItem ) {
            if ( curItem.foldable && 
                 curItem.folded === false && 
                 curItem.children.length > 0 ) 
            {
                return this.getLastElementRecursively (curItem.lastElementChild);
            }

            return curItem;
        },

        focusinAction: function (event) {
            this.focused = true;
        },

        focusoutAction: function (event) {
            if ( this.focused === false )
                return;

            if ( event.relatedTarget === null &&
                 event.target instanceof ProjectItem ) 
            {
                this.focus();

                event.stopPropagation();
                return;
            }

            if ( EditorUI.find( this.shadowRoot, event.relatedTarget ) )
                return;

            this.focused = false;
        },

        scrollAction: function (event) {
            this.scrollLeft = 0;
        },

        selectingAction: function (event) {
            this.focus();

            if ( event.target instanceof ProjectItem ) {
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
            if ( event.target instanceof ProjectItem ) {
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
            if ( event.target instanceof ProjectItem ) {
                this.focus();
                var srcPath = this.getUrl(event.target);
                var destPath = Path.dirname(srcPath) + "/" + event.detail.name + event.target.extname;
                AssetDB.moveAsset( srcPath, destPath );
            }
            event.stopPropagation();
        },

        openAction: function (event) {
            if ( event.target instanceof ProjectItem ) {
                // TODO: FireApp.fire( 'loadScene', { uuid: uuid } );
                var url = this.getUrl(event.target);
                var uuid = AssetDB.urlToUuid(url);
                FIRE.AssetLibrary.loadAssetByUuid(uuid, function (asset, error) {
                    if (error) {
                        console.error('Failed to load asset: ' + error);
                        return;
                    }

                    if ( asset instanceof FIRE._Scene ) {
                        FIRE.Engine._setCurrentScene(asset);
                    }
                });

            }
            event.stopPropagation();
        },

        draghoverAction: function (event) {
            if ( event.target ) {
                this.lastDragoverEL = this.curDragoverEL;
                var target = event.target;
                if ( event.target.foldable === false )
                    target = event.target.parentElement;

                // name collision check
                if ( target !== this.lastDragoverEL ) {

                    this.cancelHighligting();
                    this.cancelConflictsHighliting();

                    this.isValidForDrop = true;
                    this.curDragoverEL = target;
                    this.highlight(this.curDragoverEL);

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
                            if (target != srcEL.parentElement) {
                                names.push(srcEL.basename + srcEL.extname);
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
            if ( event.target instanceof ProjectItem ) {
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
                switch ( event.which ) {
                    // enter or F2
                    case 13:
                    case 113:
                        if ( this.lastActive ) {
                            this.lastActive.rename();
                        }
                        event.stopPropagation();
                    break;

                    // key-up
                    case 38:
                        if ( this.lastActive ) {
                            this.clearSelect();
                            var prev = this.prevItem(this.lastActive);
                            if ( prev === null ) {
                                prev = this.lastActive;
                            }
                            this.lastActive = prev;
                            this.select([this.lastActive]);
                            // this.confirmSelect();
                        }
                        event.preventDefault();
                        event.stopPropagation();
                    break;

                    // key-down
                    case 40:
                        if ( this.lastActive ) {
                            this.clearSelect();
                            var next = this.nextItem(this.lastActive,true);
                            if ( next === null ) {
                                next = this.lastActive;
                            }
                            this.lastActive = next;
                            this.select([this.lastActive]);
                            // this.confirmSelect();
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
            // var dstFsDir = AssetDB.fspath(url);

            // for ( var i = 0; i < files.length; i++ ) {
            //     Fs.copySync(files[i].path, dstFsDir);
            // }

            // AssetDB.clean(url);

            // while (targetEl.firstChild) {
            //     targetEl.removeChild(targetEl.firstChild);
            // }

            // if( !targetEl.isRoot ) {
            //     AssetDB.importAsset(dstFsDir);
            // }

            // var folderElements = {};
            // AssetDB.walk( 
            //     url, 

            //     function ( root, name, isDirectory ) {
            //         var itemEL = null;
            //         var fspath = Path.join(root, name);

            //         if ( isDirectory ) {
            //             itemEL = _newProjectItem( fspath, 'folder' );
            //             folderElements[fspath] = itemEL;
            //         }
            //         else {
            //             itemEL = _newProjectItem( fspath );
            //         }

            //         var parentEL = folderElements[root];
            //         if ( parentEL ) {
            //             parentEL.appendChild(itemEL);
            //         }
            //         else {
            //             targetEl.appendChild(itemEL);
            //         }

            //         // reimport
            //         AssetDB.importAsset(fspath);

            //     }.bind(targetEl), 

            //     function () {
            //         // console.log("finish walk");
            //     }.bind(targetEl)
            // );
            // TODO }: 

        },

    });
})();
