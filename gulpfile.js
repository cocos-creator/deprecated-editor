var path = require('path');

var gulp = require('gulp');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var stylus = require('gulp-stylus');
var vulcanize = require('gulp-vulcanize');
var minifyCSS = require('gulp-minify-css');
var fb = require('gulp-fb');
var header = require('gulp-header');

var del = require('del');
var stylish = require('jshint-stylish');

var paths = {
    src: [
        // init
        'src/editor-init.js',
        'src/ipc-init.js',
        'src/editor-window.js',
        'src/editor-panel.js',
        'src/editor-menu.js',
        'src/main-menu.js',

        // asset extends
        'src/asset-extends/bitmap-font.js',
        'src/asset-extends/sprite.js',
        'src/asset-extends/texture.js',
        'src/asset-extends/script-asset.js',
        'src/asset-extends/audio-clip.js',

        // engine extends
        'src/engine-extends/asset-library.js',
        'src/engine-extends/asset-watcher.js',
        'src/engine-extends/dom.js',
        'src/engine-extends/file-utils.js',
        'src/engine-extends/misc.js',
        'src/engine-extends/component.js',
        'src/engine-extends/missing.js',
        'src/engine-extends/entity.js',
        'src/engine-extends/scene.js',
        'src/engine-extends/engine.js',
        'src/engine-extends/ipc-sender.js',
        'src/engine-extends/ipc-receiver.js',

        // editor
        'src/plugin-loader.js',
        'src/source-map.js',
        'src/sandbox.js',
        'src/asset-db.js',
        'src/pixi-grids.js',
        'src/svg-grids.js',
        'src/gizmos-utils.js',
        'src/svg-gizmos.js',
        'src/build-assets.js',

        // gizmos
        'src/gizmos/gizmo.js',
        'src/gizmos/position-gizmo.js',
        'src/gizmos/rotation-gizmo.js',
        'src/gizmos/scale-gizmo.js',
        'src/gizmos/camera-gizmo.js',
        'src/gizmos/sprite-renderer-gizmo.js',
        'src/gizmos/bitmap-text-gizmo.js',
        'src/gizmos/audio-source-gizmo.js',
        'src/gizmos/text-gizmo.js',
        'src/gizmos/particle-system-gizmo.js',
    ],
    api: [
        'src/ipc-init.js',
    ],
};

// clean
gulp.task('clean', function(cb) {
    del('bin/', cb);
});

/////////////////////////////////////////////////////////////////////////////
// build
/////////////////////////////////////////////////////////////////////////////

var task_copy_deps = [];
var task_min_deps = [ 'src-min' ];
var task_dev_deps = [ 'src-dev' ];
var polymer_watchers = [];

var task_polymer = function ( name ) {
    var basePath = 'elements/' + name + '/';

    var task_css = 'polymer-' + name + '-css';
    var task_styl = 'polymer-' + name + '-styl';
    var task_js = 'polymer-' + name + '-js';
    var task_js_dev = 'polymer-' + name + '-js-dev';
    var task_html = 'polymer-' + name + '-html';
    var task_html_dev = 'polymer-' + name + '-html-dev';
    var task_copy_html = 'polymer-' + name + '-copy-html';
    var task_copy_res = 'polymer-' + name + '-copy-res';

    task_copy_deps.push(task_copy_html, task_copy_res);
    task_min_deps.push(task_html);
    task_dev_deps.push(task_html_dev);

    var js_files = [basePath + '**/*.js','!' + basePath + 'ext/**/*.js'];

    var watcher = {
        css: { files: basePath + '**/*.css', tasks: [task_css, task_html_dev] },
        styl: { files: basePath + '**/*.styl', tasks: [task_styl, task_html_dev] },
        js: { files: js_files, tasks: [task_html_dev] },
        html: { files: basePath + '**/*.html', tasks: [task_html_dev] },
        res: { files: [basePath + '**/*.jpg', basePath + '**/*.png'], tasks: [task_copy_res] }
    };
    polymer_watchers.push(watcher);

    // copy
    gulp.task( task_copy_html, function() {
        return gulp.src( [
            basePath + '**/*.html',
        ], {base: 'elements'})
        .pipe(gulp.dest('bin/tmp/'))
        ;
    });

    gulp.task( task_copy_res, function() {
        return gulp.src( [
            basePath + '**/*.jpg',
            basePath + '**/*.png',
        ], {base: 'elements'})
        .pipe(gulp.dest('bin/'))
        ;
    });

    // styl
    gulp.task( task_styl, function() {
        return gulp.src(basePath + '**/*.styl', {base: 'elements'})
        .pipe(stylus({
            compress: true,
            include: 'src'
        }))
        .pipe(gulp.dest('bin/tmp/'));
    });

    // css
    gulp.task( task_css, function() {
        return gulp.src(basePath + '**/*.css', {base: 'elements'})
        .pipe(minifyCSS())
        .pipe(gulp.dest('bin/tmp/'));
    });

    // js
    gulp.task(task_js, function(callback) {
        var uglify = require('gulp-uglifyjs');
        var gulpSrcFiles = require('gulp-src-files');
        var files = gulpSrcFiles(js_files, {base: 'elements'});
        var count = files.length;
        var streams = files.map(function(file){
            var globpath = path.relative(__dirname, file);
            var destfile = path.relative(path.join(__dirname, 'elements'), file);
            var stream = gulp.src(globpath)
                .pipe(fb.wrapScope())
                .pipe(jshint({
                    multistr: true,
                    smarttabs: false,
                    loopfunc: true,
                    esnext: true,
                }))
                .pipe(jshint.reporter(stylish))
                .pipe(uglify(destfile, {
                    compress: {
                        dead_code: false,
                        unused: false
                    }
                }))
                .pipe(gulp.dest('bin/tmp/'));
            stream.on('end', function() {
                count--;
                if (count <= 0) {
                    callback();
                }
            });
            return stream;
        });
    });

    gulp.task(task_js_dev, function() {
        return gulp.src(js_files, {base: 'elements'})
        .pipe(fb.wrapScope())
        .pipe(jshint({
            multistr: true,
            smarttabs: false,
            loopfunc: true,
            esnext: true,
        }))
        .pipe(jshint.reporter(stylish))
        .pipe(gulp.dest('bin/tmp/'))
        ;
    });

    // html
    var build_html = function () {
        var htmlmin = require('gulp-htmlmin');
        return function () {
            return gulp.src('bin/tmp/' + name + '/' + name + '.html')
            .pipe(vulcanize({
                dest: 'bin/tmp/' + name,
                inline: true,
                strip: true
            }))
            .pipe(htmlmin({
                    removeComments: true,
                    collapseWhitespace: true
                }))
            .pipe(gulp.dest('bin/' + name))
            ;
        };
    };

    var build_html_dev = function () {
        return function () {
            return gulp.src('bin/tmp/' + name + '/' + name + '.html')
                .pipe(vulcanize({
                    dest: 'bin/tmp/' + name,
                    inline: true,
                    strip: false
                }))
                .pipe(gulp.dest('bin/' + name))
                ;
        };
    };

    gulp.task(task_html, [ task_copy_html, task_copy_res, task_styl, task_css, task_js ], build_html());
    gulp.task(task_html_dev, [ task_copy_html, task_copy_res, task_styl, task_css, task_js_dev ], build_html_dev());
};

// src-jshint
gulp.task('src-jshint', function() {
    return gulp.src(paths.src)
    .pipe(jshint({
        forin: false,
        multistr: true,
        smarttabs: false,
        loopfunc: true,
        esnext: true
    }))
    .pipe(jshint.reporter(stylish))
    ;
});

// src-dev
gulp.task('src-dev', ['src-jshint'], function() {
    return gulp.src(paths.src)
    .pipe(fb.wrapScope())
    .pipe(concat('editor.js'))
    .pipe(gulp.dest('bin'))
    ;
});

// src-min
gulp.task('src-min', ['src-dev'], function() {
    //var compiler = require('gulp-closure-compiler');
    var uglify = require('gulp-uglifyjs');
    return gulp.src('bin/editor.js')
        .pipe(uglify('editor.js', {
            compress: {
                dead_code: false,
                unused: false
            }
        }))
        .pipe(gulp.dest('bin'));
});

// doc
gulp.task('export-api-syntax', function (done) {

    // 默认模块是 Editor
    var DefaultModuleHeader = "/**\n" +
        " * @module Editor\n" +
        " */\n";
    var dest = '../../utils/api/editor';

    del(dest + '/**/*', { force: true }, function (err) {
        if (err) {
            done(err);
            return;
        }

        gulp.src(paths.api)
            .pipe(header(DefaultModuleHeader))
            .pipe(gulp.dest(dest))
            .on('end', done);
    });
});

/////////////////////////////////////////////////////////////////////////////
// commands
/////////////////////////////////////////////////////////////////////////////

// task polymers
task_polymer ( 'fire-dashboard' );
task_polymer ( 'main-window' );

// tasks
gulp.task('copy', task_copy_deps );
gulp.task('dev', task_dev_deps );
gulp.task('default', task_min_deps );

// watch
gulp.task('watch', function() {
    for ( var i = 0; i < polymer_watchers.length; ++i ) {
        var watcher = polymer_watchers[i];
        gulp.watch( watcher.css.files, watcher.css.tasks ).on ( 'error', gutil.log );
        gulp.watch( watcher.styl.files, watcher.styl.tasks ).on ( 'error', gutil.log );
        gulp.watch( watcher.js.files, watcher.js.tasks ).on ( 'error', gutil.log );
        gulp.watch( watcher.html.files, watcher.html.tasks ).on ( 'error', gutil.log );
        gulp.watch( watcher.res.files, watcher.res.tasks ).on ( 'error', gutil.log );
    }
    gulp.watch(paths.src, ['src-dev']).on ( 'error', gutil.log );
});
