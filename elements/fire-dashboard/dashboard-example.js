var Remote = require('remote');
var Ipc = require('ipc');
var Path = require('fire-path');

Polymer({
    created: function () {
        // hard coded example path
        this.exampleProjects = [
            {
                name: 'Basic Examples',
                path:  Path.join(__dirname, '..', 'examples', 'basic'),
                desc: 'Contains a collection of scenes each shows usage of a basic component or scripting tip.',
                blink: false
            }
        ];
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

    dropAction: function ( event ) {
    //    event.preventDefault();
    //    event.stopPropagation();
    //
    //    this.$.border.classList.remove('highlight');
    //    this.dragenterCnt = 0;
    //
    //    var files = event.dataTransfer.files;
    //    for ( var i = 0; i < files.length; ++i ) {
    //        var file = files[i];
    //        Editor.sendToCore( 'dashboard:add-project', file.path );
    //    }
    }
});
