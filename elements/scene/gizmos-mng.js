function GizmosMng ( svgElement ) {
    this.svg = SVG(svgElement);
}

GizmosMng.prototype.resize = function ( width, height ) {
    this.svg.size( width, height );
};

GizmosMng.prototype.update = function ( camera ) {
};

GizmosMng.prototype.updateSelection = function ( x, y, w, h ) {
    if ( !this.selectRect ) {
        this.selectRect = this.svg.rect();
    }

    this.selectRect.move( x, y ) 
                   .size( w, h )
                   .fill( { color: "#09f", opacity: 0.4 } )
                   .stroke( { color: "#09f", opacity: 1.0 } )
                   ;
};

GizmosMng.prototype.fadeoutSelection = function () {
    if ( !this.selectRect ) {
        return;
    }

    this.selectRect.animate( 100, '-' ).opacity(0.0)
    .after( function () {
        this.remove();
    }.bind(this.selectRect) );
    this.selectRect = null;
};
