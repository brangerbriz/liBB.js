# liBB

#### A JavaScript library/framework for creating interactive && generative apps + installations in/out of the browser
visit [libb.brangerbriz.com](http://libb.brangerbriz.com/) for examples and documentation or see the [www](https://github.com/brangerbriz/liBB.js/tree/master/www) directory.

----------

## dev dependencies
run `npm install` in the root directory to download the dev dependencies

* **jshint** for linting the source code
* **jshint-stylish** for prettier linting
* **babel-cli** for transpiling
* **babel-preset-es2015** transpiling preset from es2015
* **browserify** for compiling the build
* **uglify-js** for minifying the build
* **yuidocjs** for auto-generated docs
* **nodemon** for watch scripts

## dev notes
to build the library you can run `npm run build`, which will create two files ( in the build folder ) **BB.min.js** and **BB.js**. Running the build scripts also automatically runs `npm run lint` which will lint your code for errors, `npm run transpile` which will generate transpiled version of all the source code in **src/transpiled**, `npm run compile` which compiles the transpiled versions into **build/BB.js**, `npm run minify` which minifies the compiled library into **build/BB.min.js** and  `npm run docs` which builds the documentation page in **www/docs**.

to build an ***un-***minified and ***un***-transpiled debug version of the library with source maps run `npm run build:debug`, this will produce **BB.debug.js** into the build folder as well as the www folder for use with examples and tests.

There are also a couple of watch scripts which watch for changes in the **src/** directory: `npm run watch` which will run the entire build process described above, or `npm run watch:debug` which will only run the build:debug script.
