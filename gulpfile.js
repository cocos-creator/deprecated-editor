var gulp = require('gulp');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var stylus = require('gulp-stylus');
var rename = require('gulp-rename');
var vulcanize = require('gulp-vulcanize');
var del = require('del');

var path = require('path');
var es = require('event-stream');
var stylish = require('jshint-stylish');

var paths = {
    elements_css:  'elements/**/*.styl',
    elements_html: 'elements/**/*.html',
    elements_js:   'elements/**/*.js',
    src: [
        'src/engine-extends/misc.js',
        'src/engine-extends/component.js',
        'src/engine-extends/entity.js',
        'src/engine-extends/scene.js',
        'src/engine-extends/engine.js',
        'src/engine-extends/render-context.js',
        'src/engine-extends/ipc-sender.js',
        'src/engine-extends/ipc-receiver.js',

        'src/bootstrap.js',
        'src/ipc-listener.js',
        'src/selection.js',

        'src/pixi-grids.js',
        'src/svg-grids.js',
        'src/svg-gizmos.js',
        'src/menu.js',

        //'src/main-menu.js',
        'src/plugins/hierarchy.js',
        'src/gizmos/camera.js',
    ],
    img: [ 
        'img/**/*.png',
        'img/**/*.jpg'
    ],
};

// clean
gulp.task('clean', function() {
    del('bin/');
});

/////////////////////////////////////////////////////////////////////////////
// copy
/////////////////////////////////////////////////////////////////////////////

gulp.task('cp-img', function() {
    return gulp.src(paths.img, {base: './'})
    .pipe(gulp.dest('bin'))
    ;
});

gulp.task('cp-elements-html', function() {
    return gulp.src(paths.elements_html, {base: './'})
    .pipe(gulp.dest('bin'))
    ;
});

/////////////////////////////////////////////////////////////////////////////
// build
/////////////////////////////////////////////////////////////////////////////

// css
gulp.task('elements-css', function() {
    return gulp.src(paths.elements_css, {base: './'})
    .pipe(stylus({
        compress: true,
        include: 'src'
    }))
    .pipe(gulp.dest('bin'));
});

// write version
var pkg = require('./package.json');
var writeVersion = function (filename) {
    return es.map(function(file, callback) {
        if (path.basename(file.path) !== filename) {
            callback(null, file);
            return;
        }
        var date = new Date();
        var yy = date.getFullYear().toString().substring(2);
        var m = (date.getMonth()+1).toString();
        var mm = m.length === 2 ? m : '0' + m;
        var d = date.getDate().toString();
        var dd = d.length === 2 ? d : '0' + d;
        var build = yy + mm + dd;

        var data = { file: file, gulp_version: pkg.version, gulp_build: build };
        file.contents = new Buffer(gutil.template(file.contents, data));
        callback(null, file);
    });
};

// elements-js
gulp.task('elements-js', function() {
    return gulp.src(paths.elements_js, {base: './'})
    .pipe(jshint({
        multistr: true,
        smarttabs: false,
        loopfunc: true,
    }))
    .pipe(jshint.reporter(stylish))
    .pipe(uglify())
    .pipe(gulp.dest('bin'))
    ;
});

// elements-js-dev
gulp.task('elements-js-dev', function() {
    return gulp.src(paths.elements_js, {base: './'})
    .pipe(gulp.dest('bin'))
    ;
});

// element-html
var build_elements_html = function (strip) {
    return function () {
        return gulp.src('bin/elements/editor.html')
        .pipe(vulcanize({
            dest: 'bin/',
            inline: true,
            strip: strip,
        }));
    };
};
gulp.task('build-elements-html', [
    'cp-img', 'cp-elements-html', 'elements-css', 'elements-js'
], build_elements_html(true));
gulp.task('build-elements-html-dev', [
    'cp-img', 'cp-elements-html', 'elements-css', 'elements-js-dev'
], build_elements_html(false));

// js-hint
gulp.task('src-jshint', function() {
    return gulp.src(paths.src)
    .pipe(jshint({
        forin: false,
        multistr: true,
    }))
    .pipe(jshint.reporter(stylish))
    ;
});

// src-dev
gulp.task('src-dev', ['src-jshint'], function() {
    return gulp.src(paths.src)
    .pipe(concat('editor.dev.js'))
    .pipe(gulp.dest('bin'))
    ;
});

// src-min
gulp.task('src-min', ['src-dev'], function() {
    return gulp.src('bin/editor.dev.js')
    .pipe(rename('editor.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('bin'))
    ;
});

/////////////////////////////////////////////////////////////////////////////
// commands
/////////////////////////////////////////////////////////////////////////////

// short tasks
gulp.task('copy', ['cp-img', 'cp-elements-html'] );
gulp.task('dev', ['copy', 'build-elements-html-dev', 'src-dev' ] );
gulp.task('default', ['copy', 'build-elements-html', 'src-min' ] );

// watch
gulp.task('watch', function() {
    gulp.watch(paths.elements_css, ['elements-css', 'build-elements-html-dev']).on ( 'error', gutil.log );
    gulp.watch(paths.elements_js, ['build-elements-html-dev']).on ( 'error', gutil.log );
    gulp.watch(paths.elements_html, ['build-elements-html-dev']).on ( 'error', gutil.log );
    gulp.watch(paths.src, ['src-dev']).on ( 'error', gutil.log );
    gulp.watch(paths.img, ['cp-img']).on ( 'error', gutil.log );
});
gulp.task('watch-self', function() {
    gulp.watch(paths.elements_css, ['elements-css', 'build-elements-html-dev']).on ( 'error', gutil.log );
    gulp.watch(paths.elements_js, ['build-elements-html-dev']).on ( 'error', gutil.log );
    gulp.watch(paths.elements_html, ['build-elements-html-dev']).on ( 'error', gutil.log );
    gulp.watch(paths.src, ['src-dev']).on ( 'error', gutil.log );
    gulp.watch(paths.img, ['cp-img']).on ( 'error', gutil.log );
});
