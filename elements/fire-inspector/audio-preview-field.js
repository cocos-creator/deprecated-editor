Polymer({
    publish: {
        asset: null,
        meta: null,
        isPlay: false,
    },

    info: "",
    audioNowPlayTime: 0,
    isRetina: false,
    isautoStop: true,

    created: function () {
        this.audioSource = new Fire.AudioSource();
        this.isRetina = window.devicePixelRatio === 1 ? false : true;
    },

    resize: function (isChanged) {
        if ( !this.asset)
            return;

        var contentRect = this.$.content.getBoundingClientRect();
        if (this.isRetina) {
            this.$.canvas.width = contentRect.width * 2;
            this.$.canvas.height = contentRect.height * 2;
        }
        else {
            this.$.canvas.width = contentRect.width;
            this.$.canvas.height = contentRect.height;
        }


        this.$.canvas.style.width = contentRect.width + "px";
        this.$.canvas.style.height = contentRect.height + "px";

        this.$.Progress.height = contentRect.height;
        this.repaint(isChanged);
    },


    repaint: function (isChanged) {
        var ctx = this.$.canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;

        if ( isChanged ) {
            this.stop();
            this.audioSource = new Fire.AudioSource();
            this.audioSource.clip = this.asset;
        }

        if (this.isRetina) {
            this.width = this.$.canvas.getBoundingClientRect().width *2;
            this.height = this.$.canvas.getBoundingClientRect().height *2;
        }
        else {
            this.width = this.$.canvas.getBoundingClientRect().width;
            this.height = this.$.canvas.getBoundingClientRect().height;
        }


        this.buffer = this.asset.rawData;
        this.info = "ch:" + this.buffer.numberOfChannels +","
                + this.buffer.sampleRate + "Hz,"
                + this.asset._rawext;
        this.audioLength = this.buffer.duration * 1000;
        this.peaks = this.getPeaks(this.width);
        this.drawWave(ctx,this.peaks,this.buffer.numberOfChannels,this.isRetina);
    },

    playAudioAction: function () {
        // if (!this.isautoStop) {
        //     this.isPlay = false;
        //     this.audioSource.pause();
        //     this.isautoStop = true;
        //     return;
        // }

        if (this.audioSource.isPlaying) {
            this.isPlay = false;
            this.audioSource.pause();
            clearInterval(this.timeSpan);
        }
        else {
            this.isPlay = true;
            this.audioSource.play();
            this.updateProgress();
        }

    },

    // NOTE: wait @knox fixed obj.time bug
    goTimeline: function () {
        this.isautoStop = false;
        this.isPlay = true;
        this.audioSource.stop();
        this.audioSource.play();
        this.updateProgress();
    },

    updateProgress: function () {
        this.audioSource.onEnd = function () {
            if (this.isautoStop) {
                this.isPlay = false;
                this.isautoStop = true;
                this.stop();
                this.audioSource.time = 0;
            }
        }.bind(this);
        this.audioNowPlayTime = 0;
        this.timeSpan = setInterval(function () {
            this.audioNowPlayTime = this.convertTime(this.audioSource.time * 1000);
            var contentRect = this.$.content.getBoundingClientRect();
            this.$.Progress.style.left = (this.audioSource.time * 1000 / this.audioLength) * contentRect.width -2 ;
        }.bind(this),1);
    },

    stop: function () {
        this.audioSource.stop();
        this.audioNowPlayTime = 0;
        this.isPlay = false;
        clearInterval(this.timeSpan);
        this.$.Progress.style.left = "-2px";
    },

    mouseDownAction: function (event) {
        this.drag = true;
        if ( this.drag ) {
            this.$.Progress.style.left = event.offsetX + "px";
            this.audioSource.time = (event.offsetX / this.$.content.getBoundingClientRect().width) * (this.audioLength / 1000);
            this.goTimeline();
        }
    },

    mouseMoveAction: function (event) {
        if ( this.drag ) {
            this.$.Progress.style.left = event.offsetX + "px";
            this.audioSource.time = (event.offsetX / this.$.content.getBoundingClientRect().width) * (this.audioLength / 1000);
            this.goTimeline();
        }
    },

    mouseUpAction: function () {
        this.drag = false;
    },

    convertTime: function (audioLength) {
        var f_x = parseFloat(audioLength);
        if (isNaN(f_x)) {
            return false;
        }
        var f_x = Math.round(audioLength * 100) / 100;
        var s_x = f_x.toString();
        var pos_decimal = s_x.indexOf('.');
        if (pos_decimal < 0) {
            pos_decimal = s_x.length;
            s_x += '.';
        }
        while (s_x.length <= pos_decimal + 2) {
            s_x += '0';
        }
        return s_x;
    },

    drawWave: function (ctx,peaks, max,isRetina) {
        if (isRetina) {
            var $ = 0.25;
        }
        else {
            var $ = 0.5 ;
        }
        var halfH = this.height / 4;
        var coef = halfH / max;
        var length = peaks[0].length;
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
                h = Math.round(peaks[0][i] * coef);
                cc.lineTo(i * scale + $, halfH + h);
            }
            cc.lineTo(this.width + $, halfH);
            cc.moveTo($, halfH);

            for ( i = 0; i < length; i++ ) {
                h = Math.round(peaks[0][i] * coef);
                cc.lineTo(i * scale + $, halfH - h);
            }
            cc.lineTo(this.width + $, halfH);
            cc.fill();
            cc.fillRect(0, halfH - $, this.width, $*2);

            // cc.moveTo($, halfH*20);
        }.bind(this));
    },

    // 这个是根据原peaks 转换成根据canvas宽度同等的小数据，避免绘制冗余
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
                    } else if (-value > max) {
                        max = -value;
                    }
                }
                if (c === 0 || max > peaks[i]) {
                    peaks[i] = max;
                }else if(c === 1 || max > peaks[i]){
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

    assetChanged: function () {
        this.resize(true);
    },

    getTime: function () {
        console.log(this.audioSource.time);
    }
});
