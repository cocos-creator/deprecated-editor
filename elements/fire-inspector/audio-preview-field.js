Polymer({
    publish: {
        asset: null,
        meta: null,
    },

    info: "Unkown",
    audioNowPlayTime: 0,

    resize: function () {
        if ( !this.asset)
            return;

        var contentRect = this.$.content.getBoundingClientRect();

        this.$.canvas.width = contentRect.width;
        this.$.canvas.height = contentRect.height;

        this.repaint();
    },

    repaint: function () {
        var ctx = this.$.canvas.getContext("2d");

        if ( this.audioSource ) {
            this.allAudioStop();
        }

        this.audioSource = new Fire.AudioSource();
        this.audioSource.clip = this.asset;

        var devicePixelRation = window.devicePixelRatio;

        this.width = this.$.canvas.getBoundingClientRect().width;
        this.height = this.$.canvas.getBoundingClientRect().height;

        this.buffer = this.asset.rawData;
        this.audioLength = this.buffer.duration;
        this.peaks = this.getPeaks(this.width);
        this.drawWave(ctx,this.peaks,1,devicePixelRation);
    },

    playAudioAction: function (event) {

        // NOTE: 这里代码要改
        if ( event.target.className === "fa fa-play" ) {
            event.target.className = "fa fa-pause";
        }
        else if ( event.target.className === "fa fa-pause" ) {
            event.target.className = "fa fa-play";
        }
        if (this.audioSource.isPlaying) {
            this.audioSource.pause();
            this.allAudioStop();
        }
        else {
            this.audioSource.play();
            this.updateProgress();
        }

    },

    // NOTE: 临时代码
    updateProgress: function () {
        this.audioSource.onEnd = function () {
            this.allAudioStop();
        }.bind(this);
        this.audioNowPlayTime = 0;
        this.timeSpan = setInterval(function () {
            this.audioNowPlayTime ++;
        }.bind(this),1000);
    },

    // NOTE: 临时代码
    allAudioStop: function () {
        this.audioSource.stop();
        this.audioNowPlayTime = 0;
        clearInterval(this.timeSpan);
        this.audioSource = null;
    },

    drawWave: function (ctx,peaks, max,devicePixelRation) {
        //devicePixelRatio  win:1  mac: 2
        var $ = 0.5 / devicePixelRation ;
        var halfH = this.height / 2;
        var coef = halfH / max;
        var length = peaks.length;
        var scale = 1;
        ctx.fillStyle = "#ff8e00";
        if (this.width !== length) {
            scale = this.width / length;
        }
        [ctx].forEach(function (cc) {
            if (!cc) { return; }
            cc.beginPath();
            cc.moveTo($, halfH);

            var i, h;
            for (i = 0; i < length; i++) {
                h = Math.round(peaks[i] * coef);
                cc.lineTo(i * scale + $, halfH + h);
            }
            cc.lineTo(this.width + $, halfH);
            cc.moveTo($, halfH);
            for ( i = 0; i < length; i++ ) {
                h = Math.round(peaks[i] * coef);
                cc.lineTo(i * scale + $, halfH - h);
            }
            cc.lineTo(this.width + $, halfH);
            cc.fill();
            cc.fillRect(0, halfH - $, this.width, $);
        }.bind(this));
    },

    // 这个是根据原peaks 转换成根据canvas宽度同等的小数据，避免绘制冗余
    getPeaks: function (length) {
        var buffer = this.buffer;
        var sampleSize = buffer.length / length;
        var sampleStep = ~~(sampleSize / 10) || 1;
        var channels = buffer.numberOfChannels;
        var peaks = new Float32Array(length);
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
                    // faster than Math.abs
                    } else if (-value > max) {
                        max = -value;
                    }
                }
                if (c === 0 || max > peaks[i]) {
                    peaks[i] = max;
                }
            }
        }

        return peaks;
    },

    assetChanged: function () {
        this.resize();
    },
});
