var gulp = require('gulp');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var compiler = require('gulp-closure-compiler');
//var map = require('vinyl-map');
var concat = require('gulp-concat');
var stylus = require('gulp-stylus');
var vulcanize = require('gulp-vulcanize');
var del = require('del');
var minifyCSS = require('gulp-minify-css');

var path = require('path');
var es = require('event-stream');
var gulpSrcFiles = require('gulp-src-files');
var stylish = require('jshint-stylish');

var paths = {
    src: [
        // asset extends
        'src/engine-extends/asset-library.js',
        'src/assets/bitmap-font.js',
        'src/assets/sprite.js',
        'src/assets/texture.js',

        // engine extends
        'src/engine-extends/utils.js',
        'src/engine-extends/platform.js',
        'src/engine-extends/dom.js',
        'src/engine-extends/file-utils.js',
        'src/engine-extends/misc.js',
        'src/engine-extends/component.js',
        'src/engine-extends/missing.js',
        'src/engine-extends/entity.js',
        'src/engine-extends/scene.js',
        'src/engine-extends/engine.js',
        'src/engine-extends/render-context.js',
        'src/engine-extends/ipc-sender.js',
        'src/engine-extends/ipc-receiver.js',

        // editor
        'src/plugin-loader.js',
        'src/sandbox.js',
        'src/editor.js',
        'src/menu.js',
        'src/pixi-grids.js',
        'src/svg-grids.js',
        'src/gizmos-utils.js',
        'src/svg-gizmos.js',

        // plugins
        'src/plugins/hierarchy.js',

        // gizmos
        'src/gizmos/gizmo.js',
        'src/gizmos/position-gizmo.js',
        'src/gizmos/rotation-gizmo.js',
        'src/gizmos/scale-gizmo.js',
        'src/gizmos/camera-gizmo.js',
        'src/gizmos/sprite-renderer-gizmo.js',
        'src/gizmos/bitmap-text-gizmo.js',
        'src/gizmos/audio-source-gizmo.js',
    ],
};

// clean
gulp.task('clean', function() {
    del('bin/');
});

/////////////////////////////////////////////////////////////////////////////
// build
/////////////////////////////////////////////////////////////////////////////

function wrapScope () {
    var header = new Buffer("(function () {\n");
    var footer = new Buffer("})();\n");
    return es.through(function (file) {
        file.contents = Buffer.concat([header, file.contents, footer]);
        this.emit('data', file);
    });
}

var task_copy_deps = [];
var task_min_deps = [ 'src-min' ];
var task_dev_deps = [ 'src-dev' ];
var plugin_watchers = [];

var task_plugin = function ( name ) {
    var basePath = 'elements/' + name + '/';

    var task_css = 'plugin-' + name + '-css';
    var task_styl = 'plugin-' + name + '-styl';
    var task_js = 'plugin-' + name + '-js';
    var task_js_dev = 'plugin-' + name + '-js-dev';
    var task_js_ext = 'plugin-' + name + '-js-ext';
    var task_html = 'plugin-' + name + '-html';
    var task_html_dev = 'plugin-' + name + '-html-dev';
    var task_copy_html = 'plugin-' + name + '-copy-html';
    var task_copy_res = 'plugin-' + name + '-copy-res';

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
    plugin_watchers.push(watcher);

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
    gulp.task(task_js_ext, function() {
        return gulp.src(basePath + 'ext/**/*.js', {base: 'elements'})
        .pipe(gulp.dest('bin/tmp/'))
        ;
    });

    gulp.task(task_js, [task_js_ext], function(callback) {
        var files = gulpSrcFiles(js_files, {base: 'elements'});
        var count = files.length;
        var streams = files.map(function(file){
            var globpath = path.relative(__dirname, file);
            var destfile = path.relative(path.join(__dirname, 'elements'), file);
            var stream = gulp.src(globpath)
                .pipe(wrapScope())
                .pipe(jshint({
                    multistr: true,
                    smarttabs: false,
                    loopfunc: true,
                    esnext: true,
                }))
                .pipe(jshint.reporter(stylish))
                .pipe(compiler({
                    compilerPath: path.normalize('../../compiler/compiler.jar'),
                    compilerFlags: {
                        language_in: 'ECMASCRIPT6',
                        language_out: 'ECMASCRIPT5',
                        transpile_only: null,
                        compilation_level: 'SIMPLE',
                        jscomp_off: 'globalThis',
                    },
                    fileName: destfile,
                    continueWithWarnings: true
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

    gulp.task(task_js_dev, [task_js_ext], function() {
        return gulp.src(js_files, {base: 'elements'})
        .pipe(wrapScope())
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
    var build_html = function (strip) {
        return function () {
            return gulp.src('bin/tmp/' + name + '/' + name + '.html')
            .pipe(vulcanize({
                dest: 'bin/tmp/' + name,
                inline: true,
                strip: strip,
            }))
            .pipe(gulp.dest('bin/' + name))
            ;
        };
    };

    gulp.task(task_html, [ task_copy_html, task_copy_res, task_styl, task_css, task_js ], build_html(true));
    gulp.task(task_html_dev, [ task_copy_html, task_copy_res, task_styl, task_css, task_js_dev ], build_html(false));
};

// src-jshint
gulp.task('src-jshint', function() {
    return gulp.src(paths.src)
    .pipe(jshint({
        forin: false,
        multistr: true,
        smarttabs: false,
        loopfunc: true,
        esnext: true,
    }))
    .pipe(jshint.reporter(stylish))
    ;
});

// src-dev
gulp.task('src-dev', ['src-jshint'], function() {
    return gulp.src(paths.src)
    .pipe(wrapScope())
    .pipe(concat('editor.dev.js'))
    .pipe(gulp.dest('bin'))
    ;
});

// src-min
gulp.task('src-min', ['src-dev'], function() {
    return gulp.src('bin/editor.dev.js')
        .pipe(compiler({
            compilerPath: path.normalize('../../compiler/compiler.jar'),
            compilerFlags: {
                language_in: 'ECMASCRIPT6',
                language_out: 'ECMASCRIPT5',
                compilation_level: 'WHITESPACE_ONLY',
                jscomp_off: 'globalThis',
            },
            fileName: 'editor.min.js',
            continueWithWarnings: true
        }))
        .pipe(gulp.dest('bin'));
});

/////////////////////////////////////////////////////////////////////////////
// commands
/////////////////////////////////////////////////////////////////////////////

// task plugins
task_plugin ( 'fire-dashboard' );
task_plugin ( 'fire-assets' );
task_plugin ( 'fire-console' );
task_plugin ( 'fire-game' );
task_plugin ( 'fire-hierarchy' );
task_plugin ( 'fire-inspector' );
task_plugin ( 'fire-scene' );
task_plugin ( 'main-window' );
task_plugin ( 'quick-assets' );

// tasks
gulp.task('copy', task_copy_deps );
gulp.task('dev', task_dev_deps );
gulp.task('default', task_min_deps );

// watch
gulp.task('watch', function() {
    for ( var i = 0; i < plugin_watchers.length; ++i ) {
        var watcher = plugin_watchers[i];
        gulp.watch( watcher.css.files, watcher.css.tasks ).on ( 'error', gutil.log );
        gulp.watch( watcher.styl.files, watcher.styl.tasks ).on ( 'error', gutil.log );
        gulp.watch( watcher.js.files, watcher.js.tasks ).on ( 'error', gutil.log );
        gulp.watch( watcher.html.files, watcher.html.tasks ).on ( 'error', gutil.log );
        gulp.watch( watcher.res.files, watcher.res.tasks ).on ( 'error', gutil.log );
    }
    gulp.watch(paths.src, ['src-dev']).on ( 'error', gutil.log );
});
gulp.task('watch-self', function() {
    for ( var i = 0; i < plugin_watchers.length; ++i ) {
        var watcher = plugin_watchers[i];
        gulp.watch( watcher.css.files, watcher.css.tasks ).on ( 'error', gutil.log );
        gulp.watch( watcher.styl.files, watcher.styl.tasks ).on ( 'error', gutil.log );
        gulp.watch( watcher.js.files, watcher.js.tasks ).on ( 'error', gutil.log );
        gulp.watch( watcher.html.files, watcher.html.tasks ).on ( 'error', gutil.log );
        gulp.watch( watcher.res.files, watcher.res.tasks ).on ( 'error', gutil.log );
    }
    gulp.watch(paths.src, ['src-dev']).on ( 'error', gutil.log );
});
