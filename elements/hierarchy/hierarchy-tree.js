(function () {
    var Ipc = require('ipc');
    var Remote = require('remote');
    var Menu = Remote.require('menu');

    Polymer({
        created: function () {
            this.focused = false;

            this.contextmenuAt = null;
            this._idToItem = {};

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
            this._ipc_deleteEntity = this.deleteEntity.bind(this);
            this._ipc_setEntityParent = this.setEntityParent.bind(this);
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
            Ipc.on('entity:removed', this._ipc_deleteEntity);
            Ipc.on('entity:parentChanged', this._ipc_setEntityParent);
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
            Ipc.removeListener('entity:removed', this._ipc_deleteEntity);
            Ipc.removeListener('entity:parentChanged', this._ipc_setEntityParent);
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

        deleteEntity: function ( id ) {
            // TODO: deal by view ?
            var el = this._idToItem[id];
            if ( !el ) {
                //Fire.warn( 'Can not find source element: ' + id );
                return;
            }
            this.deleteItem(el);
        },

        onDeleteItem: function (item) {
            // TODO: deal by view ?
            // remove id
            delete this._idToItem[item.id];
        },

        setEntityParent: function ( id, parentId ) {
            var el = this._idToItem[id];
            if ( !el ) {
                //Fire.warn( 'Can not find source element: ' + id );
                return;
            }
            //var oldParentEL = el.parentElement;
            var parentEL = parentId ? this._idToItem[parentId] : this;
            if ( !parentEL ) {
                //Fire.warn( 'Can not find dest element: ' + destUrl );
                return;
            }
            this.setItemParent(el, parentEL);
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
            
            //
            // 目前hierarchy和engine处在同一context，直接访问场景就行。
            // 将来如有需要再改成ipc。
            // 由于这里会同步访问场景，因此可能导致hierarchy提前更新到最新状态，然后才收到刷新事件，
            // 所以刷新时需要做容错。
            if (!Fire.Engine._scene) {
                return;
            }
            var selection = Fire.Selection.entities;
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
                    el.selected = selection.indexOf(el.id) !== -1;
                }
            }
            var entities = Fire.Engine._scene.entities;
            for (var i = 0, len = entities.length; i < len; i++) {
                createItem(entities[i].transform);
            }
        },

        highlight: function ( item ) {
            if ( item ) {
                var style = this.$.highlightMask.style;
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
            var nextSiblingId;  // Todo: = ? 
            Fire.broadcast('engine:moveEntity', Fire.Selection.entities, targetEL.id, nextSiblingId);
        },

        selectingAction: function (event) {
            // mouse down
            this.focus();
            if ( event.target instanceof HierarchyItem ) {
                if ( event.detail.shift ) {
                    //if ( !this.lastActive ) {
                    //    Fire.broadcast('select:entity', event.target.id);
                    //}
                    //else {
                    //    // TODO:
                    //}
                }
                else if ( event.detail.toggle ) {
                    if ( event.target.selected ) {
                        Fire.Selection.unselectEntity(event.target.id);
                    }
                    else {
                        Fire.Selection.selectEntity(event.target.id, false);
                    }
                }
                else {
                    this.startDragging = true;
                    this.startDragAt = [event.detail.x, event.detail.y];
                    //Fire.log('select ' + event.target.id);
                    Fire.Selection.selectEntity(event.target.id);
                    //Fire.log('active becomes ' + Fire.Selection.activeEntityId);
                }
            }
            event.stopPropagation();
        },

        selectAction: function (event) {
            // mouse up
            if ( event.target instanceof HierarchyItem === false ) {
                Fire.Selection.clearEntity(event.target.id);
            }
            event.stopPropagation();
        },
        
        namechangedAction: function (event) {
            // TODO: pull up to view ?
            var item = event.target;
            if ( item instanceof FireTreeItem ) {
                this.focus();
                Fire.broadcast('engine:renameEntity', item.id, event.detail.name);
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
                if (Fire.Selection.entities.indexOf(event.target.id) === -1) {
                    Fire.Selection.clearEntity();
                }
                Fire.Selection.selectEntity(event.target.id);
            }

            this.getContextMenu().popup(Remote.getCurrentWindow());
            event.stopPropagation();
        },

        deleteSelection: function () {
            Fire.broadcast('engine:deleteEntities', Fire.Selection.entities);
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
                var activeId = Fire.Selection.activeEntityId;
                var activeEL = activeId && this._idToItem[activeId];

                this.super([event, activeEL]);
                if (event.cancelBubble) {
                    return;
                }
                //console.log(event.which);
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
                                Fire.Selection.selectEntity(prev.id);
                            }
                        }
                        event.preventDefault();
                        event.stopPropagation();
                    break;

                    // key-down
                    case 40:
                        if ( activeEL ) {
                            var next = this.nextItem(activeEL.id, false);
                            if ( next ) {
                                Fire.Selection.selectEntity(next.id);
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
