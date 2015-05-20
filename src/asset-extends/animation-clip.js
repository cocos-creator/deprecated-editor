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
