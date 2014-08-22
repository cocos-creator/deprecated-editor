(function () {
    Polymer('project-tree', {
        publish: {
            focused: {
                value: false,
                reflect: true
            },
        },

        created: function () {
            this.focused = false;
            this.folderElements = {};
            this.selection = [];
            this.lastActive = null;
        },

        ready: function () {
            this.$.view.tabIndex = EditorUI.getParentTabIndex(this)+1;
        },

        load: function ( path ) {
            AssetDB.walk( path, function ( root, stat ) {
                itemEL = new ProjectItem();
                itemEL.$.name.innerHTML = stat.name;
                if ( stat.isDirectory() ) {
                    itemEL.foldable = true;
                    itemEL.setIcon('fa-folder');

                    this.folderElements[root+"/"+stat.name] = itemEL;
                }
                else {
                    itemEL.setIcon('fa-file-image-o');
                }

                var parentEL = this.folderElements[root];
                if ( parentEL ) {
                    parentEL.appendChild(itemEL);
                }
                else {
                    itemEL.style.marginLeft="0px";
                    this.$.content.appendChild(itemEL);
                }
            }.bind(this) );
        },

        focusinAction: function (event) {
            this.focused = true;
        },

        focusoutAction: function (event) {
            if ( this.focused === false )
                return;

            if ( EditorUI.find( this.shadowRoot, event.relatedTarget ) )
                return;

            // this.clearSelect(); // TODO
            this.focused = false;
        },

        mousedownAction: function ( event ) {
            // NOTE: this will prevent dragging auto-scroll
            event.preventDefault();
        },

        selectAction: function (event) {
            this.$.view.focus();

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
                    this.clearSelect();
                    this.select( [event.target] );
                } 
                this.lastActive = event.target;
            }
            event.stopPropagation();
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
    });
})();
