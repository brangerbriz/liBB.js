var gulp = require('gulp');

var jshint            = require('gulp-jshint');
var jshintStylish     = require('jshint-stylish');
var uglify            = require('gulp-uglify');
var rename            = require('gulp-rename');
var yuidoc            = require('gulp-yuidoc');
var requireJSOptimize = require('gulp-requirejs-optimize');

var packageName = 'BBMod';
var srcDir      = 'src';
var buildDir    = 'build';
var docsDir     = 'docs';
var mainFile    = 'main.js';

var requireJSOptimizeConfig = {
    baseUrl: "./src",
    name: "../node_modules/almond/almond",
    include: ["main"],
    out: packageName + ".js",
    optimize: "none",
    wrap: {
        "startFile": "src/start.frag.js",
        "endFile": "src/end.frag.js"
    }
};

// Lint Task
gulp.task('lint', function() {
    return gulp.src(srcDir + '/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter(jshintStylish));
});

gulp.task('docs', function() {
    return gulp.src(srcDir + '/*.js')
        .pipe(yuidoc())
        .pipe(gulp.dest(docsDir))
});

gulp.task('scripts', function () {
    return gulp.src(srcDir + mainFile)
        .pipe(requireJSOptimize(requireJSOptimizeConfig))
        .pipe(gulp.dest(buildDir))
        .pipe(rename('BBMod.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(buildDir));
});

// Watch Files For Changes
gulp.task('watch', function(event) {
    gulp.watch(srcDir + '/*.js', ['lint', 'scripts']);
});

// Default Task
gulp.task('default', ['lint', 'scripts', 'docs', 'watch']);
