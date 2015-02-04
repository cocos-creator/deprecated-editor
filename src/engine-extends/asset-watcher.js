Fire._AssetsWatcher = (function () {

    function AssetsWatcher(owner) {
        this.owner = owner;

        /**
         *  {
         *      propName: {
         *          uuid: uuid,
         *          callback: callback,
         *      }
         *  }
         */
        this.watchingInfos = {};
    }

    // 如果该 component 不含任何需要检测的 asset，直接把 _assetsWatcher 置为该标记，这样能减少临时对象的创建。
    var EmptyWatcher = AssetsWatcher;

    AssetsWatcher.initComponent = function (component) {
        component._watcherHandler = null;
    };

    function forceSetterNotify(constructor, name, setter) {
        Object.defineProperty(constructor.prototype, name, {
            set: function (value, forceRefresh) {
                if (this._observing) {
                    Object.getNotifier(this).notify({
                        type: 'update',
                        name: name,
                        oldValue: this[name]
                    });
                }
                setter.call(this, value, forceRefresh);

                // 本来是应该用Object.observe，但既然这个 setter 要重载，不如就写在里面
                if (this._watcherHandler && this._watcherHandler !== EmptyWatcher) {
                    this._watcherHandler.changeWatchAsset(name, value);
                }
            },
            configurable: true
        });
    }

    AssetsWatcher.initHandler = function (component) {
        var handler = null;
        // parse props
        var props = component.constructor.__props__;
        for (var i = 0; i < props.length; i++) {
            var propName = props[i];
            var attrs = Fire.attr(component.constructor, propName);
            if (attrs.hasSetter && attrs.hasGetter) {
                var prop = component[propName];
                var isAssetType = (prop instanceof Fire.Asset || Fire.isChildClassOf(attrs.ctor, Fire.Asset));
                if (isAssetType) {
                    forceSetterNotify(component.constructor, propName, attrs.originalSetter);
                    var assetPropsAttr = Fire.attr(component.constructor, 'A$$ETprops', {});
                    if (assetPropsAttr.assetProps) {
                        assetPropsAttr.assetProps.push(propName);
                    }
                    else {
                        assetPropsAttr.assetProps = [propName];
                    }
                    if (!handler) {
                        handler = new AssetsWatcher(component);
                    }
                }
            }
        }
        component._watcherHandler = handler || EmptyWatcher;
    };

    AssetsWatcher.start = function (component) {
        if (!component._watcherHandler) {
            AssetsWatcher.initHandler(component);
        }
        if (component._watcherHandler !== EmptyWatcher) {
            component._watcherHandler.start();
        }
    };

    AssetsWatcher.stop = function (component) {
        console.assert(component._watcherHandler, 'watcher should initialized when start');
        if (component._watcherHandler !== EmptyWatcher) {
            component._watcherHandler.stop();
        }
    };

    function invokeAssetSetter(component, propName, asset) {
        // TODO: 直接调用 set 方法，传入第二个参数，用于指明需要强制刷新
        component[propName] = asset;
    }

    AssetsWatcher.prototype.start = function () {
        var component = this.owner;
        var assetProps = Fire.attr(component.constructor, 'A$$ETprops', {}).assetProps;
        for (var i = 0; i < assetProps.length; i++) {
            var propName = assetProps[i];
            var prop = component[propName];
            if (prop && prop._uuid) {
                var onDirty = (function (propName) {
                    return function (asset) {
                        invokeAssetSetter(component, propName, asset);
                    };
                })(propName);
                Fire.AssetLibrary.assetListener.add(prop._uuid, onDirty);
                this.watchingInfos[propName] = {
                    uuid: prop._uuid,
                    callback: onDirty,
                };
            }
        }
    };

    AssetsWatcher.prototype.stop = function () {
        for (var key in this.watchingInfos) {
            var info = this.watchingInfos[key];
            Fire.AssetLibrary.assetListener.remove(info.uuid, info.callback);
        }
        this.watchingInfos = {};
    };

    AssetsWatcher.prototype.changeWatchAsset = function (propName, newAsset) {
        // deregister old
        var info = this.watchingInfos[propName];
        if (info) {
            if (info.uuid === newAsset._uuid) {
                return;
            }
            // if watching, remove
            Fire.AssetLibrary.assetListener.remove(info.uuid, info.callback);
        }
        // register new
        if (newAsset) {
            var newUuid = newAsset._uuid;
            if (newUuid) {
                var component = this.owner;
                var onDirty = function (asset) {
                    invokeAssetSetter(component, propName, asset);
                };
                Fire.AssetLibrary.assetListener.add(newUuid, onDirty);
                this.watchingInfos[propName] = {
                    uuid: newUuid,
                    callback: onDirty,
                };
                return;
            }
        }
        delete this.watchingInfos[propName];
    };

    return AssetsWatcher;
})();
