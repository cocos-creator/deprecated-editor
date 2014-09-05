(function () {
    Polymer({
        publish: {
            folded: false,
            foldable: {
                value: false,
                reflect: true
            },
            selected: {
                value: false,
                reflect: true
            },
            highlighted: {
                value: false,
                reflect: true
            },
        },

        created: function () {
            this._isToggle = false;
            this._isShift = false;

            this.basename = '';
            this.extname = '';
            this.isFolder = false;
            this.isRoot = false;

            this.renaming = false;

            // TODO:
            this.collisionNodes = [];
        },

        domReady: function () {
            // HACK: to make this.$.rename.select() works
            this.$.rename.value = this.basename;
        },

        rename: function () {
            this.$.rename.style.display = '';
            this.$.rename.value = this.basename;
            this.$.rename.focus();
            this.$.rename.select();

            this.renaming = true;
        },

        setIcon: function ( className ) {
            this.$.typeIcon.className = "type-icon fa " + className;
        },

        mousedownAction: function ( event ) {
            if ( this.renaming ) {
                event.stopPropagation();
                return;
            }

            // if this is not the mouse-left-button
            if ( event.which !== 1 )
                return;

            this._isToggle = false;
            this._isShift = false;

            if ( event.shiftKey ) {
                this._isShift = true;
            }
            else if ( event.metaKey || event.ctrlKey ) {
                this._isToggle = true;
            }

            this.fire('selecting', { 
                toggle: this._isToggle, 
                shift: this._isShift
            } );

            event.preventDefault();
            event.stopPropagation();
        },

        mouseupAction: function ( event ) {
            if ( this.renaming ) {
                event.stopPropagation();
                return;
            }

            // if this is not the mouse-left-button
            if ( event.which !== 1 )
                return;

            this.fire('select', { 
                toggle: this._isToggle, 
                shift: this._isShift
            } );

            event.stopPropagation();
        },

        mousemoveAction: function ( event ) {
            this.fire('draghover');

            event.stopPropagation();
        },

        foldMousedownAction: function ( event ) {
            this.folded = !this.folded;

            event.stopPropagation();
        },

        renameConfirmAction: function ( event ) {
            this.$.rename.style.display = 'none';
            this.renaming = false;

            if ( this.$.rename.value !== this.basename ) {
                this.fire('namechanged', { name: this.$.rename.value } );
            }
            event.stopPropagation();
        },

        dragenterAction: function ( event ) {
            console.log("this =>", this);
            console.log("project item drag enter action");

            // debug
            That = this;
            
            var nodes;
            if(this.isFolder) {
                nodes = this.childNodes;

            }
            else {
                nodes = this.parentElement.childNodes;
            }

            var nodesLen = nodes.length;

            var files = event.dataTransfer.files;
            var len = files.length;
            var i;

            var file;
            var node;

            for(i = 0; i < len; i++) {
                file = files[i];

                for(j = 0; j < nodesLen; j++) {
                    
                    node = nodes[j];

                    // console.log("node :", node);
                    // console.log("node.basename :", node.basename);
                    // console.log("node.extname :", node.extname);
                    // console.log("fullname", node.basename + '.' + node.extname);
                    // console.log("filename", file.name);

                    if (!node.isFolder && node.basename + node.extname === file.name) {
                        console.log("conlision ===> ", file.name);

                        // TODO: 
                        CEL = node.$;
                        node.$.name.style.color = "red";


                        this.collisionNodes.push(node);
                        // TODO: 是否需要一个全局量 保存 冲突的 node ，待移出时处理？
                    }

                }
            }


            // var self = this;
            // FIRE.getDraggingFiles(event, function (files) {
            //     //self.fire('import', files);
            //     console.log("files =>", files);

            //     // TODO: 如果 self 是文件 则探测 parent 文件夹

            //     // TODO: 如果 self 是文件夹则直接探测

            // });

            event.preventDefault();
            event.stopPropagation();
        },

        dropAction: function ( event ) {
            console.log("this =>", this);
            console.log("project item drop action");

            // debug
            // console.log(event.dataTransfer.types);
            // Files = event.dataTransfer.files;
            // console.log(event.dataTransfer.items.length);

            // var self = this;
            // FIRE.getDraggingItems(event, function (item, isDir) {
            //     //self.fire('import', files);
            //     console.log(item);
            //     console.log(isDir);
            // });


            // TODO: 考虑当前选中的是否是为 文件夹 ，如果是文件夹泽 导入进去 ，不是，则 导入同级。

            That = this;
            //var dstDir = AssetDB.rpath(this.basename + "://");
            
            var files = event.dataTransfer.files;
            var items = event.dataTransfer.items;
            var len = items.length;
            var item;
            var file;

            for(i=0; i<len; i++){
                item = items[i];
                file = files[i];

                if(item.getAsEntry){  //Standard HTML5 API
                    item = item.getAsEntry();
                }else if(item.webkitGetAsEntry){  //WebKit implementation of HTML5 API.
                    item = item.webkitGetAsEntry();
                }

                //if (entry.isDirectory) {
                    console.log("item ==> ", item);
                    console.log("file ==> ", file);
                // }
                // else {

                // }
                

            }

            // TODO:
            this.fire('dragend');
            

            event.preventDefault();
            event.stopPropagation();
        },

        dragendAction: function( event ) {
            console.log("project item drag end action");

            var len = this.collisionNodes.length;
            var i;
            for(i = 0; i < len; i++) {
                this.collisionNodes[i].$.name.style.color = "blue";
            }

            this.collisionNodes = [];
        },
    });
})();
