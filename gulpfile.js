var path = require('path');
var Q = require('q');
var es = require('event-stream');
var stylish = require('jshint-stylish');

var gulp = require('gulp');
var gutil = require('gulp-util');
var clean = require('gulp-clean');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var stylus = require('gulp-stylus');
var rename = require('gulp-rename');
var vulcanize = require('gulp-vulcanize');

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
    img: 'src/img/**/*',
    css:  'src/**/*.styl',
    html: 'src/**/*.html',
    js:   'src/**/*.js',
    third_party: '3rd/**/*',
    minify_ext: [],
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

gulp.task('cp-img', function() {
    return gulp.src(paths.img, {base: 'src/'})
    .pipe(gulp.dest('bin'))
    ;
});

gulp.task('cp-html', function() {
    return gulp.src(paths.html, {base: 'src/'})
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
gulp.task('css', function() {
    return gulp.src(paths.css, {base: 'src/'})
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

// js
gulp.task('js', function() {
    return gulp.src(paths.js, {base: 'src'})
    // .pipe(writeVersion('atlas-editor.js'))
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(uglify())
    .pipe(gulp.dest('bin'))
    ;
});

// js-no-uglify
gulp.task('js-dev', function() {
    return gulp.src(paths.js, {base: 'src'})
    // .pipe(writeVersion('atlas-editor.js'))
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
var build_html = function (strip) {
    return function () {
        return gulp.src('bin/app.html')
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
gulp.task('build-html', ['cp-html', 'css', 'js'], build_html(true));
gulp.task('build-html-dev', ['cp-html', 'css', 'js-dev'], build_html(false));
gulp.task('cp-all', ['cp-core', 'cp-engine', 'cp-editor-ui', 'cp-img', 'cp-html', 'cp-3rd'] );
gulp.task('dev', ['cp-all', 'build-html-dev' ] );
gulp.task('default', ['cp-all', 'ext-min', 'build-html' ] );

// watch
gulp.task('watch', function() {
    gulp.watch(paths.ext_core, ['cp-core']).on ( 'error', gutil.log );
    gulp.watch(paths.ext_engine, ['cp-engine']).on ( 'error', gutil.log );
    gulp.watch(paths.ext_editor_ui, ['cp-editor-ui']).on ( 'error', gutil.log );
    gulp.watch(paths.img, ['cp-img']).on ( 'error', gutil.log );
    gulp.watch(paths.css, ['css', 'build-html-dev']).on ( 'error', gutil.log );
    gulp.watch(paths.js, ['build-html-dev']).on ( 'error', gutil.log );
    gulp.watch(paths.html, ['build-html-dev']).on ( 'error', gutil.log );
});
