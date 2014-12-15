(function () {
    Polymer({
        publish: {
            mySelect: 0,
            mySelectList: [
                { name: 'all',value: 0 },
                { name: 'log',value: 1 },
                { name: 'warn',value: 2 },
                { name: 'error',value: 3 },
                { name: 'hint',value: 4},
            ],
            searchValue: '',
        },

        observe: {
            searchValue: 'searchValueChanged',
            mySelect: 'mySelectChanged',
        },

        created: function () {
            this.icon = new Image();
            this.icon.src = "fire://static/img/plugin-console.png";

            this.ipc = new Fire.IpcListener();
        },

        attached: function () {
            // register ipc
            this.ipc.on('console:log', function ( text ) {
                this.$.view.add( 'log', text );
            }.bind(this) );

            this.ipc.on('console:warn', function ( text ) {
                this.$.view.add( 'warn', text );
            }.bind(this) );

            this.ipc.on('console:error', function ( text ) {
                this.$.view.add( 'error', text );
            }.bind(this) );

            this.ipc.on('console:hint', function ( text ) {
                this.$.view.add( 'hint', text );
            }.bind(this) );
        },

        detached: function () {
            this.ipc.clear();
        },

        clearConsole: function (event,target) {
            var nextEle = event.target;
            if (event.target.tagName == "I") {
                nextEle = event.target.parentNode;
            }
            nextEle.parentNode.nextElementSibling.clear();
        },

        searchValueChanged: function () {
            this.$.view.searchValue = this.searchValue;
        },

        mySelectChanged: function () {
            this.$.view.mySelect = this.mySelect;
        },

    });
})();
