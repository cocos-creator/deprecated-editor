Polymer({
    publish: {
        asset: null,
        meta: null,
    },

    info: "",
    _isRetina: false,
    isPlaying: false,
    currentTime: 0,
    audioSource: null,

    created: function () {
        this._isRetina = window.devicePixelRatio === 1 ? false : true;
    },

    resize: function () {
        if ( !this.asset)
            return;

        var contentRect = this.$.content.getBoundingClientRect();
        if (this._isRetina) {
            this.$.canvas.width = contentRect.width * 2;
            this.$.canvas.height = contentRect.height * 2;

            this.$.canvas2.width = contentRect.width * 2;
            this.$.canvas2.height = contentRect.height * 2;
        }
        else {
            this.$.canvas.width = contentRect.width;
            this.$.canvas.height = contentRect.height;

            this.$.canvas2.width = contentRect.width;
            this.$.canvas2.height = contentRect.height;
        }

        this.$.canvas.style.width = contentRect.width + "px";
        this.$.canvas.style.height = contentRect.height + "px";

        this.$.canvas2.style.width = contentRect.width + "px";
        this.$.canvas2.style.height = contentRect.height + "px";

        this.repaint();
        this.drawProgress(0);
    },

    repaint: function () {
        var ctx = this.$.canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;

        var canvasRect = this.$.canvas.getBoundingClientRect();

        if (this._isRetina) {
            this.width = canvasRect.width *2;
            this.height = canvasRect.height *2;
        }
        else {
            this.width = canvasRect.width;
            this.height = canvasRect.height;
        }

        var buffer = this.asset.rawData;
        this.info = "ch:" + buffer.numberOfChannels + ", " + buffer.sampleRate + "Hz, " + this.asset._rawext;
        this.audioLength = buffer.duration * 1000;

        var peaks = null;
        var height = this.height/buffer.numberOfChannels;
        var yoffset = 0;

        for ( var c = 0; c < buffer.numberOfChannels; ++c ) {
            peaks = this.getPeaks( buffer, c, this.width );
            this.drawWave( ctx, peaks, 0, yoffset, this.width, height, this._isRetina );
            yoffset += height;
        }
    },

    assetChanged: function () {
        this.stop();
        this.audioSource = new Fire.AudioSource();
        this.audioSource.clip = this.asset;
        this.audioSource.onEnd = function () {
            this.isPlaying = false;
            this.stop();
            this.audioSource.time = 0;
        }.bind(this);

        this.resize();
    },

    // NOTE: wait @knox fixed obj.time bug
    play: function () {
        this.isPlaying = true;
        this.audioSource.play();

        this.tickProgress();
    },

    stop: function () {
        if ( this.audioSource )
            this.audioSource.stop();
        this.currentTime = 0;
        this.isPlaying = false;
    },

    tickProgress: function () {
        if ( !this.isPlaying )
            return;

        window.requestAnimationFrame ( function () {
            this.currentTime = this.convertTime(this.audioSource.time * 1000);
            var x = (this.audioSource.time*1000/this.audioLength) * this.width;

            this.drawProgress(x);

            this.tickProgress();
        }.bind(this));
    },

    convertTime: function (time) {
        return isNaN(time) ? 0 : parseFloat(time).toFixed(2);
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

    drawProgress: function ( x ) {
        var ctx = this.$.canvas2.getContext("2d");
        if (isNaN(x)) {
            x = 0;
        }
        ctx.clearRect( 0, 0, this.width, this.height );
        ctx.strokeStyle = "#aaa";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo( x, 0 );
        ctx.lineTo( x, this.height );
        ctx.stroke();
    },

    drawWave: function ( ctx, peaks, x, y, width, height, _isRetina ) {
        var $ = 0;
        if (_isRetina) {
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
            this.isPlaying = false;
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

    forwardAction: function ( event ) {
        event.stopPropagation();

        // TODO
    },

    mousedownAction: function (event) {
        event.stopPropagation();
        
        this.isPlaying = false;
        if ( event.which === 1 ) {
            var rect = this.$.content.getBoundingClientRect();
            var startX = rect.left;
            var width = rect.width;

            var mousemoveHandle = function(event) {
                event.stopPropagation();

                var dx = event.clientX - startX;
                dx = Math.clamp( dx, 0, width );
                if (this._isRetina)
                    dx *= 2;

                this.drawProgress(dx);
            }.bind(this);

            var mouseupHandle = function(event) {
                event.stopPropagation();

                var dx = event.clientX - startX;
                dx = Math.clamp( dx, 0, width );

                this.drawProgress(dx);

                this.audioSource.time = (dx/width) * (this.audioLength / 1000);
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
