(function () {
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

            this._isValidForDrop = true;
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
            
            var folderEl;
            if(this.isFolder) {
                folderEl = this;
            }
            else {
                folderEl = this.parentElement;
            }

            var url = folderEl.getUrl();
            var files = event.dataTransfer.files;
            
            this.fire("dndimport", {folderEl:folderEl, url:url, files:files});

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

        isValidForDrop: function() {
            return this._isValidForDrop;
        },

        getNameCollisions: function( list ) {
            // list if from event.dataTransfer.files

            var nodes;
            if(this.isFolder) {
                nodes = this.childNodes;
            }
            else {
                nodes = this.parentElement.childNodes;
            }
            
            var nodesLen = nodes.length;
            var len = list.length;
            var i,j;
            var file;
            var node;
            var collisions = [];

            for(i = 0; i < len; i++) {
                file = list[i];
            
                for(j = 0; j < nodesLen; j++) {
                    
                    node = nodes[j];
                    if (node.basename + node.extname === file.name) {
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
