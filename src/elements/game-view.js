(function () {
    Polymer('game-view', {
        created: function () {
            this.canvas = null;

            window.addEventListener('resize', function() {
                this.resize();
            }.bind(this));
        },

        setCanvas: function ( canvas ) {
            if ( this.canvas !== null ) {
                this.$.view.removeChild(this.canvas);
            }

            if ( canvas !== null ) {
                this.canvas = canvas;
                this.$.view.appendChild(canvas);
            }
        }, 

        showAction: function ( event ) {
            this.resize();
        },

        resize: function () {
            if ( this.canvas !== null ) {
                FIRE.Engine.screenSize = new FIRE.Vec2( this.$.view.clientWidth, 
                                                        this.$.view.clientHeight );
            }
        },

    });
})();
