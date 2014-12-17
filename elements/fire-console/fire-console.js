(function () {
    Polymer({
        publish: {
            option: 0,
            options: [
                { name: 'All',value: 0 },
                { name: 'Log',value: 1 },
                { name: 'Warn',value: 2 },
                { name: 'Error',value: 3 },
                { name: 'Info',value: 4},
            ],
            searchValue: '',
        },

        observe: {
            searchValue: 'searchValueChanged',
            option: 'optionChanged',
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

            this.ipc.on('console:info', function ( text ) {
                this.$.view.add( 'info', text );
            }.bind(this) );
        },

        detached: function () {
            this.ipc.clear();
        },

        searchValueChanged: function () {
            this.$.view.searchValue = this.searchValue;
        },

        optionChanged: function () {
            this.$.view.option = this.option;
        },

        clearConsoleAction: function (event) {
            this.$.view.clear();
        },

        searchAction: function (event) {
            this.$.view.searchValue = event.detail.value;
        },
    });
})();
