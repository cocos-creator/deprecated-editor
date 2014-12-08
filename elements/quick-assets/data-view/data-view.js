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
            },
            viewMode: {
                value: "list",
                reflect: true
            },
        },

        observe: {
            searchValue: "searchValueChanged",
            viewMode: "viewModeChanged",
        },

        created: function () {
            var lock = false;
            this.img = "";
            this.lastSelect = null;
            this.tempList = [];
        },
        ready: function () {

        },

        searchValueChanged: function () {
            this.toSearch();
        },

        viewModeChanged: function () {
            if (this.viewMode == "list") {
                this.$.uls.setAttribute("inline","");
            }
            else {
                this.$.uls.removeAttribute("inline");
            }
        },

        update: function () {
            this.list = this.dataList;
            this.dataList = null;
            switch(this.typename.toString()) {
                case "Fire.Texture":
                    for (var i = 0; i<this.list.length; i++) {
                        this.list[i].uuid = "uuid://" + this.list[i].uuid;
                        var extname = Url.extname(this.list[i].url);
                        var basename = Url.basename(this.list[i].url, extname);
                        this.list[i].url = basename;
                    }
                break;
                case "Fire.Sprite":
                    for (var i = 0; i < this.list.length; i++) {
                        this.list[i].uuid = "fire://src/editor/fire-assets/img/assets-fire.png";
                        var extname = Url.extname(this.list[i].url);
                        var basename = Url.basename(this.list[i].url, extname);
                        this.list[i].url = basename;
                    }
                break;
            }

            this.tempList = this.list;
            //this.bindding(this.list);
        },

        bindding: function (list) {
            for (var i = 0; i<this.$.uls.children.length;i++){
                  this.$.uls.children[i] = null;
                  this.$.uls.removeChild(this.$.uls.children[i]);
                 //delete this.$.uls.children[i].parentNode.removeChild(this.$.uls.children[i]);
                  this.$.uls.children[i];
            }
            //this.$.uls.innerHTML="";
            for (var i= 0;i<list.length;i++) {
                var li= document.createElement('li');
                li.setAttribute("class","list");
                var img = document.createElement('img');
                img.src = list[i].uuid;
                var span = document.createElement('span');
                span.innerHTML =list[i].url;
                li.appendChild(img);
                li.appendChild(span);
                this.$.uls.appendChild(li);
            }
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
            if (this.lock != true) {
                this.lock = true;
                //this.list = null;
                this.list = this.search(this.searchValue,this.tempList);
                this.lock = false;
            }
        },
        ScrollAction: function () {
            /*var onScrollTop = this.$.scrolls.scrollTop;
            var hiddenLength = parseInt(onScrollTop/21);
            if (hiddenLength > this.hiddens) {
                console.log("向下滑");
                for (var i = this.hiddens; i< hiddenLength-this.hidden; i++) {
                    this.tempList[i] = this.tempList[i].img = "";
                }
                this.tempList.push(this.list[hiddenLength]);
            }else if (hiddenLength <this.hiddens){
                console.log("向上滑");
            }
            this.hiddens = hiddenLength;
            this.tempScroll = onScrollTop;*/
        },

        keydownAction: function (event, detail, sender) {
            var pre = this.lastSelect.previousElementSibling;
            var next = this.lastSelect.nextElementSibling;
            switch (event.which) {
                case 38:
                    event.preventDefault();
                    if (pre.tagName != 'LI') {
                         break;
                    }
                    else {
                        if (this.lastSelect != null) {
                            this.lastSelect.removeAttribute("selected");
                        }

                        pre.setAttribute("selected","");
                        this.lastSelect = pre;
                        this.clickAction(event,detail,this.lastSelect);
                        if (pre.offsetTop < this.$.scrolls.scrollTop) {
                            if (this.viewMode == "list") {
                                this.$.scrolls.scrollTop -= 140;
                            }
                            this.$.scrolls.scrollTop -= 21;
                        }

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
                        if (next.offsetTop >= this.$.scrolls.offsetHeight) {
                            if (this.viewMode == "list") {
                                this.$.scrolls.scrollTop += 140;
                            }
                            this.$.scrolls.scrollTop += 21;
                        }

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
