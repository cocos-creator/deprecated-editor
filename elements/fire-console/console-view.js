(function () {
    Polymer({
        publish: {
            searchValue: '',
        },

        observe: {
            searchValue: 'searchValueChanged',
            logs: 'logsChanged',
            mySelect: 'mySelectChanged',
        },

        created: function () {
            this.logs = [];
            this.tempLogs = [];
            this.mySelect = 0;
        },

        add: function ( type, text ) {
            this.logs.push({
                type: type,
                text: text
            });
        },

        logsChanged: function () {
            this.tempLogs = this.logs;
        },

        itemAddedAction: function ( event ) {
            // to make sure after layout and before render
            window.requestAnimationFrame ( function () {
                this.scrollTop = this.scrollHeight;
            }.bind(this) );
            event.stopPropagation();
        },

        searchValueChanged: function () {
            this.tempLogs = [];
            for (var i = 0;i <this.logs.length;i++) {
                if (this.logs[i].text.toUpperCase().indexOf(this.searchValue.toUpperCase()) > -1) {
                    this.tempLogs.push(this.logs[i]);
                }
            }
            //this.tempLogs = temp;
        },


        itemClickAction: function (event, detail, sender) {
            var index = sender.getAttribute('index');
            this.nextElementSibling.info = "type:"+this.logs[index].type+",info:"+this.logs[index].text;
        },

        mySelectChanged: function () {
            var type= "";
            switch(this.mySelect) {
                case 0:
                    this.tempLogs = this.logs;
                break;
                case 1:
                    type = "log";
                break;
                case 2:
                    type = "warn";
                break;
                case 3:
                    type = "error";
                break;
                case 4:
                    type = "hint";
                break;
            }

            if (type == "")
                return;

            this.tempLogs = [];
            for (var i = 0; i<this.logs.length; i++) {
                if (this.logs[i].type == type) {
                    this.tempLogs.push(this.logs[i]);
                }
            }
        },

        clear: function () {
            this.logs = [];
        },
    });
})();
