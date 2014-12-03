(function () {
    var Url = require('fire-url');

    Polymer({
        publish: {
            dataList: [],
            typename: null,
            searchValue: {
                value: "",
                reflect: true
            },
            select: {
                value: false,
                reflect: true
            }
        },

        observe: {
            searchValue: "searchValueChanged",
        },

        created: function (){
            var lock =false;
            this.img = "";
            this.lastSelect = null;
        },
        ready: function () {

        },

        searchValueChanged: function () {
            this.toSearch();
        },

        update: function () {
            this.list = this.dataList;
            switch(this.typename.toString()){
                case "Fire.Texture":
                    for (var i = 0; i<this.list.length; i++) {
                        this.list[i].uuid = "uuid://" + this.list[i].uuid;
                        var extname = Url.extname(this.list[i].url);
                        var basename = Url.basename(this.list[i].url, extname);
                        this.list[i].url = basename;
                    }
                break;
                case "Fire.Sprite":
                    for (var i = 0; i<this.list.length; i++) {
                        this.list[i].uuid = "fire://src/editor/fire-assets/img/assets-fire.png";
                        var extname = Url.extname(this.list[i].url);
                        var basename = Url.basename(this.list[i].url, extname);
                        this.list[i].url = basename;
                    }
                break;
            }
            this.tempList = this.list;
        },

        clickAction: function (event, detail, sender) {
            this.img = this.list[parseInt(sender.getAttribute('index'))].uuid;
            if (this.lastSelect != null) {
                this.lastSelect.removeAttribute("selected");
            }
            sender.setAttribute("selected","");
            this.lastSelect = sender;
        },
        toSearch: function () {
            if (this.lock!=true){
                this.lock = true;
                this.list = this.search(this.searchValue,this.tempList);
                this.lock = false;
            }
        },

        ScrollAction: function () {
            console.log('on scroll');
        },

        keydownAction: function (event, detail, sender) {
            var pre = this.lastSelect.previousElementSibling;
            var next = this.lastSelect.nextElementSibling;
            switch (event.which){
                case 38:
                    event.preventDefault();
                    if (pre.tagName != 'LI'){
                         break;
                    }
                    else {
                        if (this.lastSelect != null) {
                            this.lastSelect.removeAttribute("selected");
                        }
                        pre.setAttribute("selected","");
                        this.lastSelect = pre;
                        this.clickAction(event,detail,this.lastSelect);
                    }
                break;

                case 40:
                    event.preventDefault();
                    if (next.tagName != 'LI') {
                        break;
                    }
                    else {
                        if (this.lastSelect != null) {
                            this.lastSelect.removeAttribute("selected");
                        }
                        next.setAttribute("selected","");
                        this.lastSelect = next;
                        this.clickAction(event,detail,this.lastSelect);
                    }
                break;
            }
        },

        // 模糊搜索
        search: function (str,list){
            var temp = [];
            var tempStr = str.toUpperCase();
            for (var i= 0; i < list.length; i++) {
                if ((list[i].url.toUpperCase()).indexOf(tempStr) >- 1) {
                    temp.push(list[i]);
                }
            }
            return temp;
        },
    });
})();
