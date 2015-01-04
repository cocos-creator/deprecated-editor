var remote = require('remote');

Polymer({
    created: function () {
        this.version = remote.getGlobal( 'FIRE_VER' );
    },
});
