(function () {
    var Ipc = require('ipc');
    var Remote = require('remote');
    var Menu = Remote.require('menu');

    Polymer({
        publish: {
            focused: {
                value: false,
                reflect: true
            },
        },

        created: function () {
            this.focused = false;

            this._idToItem = {};

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

            // debug
            hierarchy = this;

            this._ipc_refresh = this.refresh.bind(this);
            this._ipc_newItem = this.newItem.bind(this);
            this._ipc_deleteItem = this.deleteItem.bind(this);
            this._ipc_setItemParent = this.setItemParent.bind(this);
            this._ipc_setItemIndex = this.setItemIndex.bind(this);
            this._ipc_renameItem = this.renameItem.bind(this);
            //this._ipc_beginLoad = this.beginLoad.bind(this);
            //this._ipc_endLoad = this.endLoad.bind(this);
        },

        ready: function () {
            this.tabIndex = EditorUI.getParentTabIndex(this) + 1;

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

                    this.curDragoverEL = null;
                    this.lastDragoverEL = null;
                    this.isValidForDrop = true;

                    event.stopPropagation();
                }
            }, true );

            this.addEventListener('mouseup', function ( event ) {
                this.startDragging = false;
                if ( this.dragging ) {
                    if ( this.isValidForDrop && this.curDragoverEL ) {
                        this.moveSelection( this.curDragoverEL );
                    }

                    this.cancelHighligting();

                    this.curDragoverEL = null;
                    this.lastDragoverEL = null;
                    this.isValidForDrop = true;
                    this.dragging = false;

                    event.stopPropagation();
                }
            }, true );

            this.addEventListener( "dragenter", function (event) {
                //++this.dragenterCnt;
            }, true);

            this.addEventListener( "dragleave", function (event) {
                --this.dragenterCnt;
                if ( this.dragenterCnt === 0 ) {
                    this.cancelHighligting();

                    this.curDragoverEL = null;
                    this.lastDragoverEL = null;
                    this.isValidForDrop = true;
                }
            }, true);

            // register Ipc
            Ipc.on('scene:launched', this._ipc_refresh);
            Ipc.on('entity:created', this._ipc_newItem);
            Ipc.on('entity:removed', this._ipc_deleteItem);
            Ipc.on('entity:parentChanged', this._ipc_setItemParent);
            Ipc.on('entity:indexChanged', this._ipc_setItemIndex);
            Ipc.on('entity:renamed', this._ipc_renameItem);
            //Ipc.on('hierarchy:beginLoad', this._ipc_beginLoad);
            //Ipc.on('hierarchy:endLoad', this._ipc_endLoad);

            //
            this.refresh();
        },

        detached: function () {
            // unregister Ipc
            Ipc.removeListener('scene:launched', this._ipc_refresh);
            Ipc.removeListener('entity:created', this._ipc_newItem);
            Ipc.removeListener('entity:removed', this._ipc_deleteItem);
            Ipc.removeListener('entity:parentChanged', this._ipc_setItemParent);
            Ipc.removeListener('entity:indexChanged', this._ipc_setItemIndex);
            Ipc.removeListener('entity:renameItem', this._ipc_renameItem);
            //Ipc.removeListener('hierarchy:beginLoad', this._ipc_beginLoad);
            //Ipc.removeListener('hierarchy:endLoad', this._ipc_endLoad);
        },

        getContextMenu: function () {
            var template = [
                //// Copy
                //{
                //    label: 'Copy',
                //    click: function () {
                //        if ( this.contextmenuAt instanceof HierarchyItem ) {
                //            // TODO
                //        }
                //    }.bind(this)
                //},

                //// Paste
                //{
                //    label: 'Paste',
                //    click: function () {
                //        // TODO
                //    }.bind(this)
                //},

                //// Duplicate
                //{
                //    label: 'Duplicate',
                //    click: function () {
                //        // TODO
                //    }.bind(this)
                //},

                //// =====================
                //{ type: 'separator' },
                
                // Rename
                {
                    label: 'Rename',
                    click: function () {
                        if ( this.contextmenuAt instanceof HierarchyItem ) {
                            this.contextmenuAt.rename();
                        }
                    }.bind(this)
                },

                // Delete
                {
                    label: 'Delete',
                    click: function () {
                        this.deleteSelection();
                    }.bind(this)
                },
                
                // =====================
                { type: 'separator' },
            ];
            // append Create menu
            template = template.concat(this.parentNode.host.getCreateMenuTemplate(true));
            //
            return Menu.buildFromTemplate(template);
        },

        newItem: function ( name, flags, id, parentEL ) {
            if (flags & Fire._ObjectFlags.SceneGizmo) {
                return;
            }
            var newEL = new HierarchyItem();
            newEL.name = name;
            newEL.foldable = false;
            newEL.id = id;

            this._idToItem[id] = newEL;

            parentEL = parentEL || this;
            parentEL.appendChild(newEL);

            return newEL;
        },

        deleteItem: function ( id ) {
            var el = this._idToItem[id];
            if ( !el ) {
                //Fire.warn( 'Can not find source element: ' + id );
                return;
            }
            
            var self = this;
            function deleteRecursively ( item ) {
                // unselect
                if ( item.selected ) {
                    var idx = self.selection.indexOf( item ); 
                    self.selection.splice(idx, 1);
                }
                // remove id
                delete self._idToItem[item.id];
                // children
                var children = item.children;
                for ( var i = 0; i < children.length; ++i ) {
                    deleteRecursively(children[i]);
                }
            }
            deleteRecursively(el);

            var parentEL = el.parentElement;
            el.remove();
            if (parentEL !== this) {
                parentEL.foldable = parentEL.hasChildNodes();
            }
        },

        setItemParent: function ( id, parentId ) {
            var el = this._idToItem[id];
            if ( !el ) {
                //Fire.warn( 'Can not find source element: ' + id );
                return;
            }
            var oldParentEL = el.parentElement;
            var parentEL = parentId ? this._idToItem[parentId] : this;
            if ( !parentEL ) {
                //Fire.warn( 'Can not find dest element: ' + destUrl );
                return;
            }
            parentEL.appendChild(el);
            if (parentEL !== this) {
                parentEL.foldable = true;
            }
            if (oldParentEL !== this) {
                oldParentEL.foldable = oldParentEL.hasChildNodes();
            }
        },

        setItemIndex: function ( id, nextIdInGame ) {
            var el = this._idToItem[id];
            if ( !el ) {
                //Fire.warn( 'Can not find source element: ' + id );
                return;
            }
            if ( nextIdInGame ) {
                var next = this._idToItem[nextIdInGame];
                if ( !next ) {
                    //Fire.warn( 'Can not find next element: ' + nextIdInGame );
                    return;
                }
                el.parentElement.insertBefore(el, next);
            }
            else {
                el.parentElement.appendChild(el);
            }
        },

        renameItem: function ( id, newName ) {
            var el = this._idToItem[id];
            if ( !el ) {
                //Fire.warn( 'Can not find source element: ' + id );
                return;
            }
            el.name = newName;
        },

        //beginLoad: function () {
        //    // TODO lock
        //    console.time('hierarchy-tree:load');
        //    // TODO clear
        //},

        //endLoad: function () {
        //    // TODO unlock
        //    console.timeEnd('hierarchy-tree:load');
        //},

        refresh: function () {
            // clear
            while (this.firstChild) {
                this.removeChild(this.firstChild);
            }
            this._idToItem = {};
            this.selection.length = 0;
            //
            // 目前hierarchy和engine处在同一context，直接访问场景就行。
            // 将来如有需要再改成ipc。
            // 由于这里会同步访问场景，因此可能导致hierarchy提前更新到最新状态，然后才收到刷新事件，
            // 所以刷新时需要做容错。
            if (!Fire.Engine._scene) {
                return;
            }
            var self = this;
            function createItem(transform, parentEL) {
                var entity = transform.entity;
                var el = self.newItem(entity.name, entity._objFlags, entity.hashKey, parentEL);
                if (el) {
                    var children = transform._children;
                    for (var i = 0, len = children.length; i < len; i++) {
                        createItem(children[i], el);
                    }
                    el.foldable = el.hasChildNodes();
                }
            }
            var entities = Fire.Engine._scene.entities;
            for (var i = 0, len = entities.length; i < len; i++) {
                createItem(entities[i].transform);
            }
        },

        toggle: function ( items ) {
            for ( var i = 0; i < items.length; ++i ) {
                var item = items[i];
                item.selected = !item.selected;
                if ( item.selected ) {
                    this.selection.push(item);
                }
                else {
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

        clearSelect: function () {
            for ( var i = 0; i < this.selection.length; ++i ) {
                this.selection[i].selected = false;
            }
            this.selection = [];
        },

        confirmSelect: function () {
            if ( this.selection.length > 0 ) {
                var idList = this.selection.map( function (x) { return x.id; } );
                Fire.broadcast( 'scene:selected', idList );
            }
        },

        highlight: function ( item ) {
            if ( item ) {
                var style = this.$.highlightMask;
                style.display = "block";
                style.left = item.offsetLeft + "px";
                style.top = item.offsetTop + "px";
                style.width = item.offsetWidth + "px";
                style.height = item.offsetHeight + "px";

                item.highlighted = true;
            }
        },
        
        cancelHighligting: function () {
            if ( this.curDragoverEL ) {
                this.curDragoverEL.highlighted = false;
                this.$.highlightMask.style.display = "none";
            }
        },

        moveSelection: function ( targetEL ) {
            // TODO: sort selection
            var idList = this.selection.map( function (x) { return x.id; } );
            var nextSiblingId;  // Todo: = ? 
            Fire.broadcast('engine:moveEntity', idList, targetEL.id, nextSiblingId);
        },

        nextItem: function ( curItem, skipChildren ) {
            if ( !skipChildren && curItem.expanded ) {
                return curItem.firstElementChild;
            }

            if ( curItem.nextElementSibling )
                return curItem.nextElementSibling;

            var parentEL = curItem.parentElement;
            if ( parentEL instanceof HierarchyItem === false ) {
                return null;
            }

            return this.nextItem(parentEL, true);
        },

        prevItem: function ( curItem ) {
            var prevSb = curItem.previousElementSibling;
            if ( prevSb ) {
                if ( prevSb.expanded ) {
                    function getLastChildRecursively ( curItem ) {
                        if ( curItem.expanded ) {
                            return getLastChildRecursively (curItem.lastElementChild);
                        }
                        return curItem;
                    }
                    return getLastChildRecursively (prevSb);
                }
                return prevSb;
            }

            var parentEL = curItem.parentElement;
            if ( parentEL instanceof HierarchyItem === false ) {
                return null;
            }

            return parentEL;
        },

        focusinAction: function (event) {
            this.focused = true;
        },

        focusoutAction: function (event) {
            if ( this.focused === false )
                return;

            if ( event.relatedTarget === null &&
                 event.target instanceof HierarchyItem ) 
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

            if ( event.target instanceof HierarchyItem ) {
                if ( event.detail.shift ) {
                    if ( !this.lastActive ) {
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
            if ( event.target instanceof HierarchyItem ) {
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
            var el = event.target;
            if ( el instanceof HierarchyItem ) {
                this.focus();
                Fire.broadcast('engine:renameEntity', el.id, event.detail.name);
            }
            event.stopPropagation();
        },

        openAction: function (event) {
            if ( event.target instanceof HierarchyItem ) {
                // TODO: align scene view to target
            }
            event.stopPropagation();
        },

        draghoverAction: function (event) {
            if ( event.target ) {
                this.lastDragoverEL = this.curDragoverEL;
                var target = event.target;
                
                if ( target !== this.lastDragoverEL ) {

                    this.cancelHighligting();

                    this.isValidForDrop = true;
                    this.curDragoverEL = target;
                    this.highlight(this.curDragoverEL);
                }

            }
            event.stopPropagation();
        },

        dragcancelAction: function (event) {
            this.cancelHighligting();

            this.curDragoverEL = null;
            this.lastDragoverEL = null;
            this.isValidForDrop = true;
        },

        contextmenuAction: function (event) {
            this.cancelHighligting();

            this.curDragoverEL = null;
            this.lastDragoverEL = null;
            this.isValidForDrop = true;
            this.startDragging = false;
            this.dragging = false;

            //
            this.contextmenuAt = null;
            if ( event.target instanceof HierarchyItem ) {
                this.contextmenuAt = event.target;
                this.lastActive = this.contextmenuAt;
                if (this.selection.indexOf(this.contextmenuAt) === -1) {
                    this.clearSelect();
                }
                this.select([this.contextmenuAt]);
            }

            this.getContextMenu().popup(Remote.getCurrentWindow());
            event.stopPropagation();
        },

        deleteSelection: function () {
            var idList = this.selection.map( function (x) { return x.id; } );
            Fire.broadcast('engine:deleteEntities', idList);
        },

        keydownAction: function (event) {
            if ( this.dragging ) {
                switch ( event.which ) {
                    // esc
                    case 27:
                        this.cancelHighligting();

                        this.curDragoverEL = null;
                        this.lastDragoverEL = null;
                        this.isValidForDrop = true;
                        this.dragging = false;
                        event.stopPropagation();
                    break;
                }
            }
            else {
                //console.log(event.which);
                switch ( event.which ) {
                    // F2
                    case 113:
                        if ( this.lastActive ) {
                            this.lastActive.rename();
                        }
                        event.stopPropagation();
                    break;
                    
                    // delete
                    case 46:
                        this.deleteSelection();
                        event.stopPropagation();
                    break;
                    
                    // key-up
                    case 38:
                        if ( this.lastActive ) {
                            var prev = this.prevItem(this.lastActive);
                            if ( prev ) {
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
                            if ( next ) {
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
            
            // TODO: instantiate
        },

    });
})();
