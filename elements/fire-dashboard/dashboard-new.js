(function () {
    var Remote = require('remote');
    var Ipc = require('ipc');
    var Path = require('fire-path');
    var Fs = require('fire-fs');

    function _getUserHome() {
        return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
    }

    Polymer({
        ready: function () {
            this.name = "New Project";
            this.path = _getUserHome();
        },

        browseAction: function ( event ) {
            event.stopPropagation();

            var dialog = Remote.require('dialog');

            var result = dialog.showOpenDialog ( {
                title: "Choose a project",
                properties: [ 'openDirectory', 'createDirectory' ]
            } );

            if ( result ) {
                this.path = result[0];
            }
        },

        createAction: function ( event ) {
            event.stopPropagation();
            
            if ( this.path === '' || this.name === '' )
                return;

            var projectPath = Path.join( this.path, this.name );
            if ( Fs.existsSync(projectPath) && Fs.statSync(projectPath).isDirectory() )
                return;

            Fire.command( 'dashboard:create-project', projectPath );
        },
    });
})();
