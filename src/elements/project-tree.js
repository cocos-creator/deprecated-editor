(function () {
    Polymer('project-tree', {
        created: function () {
            this.folderElements = {};
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

    });
})();
