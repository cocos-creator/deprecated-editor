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

    for ( var i = 0; i < this.frames.length; ++i ) {
        var frameInfo = this.frames[i];
        var comp = ent.getComponent(frameInfo.component);
        if ( !comp ) {
            continue;
        }

        var splits = frameInfo.property.split('.');
        var prop;

        if ( splits.length === 1 ) {
            prop = comp[frameInfo.property];
            if ( !prop ) {
                continue;
            }
        }
        // get value type properties
        else {
            prop = comp[splits[0]];
            if ( !prop ) {
                continue;
            }
            prop = prop[splits[1]];
            if ( !prop ) {
                continue;
            }
        }

        var k, keyInfo;
        for ( k = 0; k < frameInfo.keys.length; ++k ) {
            keyInfo = frameInfo.keys[k];
            if ( keyInfo.frame === frameAt ) {
                break;
            }

            if ( keyInfo.frame > frameAt ) {
                if ( k > 0 ) {
                    keyInfo = frameInfo.keys[k-1];
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
            component: frameInfo.component,
            property: frameInfo.property,
            frame: frameAt,
            value: prop,
            curve: 'linear',
        };

        if ( keyInfo ) {
            if ( keyInfo.frame === frameAt ) {
                keyInfo.value = prop;
            }
            else if ( keyInfo.value !== prop ) {
                frameInfo.keys.splice(k, 0, newKeyInfo);
                results.push(newKeyInfo);
            }
        }
        else {
            if ( frameInfo.keys.length > 0 ) {
                frameInfo.keys.splice(0, 0, newKeyInfo);
            }
            else {
                frameInfo.keys.push(newKeyInfo);
            }
            results.push(newKeyInfo);
        }
    }
    return results;
};

Fire.AnimationClip.prototype.removeKey = function ( comp, prop, frame ) {
    var frameInfo = this.getFrameInfo( comp, prop );
    if ( !frameInfo )
        return null;

    for ( var i = 0; i < frameInfo.keys.length; ++i ) {
        var key = frameInfo.keys[i];
        if ( key.frame === frame ) {
            frameInfo.keys.splice( i, 1 );
            return key;
        }
    }

    return null;
};

Fire.AnimationClip.prototype.addKey = function ( comp, prop, newKey ) {
    var frameInfo = this.getFrameInfo( comp, prop );
    if ( !frameInfo ) {
        return null;
    }

    for ( var i = 0; i < frameInfo.keys.length; ++i ) {
        var key = frameInfo.keys[i];
        if ( newKey.frame === key.frame ) {
            frameInfo.keys[i] = newKey;
            return;
        }
        if ( newKey.frame < key.frame ) {
            frameInfo.keys.splice(i, 0, newKey);
            return;
        }
    }

    frameInfo.keys.push(newKey);
};

Fire.AnimationClip.prototype.sortKeys = function ( comp, prop ) {
    var frameInfo = this.getFrameInfo( comp, prop );
    if ( frameInfo ) {
        frameInfo.keys.sort(function ( a, b ) {
            return a.frame - b.frame;
        });
    }
};
