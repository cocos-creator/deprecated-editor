Polymer({
    publish: {
        asset: null,
        meta: null,
    },

    info: "",
    isRetina: false,
    isPlaying: false,
    currentTime: 0,
    audioSource: null,

    created: function () {
        this.isRetina = window.devicePixelRatio === 1 ? false : true;
    },

    resize: function () {
        if ( !this.asset)
            return;

        var contentRect = this.$.content.getBoundingClientRect();
        if (this.isRetina) {
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

        if (this.isRetina) {
            this.width = canvasRect.width *2;
            this.height = canvasRect.height *2;
        }
        else {
            this.width = canvasRect.width;
            this.height = canvasRect.height;
        }

        this.buffer = this.asset.rawData;
        this.info = "ch:" + this.buffer.numberOfChannels + ", " + this.buffer.sampleRate + "Hz, " + this.asset._rawext;
        this.audioLength = this.buffer.duration * 1000;
        this.peaks = this.getPeaks(this.width);
        this.drawWave(ctx,this.peaks,this.buffer.numberOfChannels,this.isRetina);
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

        //
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

        var contentRect = this.$.content.getBoundingClientRect();

        window.requestAnimationFrame ( function () {
            this.currentTime = this.convertTime(this.audioSource.time * 1000);
            var x = (this.audioSource.time*1000/this.audioLength) * this.width;

            this.drawProgress(x);

            this.tickProgress();
        }.bind(this));
    },

    convertTime: function (time) {
        return parseFloat(time).toFixed(2);
    },

    // get peaks depends on canvas width, to avoid wasted drawing
    getPeaks: function (length) {
        var buffer = this.buffer;
        var sampleSize = buffer.length / length;
        var sampleStep = ~~(sampleSize / 10) || 1;
        var channels = buffer.numberOfChannels;
        var peaks = new Float32Array(length);
        var peaks2 = new Float32Array(length);
        for (var c = 0; c < channels; c++) {
            var chan = buffer.getChannelData(c);
            for (var i = 0; i < length; i++) {
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
                if (c === 0 || max > peaks[i]) {
                    peaks[i] = max;
                }
                else if(c === 1 || max > peaks[i]){
                    peaks2[i] = max;
                }
            }
        }

        var allPeaks = [];
        allPeaks.push(peaks);
        if (channels === 2) {
            allPeaks.push(peaks2);
        }
        return allPeaks;
    },

    drawProgress: function ( x ) {
        var ctx = this.$.canvas2.getContext("2d");

        ctx.clearRect( 0, 0, this.width, this.height );
        ctx.strokeStyle = "#aaa";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo( x, 0 );
        ctx.lineTo( x, this.height );
        ctx.stroke();
    },

    drawWave: function (ctx,peaks,max,isRetina) {
        var $ = 0;
        if (isRetina) {
            $ = 0.25;
        }
        else {
            $ = 0.5 ;
        }
        var halfH = this.height / 4;
        var coef = halfH / max;
        var length = peaks[0].length;
        var scale = 1;
        ctx.fillStyle = "#ff8e00";
        if (this.width !== length) {
            scale = this.width / length;
        }

        ctx.beginPath();
        ctx.moveTo($, halfH);
        var i, h;
        for (i = 0; i < length; i++) {
            h = Math.round(peaks[0][i] * coef);
            ctx.lineTo(i * scale + $, halfH + h);
        }
        ctx.lineTo(this.width + $, halfH);
        ctx.moveTo($, halfH);

        for ( i = 0; i < length; i++ ) {
            h = Math.round(peaks[0][i] * coef);
            ctx.lineTo(i * scale + $, halfH - h);
        }
        ctx.lineTo(this.width + $, halfH);
        ctx.fill();
        ctx.fillRect(0, halfH - $, this.width, $*2);
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

        if ( event.which === 1 ) {
            var rect = this.$.content.getBoundingClientRect();
            var startX = rect.left;
            var width = rect.width;

            //
            var mousemoveHandle = function(event) {
                event.stopPropagation();

                var dx = event.clientX - startX;
                dx = Math.clamp( dx, 0, width );

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
