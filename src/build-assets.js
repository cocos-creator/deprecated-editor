var Path = require('path');
var Ipc = require('ipc');
var gulp = require('gulp');
gulp = new gulp.Gulp();

var es = require('event-stream');

Ipc.on('build-assets', function (proj, dest, debug) {
    var library = Path.join(proj, 'library/');
    var rawFiles = [library + '*/*.*', '!' + library + '*/*.thumb.*'];   // indeed not **/*
    var assets = [library + '*/*', '!' + library + '*/*.*'];

    // build assets
    var info = new Fire._DeserializeInfo();
    var buildAssets = gulp.src(assets, { base: proj })
        .pipe(es.through(function (data) {
            // 去掉带有 editor only 标记的对象和属性，同时压缩 json 文件到最小
            info.reset();
            var obj = Fire.deserialize(data.contents, info, {
                isEditor: false,
                createAssetRefs: true
            });
            data.contents = new Buffer(Editor.serialize(obj, {
                exporting: true,
                minify: !debug
            }));
            this.emit('data', data);
        }))
        .pipe(gulp.dest(dest));

    // copy raw files
    var copyRawFiles = gulp.src(rawFiles, { base: proj })
        .pipe(gulp.dest(dest));

    es.merge(buildAssets, copyRawFiles).on('end', function () {
        Editor.sendToCore('build-assets:reply');
    });
});
