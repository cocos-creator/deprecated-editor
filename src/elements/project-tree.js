(function () {
    Polymer('project-tree', {

        load: function ( path ) {
            AssetDB.walk( path, function ( root, stat ) {
                var el = document.createElement("div");
                if ( stat.isDirectory() ) {
                    el.innerHTML = "<b>" + stat.name + "</b>";
                }
                else {
                    el.innerHTML = stat.name;
                }
                this.$.content.appendChild(el);
            }.bind(this) );
        },

    });
})();
