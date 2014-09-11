(function () {
    var Path = require('path');

    // redundant 
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
            folded: false,
            foldable: {
                value: false,
                reflect: true
            },
            selected: {
                value: false,
                reflect: true
            },
            highlighted: {
                value: false,
                reflect: true
            },
        },

        created: function () {
            this._isToggle = false;
            this._isShift = false;

            this.basename = '';
            this.extname = '';
            this.isFolder = false;
            this.isRoot = false;

            this.renaming = false;
        },

        domReady: function () {
            // HACK: to make this.$.rename.select() works
            this.$.rename.value = this.basename;
        },

        rename: function () {
            this.$.rename.style.display = '';
            this.$.rename.value = this.basename;
            this.$.rename.focus();
            this.$.rename.select();

            this.renaming = true;
        },

        setIcon: function ( icon ) {
            if ( icon instanceof Image ) {
                this.$.typeIcon.appendChild(icon);
            }
            else {
                this.$.typeIcon.className = "type-icon fa " + icon;
            }
        },

        mousedownAction: function ( event ) {
            if ( this.renaming ) {
                event.stopPropagation();
                return;
            }

            // if this is not the mouse-left-button
            if ( event.which !== 1 )
                return;

            this._isToggle = false;
            this._isShift = false;

            if ( event.shiftKey ) {
                this._isShift = true;
            }
            else if ( event.metaKey || event.ctrlKey ) {
                this._isToggle = true;
            }

            this.fire('selecting', { 
                toggle: this._isToggle, 
                shift: this._isShift
            } );

            event.preventDefault();
            event.stopPropagation();
        },

        mouseupAction: function ( event ) {
            if ( this.renaming ) {
                event.stopPropagation();
                return;
            }

            // if this is not the mouse-left-button
            if ( event.which !== 1 )
                return;

            this.fire('select', { 
                toggle: this._isToggle, 
                shift: this._isShift
            } );

            event.stopPropagation();
        },

        mousemoveAction: function ( event ) {
            this.fire('draghover');

            event.stopPropagation();
        },

        dragoverAction: function ( event ) {
            this.fire('draghover');

            event.preventDefault();
            event.stopPropagation();
        },

        dropAction: function ( event ) {
            event.preventDefault();
            event.stopPropagation();
            
            var url;
            if(this.isFolder) {
                url = this.getUrl();
            }
            else {
                url = this.parentElement.getUrl();
            }

            var dstFsDir = AssetDB.fspath(url);
            var files = event.dataTransfer.files;
            var filesLen = files.length;
            var i;
            var dstFsPath

            for(i = 0; i < filesLen; i++) {
                dstFsPath = Path.join(dstFsDir, files[i].name);
                AssetDB.copyRecursively(files[i].path, dstFsPath);
            }

            // reimport
            AssetDB.clean(url);

            while (this.firstChild) {
                this.removeChild(this.firstChild);
            }

            if( !this.isRoot ) {
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
                        this.appendChild(itemEL);
                    }

                    // reimport
                    AssetDB.importAsset(fspath);

                }.bind(this), 

                function () {
                    // console.log("finish walk");
                }.bind(this)
            );
        },

        getUrl: function () {
            if ( this.isRoot ) {
                return this.basename + "://"; 
            }

            var url = this.basename + this.extname;
            var parentEL = this.parentElement;
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

        foldMousedownAction: function ( event ) {
            this.folded = !this.folded;

            event.stopPropagation();
        },

        renameConfirmAction: function ( event ) {
            this.$.rename.style.display = 'none';
            this.renaming = false;

            if ( this.$.rename.value !== this.basename ) {
                this.fire('namechanged', { name: this.$.rename.value } );
            }
            event.stopPropagation();
        },
    });
})();
