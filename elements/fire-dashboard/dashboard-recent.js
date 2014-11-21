(function () {
    var Remote = require('remote');
    var Ipc = require('ipc');
    var Path = require('fire-path');

    Polymer({
        created: function () {
            this.recentProjets = [];
            this.dragenterCnt = 0;
        },

        ready: function () {
            Ipc.on( 'dashboard:recent-projects', function ( list ) {
                for ( var i = 0; i < list.length; ++i ) {
                    var path = list[i];
                    this.recentProjets.push({
                        name: Path.basename(path),
                        path: path,
                    });
                }
            }.bind(this) );

            Ipc.on( 'dashboard:project-added', function ( path ) {
                this.recentProjets.push({ 
                    name: Path.basename(path),
                    path: path,
                });
            }.bind(this) );

            Ipc.on( 'dashboard:project-removed', function ( path ) {
                for ( var i = 0; i < this.recentProjets.length; ++i ) {
                    var item = this.recentProjets[i];
                    if ( item.path === path ) {
                        this.recentProjets.splice(i,1);
                        break;
                    }
                }
            }.bind(this) );

            //
            Fire.command( 'dashboard:request-recent-projects' );

            //
            this.$.border.addEventListener( "dragenter", function (event) {
                if ( this.dragenterCnt === 0 ) {
                    this.$.border.classList.add('highlight');
                }
                ++this.dragenterCnt;
            }.bind(this), true);

            this.$.border.addEventListener( "dragleave", function (event) {
                --this.dragenterCnt;
                if ( this.dragenterCnt === 0 ) {
                    this.$.border.classList.remove('highlight');
                }
            }.bind(this), true);
        },

        browseAction: function ( event ) {
            var dialog = Remote.require('dialog');

            var result = dialog.showOpenDialog ( {
                title: "Choose a project",
                properties: [ 'openDirectory' ]
            } );

            if ( result ) {
                Fire.command( 'dashboard:add-project', result[0] );
            }
        },

        dropAction: function ( event ) {
            event.preventDefault();
            event.stopPropagation();

            this.$.border.classList.remove('highlight');
            this.dragenterCnt = 0;

            var files = event.dataTransfer.files;
            for ( var i = 0; i < files.length; ++i ) {
                var file = files[i];
                Fire.command( 'dashboard:add-project', file.path );
            }
        },
    });
})();
