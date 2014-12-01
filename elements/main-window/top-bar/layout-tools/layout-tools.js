(function () {
    var _handles = [ "move", "rotate", "scale" ];
    var _coordinates = [ "local", "global" ];
    var _pivots = [ "pivot", "center" ];

    Polymer({
        created: function () {
            this.handleID = 0;
            this.coordinateID = 0;
            this.pivotID = 0;
        },

        ready: function () {
            this.$.transform.select(0);
            this.$.coordinate.select(0);
            this.$.pivot.select(0);
        },

        // handle
        selectMove: function ( event ) { 
            this.handleID = 0; 
            this.fire('layout-tools-changed'); 
        },
        selectRotate: function ( event ) { 
            this.handleID = 1; 
            this.fire('layout-tools-changed'); 
        },
        selectScale: function ( event ) { 
            this.handleID = 2; 
            this.fire('layout-tools-changed'); 
        },

        // coordinate
        selectLocal: function ( event ) { 
            this.coordinateID = 0; 
            this.fire('layout-tools-changed'); 
        },
        selectGlobal: function ( event ) { 
            this.coordinateID = 1; 
            this.fire('layout-tools-changed'); 
        },

        // pivot
        selectPivot: function ( event ) { 
            this.pivotID = 0; 
            this.fire('layout-tools-changed'); 
        },
        selectCenter: function ( event ) { 
            this.pivotID = 1; 
            this.fire('layout-tools-changed'); 
        },

        //
        settings: function () {
            return {
                handle: _handles[this.handleID],
                coordinate: _coordinates[this.coordinateID],
                pivot: _pivots[this.pivotID],
            };
        },
    });
})();
