Polymer({
    publish: {
        asset: null,
        meta: null,
    },

    audioInfo: "",
    timeInfo: "",
    audioSource: null,
    contentRectWidth: -1,

    detached: function () {
        this.stop();
    },

    resize: function () {
        if ( !this.asset)
            return;

        var contentRect = this.$.content.getBoundingClientRect();
        if ( Fire.isRetina ) {
            this.$.canvas.width = contentRect.width * 2;
            this.$.canvas.height = contentRect.height * 2;
        }
        else {
            this.$.canvas.width = contentRect.width;
            this.$.canvas.height = contentRect.height;
        }

        this.$.canvas.style.width = contentRect.width + "px";
        this.$.canvas.style.height = contentRect.height + "px";

        this.contentRectWidth = contentRect.width;

        this.repaint();
        this.setProgress(0);
    },

    repaint: function () {
        var ctx = this.$.canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;

        var buffer = this.asset.rawData;

        var peaks = null;
        var height = this.$.canvas.height/buffer.numberOfChannels;
        var yoffset = 0;

        for ( var c = 0; c < buffer.numberOfChannels; ++c ) {
            peaks = this.getPeaks( buffer, c, this.$.canvas.width );
            this.drawWave( ctx, peaks, 0, yoffset, this.$.canvas.width, height );
            if ( buffer.numberOfChannels > 1 ) {
                this.drawChannelTip(ctx, c, yoffset );
            }
            yoffset += height;
        }
    },

    assetChanged: function () {
        this.stop();
        this.audioSource = new Fire.AudioSource();
        this.audioSource.clip = this.asset;

        var buffer = this.asset.rawData;
        this.audioInfo = "ch:" + buffer.numberOfChannels + ", " + buffer.sampleRate + "Hz, " + this.asset._rawext;

        this.resize();
    },

    play: function () {
        if ( !this.audioSource )
            return;

        this.audioSource.play();
        this.tickProgress();
    },

    stop: function () {
        if ( !this.audioSource )
            return;

        this.audioSource.stop();
        this.setProgress(0);
    },

    tickProgress: function () {
        if ( !this.audioSource.isPlaying ) {
            return;
        }

        window.requestAnimationFrame ( function () {
            var audioLength = this.audioSource.clip.length;
            var time = this.audioSource.time%audioLength;
            var x = time / audioLength * this.contentRectWidth;

            this.setProgress(x);
            this.tickProgress();
        }.bind(this));
    },

    drawChannelTip: function ( ctx, channel, yOffset ) {
        var offset = 0;
        ctx.fillStyle = "white";
        if ( Fire.isRetina ) {
            ctx.font = '24px Arial';
            offset = 24;
        }
        else {
            ctx.font = '12px Arial';
            offset = 12;
        }
        ctx.fillText( 'ch' + (channel+1), 4, yOffset + offset );
    },

    // get peaks depends on canvas width, to avoid wasted drawing
    getPeaks: function ( buffer, ch, width ) {
        var sampleSize = buffer.length / width;
        var sampleStep = ~~(sampleSize / 10) || 1;
        var peaks = new Float32Array(width);

        var chan = buffer.getChannelData(ch);
        for (var i = 0; i < width; i++) {
            var start = ~~(i * sampleSize);
            var end = ~~(start + sampleSize);
            var max = 0;
            for (var j = start; j < end; j += sampleStep) {
                var value = chan[j];
                if (value > max) {
                    max = value;
                }
                 else if (-value > max) {
                    max = -value;
                }
            }
            peaks[i] = max;
        }

        return peaks;
    },

    setProgress: function ( x ) {
        this.$.progressBar.style.transform = "translateX(" + x + "px)";

        //
        var audioLength = this.audioSource.clip.length;
        var date = new Date( x / this.contentRectWidth * audioLength * 1000 );
        this.timeInfo = Fire.padLeft( date.getMinutes(), 2, '0' ) +
            ":" + Fire.padLeft( date.getSeconds(), 2, '0' ) +
            "." + Fire.padLeft(date.getMilliseconds(), 3, '0' );
    },

    drawWave: function ( ctx, peaks, x, y, width, height ) {
        var $ = 0;
        if ( Fire.isRetina ) {
            $ = 0.25;
        }
        else {
            $ = 0.5;
        }
        var halfH = height / 2;
        var offsetY = y + halfH;
        var length = peaks.length;
        var scale = 1;
        ctx.fillStyle = "#ff8e00";
        if (width !== length) {
            scale = width / length;
        }

        var i, h;

        ctx.beginPath();
        ctx.moveTo($, offsetY);

        for (i = 0; i < length; i++) {
            h = Math.round(peaks[i] * halfH);
            ctx.lineTo(i * scale + $, offsetY + h);
        }
        ctx.lineTo(width + $, offsetY);
        ctx.moveTo($, offsetY);

        for ( i = 0; i < length; i++ ) {
            h = Math.round(peaks[i] * halfH);
            ctx.lineTo(i * scale + $, offsetY - h);
        }
        ctx.lineTo(width + $, offsetY);
        ctx.fill();
        ctx.fillRect(0, offsetY - $, width, $*2);
    },

    playAction: function ( event ) {
        event.stopPropagation();

        if ( this.audioSource.isPlaying ) {
            this.audioSource.pause();
        }
        else {
            this.play();
        }
    },

    stopAction: function ( event ) {
        event.stopPropagation();

        this.stop();
    },

    loopAction: function ( event ) {
        event.stopPropagation();

        this.audioSource.loop = !this.audioSource.loop;
    },

    mousedownAction: function (event) {
        event.stopPropagation();

        if ( event.which === 1 ) {
            var rect = this.$.content.getBoundingClientRect();
            var startX = rect.left;
            var width = rect.width;
            var audioLength = this.audioSource.clip.length;

            var dx = event.clientX - startX;
            dx = Math.clamp( dx, 0, width );

            this.audioSource.pause();
            this.audioSource.time = (dx/width) * audioLength;
            this.setProgress(dx);

            var mousemoveHandle = function(event) {
                event.stopPropagation();

                var dx = event.clientX - startX;
                dx = Math.clamp( dx, 0, width );

                this.setProgress(dx);
            }.bind(this);

            var mouseupHandle = function(event) {
                event.stopPropagation();

                var dx = event.clientX - startX;
                dx = Math.clamp( dx, 0, width );

                this.audioSource.time = (dx/width) * audioLength;
                this.play();

                document.removeEventListener('mousemove', mousemoveHandle);
                document.removeEventListener('mouseup', mouseupHandle);
                EditorUI.removeDragGhost();
            }.bind(this);

            EditorUI.addDragGhost( 'ew-resize' );
            document.addEventListener ( 'mousemove', mousemoveHandle );
            document.addEventListener ( 'mouseup', mouseupHandle );
        }
    },
});
