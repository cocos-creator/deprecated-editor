// create entity action
Fire.AnimationClip.prototype.createEntity = function ( cb ) {
    var ent = new Fire.Entity(this.name);

    var animation = ent.addComponent(Fire.Animation);

    animation.defaultAnimation = this;

    if ( cb ) {
        cb (ent);
    }
};


Fire.AnimationClip.prototype.applyKeyFrame = function ( ent, frameAt ) {
    var results = [];

    for ( var i = 0; i < this.curveData.length; ++i ) {
        var curveInfo = this.curveData[i];
        var comp = ent.getComponent(curveInfo.component);
        if ( !comp ) {
            continue;
        }

        var splits = curveInfo.property.split('.');
        var prop;

        if ( splits.length === 1 ) {
            prop = comp[curveInfo.property];
            if ( prop === undefined ) {
                continue;
            }
        }
        // get value type properties
        else {
            prop = comp[splits[0]];
            if ( prop === undefined ) {
                continue;
            }
            prop = prop[splits[1]];
            if ( prop === undefined ) {
                continue;
            }
        }

        var k, keyInfo;
        for ( k = 0; k < curveInfo.keys.length; ++k ) {
            keyInfo = curveInfo.keys[k];
            if ( keyInfo.frame === frameAt ) {
                break;
            }

            if ( keyInfo.frame > frameAt ) {
                if ( k > 0 ) {
                    keyInfo = curveInfo.keys[k-1];
                    k = k-1;
                }
                else {
                    keyInfo = null;
                }

                break;
            }
        }

        // NOTE: only add key when last key value is not equal to it
        var newKeyInfo = {
            frame: frameAt,
            value: prop,
            curve: 'linear',
        };
        var result = {
            component: curveInfo.component,
            property: curveInfo.property,
            frame: frameAt,
            value: prop,
            curve: 'linear',
        };

        if ( keyInfo ) {
            if ( keyInfo.frame === frameAt ) {
                keyInfo.value = prop;
            }
            else if ( keyInfo.value !== prop ) {
                curveInfo.keys.splice(k, 0, newKeyInfo);
                results.push(result);
            }
        }
        else {
            if ( curveInfo.keys.length > 0 ) {
                curveInfo.keys.splice(0, 0, newKeyInfo);
            }
            else {
                curveInfo.keys.push(newKeyInfo);
            }
            results.push(result);
        }
    }
    return results;
};

Fire.AnimationClip.prototype.removeKey = function ( comp, prop, frame ) {
    var curveInfo = this.getCurveInfo( comp, prop );
    if ( !curveInfo )
        return null;

    for ( var i = 0; i < curveInfo.keys.length; ++i ) {
        var key = curveInfo.keys[i];
        if ( key.frame === frame ) {
            curveInfo.keys.splice( i, 1 );
            return key;
        }
    }

    return null;
};

Fire.AnimationClip.prototype.findKey = function ( comp, prop, frame ) {
    var curveInfo = this.getCurveInfo( comp, prop );
    if ( !curveInfo ) {
        return null;
    }

    for ( var i = 0; i < curveInfo.keys.length; ++i ) {
        var key = curveInfo.keys[i];
        if ( frame === key.frame ) {
            return key;
        }
    }
};

Fire.AnimationClip.prototype.addKey = function ( comp, prop, newKey ) {
    var curveInfo = this.getCurveInfo( comp, prop );
    if ( !curveInfo ) {
        return;
    }

    for ( var i = 0; i < curveInfo.keys.length; ++i ) {
        var key = curveInfo.keys[i];
        if ( newKey.frame === key.frame ) {
            curveInfo.keys[i] = newKey;
            return;
        }
        if ( newKey.frame < key.frame ) {
            curveInfo.keys.splice(i, 0, newKey);
            return;
        }
    }

    curveInfo.keys.push(newKey);
};

Fire.AnimationClip.prototype.sortKeys = function ( comp, prop ) {
    var curveInfo = this.getCurveInfo( comp, prop );
    if ( curveInfo ) {
        curveInfo.keys.sort(function ( a, b ) {
            return a.frame - b.frame;
        });
    }
};

Fire.AnimationClip.prototype.updateLength = function () {
    var maxFrame = 0;
    for ( var i = 0; i < this.curveData.length; ++i ) {
        var curveInfo = this.curveData[i];
        if ( curveInfo.keys.length > 0 ) {
            var lastKey = curveInfo.keys[curveInfo.keys.length-1];
            if ( maxFrame < lastKey.frame ) {
                maxFrame = lastKey.frame;
            }
        }
    }

    this._length = maxFrame / this.frameRate;
};
