(function () {

    var gizmos = {
        icon: {
            url: "fire://static/img/gizmos-camera.png",
            width: 40,
            height: 40,
        },

        create: function ( svg, target ) {
            var group = svg.group();
            group.target = target;
            var color = "#ff0";

            var rect = group.rect ()
                 .fill( "none" )
                 .stroke( { width: 1, color: color } )
                 ;

            var l1 = group.line().stroke( { width: 1, color: color } );
            var l2 = group.line().stroke( { width: 1, color: color } );
            var l3 = group.line().stroke( { width: 1, color: color } );
            var l4 = group.line().stroke( { width: 1, color: color } );

            group.update = function ( camera, view ) {
                var zoom = camera.size/view.height;

                var localToWorld = this.entity.transform.getLocalToWorldMatrix();
                var worldpos = new Fire.Vec2(localToWorld.tx, localToWorld.ty);
                var screenpos = camera.worldToScreen(worldpos);
                this.position = screenpos;
                this.rotation = -this.entity.transform.worldRotation;

                var gameViewSize = Fire.Engine.screenSize;
                var height = this.target.size * 2.0 * zoom;
                var width = gameViewSize.x/gameViewSize.y * height;

                rect.size( width, height )
                    .move( -0.5 * width, -0.5 * height )
                    ;

                var len = 10;
                l1.plot(  0.0, -0.5 * height, 0, -0.5 * height + len );
                l2.plot(  0.0,  0.5 * height, 0,  0.5 * height - len );
                l3.plot( -0.5 * width, 0.0, -0.5 * width + len, 0 );
                l4.plot(  0.5 * width, 0.0,  0.5 * width - len, 0 );

                this.translate( this.position.x, this.position.y ) 
                     .rotate( this.rotation, this.position.x, this.position.y )
                     ;
            };

            return group;
        },
    };

    Fire.gizmos['Fire.Camera'] = gizmos;
})();
