(function () {
    var Path = require('fire-path');
    var Url = require('fire-url');

    var Remote = require('remote');
    var Ipc = require('ipc');
    var Menu = Remote.require('menu');
    var MenuItem = Remote.require('menu-item');

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
            if (el.parentNode !== this) {
                el.parentNode.foldable = el.parentNode.hasChildNodes();
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
            el.remove();
        },

        setItemParent: function ( id, parentID ) {
            var el = this._idToItem[id];
            if ( !el ) {
                //Fire.warn( 'Can not find source element: ' + id );
                return;
            }
            if (el.parentNode !== this) {
                el.parentNode.foldable = el.parentNode.hasChildNodes();
            }
            var parentEL = parentID ? this._idToItem[parentID] : this;
            if ( !parentEL ) {
                //Fire.warn( 'Can not find dest element: ' + destUrl );
                return;
            }
            parentEL.appendChild(el);
            if (parentEL !== this) {
                parentEL.foldable = true;
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
                el.parentNode.insertBefore(el, next);
            }
            else {
                el.parentNode.appendChild(el);
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
                var id = this.selection[0].id;

                // TEMP TODO 
                // FireApp.fire( 'selected', { id: id } );
            }
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
        keydownAction: function (event) {
            if ( this.dragging ) {
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
                        var idList = [];
                        for ( var i = 0; i < this.selection.length; ++i ) {
                            idList.push(this.selection[i].id);
                        }
                        Fire.broadcast('engine:deleteEntities', idList);
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
    });
})();
