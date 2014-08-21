(function () {
    Polymer('project-tree', {

        load: function ( path ) {
            AssetDB.walk( path, function ( root, stat ) {
                var itemEL = new ProjectItem();
                if ( stat.isDirectory() ) {
                    itemEL.$.name.innerHTML = "<b>" + stat.name + "</b>";
                }
                else {
                    itemEL.$.name.innerHTML = stat.name;
                }
                this.$.content.appendChild(itemEL);

                // var el = document.createElement("div");
                // if ( stat.isDirectory() ) {
                //     el.innerHTML = "<b>" + stat.name + "</b>";
                // }
                // else {
                //     el.innerHTML = stat.name;
                // }
                // this.$.content.appendChild(el);
            }.bind(this) );
        },

    });
})();
