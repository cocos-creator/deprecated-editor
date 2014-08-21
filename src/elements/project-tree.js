(function () {
    Polymer('project-tree', {
        created: function () {
            this.folderElements = {};
        },

        load: function ( path ) {
            AssetDB.walk( path, function ( root, stat ) {
                var itemEL = new ProjectItem();
                if ( stat.isDirectory() ) {
                    itemEL.$.name.innerHTML = "<b>" + stat.name + "</b>";

                    this.folderElements[root+"/"+stat.name] = itemEL;
                }
                else {
                    itemEL.$.name.innerHTML = stat.name;
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
