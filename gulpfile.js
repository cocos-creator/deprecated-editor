var gulp = require('gulp');
var gutil = require('gulp-util');
var clean = require('gulp-clean');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var stylus = require('gulp-stylus');
var rename = require('gulp-rename');
var vulcanize = require('gulp-vulcanize');

var path = require('path');
var Q = require('q');
var es = require('event-stream');
var stylish = require('jshint-stylish');

var paths = {
    ext_core: [ 
        '../core/bin/**/*.js',
    ],
    ext_engine: [ 
        '../engine/bin/**/*.js',
    ],
    ext_editor_ui: [ 
        '../editor-ui/bin/editor-ui.css',
        '../editor-ui/bin/editor-ui.html',
        '../editor-ui/bin/img/**/*.png',
    ],
    third_party: '3rd/**/*',
    minify_ext: [],
    elements_img:  'src/elements/img/**/*.png',
    elements_css:  'src/elements/**/*.styl',
    elements_html: 'src/elements/**/*.html',
    elements_js:   'src/elements/**/*.js',
    editor_js: [
        'src/core/utils.js',
        'src/core/asset-db.js',
        'src/core/editor-app.js',
    ],
};

// clean
gulp.task('clean', function() {
    return gulp.src('bin/', {read: false})
    .pipe(clean());
});

/////////////////////////////////////////////////////////////////////////////
// copy
/////////////////////////////////////////////////////////////////////////////

gulp.task('cp-core', function() {
    return gulp.src(paths.ext_core)
    .pipe(gulp.dest('ext/fire-core'))
    ;
});

gulp.task('cp-engine', function() {
    return gulp.src(paths.ext_engine)
    .pipe(gulp.dest('ext/fire-engine'))
    ;
});

gulp.task('cp-editor-ui', function() {
    var deferred = Q.defer();

    // deferred 1 second to prevent copy editor-ui.html while it is in the building phase
    setTimeout(function () {
        gulp.src(paths.ext_editor_ui, {base: '../editor-ui/bin/'})
        .pipe(gulp.dest('ext/fire-editor-ui'))
        ;
        deferred.resolve();
    }, 1000);

    return deferred.promise;
});

gulp.task('cp-elements-img', function() {
    return gulp.src(paths.elements_img, {base: 'src/'})
    .pipe(gulp.dest('bin'))
    ;
});

gulp.task('cp-elements-html', function() {
    return gulp.src(paths.elements_html, {base: 'src/'})
    .pipe(gulp.dest('bin'))
    ;
});

gulp.task('cp-3rd', function() {
    return gulp.src(paths.third_party, {base: '3rd/'})
    .pipe(gulp.dest('ext'))
    ;
});

/////////////////////////////////////////////////////////////////////////////
// build
/////////////////////////////////////////////////////////////////////////////

// css
gulp.task('elements-css', function() {
    return gulp.src(paths.elements_css, {base: 'src/'})
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
        var mm = m.length == 2 ? m : '0' + m;
        var d = date.getDate().toString();
        var dd = d.length == 2 ? d : '0' + d;
        var build = yy + mm + dd;

        var data = { file: file, gulp_version: pkg.version, gulp_build: build };
        file.contents = new Buffer(gutil.template(file.contents, data));
        callback(null, file);
    });
};

// elements-js
gulp.task('elements-js', function() {
    return gulp.src(paths.elements_js, {base: 'src'})
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(uglify())
    .pipe(gulp.dest('bin'))
    ;
});

// elements-js-dev
gulp.task('elements-js-dev', function() {
    return gulp.src(paths.elements_js, {base: 'src'})
    .pipe(gulp.dest('bin'))
    ;
});

// editor-js-dev
gulp.task('editor-js-dev', function() {
    return gulp.src(paths.editor_js)
    // .pipe(writeVersion('editor-app.js'))
    .pipe(concat('editor.dev.js'))
    .pipe(gulp.dest('bin'))
    ;
});

// editor-js-min
gulp.task('editor-js-min', ['editor-js-dev'], function() {
    return gulp.src('bin/editor.dev.js')
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(rename('editor.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('bin'))
    ;
});

// minify 3rd libraries from their source
gulp.task('ext-min', ['cp-3rd'], function() {
    // return gulp.src(paths.minify_ext)
    // .pipe(uglify())
    // .pipe(rename(function (path) {
    //     //path
    //     path.extname = ".min" + path.extname;
    // }))
    // .pipe(gulp.dest('ext'));
});

// html
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

/////////////////////////////////////////////////////////////////////////////
// commands
/////////////////////////////////////////////////////////////////////////////

// short tasks
gulp.task('build-elements-html', ['cp-elements-html', 'elements-css', 'elements-js'], build_elements_html(true));
gulp.task('build-elements-html-dev', ['cp-elements-html', 'elements-css', 'elements-js-dev'], build_elements_html(false));
gulp.task('copy', ['cp-elements-img', 'cp-elements-html', 'cp-3rd'] );
gulp.task('dev', ['copy', 'build-elements-html-dev', 'editor-js-dev' ] );
gulp.task('default', ['copy', 'ext-min', 'build-elements-html', 'editor-js-min' ] );

// watch
gulp.task('watch', function() {
    gulp.watch(paths.ext_core, ['cp-core']).on ( 'error', gutil.log );
    gulp.watch(paths.ext_engine, ['cp-engine']).on ( 'error', gutil.log );
    gulp.watch(paths.ext_editor_ui, ['cp-editor-ui']).on ( 'error', gutil.log );
    gulp.watch(paths.elements_img, ['cp-elements-img']).on ( 'error', gutil.log );
    gulp.watch(paths.elements_css, ['elements-css', 'build-elements-html-dev']).on ( 'error', gutil.log );
    gulp.watch(paths.elements_js, ['build-elements-html-dev']).on ( 'error', gutil.log );
    gulp.watch(paths.elements_html, ['build-elements-html-dev']).on ( 'error', gutil.log );
    gulp.watch(paths.editor_js, ['editor-js-dev']).on ( 'error', gutil.log );
});
