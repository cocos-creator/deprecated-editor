(function () {
    var Ipc = require('ipc');
    var Remote = require('remote');
    var Menu = Remote.require('menu');

    Polymer({
        created: function () {
            this.super();

            this.contextmenuAt = null;

            // dragging
            this.dragenterCnt = 0;
            this.curDragoverEL = null; 
            this.lastDragoverEL = null;

            // debug
            hierarchy = this;

            this.ipc = new Fire.IpcListener();
        },

        ready: function () {
            this.tabIndex = EditorUI.getParentTabIndex(this) + 1;

            // register events
            this.addEventListener( "dragenter", function (event) {
                ++this.dragenterCnt;
            }, true);

            this.addEventListener( "dragleave", function (event) {
                --this.dragenterCnt;
                if ( this.dragenterCnt === 0 ) {
                    this.resetDragState();
                }
            }, true);

            // register Ipc
            this.ipc.on('entity:removed', this.deleteItemById.bind(this));
            this.ipc.on('entity:parentChanged', this.setItemParentById.bind(this));
            this.ipc.on('entity:indexChanged', this.setItemIndex.bind(this));
            this.ipc.on('entity:renamed', this.renameItemById.bind(this));

            this.ipc.on('hierarchy:createEntity', this.createEntity.bind(this));
            this.ipc.on('hierarchy:createChildEntity', this.createChildEntity.bind(this));
            this.ipc.on('hierarchy:rename', function () {
                if ( this.contextmenuAt instanceof HierarchyItem ) {
                    this.contextmenuAt.rename();
                }
            }.bind(this));
            this.ipc.on('hierarchy:delete', this.deleteSelection.bind(this));
            this.ipc.on('hierarchy:duplicate', this.duplicateSelection.bind(this));
            
            //
            this.refresh();
        },

        detached: function () {
            this.ipc.clear();
        },

        getContextMenuTemplate: function () {
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

                // Duplicate
                {
                    label: 'Duplicate',
                    message: 'hierarchy:duplicate',
                },

                // =====================
                { type: 'separator' },
                
                // Rename
                {
                    label: 'Rename',
                    message: 'hierarchy:rename',
                },

                // Delete
                {
                    label: 'Delete',
                    message: 'hierarchy:delete',
                },
                
                // =====================
                { type: 'separator' },
            ];
            // append Create menu
            var createMenu = Fire.plugins.hierarchy.getMenuTemplate('hierarchy');
            template = template.concat(createMenu);
            //
            return template;
        },

        newItem: function ( name, id, parentEL ) {
            var newEL = new HierarchyItem();
            this.initItem(newEL, name, id, parentEL);
            return newEL;
        },

        setItemIndex: function ( id, nextIdInGame ) {
            var el = this.idToItem[id];
            if ( !el ) {
                //Fire.warn( 'Can not find source element: ' + id );
                return;
            }
            if ( nextIdInGame ) {
                var next = this.idToItem[nextIdInGame];
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
            this.clear();

            // 这里只是直接读取场景，但场景在读取过程中很可能发生改变，也可能在读取之前改变的消息这时并没收到。
            // 目前先假设在读取之前和读取过程中，场景不会改变。

            if (!Fire.Engine._scene) {
                return;
            }
            var selection = Fire.Selection.entities;
            function createItem(entity, parentEL) {
                var el = Fire.plugins.hierarchy.newEntity(entity.name, entity._objFlags, entity.id, parentEL);
                if (el) {
                    var children = entity._children;
                    for (var i = 0, len = children.length; i < len; i++) {
                        createItem(children[i], el);
                    }
                    el.selected = selection.indexOf(el.userId) !== -1;
                }
            }
            var entities = Fire.Engine._scene.entities;
            for (var i = 0, len = entities.length; i < len; i++) {
                createItem(entities[i]);
            }
        },

        highlightBorder: function ( item ) {
            if ( item && item instanceof HierarchyItem ) {
                var style = this.$.highlightBorder.style;
                style.display = "block";
                style.left = (item.offsetLeft-2) + "px";
                style.top = (item.offsetTop-1) + "px";
                style.width = (item.offsetWidth+4) + "px";
                style.height = (item.offsetHeight+3) + "px";
            }
            else {
                this.$.highlightBorder.style.display = "none";
            }
        },

        highlightInsert: function ( item, position ) {
            if ( item ) {
                var style = this.$.insertLine.style;

                if ( position === 'inside' ) {
                    if ( item.firstElementChild ) {
                        style.display = "block";
                        style.top = (item.firstElementChild.offsetTop-1) + "px";
                        style.left = (item.firstElementChild.offsetLeft-2) + "px";
                        style.width = (item.firstElementChild.offsetWidth+4) + "px";
                        style.height = "0px";
                    }
                    else {
                        style.display = "none";
                    }
                }
                else {
                    style.display = "block";

                    style.left = (item.offsetLeft-2) + "px";
                    style.width = (item.offsetWidth+4) + "px";

                    if ( position === 'before' )
                        style.top = item.offsetTop + "px";
                    else if ( position === 'after'  )
                        style.top = (item.offsetTop + item.offsetHeight) + "px";
                    style.height = "0px";
                }
            }
        },
        
        cancelHighligting: function () {
            this.$.highlightBorder.style.display = "none";
            this.$.insertLine.style.display = "none";
        },

        resetDragState: function () {
            this.cancelHighligting();

            this.curDragoverEL = null;
            this.lastDragoverEL = null;
            this.dragenterCnt = 0;
        },

        moveEntities: function ( targetEL, entities, nextSiblingId ) {
            // TODO: Fire.Selection.filter(entities,'sorted');
            Fire.broadcast('engine:moveEntities', entities, targetEL ? targetEL.userId : null, nextSiblingId);
        },

        selectingAction: function (event) {
            // mouse down
            this.focus();
            if ( event.target instanceof HierarchyItem ) {
                if ( event.detail.shift ) {
                    //if ( !this.lastActive ) {
                    //}
                    //else {
                    //}
                }
                else if ( event.detail.toggle ) {
                    if ( event.target.selected ) {
                        Fire.Selection.unselectEntity(event.target.userId, false);
                    }
                    else {
                        Fire.Selection.selectEntity(event.target.userId, false, false);
                    }
                }
                else {
                    if ( !event.target.selected ) {
                        Fire.Selection.selectEntity(event.target.userId, true, false);
                    }
                }
            }
            event.stopPropagation();
        },

        selectAction: function (event) {
            // mouse up
            if ( event.target instanceof HierarchyItem ) {
                if ( event.detail.shift ) {
                    // TODO:
                }
                else if ( event.detail.toggle ) {
                    // TODO:
                }
                else {
                    Fire.Selection.selectEntity(event.target.userId, true);
                }
                Fire.Selection.confirm();
            }
            event.stopPropagation();
        },
        
        namechangedAction: function (event) {
            // TODO: pull up to view ?
            var item = event.target;
            if ( item instanceof FireTreeItem ) {
                this.focus();
                Fire.broadcast('engine:renameEntity', item.userId, event.detail.name);
            }
            event.stopPropagation();
        },

        openAction: function (event) {
            if ( event.target instanceof HierarchyItem ) {
                // TODO: align scene view to target
            }
            event.stopPropagation();
        },

        mousedownAction: function (event) {
            Fire.Selection.clearEntity();

            event.stopPropagation();
        },

        createEntity: function () {
            var parentEL = this.contextmenuAt && this.contextmenuAt.parentElement;
            if (parentEL instanceof HierarchyItem) {
                Fire.broadcast('engine:createEntity', parentEL.userId);
            }
            else {
                Fire.broadcast('engine:createEntity');
            }
        },

        createChildEntity: function () {
            if (this.contextmenuAt) {
                Fire.broadcast('engine:createEntity', this.contextmenuAt.userId);
            }
            else {
                var activeId = Fire.Selection.activeEntityId;
                Fire.broadcast('engine:createEntity', activeId);
            }
        },

        contextmenuAction: function (event) {
            this.resetDragState();

            //
            this.contextmenuAt = null;
            if ( event.target instanceof HierarchyItem ) {
                this.contextmenuAt = event.target;
                var unselectOther = (Fire.Selection.entities.indexOf(event.target.userId) === -1);
                Fire.Selection.selectEntity(event.target.userId, unselectOther, true);
            }

            Fire.popupMenu(this.getContextMenuTemplate());
            event.stopPropagation();
        },

        deleteSelection: function () {
            Fire.broadcast('engine:deleteEntities', Fire.Selection.entities);
        },

        duplicateSelection: function () {
            var entities = this.getToplevelElements(Fire.Selection.entities).map(function (element) {
                return element && element.userId;
            });
            Fire.broadcast('engine:duplicateEntities', entities);
        },

        keydownAction: function (event) {
            // FIXME: Johnny Said: I found this will swallow some keyaction such as Command+R to refresh the page
            var activeId = Fire.Selection.activeEntityId;
            var activeEL = activeId && this.idToItem[activeId];
            
            this.super([event, activeEL]);
            if (event.cancelBubble) {
                return;
            }

            // console.log(event.which);
            switch ( event.which ) {
                // delete
                case 46:
                    this.deleteSelection();
                    event.stopPropagation();
                break;

                // command + delete (Mac)
                case 8:
                    if ( event.metaKey ) {
                        this.deleteSelection();
                        event.stopPropagation();
                    }
                    break;
                
                // key-up
                case 38:
                    if ( activeEL ) {
                        var prev = this.prevItem(activeEL);
                        if ( prev ) {
                            // Todo toggle?
                            Fire.Selection.selectEntity(prev.userId, true, true);

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
                            Fire.Selection.selectEntity(next.userId, true, true);

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
        },

        dragstartAction: function ( event ) {
            EditorUI.DragDrop.start( event.dataTransfer, 'move', 'entity', Fire.Selection.entities );

            event.stopPropagation();
        },

        dragendAction: function (event) {
            EditorUI.DragDrop.end();

            this.resetDragState();
            Fire.Selection.cancel();
        },

        dragoverAction: function (event) {
            var dragType = EditorUI.DragDrop.type(event.dataTransfer);
            if ( dragType !== "entity" && dragType !== "asset" ) {
                EditorUI.DragDrop.allowDrop( event.dataTransfer, false );
                return;
            }

            //
            if ( event.target ) {
                this.lastDragoverEL = this.curDragoverEL;
                var position;
                var bounding = this.getBoundingClientRect();
                var offsetY = event.clientY - bounding.top + this.scrollTop;
                var target = event.target;
                
                //
                if ( target !== this.lastDragoverEL ) {
                    if ( target === this ) {
                        if ( offsetY <= this.firstElementChild.offsetTop ) {
                            target = this.firstElementChild;
                        }
                        else {
                            target = this.lastElementChild;
                        }
                    }
                    this.curDragoverEL = target;
                }

                // highlight insertion
                if ( offsetY <= (target.offsetTop + target.offsetHeight * 0.3) )
                    position = 'before';
                else if ( offsetY >= (target.offsetTop + target.offsetHeight * 0.7) )
                    position = 'after';
                else 
                    position = 'inside';

                if ( position === 'inside' ) {
                    this.highlightBorder( target );
                }
                else {
                    this.highlightBorder( target.parentElement );
                }
                this.highlightInsert( target, position );

                //
                EditorUI.DragDrop.allowDrop(event.dataTransfer, true);
            }

            //
            var dropEffect = "none";
            if ( dragType === "asset" ) {
                dropEffect = "copy";
            }
            else if ( dragType === "entity" ) {
                dropEffect = "move";
            }
            EditorUI.DragDrop.updateDropEffect(event.dataTransfer, dropEffect);

            //
            event.preventDefault();
            event.stopPropagation();
        },

        dropAction: function ( event ) {
            event.preventDefault();
            event.stopPropagation();
            
            var dragType = EditorUI.DragDrop.type(event.dataTransfer);
            var items = EditorUI.DragDrop.drop(event.dataTransfer);

            this.resetDragState();
            Fire.Selection.cancel();

            if ( items.length > 0 ) {
                // get next sibliing id
                var hoverTarget = event.target;
                var targetEL = null;
                var nextSiblingId = null;
                var bounding = this.getBoundingClientRect();
                var offsetY = event.clientY - bounding.top + this.scrollTop;

                if ( hoverTarget === this ) {
                    targetEL = null;
                    if ( this.firstElementChild ) {
                        if ( offsetY <= this.firstElementChild.offsetTop ) {
                            nextSiblingId = this.firstElementChild.userId;
                        }
                    }
                }
                else {
                    if ( offsetY <= (hoverTarget.offsetTop + hoverTarget.offsetHeight * 0.3) ) {
                        nextSiblingId = hoverTarget.userId;
                        targetEL = hoverTarget.parentElement;
                    }
                    else if ( offsetY >= (hoverTarget.offsetTop + hoverTarget.offsetHeight * 0.7) ) {
                        if ( hoverTarget.nextElementSibling ) {
                            nextSiblingId = hoverTarget.nextElementSibling.userId;
                        }
                        else {
                            nextSiblingId = null;
                            targetEL = hoverTarget.parentElement;
                        }
                    }
                    else {
                        nextSiblingId = null;
                        targetEL = hoverTarget;
                        if ( targetEL.firstElementChild ) {
                            nextSiblingId = targetEL.firstElementChild.userId;
                        }
                    }
                }

                // if target is root, set it to null
                if ( targetEL === this ) {
                    targetEL = null;
                }

                // process 
                if ( dragType === 'entity' ) {
                    this.moveEntities( targetEL, items, nextSiblingId );
                }
                else if ( dragType === 'asset' ) {
                    var parentEnt = null;
                    if ( targetEL )
                        parentEnt = Fire._getInstanceById(targetEL.userId);

                    var onload = function ( asset ) {
                        if ( asset.createEntity ) {
                            var ent = asset.createEntity();
                            ent.parent = parentEnt;
                            ent.transform.position = new Fire.Vec2(0,0);
                            Fire.Selection.selectEntity( ent.id, true, true );
                            Fire.broadcast( 'scene:dirty' );
                        }
                    }.bind(this);

                    for ( var i = 0; i < items.length; ++i ) {
                        Fire.AssetLibrary.loadAssetByUuid( items[i], onload );
                    }
                }
            }
        },

    });
})();
