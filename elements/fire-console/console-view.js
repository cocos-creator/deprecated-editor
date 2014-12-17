(function () {
    Polymer({
        publish: {
            searchValue: '',
            minheight: 0,
            minwidth: 0,
        },

        observe: {
            searchValue: 'searchValueChanged',
            logs: 'logsChanged',
            option: 'optionChanged',
        },

        created: function () {
            this.logs = [];
            this.tempLogs = [];
            this.option = 0;
            this.tempSender = null;
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
            for (var i = 0;i < this.logs.length;i++) {
                if (this.logs[i].text.toUpperCase().indexOf(this.searchValue.toUpperCase()) > -1) {
                    this.tempLogs.push(this.logs[i]);
                }
            }
        },


        itemClickAction: function (event, detail, sender) {
            var index = sender.getAttribute('index');
            this.nextElementSibling.nextElementSibling.info = this.tempLogs[index].text;
            var infoclass= "";
            switch (this.tempLogs[index].type) {
                case "log": infoclass = "fa fa-info";
                break;
                case "info": infoclass = "fa fa-info";
                break;
                case "warn": infoclass = "fa fa-warning";
                break;
                case "error": infoclass = "fa fa-times-circle";
                break;
            }
            this.nextElementSibling.nextElementSibling.class = infoclass;
            if (this.tempSender !== null ){
                this.tempSender.removeAttribute("focused");
            }
            sender.setAttribute("focused","");
            this.tempSender = sender;
        },

        optionChanged: function () {
            var type= "";
            switch(this.option) {
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
                    type = "info";
                break;
            }

            if (type === "")
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
