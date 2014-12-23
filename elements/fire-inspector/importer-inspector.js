var Path = require('fire-path');

Polymer({
    created: function () {
        this.target = null;
        this.showPreview = false;
        this.assetName = '';
    },

    // _updateImporterToolbar: function () {
    //     var toolbar = this.$.toolbar;
    //     var target = this.target;
    //     var fspath = Fire.AssetDB.uuidToFspath( target.uuid );

    //     toolbar.setAttribute('justify-end','');

    //     var el = new FireLabel();
    //     el.setAttribute('flex-1','');
    //     el.innerText = Path.basename(fspath);
    //     toolbar.appendChild(el);

    //     el = new FireButton();
    //     var observer = new PathObserver(target, 'dirty');
    //     var transformObserver = new ObserverTransform(observer, function ( value ) {
    //         return !value;
    //     });
    //     el.bind('disabled', transformObserver );
    //     el.addEventListener('click', this.revertAction.bind(this));
    //     var icon = document.createElement('i');
    //     icon.classList.add('fa', 'fa-close');
    //     el.appendChild(icon);
    //     toolbar.appendChild(el);

    //     el = new FireButton();
    //     observer = new PathObserver(target, 'dirty');
    //     transformObserver = new ObserverTransform(observer, function ( value ) {
    //         return !value;
    //     });
    //     el.bind('disabled', transformObserver );
    //     el.addEventListener('click', this.applyAction.bind(this));
    //     icon = document.createElement('i');
    //     icon.classList.add('fa', 'fa-check');
    //     el.appendChild(icon);
    //     toolbar.appendChild(el);
    // },

    resize: function () {
        // TODO: preview element
        // var rect = this.$.preview.getBoundingClientRect();
        // var img = this.$.preview.firstElementChild;
    },

    updateAssetName: function () {
        var fspath = Fire.AssetDB.uuidToFspath( this.target.uuid );
        this.assetName = Path.basename(fspath);
    },

    targetChanged: function () {
        this.$.fields.target = this.target;
        this.$.fields.refresh();

        this.updateAssetName();

        // update preview
        if ( this.$.preview.firstElementChild ) {
            this.$.preview.removeChild(this.$.preview.firstElementChild);
        }
        if ( this.target instanceof Fire.TextureImporter ) {
            var img = new Image();
            img.src = "uuid://" + this.target.uuid;
            var div = document.createElement('div');
            div.classList.add('background');
            div.appendChild(img);
            this.$.preview.appendChild(div);
            this.showPreview = true;
        }
        else {
            this.showPreview = false;
        }
    },

    fieldsChangedAction: function ( event ) {
        event.stopPropagation();

        if ( this.target )
            this.target.dirty = true;
    },

    applyAction: function ( event ) {
        event.stopPropagation();

        var meta = Fire.serialize(this.target);
        Fire.sendToCore('asset-db:apply', meta );
    },

    revertAction: function ( event ) {
        event.stopPropagation();

        this.fire('reload');
    },
});
