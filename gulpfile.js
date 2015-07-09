var gulp = require('gulp');

var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var yuidoc = require('gulp-yuidoc');

var packageName = 'BBMod';
var srcDir      = 'src';
var buildDir    = 'build';
var docsDir     = 'docs';

// Lint Task
gulp.task('lint', function() {
    return gulp.src(srcDir + '/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('docs', function() {
    return gulp.src(srcDir + '/*.js')
        .pipe(yuidoc())
        .pipe(gulp.dest('docs'))
});

// Watch Files For Changes
gulp.task('watch', function(event) {
    gulp.watch(srcDir + '/*.js', ['lint']);
});

// Default Task
gulp.task('default', ['lint', 'docs', 'watch']);
