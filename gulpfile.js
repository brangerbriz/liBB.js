/**
 *  This is the Gulpfile for BB.js. Gulp is a task runner/builder
 *  which is what BB.js uses to build the source code into the library
 *  and handle other housekeeping tasks.
 *
 *  There are three main tasks:
 *
 *  gulp            - This is the default task, which lints, builds and minifies the code
 *                    as well as builds the documentation. It then watches src/ for changes
 *                    and re-lints and builds when changes occur (however it does not 
 *                    regenerate the documentation each time a file is changed).
 *  
 *  gulp build      - Lint and build the code.
 *
 *  gulp docs       - Build the documentation.
 *
 *  gulp docs-watch - Builds the documentation each time a file in src/ is changed.
 *
 *  gulp lint       - Lint the code.
 *
 *  gulp watch      - Lints and builds the code each time a file in src/ is changed.
 *
 *  gulp serve      - serves /docs, /build/, and /examples at port 3000
 *
 * (Note: This comment block is adapted from P5.js Gruntfile)
 */

var gulp = require('gulp');

var jshint            = require('gulp-jshint');
var jshintStylish     = require('jshint-stylish');
var uglify            = require('gulp-uglify');
var rename            = require('gulp-rename');
var yuidoc            = require('gulp-yuidoc-relative');
var requireJSOptimize = require('gulp-requirejs-optimize');
var express           = require('express');
var path              = require('path');
var handlebars        = require('handlebars');
var fs                = require('fs');

var packageName = 'BB';
var srcDir      = 'src';
var buildDir    = 'build';
var docsDir     = 'docs';
var mainFile    = 'main.js';
var serverPort  = 3002;

var app = express();
var server = require('http').Server(app);

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
        .pipe(yuidoc.parser())
        .pipe(yuidoc.reporter())
        .pipe(yuidoc.generator({
            themedir: './docs-theme'
        }))
        .pipe(gulp.dest(docsDir))
});

gulp.task('scripts', function () {
    return gulp.src(srcDir + '/' + mainFile)
        .pipe(requireJSOptimize(requireJSOptimizeConfig))
        .pipe(gulp.dest(buildDir))
        .pipe(rename(packageName + '.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(buildDir));
});

gulp.task('watch', function() {
    gulp.watch(srcDir + '/*.js', ['lint', 'scripts']);
});

gulp.task('docs-watch', function() {
    gulp.watch(srcDir + '/*.js', ['docs']);
});

gulp.task('serve', function() {

    var data = {}

    data.basic    = templateObjFromDirname(__dirname + '/examples/basic');
    data.advanced = templateObjFromDirname(__dirname + '/examples/advanced');

    // cache handlebars rendering of examples/index.html
    var exampleTemplate = fs.readFileSync(__dirname + '/examples/index.html', { encoding: 'utf8'});
    var exampleHTML = handlebars.compile(exampleTemplate)(data);

    app.use('/', express.static(path.resolve(__dirname + '/docs')));
    app.use('/docs', express.static(path.resolve(__dirname + '/docs')));
    app.use('/build', express.static(path.resolve(__dirname + '/build')));
    app.use('/misc', express.static(path.resolve(__dirname + '/misc')));
    app.use('/examples', function(req, res, next){

        console.log(req.path);
        if (req.path == '/' ||
            req.path == '/index.html') {
            res.send(exampleHTML);
        } else {
            next();
        }
    });
    app.use('/examples', express.static(path.resolve(__dirname + '/examples')));
    app.use('/addons', express.static(path.resolve(__dirname + '/addons')));
    app.use('/src', express.static(path.resolve(__dirname + '/src')));
    server.listen(serverPort, function() {
        console.log('[server] Server listening on port', serverPort);
    });
});

gulp.task('build', ['lint', 'scripts', 'docs']);

gulp.task('default', ['build', 'watch']);

function templateObjFromDirname(dirPath) {

    var dirs = [];

    fs.readdirSync(dirPath).forEach(function(name) {

        var filePath = path.join(dirPath, name);
        var stat = fs.statSync(filePath);
        var origName = name;

        if (stat.isDirectory() && name !== 'template') {

            if (name.indexOf('-') > -1) {
                name = name.split('-');
                for (var i = 0; i < name.length; i++) {
                    name[i] = name[i].charAt(0).toUpperCase() + name[i].slice(1);
                }                      
                name = name.join(' ')
            } else {
                name = name.charAt(0).toUpperCase() + name.slice(1);
            }

            dirs.push({
                name: name,
                path: path.basename(dirPath) + '/' + origName,
                basename: origName
            });
        }
    });

    return dirs;
}
