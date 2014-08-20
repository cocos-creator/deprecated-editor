(function () {
    Polymer('project-tree', {

        load: function ( path ) {
            AssetDB.walk( path, function ( path, stat ) {
                var el = document.createElement("div");
                el.innerHTML = stat.name;
                this.$.view.appendChild(el);
            }.bind(this) );
        },

    });
})();
