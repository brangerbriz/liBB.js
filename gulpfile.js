/**
 *  This is the Gulpfile for BBMod.js. Gulp is a task runner/builder
 *  which is what BBMod.js uses to build the source code into the library
 *  and handle other housekeeping tasks.
 *
 *  There are three main tasks:
 *
 *  gulp        - This is the default task, which lints, builds and minifies the code
 *                as well as builds the documentation. It then watches src/ for changes
 *                and re-lints and builds when changes occur (however it does not 
 *                regenerate the documentation each time a file is changed).
 *  
 *  grunt build - Lint and build the code.
 *
 *  grunt docs  - Build the documentation.
 *
 *  grunt lint  - Lint the code.
 *
 *  grunt watch - Lints and builds the code each time a file in src/ is changed.
 *
 * (Note: This comment block is adapted from P5.js Gruntfile)
 */

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

gulp.task('watch', function() {
    gulp.watch(srcDir + '/*.js', ['lint', 'scripts']);
});

gulp.task('build', ['lint', 'scripts', 'docs']);

gulp.task('default', ['build', 'watch']);
