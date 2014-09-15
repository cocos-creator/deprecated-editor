(function () {
    var Path = require('path');
    var nwGUI = require('nw.gui');

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

    function _newProjectItem ( fspath, type ) {
        var extname = Path.extname(fspath); 
        var basename = Path.basename(fspath,extname); 

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
            img.src = fspath; 
            newEL.setIcon(img);
            break;
                
        default:
            newEL.setIcon('fa-cube');
            break;
        }

        return newEL;
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
            this.curDragoverEL = null; 
            this.dragenterCnt = 0;
            this.draggingEL = null;
            this.lastDragoverEL = null;

            // confliction
            this._isValidForDrop = true;
            this.confliction = [];
        },

        ready: function () {
            this.tabIndex = EditorUI.getParentTabIndex(this)+1;

            this.addEventListener('mousemove', function ( event ) {
                if ( this.startDragging ) {
                    // TODO: go to dragging state by distance
                }
                else {
                    event.stopPropagation();
                }
            }, true );

            this.addEventListener('mouseleave', function ( event ) {
                if ( this.startDragging ) {
                    this.cancelHighligting();
                    this.unconflict(this.confliction);
                    this.clearConflict();
                    event.stopPropagation();
                }
            }, true );

            this.addEventListener('mouseup', function ( event ) {
                if ( this.startDragging ) {
                    if ( this.curDragoverEL ) {
                        this.moveSelection( this.curDragoverEL );
                    }

                    this.cancelHighligting();
                    this.startDragging = false;
                    this.draggingEL = null;
                    this.unconflict(this.confliction);
                    this.clearConflict();
                    this._isValidForDrop = true;
                    this.lastDragoverEL = null;
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
                    this.unconflict(this.confliction);
                    this.clearConflict();
                }
            }, true);

            EditorApp.on('assetMoved', function ( event ) {
                var srcEL = this.getElement( event.detail.srcUrl );
                if ( srcEL === null ) {
                    console.warn( 'Can not find source element: ' + event.detail.srcUrl );
                    return;
                }

                var destEL = this.getElement( Path.dirname(event.detail.destUrl) );
                if ( destEL === null ) {
                    console.warn( 'Can not find dest element: ' + event.detail.destUrl );
                    return;
                }

                var destExtname = Path.extname(event.detail.destUrl);
                var destBasename = Path.basename(event.detail.destUrl, destExtname);
                srcEL.extname = destExtname;
                srcEL.basename = destBasename;

                // binary insert
                _binaryInsert ( destEL, srcEL );
            }.bind(this) );

            EditorApp.on('assetDeleted', function ( event ) {
                var el = this.getElement( event.detail.url );
                if ( el === null ) {
                    console.warn( 'Can not find source element: ' + event.detail.url );
                    return;
                }
                el.parentElement.removeChild(el);
            }.bind(this) );

            EditorApp.on('folderCreated', function ( event ) {
                var parentUrl = Path.dirname(event.detail.url);
                var parentEL = this.getElement(parentUrl);
                if ( parentEL === null ) {
                    console.warn( 'Can not find element at ' + parentUrl );
                    return;
                }

                // create new folder
                var fspath = AssetDB.fspath(event.detail.url);
                var newEL = _newProjectItem( fspath, 'folder' );

                // binary insert
                _binaryInsert ( parentEL, newEL );
            }.bind(this) );

        },

        load: function ( url ) {
            var folderElements = {};
            var mountname = AssetDB.mountname(url);
            var rootEL = _newProjectItem( mountname, 'root' );
            rootEL.style.marginLeft="0px";
            this.appendChild(rootEL);

            AssetDB.walk( 
                url, 

                function ( root, name, stat ) {
                    var itemEL = null;
                    var fspath = Path.join(root,name);
                    if ( stat.isDirectory() ) {
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
                        rootEL.appendChild(itemEL);
                    }
                }.bind(this), 

                function () {
                    // console.log("finish walk");
                }.bind(this)
            );
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

        conflict: function ( items ) {
            for ( var i = 0; i < items.length; ++i ) {
                var item = items[i];
                if ( item.conflicted === false ) {
                    item.conflicted = true;
                    item.parentElement.invalid = true;
                    this.confliction.push(item);
                }

            }
        },

        unconflict: function ( items ) {
            for ( var i = 0; i < items.length; ++i ) {
                var item = items[i];
                if ( item.conflicted ) {
                    item.conflicted = false;
                    item.parentElement.invalid = false;
                    var idx = this.confliction.indexOf(item); 
                    this.confliction.splice(idx,1);
                }
            }
        },

        clearConflict: function () {
            for ( var i = 0; i < this.confliction.length; ++i ) {
                this.confliction[i].conflicted = false;
            }
            this.confliction = [];
            this.$.highlightMask.style['border-color'] = '#c7722c';
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
                        cmp = EditorUtils.includePath( resultUrl, url );
                        if ( cmp ) {
                            addEL = false;
                            break;
                        }

                        // url is parent or same of resultUrl
                        cmp = EditorUtils.includePath( url, resultUrl );
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
                        cmp = EditorUtils.includePath( resultUrl, url );
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

        cancelHighligting: function () {
            if ( this.curDragoverEL ) {
                this.curDragoverEL.highlighted = false;
                this.curDragoverEL = null;
                this.$.highlightMask.style.display = "none";
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
                if ( EditorUtils.includePath(url,targetUrl) === false ) {
                    var srcUrl = url;
                    var destUrl = Path.join( targetUrl, el.basename + el.extname );
                    try {

                        // check
                        if(!this.isValidForDrop()) {
                            //console.log("cant move");
                            return;
                        }

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
                    this.draggingEL = event.target;
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

                // TODO: confirm selection
                if ( this.selection.length > 0 ) {
                    var uuid = AssetDB.urlToUuid(this.getUrl(this.selection[0]));
                    EditorApp.fire( 'selected', { uuid: uuid } );
                }
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

        draghoverAction: function (event) {
            if ( event.target ) {
                var target = event.target;
                if ( event.target.foldable === false )
                    target = event.target.parentElement;
                if ( target ) {
                    this.$.highlightMask.style.display = "block";
                    this.$.highlightMask.style.left = target.offsetLeft + "px";
                    this.$.highlightMask.style.top = target.offsetTop + "px";
                    this.$.highlightMask.style.width = target.offsetWidth + "px";
                    this.$.highlightMask.style.height = target.offsetHeight + "px";
                }
                if ( this.curDragoverEL ) {
                    this.curDragoverEL.highlighted = false;
                }
                target.highlighted = true;
                this.curDragoverEL = target;

                // name collision check
                if (this.curDragoverEL !== this.lastDragoverEL) {
                    
                    this.unconflict(this.confliction);
                    this.clearConflict();

                    this.lastDragoverEL = this.curDragoverEL;

                    var names = [];
                    if (event.detail.files) {
                        var files = event.detail.files;
                        for (var i = 0; i < files.length; i++) {
                            names.push(files[i].name);
                        }
                    }
                    else {
                        var srcEL = this.draggingEL;

                        if (target != srcEL.parentElement) {
                            names.push(srcEL.basename + srcEL.extname);
                        }
                    }

                    if (names.length > 0) {
                        var collisions = this.getNameCollisions( target, names);
                        if (collisions.length > 0) {
                            this.$.highlightMask.style['border-color'] = '#ddd';
                            this.conflict(collisions);
                        }
                    }

                }


            }
            event.stopPropagation();
        },

        dragcancelAction: function (event) {
            this.cancelHighligting();
            this.unconflict(this.confliction);
            this.clearConflict();
        },

        contextmenuAction: function (event) {
            this.cancelHighligting();
            this.startDragging = false;
            this.draggingEL = null;
            this.unconflict(this.confliction);
            this.clearConflict();
            this._isValidForDrop = true;

            //
            this.contextmenuAt = null;
            if ( event.target instanceof ProjectItem ) {
                this.contextmenuAt = event.target;
                this.lastActive = this.contextmenuAt;
                this.clearSelect();
                this.select([this.contextmenuAt]);
            }

            var menu = new nwGUI.Menu();
            menu.append(new nwGUI.MenuItem({ 
                label: 'Show in finder',
                click: function () {
                    if ( this.contextmenuAt instanceof ProjectItem ) {
                        var fspath = AssetDB.fspath(this.getUrl(this.contextmenuAt));
                        nwGUI.Shell.showItemInFolder(fspath);
                    }
                }.bind(this)
            }));
            menu.append(new nwGUI.MenuItem({ 
                label: 'Rename',
                click: function () {
                    if ( this.contextmenuAt instanceof ProjectItem ) {
                        this.contextmenuAt.rename();
                    }
                }.bind(this)
            }));
            menu.append(new nwGUI.MenuItem({ 
                label: 'Delete',
                click: function () {
                    if ( this.contextmenuAt instanceof ProjectItem ) {
                        var url = this.getUrl(this.contextmenuAt);
                        AssetDB.deleteAsset(url);
                    }
                }.bind(this)
            }));
            menu.append(new nwGUI.MenuItem({ type: 'separator' })); 
            menu.append(new nwGUI.MenuItem({ 
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

                                function ( root, name, stat ) {
                                    var itemEL = null;
                                    var fspath = Path.join(root, name);

                                    if ( stat.isDirectory() ) {
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
            }));

            menu.popup(event.x, event.y);

            event.stopPropagation();
        },

        keydownAction: function (event) {
            if ( this.startDragging ) {
                switch ( event.which ) {
                    // esc
                    case 27:
                        this.cancelHighligting();
                        this.startDragging = false;
                        this.draggingEL = null;
                        this.unconflict(this.confliction);
                        this.clearConflict();
                        this._isValidForDrop = true;
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

            // check
            if(!this.isValidForDrop()) {
                //console.log("cant drop");
                this.cancelHighligting();
                this.startDragging = false;
                this.draggingEL = null;
                this.unconflict(this.confliction);
                this.clearConflict();
                this._isValidForDrop = true;
                this.lastDragoverEL = null;
                return;
            }

            var targetEl = this.curDragoverEL;
            this.cancelHighligting();
            
            // TODO: we should have better solution { 
            var url = this.getUrl(targetEl);
            var files = event.dataTransfer.files;
            var dstFsDir = AssetDB.fspath(url);

            for ( var i = 0; i < files.length; i++ ) {
                EditorUtils.copySync(files[i].path, dstFsDir);
            }

            AssetDB.clean(url);

            while (targetEl.firstChild) {
                targetEl.removeChild(targetEl.firstChild);
            }

            if( !targetEl.isRoot ) {
                AssetDB.importAsset(dstFsDir);
            }

            var folderElements = {};
            AssetDB.walk( 
                url, 

                function ( root, name, stat ) {
                    var itemEL = null;
                    var fspath = Path.join(root, name);

                    if ( stat.isDirectory() ) {
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
                        targetEl.appendChild(itemEL);
                    }

                    // reimport
                    AssetDB.importAsset(fspath);

                }.bind(targetEl), 

                function () {
                    // console.log("finish walk");
                }.bind(targetEl)
            );
            // TODO }: 

        },

        isValidForDrop: function() {
            return this._isValidForDrop;
        },

        getNameCollisions: function( target, list ) {

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

            if (collisions.length > 0) {
                this._isValidForDrop = false;
            }

            return collisions;
        },

    });
})();
