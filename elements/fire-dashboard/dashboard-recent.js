var Remote = require('remote');
var Ipc = require('ipc');
var Path = require('fire-path');

Polymer({
    created: function () {
        this.recentProjets = [];
        this.dragenterCnt = 0;
    },

    ready: function () {
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

    attached: function () {
        Ipc.on( 'dashboard:recent-projects', function ( list ) {
            for ( var i = 0; i < list.length; ++i ) {
                var path = list[i];
                this.recentProjets.push({
                    name: Path.basename(path),
                    path: path,
                    blink: false,
                });
            }
        }.bind(this) );

        Ipc.on( 'dashboard:project-added', function ( path, openWhenAdded ) {
            var alreadyExists = false;
            for ( var i = 0; i < this.recentProjets.length; ++i ) {
                if ( this.recentProjets[i].path === path ) {
                    alreadyExists = true;
                    break;
                }
            }
            if ( !alreadyExists ) {
                this.recentProjets.push({
                    name: Path.basename(path),
                    path: path,
                    blink: true,
                });

                setTimeout( function () {
                    if ( openWhenAdded ) {
                        Editor.sendToCore('dashboard:open-project', path);
                    }
                }, 300 );

                this.fire('project-added');
            }
            else {
                Editor.sendToCore('dashboard:open-project', path);
                this.fire('project-added');
            }
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
        Editor.sendToCore( 'dashboard:request-recent-projects' );
    },

    detached: function () {
        Ipc.removeAllListeners('dashboard:recent-projects');
        Ipc.removeAllListeners('dashboard:project-added');
        Ipc.removeAllListeners('dashboard:project-removed');
    },

    dropAction: function ( event ) {
        event.preventDefault();
        event.stopPropagation();

        this.$.border.classList.remove('highlight');
        this.dragenterCnt = 0;

        var files = event.dataTransfer.files;
        for ( var i = 0; i < files.length; ++i ) {
            var file = files[i];
            Editor.sendToCore( 'dashboard:add-project', file.path );
        }
    },
});
