(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        //Allow using this built library as an AMD module 
        //in another project. That other project will only 
        //see this AMD call, not the internal modules in 
        //the closure below. 
        define([], factory);
    } else {
        //Browser globals case. Just assign the 
        //result to a property on the global. 
        root.BB = factory();
    }
}(this, function () {
    //almond, and your modules will be inlined here
/**
 * @license almond 0.3.1 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                //Lop off the last part of baseParts, so that . matches the
                //"directory" and not name of the baseName's module. For instance,
                //baseName of "one/two/three", maps to "one/two/three.js", but we
                //want the directory, "one/two" for this normalization.
                name = baseParts.slice(0, baseParts.length - 1).concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else if(name === "BB.LeapMotion"){
                    // test (elseif) to not do anything when name is BB.LeapMotion 
                    // this is to prevent falling into Error when its BB.LeapMotion
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {
        if (typeof name !== 'string') {
            throw new Error('See almond README: incorrect module build, no module name');
        }

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("../node_modules/almond/almond", function(){});

define('BB',[],function(){

    'use strict';
    
    function BB() {
        
    }

    return BB;
});
// This class is a direct copy of the Three.js Vector2 class
// from March 14, 2015 @ 1f97cfaa5d931ae34229ff8fa9c632e99a3b8249

/**
 * A vector in 2 dimensional space. A direct copy of Three.js's Vector2 class.
 * @module BB.Vector2
 * @author mrdoob / http://mrdoob.com/
 * @author philogb / http://blog.thejit.org/
 * @author egraether / http://egraether.com/
 * @author zz85 / http://www.lab4games.net/zz85/blog
 */

/**
 * A vector in 2 dimensional space. A direct copy of Three.js's THREE.Vector2 class.
 * @class BB.Vector2
 * @constructor
 * @param {Number} x Represents the x value of the vector
 * @param {Number} y Represents the y value of the vector
 */

/**
 * This vector's x value
 * @property x
 */

/**
 * This vector's y value
 * @property y
 */

/**
 * Sets value of this vector.
 * @method set
 * @chainable
 * @param {Number} x Represents the x value of the vector
 * @param {Number} y Represents the y value of the vector
 * @return {BB.Vector2} this vector.
 */

/**
 * Replace this vector's x value with x.
 * @method setX
 * @chainable
 * @param {Number} x Represents the x value of the vector.
 * @return {BB.Vector2} this vector.
 */

/**
 * Replace this vector's y value with y.
 * @method setY
 * @chainable
 * @param {Number} y Represents the y value of the vector.
 * @return {BB.Vector2} this vector.
 */

/**
 * Sets this vector's x and y values by index (0 and 1 respectively).
 * If index equals 0 method replaces this.x with value. 
 * If index equals 1 method replaces this.y with value.
 * @method setComponent
 * @param {Number} index 0 or 1
 * @param {Number} value Value to be assigned to corresponding index
 */

/**
 * Get this vector's x and y values by index (0 and 1 respectively).
 * If index equals 0 method returns vector's x value.
 * If index equals 1 method returns vector's y value.
 * @method getComponent
 * @param  {[type]} index 0 or 1
 * @return {Number} Vector's x or y dependent on index
 */

/**
 * Copies value of v to this vector. Note: Does not return a copy of this vector.
 * @method copy
 * @chainable
 * @param  {BB.Vector2} v
 * @return {BB.Vector2} This vector.
 */

/**
 * Adds vector v to this vector.
 * @method add
 * @chainable
 * @param {BB.Vector2} v The vector to add to this vector
 * @return {BB.Vector2} this vector.
 */

/**
 * Add the scalar value s to this vector's x and y values.
 * @method addScalar
 * @chainable
 * @return {BB.Vector2} this vector.
 * @param {Number} s Scalar to add vector with.
 */

/**
 * Sets this vector to a + b.
 * @method addVectors
 * @chainable
 * @param {BB.Vector2} a The first vector.
 * @param {BB.Vector2} b The second vector.
 * @return {BB.Vector2} This vector.
 */

/**
 * Subtracts vector v from this vector.
 * @method sub
 * @chainable
 * @param {BB.Vector2} v The vector to subtract from this vector
 * @return {BB.Vector2} this vector.
 */

/**
 * Subtracts the scalar value s from this vector's x and y values.
 * @method subScalar
 * @chainable
 * @return {BB.Vector2} this vector.
 * @param {Number} s Scalar to subract vector by.
 */

/**
 * Sets this vector to a - b.
 * @method subVectors
 * @chainable
 * @param {BB.Vector2} a The first vector.
 * @param {BB.Vector2} b The second vector.
 * @return {BB.Vector2} This vector.
 */

/**
 * Multiplies this vector by v.
 * @method multiply
 * @chainable
 * @param {BB.Vector2} v The vector to subtract from this vector
 * @return {BB.Vector2} this vector.
 */

/**
 * Multiplies this vector by scalar s.
 * @method mutliplyScalar
 * @param  {Number} s The scalar to multiply this vector by.
 * @return {BB.Vector2} This vector.
 */

/**
 * Divides this vector by v.
 * @method divide
 * @chainable
 * @param {BB.Vector2} v The vector to subtract from this vector
 * @return {BB.Vector2} this vector.
 */

/**
 * Divides this vector by scalar s.
 * @method divideScalar
 * @param  {Number} s The scalar to divide this vector by.
 * @return {BB.Vector2} This vector.
 */

/**
 * If this vector's x or y value is less than v's x or y value, replace that value with the corresponding min value.
 * @method min
 * @chainable
 * @param  {BB.Vector2} v The vector to check and assign min values from
 * @return {BB.Vector2}   This vector.
 */

/**
 * If this vector's x or y value is less than v's x or y value, replace that value with the corresponding min value.
 * @method max
 * @chainable
 * @param  {BB.Vector2} v The vector to check and assign max values from
 * @return {BB.Vector2}   This vector.
 */

/**
 * If this vector's x or y value is greater than the max vector's x or y
 * value, it is replaced by the corresponding value. If this vector's x
 * or y value is less than the min vector's x or y value, it is replace
 * by the corresponding value. Note: This function assumes min < max, if
 * this assumption isn't true it will not operate correctly
 * @method clamp
 * @chainable
 * @param  {BB.Vector2} min The vector containing the min x and y values in the desired range.
 * @param  {BB.Vector2} max The vector containing the max x and y values in the desired range.
 * @return {BB.Vector2}     This vector.
 */

/**
 * If this vector's x or y values are greater than the max value, they
 * are replaced by the max value. If this vector's x or y values are
 * less than the min value, they are replace by the min value.
 * @method clampScalar
 * @chainable
 * @param  {Number} min the minimum value the components will be clamped to.
 * @param  {Number} max the minimum value the components will be clamped to.
 * @return {BB.Vector2}     This vector.
 */

/**
 * The components of the vector are rounded downwards (towards negative infinity) to an integer value.
 * @method floor
 * @chainable
 * @return {BB.Vector2} This vector.
 */

/**
 * The components of the vector are rounded upwards (towards positive infinity) to an integer value.
 * @method ceil
 * @chainable
 * @return {BB.Vector2} This vector.
 */

/**
 * The components of the vector are rounded towards the nearest integer value.
 * @method round
 * @chainable
 * @return {BB.Vector2} This vector.
 */

/**
 * The components of the vector are rounded towards zero (up if negative, down if positive) to an integer value.
 * @method roundToZero
 * @chainable
 * @return {BB.Vector2} This vector.
 */

 /**
 * Inverts this vector.
 * @method negate
 * @chainable
 * @return {BB.Vector2} this vector.
 */

/**
 * Computes dot product of this vector and v.
 * @method dot
 * @param  {BB.Vector2} v
 * @return {Number}   The dot product of this vector and v.
 */

/**
 * Computes squared length of this vector.
 * @method lengthSq
 * @return {Number}  The squared length of this vector.
 */

/**
 * Computes the length of this vector.
 * @method length
 * @return {Number}   The length of this vector.
 */

/**
 * Normalizes this vector.
 * @method normalize
 * @chainable
 * @return {BB.Vector2} This vector.
 */

/**
 * Computes distance of this vector to v.
 * @method distanceTo
 * @param  {BB.Vector2} v 
 * @return {Number}   Distance from this vector to v.
 */

/**
 * Computes squared distance of this vector to v.
 * @method distanceToSquared
 * @param  {BB.Vector2} v 
 * @return {Number}   Squared distance from this vector to v.
 */

/**
 * Normalizes this vector and multiplies it by l.
 * @method setLength
 * @chainable
 * @param {Number} l The new length of the vector.
 * @return {BB.Vector2} This vector.
 */

/**
 * Linear interpolation between this vector and v, where alpha is the
 * percent along the line.
 * @method lerp
 * @chainable
 * @param  {BB.Vector2} v  The vector to lerp this vector with.
 * @param  {Number} alpha Percentage along the line (0 - 1).
 * @return {BB.Vector2}  This vector.
 */

/**
 * Sets this vector to be the vector linearly interpolated between v1
 * and v2 with alpha factor.
 * @method lerpVectors
 * @chainable
 * @param  {BB.Vector2} v1  The first vector.
 * @param  {BB.Vector2} v2  The second vector.
 * @param  {Number} alpha Percentage along the line (0 - 1).
 * @return {BB.Vector2}  This vector.
 */

/**
 * Checks for strict equality of this vector and v.
 * @method equals
 * @param  {BB.Vector2} v The vector to check equality against.
 * @return {Boolean}
 */

/**
 * Sets this vector's x value to be array[0] and y value to be array[1].
 * @method fromArray
 * @chainable
 * @param  {[type]} array  Array of length 2.
 * @return {BB.Vector2}  This vector.
 */

/**
 * Returns an array [x, y].
 * @method toArray
 * @param  {Array} [array] Optional array that will be filled if provided.
 * @return {Array}  Array [x, y].
 */

/**
 * Clones this vector.
 * @method clone
 * @return {BB.Vector2} A new vector with this vectors x and y values.
 */
    
// note: fromAttribute(...) is not documented because the Three.js website
// provides no documentation for it and it doesn't really make sense without
// our library.

define('BB.Vector2',['./BB'],
function(  BB) { 

    'use strict';

    BB.Vector2 = function ( x, y ) {

        this.x = x || 0;
        this.y = y || 0;

    };

    BB.Vector2.prototype = {

        constructor: BB.Vector2,

        set: function ( x, y ) {

            this.x = x;
            this.y = y;

            return this;

        },

        setX: function ( x ) {

            this.x = x;

            return this;

        },

        setY: function ( y ) {

            this.y = y;

            return this;

        },

        setComponent: function ( index, value ) {

            switch ( index ) {

                case 0: this.x = value; break;
                case 1: this.y = value; break;
                default: throw new Error( 'BB.Vector2.setComponent: index is out of range: ' + index );

            }

        },

        getComponent: function ( index ) {

            switch ( index ) {

                case 0: return this.x;
                case 1: return this.y;
                default: throw new Error( 'BB.Vector2.getComponent: index is out of range: ' + index );

            }

        },

        copy: function ( v ) {

            this.x = v.x;
            this.y = v.y;

            return this;

        },

        add: function ( v, w ) {

            if ( w !== undefined ) {
                return this.addVectors( v, w );

            }

            this.x += v.x;
            this.y += v.y;

            return this;

        },

        addScalar: function ( s ) {

            this.x += s;
            this.y += s;

            return this;

        },

        addVectors: function ( a, b ) {

            this.x = a.x + b.x;
            this.y = a.y + b.y;

            return this;

        },

        sub: function ( v, w ) {

            if ( w !== undefined ) {

                return this.subVectors( v, w );

            }

            this.x -= v.x;
            this.y -= v.y;

            return this;

        },

        subScalar: function ( s ) {

            this.x -= s;
            this.y -= s;

            return this;

        },

        subVectors: function ( a, b ) {

            this.x = a.x - b.x;
            this.y = a.y - b.y;

            return this;

        },

        multiply: function ( v ) {

            this.x *= v.x;
            this.y *= v.y;

            return this;

        },

        multiplyScalar: function ( s ) {

            this.x *= s;
            this.y *= s;

            return this;

        },

        divide: function ( v ) {

            this.x /= v.x;
            this.y /= v.y;

            return this;

        },

        divideScalar: function ( scalar ) {

            if ( scalar !== 0 ) {

                var invScalar = 1 / scalar;

                this.x *= invScalar;
                this.y *= invScalar;

            } else {

                this.x = 0;
                this.y = 0;

            }

            return this;

        },

        min: function ( v ) {

            if ( this.x > v.x ) {

                this.x = v.x;

            }

            if ( this.y > v.y ) {

                this.y = v.y;

            }

            return this;

        },

        max: function ( v ) {

            if ( this.x < v.x ) {

                this.x = v.x;

            }

            if ( this.y < v.y ) {

                this.y = v.y;

            }

            return this;

        },

        clamp: function ( min, max ) {

            // This function assumes min < max, if this assumption isn't true it will not operate correctly

            if ( this.x < min.x ) {

                this.x = min.x;

            } else if ( this.x > max.x ) {

                this.x = max.x;

            }

            if ( this.y < min.y ) {

                this.y = min.y;

            } else if ( this.y > max.y ) {

                this.y = max.y;

            }

            return this;
        },

        clampScalar: ( function () {

            var min, max;

            return function ( minVal, maxVal ) {

                if ( min === undefined ) {

                    min = new BB.Vector2();
                    max = new BB.Vector2();

                }

                min.set( minVal, minVal );
                max.set( maxVal, maxVal );

                return this.clamp( min, max );

            };

        } )(),

       
        floor: function () {

            this.x = Math.floor( this.x );
            this.y = Math.floor( this.y );

            return this;

        },

        ceil: function () {

            this.x = Math.ceil( this.x );
            this.y = Math.ceil( this.y );

            return this;

        },

        round: function () {

            this.x = Math.round( this.x );
            this.y = Math.round( this.y );

            return this;

        },

        roundToZero: function () {

            this.x = ( this.x < 0 ) ? Math.ceil( this.x ) : Math.floor( this.x );
            this.y = ( this.y < 0 ) ? Math.ceil( this.y ) : Math.floor( this.y );

            return this;

        },

        negate: function () {

            this.x = - this.x;
            this.y = - this.y;

            return this;

        },

        dot: function ( v ) {

            return this.x * v.x + this.y * v.y;

        },

        lengthSq: function () {

            return this.x * this.x + this.y * this.y;

        },

        length: function () {

            return Math.sqrt( this.x * this.x + this.y * this.y );

        },

        normalize: function () {

            return this.divideScalar( this.length() );

        },

        distanceTo: function ( v ) {

            return Math.sqrt( this.distanceToSquared( v ) );

        },

        distanceToSquared: function ( v ) {

            var dx = this.x - v.x, dy = this.y - v.y;
            return dx * dx + dy * dy;

        },

        setLength: function ( l ) {

            var oldLength = this.length();

            if ( oldLength !== 0 && l !== oldLength ) {

                this.multiplyScalar( l / oldLength );
            }

            return this;

        },

        lerp: function ( v, alpha ) {

            this.x += ( v.x - this.x ) * alpha;
            this.y += ( v.y - this.y ) * alpha;

            return this;

        },

        lerpVectors: function ( v1, v2, alpha ) {

            this.subVectors( v2, v1 ).multiplyScalar( alpha ).add( v1 );

            return this;

        },

        equals: function ( v ) {

            return ( ( v.x === this.x ) && ( v.y === this.y ) );

        },

        fromArray: function ( array, offset ) {

            if ( offset === undefined ) offset = 0;

            this.x = array[ offset ];
            this.y = array[ offset + 1 ];

            return this;

        },

        toArray: function ( array, offset ) {

            if ( array === undefined ) array = [];
            if ( offset === undefined ) offset = 0;

            array[ offset ] = this.x;
            array[ offset + 1 ] = this.y;

            return array;

        },

        fromAttribute: function ( attribute, index, offset ) {

            if ( offset === undefined ) offset = 0;

            index = index * attribute.itemSize + offset;

            this.x = attribute.array[ index ];
            this.y = attribute.array[ index + 1 ];

            return this;

        },

        clone: function () {

            return new BB.Vector2( this.x, this.y );

        }
    };

    return BB.Vector2;
});
/**
 * A static utilitites class for all things math.
 * @module BB.MathUtils
 * @class BB.MathUtils
 * @static
 */
define('BB.MathUtils',['./BB', './BB.Vector2'], 
function(  BB,        Vector2){

    'use strict';

    BB.Vector2 = Vector2;

    BB.MathUtils = function() {};

    /**
     * Scales value using min and max. This is the inverse of BB.MathUtils.lerp(...).
     * @method norm
     * @static
     * @param  {Number} value The value to be scaled.
     * @param  {Number} min
     * @param  {Number} max
     * @return {Number}       Returns the scaled value.
     */
    BB.MathUtils.norm = function(value, min, max) {

        if (typeof value !== "number") {
            throw new Error("BB.MathUtils.norm: value is not a number type");
        } else if (typeof min !== "number") {
            throw new Error("BB.MathUtils.norm: min is not a number type");
        } else if (typeof max !== "number") {
            throw new Error("BB.MathUtils.norm: max is not a number type");
        }

        return (value - min) / (max - min);
    };

     /**
     * Linear interpolate norm from min and max. This is the inverse of BB.MathUtils.norm(...).
     * @method lerp
     * @static
     * @param  {Number} value
     * @param  {Number} min
     * @param  {Number} max
     * @return {Number}       Returns the lerped norm.
     */
    BB.MathUtils.lerp = function(norm, min, max) {

        if (typeof norm !== "number") {
            throw new Error("BB.MathUtils.lerp: norm is not a number type");
        } else if (typeof min !== "number") {
            throw new Error("BB.MathUtils.lerp: min is not a number type");
        } else if (typeof max !== "number") {
            throw new Error("BB.MathUtils.lerp: max is not a number type");
        }

        return (max - min) * norm + min;
    };
    /**
     * Constrains value using min and max as the upper and lower bounds.
     * @method clamp
     * @static
     * @param  {Number} value The value to be clamped.
     * @param  {Number} min   The lower limit to clamp value by.
     * @param  {Number} max   The upper limit to clamp value by.
     * @return {Number}       The clamped value.
     */
    BB.MathUtils.clamp = function(value, min, max) {

        if (typeof value !== "number") {
            throw new Error("BB.MathUtils.clamp: norm is not a number type");
        } else if (typeof min !== "number") {
            throw new Error("BB.MathUtils.clamp: min is not a number type");
        } else if (typeof max !== "number") {
            throw new Error("BB.MathUtils.clamp: max is not a number type");
        }

        return Math.max(min, Math.min(max, value));
    };
    /**
     * Maps (scales) value between sourceMin and sourceMax to destMin and destMax.
     * @method map
     * @static
     * @param  {Number} value The value to be mapped.
     * @param  {Number} sourceMin 
     * @param  {Number} sourceMax
     * @param  {Number} destMin 
     * @param  {Number} destMax
     * @return {Number} Returns the mapped value.
     */
    BB.MathUtils.map = function(value, sourceMin, sourceMax, destMin, destMax) {

        if (typeof value !== "number") {
            throw new Error("BB.MathUtils.map: value is not a number type");
        } else if (typeof sourceMin !== "number") {
            throw new Error("BB.MathUtils.map: sourceMin is not a number type");
        } else if (typeof sourceMax !== "number") {
            throw new Error("BB.MathUtils.map: sourceMax is not a number type");
        } else if (typeof destMin !== "number") {
            throw new Error("BB.MathUtils.map: destMin is not a number type");
        } else if (typeof destMax !== "number") {
            throw new Error("BB.MathUtils.map: destMax is not a number type");
        }

        return this.lerp(this.norm(value, sourceMin, sourceMax), destMin, destMax);
    };
    /**
     * Get the distance between two points.
     * @method  dist
     * @static
     * @param  {Number} p1x The x value of the first point.
     * @param  {Number} p1y The y value of the first point.
     * @param  {Number} p2x The x value of the second point.
     * @param  {Number} p2y The y value of the second point.
     * @return {Number} Returns the distance between (p1x, p1y) and (p2x, p2y).
     */
    BB.MathUtils.dist = function(p1x, p1y, p2x, p2y){
        
        if (typeof p1x !== "number") {
            throw new Error("BB.MathUtils.dist: p1x is not a number type");
        } else if (typeof p1y !== "number") {
            throw new Error("BB.MathUtils.dist: p1y is not a number type");
        } else if (typeof p2x !== "number") {
            throw new Error("BB.MathUtils.dist: p2x is not a number type");
        } else if (typeof p2y !== "number") {
            throw new Error("BB.MathUtils.dist: p2y is not a number type");
        }

        return Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2));
    };
    /**
     * Get the angle between two points in radians. For degrees process this
     * return value through BB.MathUtils.radToDegree(...).
     * @method angleBtwn
     * @static
     * @param  {Number} p1x The x value of the first point.
     * @param  {Number} p1y The y value of the first point.
     * @param  {Number} p2x The x value of the second point.
     * @param  {Number} p2y The y value of the second point.
     * @return {Number} Returns the angle between (p1x, p1y) and (p2x, p2y) in
     * radians.
     */
    BB.MathUtils.angleBtw = function(p1x, p1y, p2x, p2y){

        if (typeof p1x !== "number") {
            throw new Error("BB.MathUtils.angleBtwn: p1x is not a number type");
        } else if (typeof p1y !== "number") {
            throw new Error("BB.MathUtils.angleBtwn: p1y is not a number type");
        } else if (typeof p2x !== "number") {
            throw new Error("BB.MathUtils.angleBtwn: p2x is not a number type");
        } else if (typeof p2y !== "number") {
            throw new Error("BB.MathUtils.angleBtwn: p2y is not a number type");
        }

        return Math.atan2( p2x - p1x, p2y - p1y );
    };
    /**
     * Translate radians into degrees.
     * @method  radToDeg
     * @static
     * @param  {[type]} radians
     * @return {[type]}         Returns radians in degrees.
     */
    BB.MathUtils.radToDeg = function(radians) {

        if (typeof radians !== "number") {
            throw new Error("BB.MathUtils.radToDegree: radians is not a number type");
        }

        return radians * (180.0 / Math.PI);
    };
    /**
     * Translate degrees into radians.
     * @method  degToRad
     * @static
     * @param  {[type]} degrees
     * @return {[type]}         Returns degrees in radians.
     */
    BB.MathUtils.degToRad = function(degrees) {

        if (typeof degrees !== "number") {
            throw new Error("BB.MathUtils.degToRad: degrees is not a number type");
        }

        return degrees * (Math.PI / 180.0);
    };

    /**
     * Translate from polar coordinates to cartesian coordinates.
     * @method polarToCartesian
     * @static
     * @param  {Number} radius  The straight line distance from the origin.
     * @param  {Number} degrees The angle in degrees measured clockwise from the
     * positive x axis.
     * @return {Array}         An array of length two where the first element is
     * the x value and the second element is the y value.
     */
    BB.MathUtils.polarToCartesian = function(radius, degrees) {

        if (typeof radius !== "number" || typeof degrees !== "number") {
            throw new Error("BB.MathUtils.polarToCartesian: invalid arguments, function expects two Number type parameters.");
        }

        return [ radius * Math.cos(degrees), radius * Math.sin(degrees) ];
    };

    /**
     * Translate from cartesian to polar coordinates.
     * @method cartesianToPolar
     * @static
     * @param  {Number} x The x coordinate.
     * @param  {Number} y The y coordinate.
     * @return {Array}  An array of length two where the first element is the
     * polar radius and the second element is the polar angle in degrees
     * measured clockwise from the positive x axis.
     */
    BB.MathUtils.cartesianToPolar = function(x, y) {

        if (typeof x !== "number" || typeof y !== "number") {
            throw new Error("BB.MathUtils.cartesianToPolar: invalid arguments, function expects two Number type parameters.");
        }

        return [ Math.sqrt((x * x) + (y * y)), Math.atan(y / x) ];
    };

    /**
     * return a random int between a min and a max
     * @method randomInt
     * @static
     * @param  {Number} min minimum value ( default to 0 if only one argument is passed )
     * @param  {Number} max maximum value
     * @return {Number}  random integer
     */
    BB.MathUtils.randomInt = function( min, max) {
        if( arguments.length === 0 ){
            throw new Error("BB.MathUtils.cartesianToPolar: requires at least one argument");
        }
        else if( arguments.length === 1 ){
            return Math.floor(0 + Math.random() * (min - 0 + 1));
        }
        else {
            return Math.floor(min + Math.random() * (max - min + 1));
        }
    };

    /**
     * return a random float between a min and a max
     * @method randomFloat
     * @static
     * @param  {Number} min minimum value ( default to 0 if only one argument is passed )
     * @param  {Number} max maximum value
     * @return {Number}  random float
     */
    BB.MathUtils.randomFloat = function( min, max ) {
        if( arguments.length === 0 ){
            throw new Error("BB.MathUtils.cartesianToPolar: requires at least one argument");
        }
        else if( arguments.length === 1 ){
            return 0 + Math.random() * (min - 0);
        }
        else {
            return min + Math.random() * (max - min);
        }
    };

    return BB.MathUtils;
});
/**
 * A module for creating color objects, color schemes and doing color maths
 * @module BB.Color
 */
define('BB.Color',['./BB'],
function(  BB) {

    'use strict';
    
    /**
     * A module for creating color objects, color schemes and doing color maths.
     * @class BB.Color
     * @constructor
     * @param {Number} [r] optional parameter for setting the red value (0-255)
     * @param {Number} [g] optional parameter for setting the green value (0-255)
     * @param {Number} [b] optional parameter for setting the blue value (0-255)
     * @param {Number} [a] optional parameter for setting the alpha value (0-255)
     * @example 
     * <pre class="code prettyprint"> var color = new BB.Color(255,0,0); </pre>
     */

    BB.Color = function(r, g, b, a) {

        // see getter/setter below
        if( typeof r == "undefined" ){
            this._r = 204; 
        }
        else if( typeof r !== 'number' || r<0 || r>255 ){
            throw new Error("BB.Color: red parameter neeeds to be a NUMBER between 0 - 255");
        } else {
            this._r = r;     
        }

        // see getter/setter below
        if( typeof g == "undefined" ){
            this._g = 51; 
        }
        else if( typeof g !== 'number' || g<0 || g>255 ){
            throw new Error("BB.Color: green parameter neeeds to be a NUMBER between 0 - 255");
        } else {
            this._g = g;        
        }

        // see getter/setter below
        if( typeof b == "undefined" ){
            this._b = 153; 
        }
        else if( typeof b !== 'number' || b<0 || b>255 ){
            throw new Error("BB.Color: blue parameter neeeds to be a NUMBER between 0 - 255");
        } else {
            this._b = b;        
        }

        // see getter/setter below
        if( typeof a == "undefined" ){
            this._a = 255; 
        }
        else if(  a<0 || a>255 ){
            throw new Error("BB.Color: alpha parameter neeeds to be a NUMBER between 0 - 255");
        } else {
            this._a = a;        
        }

       this.rgb2hsv();

        /**
         * object with properties ( named after different color schemes ) for
         * holding arrays of new BB.Color objects generated with the
         * <a href="#method_createScheme"><code>createScheme()</code></a> method. 
         * 
         * @type {Object}
         * @property schemes
         */
        this.schemes = {
            'monochromatic' : [],
            'analogous' : [],
            'complementary' : [],
            'splitcomplementary' : [],
            'triadic' : [],
            'tetradic' : [],
            'random' : []
        };
    };

    /**
     * the red value between 0 - 255
     * @property r (red)
     * @type Number
     * @default 204
     */   
    Object.defineProperty(BB.Color.prototype, "r", {
        get: function() {
            return this._r;
        },
        set: function(r) {
            if( typeof r !== 'number' || r<0 || r>255 ){
                throw new Error("BB.Color: red parameter neeeds to be a NUMBER between 0 - 255");
            } else {
                this._r = r;    
                this.rgb2hsv(); 
            }
        }
    });

    /**
     * the green value between 0 - 255
     * @property g (green)
     * @type Number
     * @default 51
     */   
    Object.defineProperty(BB.Color.prototype, "g", {
        get: function() {
            return this._g;
        },
        set: function(g) {
            if( typeof g !== 'number' || g<0 || g>255 ){
                throw new Error("BB.Color: green parameter neeeds to be a NUMBER between 0 - 255");
            } else {
                this._g = g;    
                this.rgb2hsv(); 
            }
        }
    });

    /**
     * the blue value between 0 - 255
     * @property b (blue)
     * @type Number
     * @default 153
     */   
    Object.defineProperty(BB.Color.prototype, "b", {
        get: function() {
            return this._b;
        },
        set: function(b) {
            if( typeof b !== 'number' || b<0 || b>255 ){
                throw new Error("BB.Color: blue parameter neeeds to be a NUMBER between 0 - 255");
            } else {
                this._b = b;    
                this.rgb2hsv(); 
            }
        }
    });

    /**
     * the alpha value between 0 - 255
     * @property a (alpha)
     * @type Number
     * @default 255
     */   
    Object.defineProperty(BB.Color.prototype, "a", {
        get: function() {
            return this._a;
        },
        set: function(a) {
            if( typeof a !== 'number' || a<0 || a>255 ){
                throw new Error("BB.Color: alpha parameter neeeds to be a NUMBER between 0 - 255");
            } else {
                this._a = a;    
                this.rgb2hsv(); 
            }
        }
    });

    /**
     * the hue value between 0 - 359
     * @property h (hue)
     * @type Number
     * @default 0
     */   
    Object.defineProperty(BB.Color.prototype, "h", {
        get: function() {
            return this._h;
        },
        set: function(h) {
            if( typeof h !== 'number' || h<0 || h>359 ){
                throw new Error("BB.Color: hue parameter neeeds to be a NUMBER between 0 - 359");
            } else {
                this._h = h;    
                this.hsv2rgb(); 
            }
        }
    });

    /**
     * the saturation value between 0 - 100
     * @property s (saturation)
     * @type Number
     * @default 0
     */   
    Object.defineProperty(BB.Color.prototype, "s", {
        get: function() {
            return this._s;
        },
        set: function(s) {
            if( typeof s !== 'number' || s<0 || s>100 ){
                throw new Error("BB.Color: saturation parameter neeeds to be a NUMBER between 0 - 100");
            } else {
                this._s = s;    
                this.hsv2rgb(); 
            }
        }
    });

    /**
     * the brightness/lightness value between 0 - 100
     * @property v (value)
     * @type Number
     * @default 0
     */   
    Object.defineProperty(BB.Color.prototype, "v", {
        get: function() {
            return this._v;
        },
        set: function(v) {
            if( typeof v !== 'number' || v<0 || v>100 ){
                throw new Error("BB.Color: brightness/lightness parameter neeeds to be a NUMBER between 0 - 100");
            } else {
                this._v = v;    
                this.hsv2rgb(); 
            }
        }
    });


    /**
     * the base color's rgb string
     * @property rgb
     * @type String
     * @default "rgb(204,51,153)"
     */   
    Object.defineProperty(BB.Color.prototype, "rgb", {
        get: function() {
            return 'rgb('+this.r+', '+this.g+', '+this.b+')';
        },
        set: function(v) {
            if( typeof v !== 'string' ){
                throw new Error("BB.Color: rgb parameter expects an rgb(...) string");
            } else {
                if( v.indexOf('rgb(') !== 0){
                    throw new Error("BB.Color: expecting string staring with 'rgb(' ");
                }
                else if( v[v.length-1] !== ")"){
                    throw new Error("BB.Color: expecting string ending with ')' ");
                } 
                else {
                    v = v.substr(4,v.length-5);
                    v = v.split(',');
                    if( v.length < 3 ) throw new Error("BB.Color: rgb(...) requires 3 properties");
                    v[0] = parseInt(v[0]);
                    v[1] = parseInt(v[1]);
                    v[2] = parseInt(v[2]);
                    if( v[0] < 0 || v[0] > 255 ) throw new Error("BB.Color: red value must be between 0 - 255 ");
                    if( v[1] < 0 || v[1] > 255 ) throw new Error("BB.Color: green value must be between 0 - 255 ");
                    if( v[2] < 0 || v[2] > 255 ) throw new Error("BB.Color: blue value must be between 0 - 255 ");
                    this.r = v[0];
                    this.g = v[1];
                    this.b = v[2];
                }
            }
        }
    });


    /**
     * the base color's rgba string
     * @property rgba
     * @type String
     * @default "rgba(204,51,153,1)"
     */   
    Object.defineProperty(BB.Color.prototype, "rgba", {
        get: function() {
            return 'rgba('+this.r+', '+this.g+', '+this.b+','+Math.floor((this.a/255)*100)/100+')';
        },
        set: function(v) {
            if( typeof v !== 'string' ){
                throw new Error("BB.Color: rgba parameter expects an rgba(...) string");
            } else {
                if( v.indexOf('rgba(') !== 0){
                    throw new Error("BB.Color: expecting string staring with 'rgba(' ");
                }
                else if( v[v.length-1] !== ")"){
                    throw new Error("BB.Color: expecting string ending with ')' ");
                } 
                else {
                    v = v.substr(5,v.length-6);
                    v = v.split(',');
                    if( v.length < 4 ) throw new Error("BB.Color: rgba(...) requires 4 properties");
                    v[0] = parseInt(v[0]);
                    v[1] = parseInt(v[1]);
                    v[2] = parseInt(v[2]);
                    v[3] = parseFloat(v[3]);
                    if( v[0] < 0 || v[0] > 255 ) throw new Error("BB.Color: red value must be between 0 - 255 ");
                    if( v[1] < 0 || v[1] > 255 ) throw new Error("BB.Color: green value must be between 0 - 255 ");
                    if( v[2] < 0 || v[2] > 255 ) throw new Error("BB.Color: blue value must be between 0 - 255 ");
                    if( v[3] < 0.0 || v[3] > 1.0 ) throw new Error("BB.Color: alpha value must be between 0.0 - 1.0 ");
                    this.r = v[0];
                    this.g = v[1];
                    this.b = v[2];
                    this.a = Math.floor( v[3] * 255 );
                }
            }
        }
    });

    /**
     * the base color's hex string
     * @property hex
     * @type String
     * @default "#cc3399"
     */   
    Object.defineProperty(BB.Color.prototype, "hex", {
        get: function() {
            return "#" +((this.r << 16) | (this.g << 8) | this.b).toString(16);
        },
        set: function(v) {
            if( typeof v !== 'string' ){
                throw new Error("BB.Color: hex parameter expects a # string");
            } 
            else {
                   if (v.indexOf('#') !== 0) {
                        throw new Error("BB.Color: expecting string staring with '#' ");
                    }
                    else if( v.length !== 7 && v.length !== 4  ){
                        throw new Error("BB.Color: hex string is too long or short ");
                    }
                    else {
                        var a;
                        if(v.length === 7 ){
                            v = v.substr(1,v.length-1);
                            a = [ v.substr(0,v.length-4), v.substr(2,v.length-4), v.substr(4,v.length-4)];
                            console.log( parseInt('0x'+a[0]), parseInt('0x'+a[1]), parseInt('0x'+a[2]) );
                            this.r = parseInt('0x'+a[0]);
                            this.g = parseInt('0x'+a[1]);
                            this.b = parseInt('0x'+a[2]);
                        }
                        else {
                            v = v.substr(1,v.length-1);
                            a = [ v.substr(0,v.length-2), v.substr(1,v.length-2), v.substr(2,v.length-2)];
                            this.r = parseInt('0x'+a[0]+a[0]);
                            this.g = parseInt('0x'+a[1]+a[1]);
                            this.b = parseInt('0x'+a[2]+a[2]);
                        }
                    }
            }
        }
    });

    /**
     * sets color value to match another color object's value
     * @method copy
     * @param {BB.Color} color another color object to copy from
     * @return {BB.Color} this color
     * @chainable
     * @example
     * <code class="code prettyprint">
     * &nbsp; var x = new color(0,255,0); <br>
     * &nbsp; var y = new color(100,100,100); <br>
     * &nbsp; y.copy( x ); <br>
     * &nbsp; y.rgb; // returns 'rgb(0,255,0)';                         
     * </code>
     */
    BB.Color.prototype.copy = function( color ) { 
        
        if (typeof color === "undefined" || ! (color instanceof BB.Color)) {
            throw new Error("BB.Color.copy: color parameter is not an instance of BB.Color");
        }

        this.setRGBA( color.r, color.g, color.b, color.a );
        return this;
    };

    /**
     * creates a new color object that is a copy of itself
     * @method clone
     * @return {BB.Color} a new color object copied from this one
     * @example
     * <code class="code prettyprint">
     * &nbsp; var x = new color(0,255,0); <br>
     * &nbsp; var y = x.clone(); <br>
     * &nbsp; y.rgb; // returns 'rgb(0,255,0)';
     * </code>
     */
    BB.Color.prototype.clone = function() { 
        var child = new BB.Color();
            child.copy( this );
        return child;
    };

    /**
     * sets the rgba value of the color
     * @method setRGBA
     * @param {Number} r sets the red value from 0 - 255 
     * @param {Number} g sets the green value from 0 - 255 
     * @param {Number} b sets the blue value from 0 - 255 
     * @param {Number} a sets the alpha value from 0 - 255 
     * @return {BB.Color} this color
     * @chainable
     */
    BB.Color.prototype.setRGBA = function(r, g, b, a) {


        if( typeof r !== 'number' || r<0 || r>255 ){
            throw new Error("BB.Color: red parameter neeeds to be a NUMBER between 0 - 255");
        } else {
            this.r = r;
        }

        if( typeof g !== 'number' || g<0 || g>255 ){
            throw new Error("BB.Color: green parameter neeeds to be a NUMBER between 0 - 255");
        } else {
            this.g = g;
        }

        if( typeof b !== 'number' || b<0 || b>255 ){
            throw new Error("BB.Color: blue parameter neeeds to be a NUMBER between 0 - 255");
        } else {
            this.b = b;
        }

        if( typeof a !== 'number' || a<0 || a>255 ){
            throw new Error("BB.Color: alpha parameter neeeds to be a NUMBER between 0 - 255");
        } else {
            this.a = a;
        }

        this.rgb2hsv();
        return this;
    };
    
    /**
     * sets the h(hue) s(saturation) v(value) of the color
     * @method setHSVA
     * @param {Number} h sets the hue value from 0 - 359
     * @param {Number} s sets the saturation value from 0 - 100
     * @param {Number} v sets the light/bright value from 0 - 100
     * @param {Number} a sets the alpha value from 0 - 255
     * @return {BB.Color} this color
     * @chainable
     */
    BB.Color.prototype.setHSVA = function(h, s, v, a) {
        
        if( typeof h !== 'number' || h<0 || h>359 ){
            throw new Error("BB.Color: hue parameter neeeds to be a NUMBER between 0 - 359");
        } else {
            this.h = h;
        }

        if( typeof s !== 'number' || s<0 || s>100 ){
            throw new Error("BB.Color: saturation parameter neeeds to be a NUMBER between 0 - 100");
        } else {
            this.s = s;
        }

        if( typeof v !== 'number' || v<0 || v>100 ){
            throw new Error("BB.Color: value parameter neeeds to be a NUMBER between 0 - 100");
        } else {
            this.v = v;
        }

        if( typeof a !== 'number' || a<0 || a>255 ){
            throw new Error("BB.Color: alpha parameter neeeds to be a NUMBER between 0 - 255");
        } else {
            this.a = a;
        }

        this.hsv2rgb();
        return this;
    };



    //


    /**
     * checks if another color object is equal to itself
     * 
     * @method isEqual
     * @param {BB.Color} color another color object to compare to
     * @param {Boolean} excludeAlpha Whether or not to exlude Alpha property. True by default.
     * @return {Boolean}     true if it's equal, false if it's not
     */
    BB.Color.prototype.isEqual = function(color, excludeAlpha) {

        if (! color || !(color instanceof BB.Color) ) {
            throw new Error("BB.Color.isEqual: color parameter is not an instance of BB.Color");
        }

        if (excludeAlpha) {
            return (this.r === color.r &&
                    this.g === color.g &&
                    this.b === color.b);
        } else {
            return (this.r === color.r &&
                    this.g === color.g &&
                    this.b === color.b &&
                    this.a === color.a);
        }
    };

    BB.Color.prototype.min3 = function( a,b,c ) { 
        return ( a<b )   ?   ( ( a<c ) ? a : c )   :   ( ( b<c ) ? b : c ); 
    }; 
    
    BB.Color.prototype.max3 = function( a,b,c ) { 
        return ( a>b )   ?   ( ( a>c ) ? a : c )   :   ( ( b>c ) ? b : c );
    };

    /**
     * converts rgb values into hsv values, you can pass it an instance of
     * BB.Color as a single parameter or pass it three individual parameters (
     * for r, g and b ) and it returns an object with h,s,v properties.
     *
     * if you don't pass it any parameters it takes its own internal values as
     * arguments and updates it's own internal hsv automatically ( that
     * functionality is used internally, for ex. by the getters && setters )
     * 
     * @method rgb2hsv
     * @param  {Number} [rgb] either an instance of BB.Color or a red value
     * between 0 - 255
     * @param  {Number} [g]   a green value between 0 - 255
     * @param  {Number} [b]   a blue value value between 0 - 255
     * @return {Object}     an object with h, s, v properties
     */
    BB.Color.prototype.rgb2hsv = function( rgb, g, b ) { 

        var self;
        if( typeof rgb == "undefined"){
            self = this;
        } else {
            self = ( rgb instanceof BB.Color ) ? rgb : { r:rgb, g:g, b:b };
        }

        var hsv = {};
        var max = Math.max(self.r, Math.max(self.g, self.b));
        var dif = max - Math.min(self.r, Math.min(self.g, self.b));

        hsv.s = (max===0.0) ? 0 : (100*dif/max);

        if ( hsv.s === 0 ) hsv.h = 0;
        else if ( self.r==max ) hsv.h = 60.0 * ( self.g-self.b )/dif;
        else if ( self.g==max ) hsv.h = 120.0+60.0 * ( self.b-self.r )/dif;
        else if ( self.b==max ) hsv.h = 240.0+60.0 * ( self.r-self.g )/dif;

        if ( hsv.h < 0.0 ) hsv.h += 360.0;

        hsv.h = Math.round( hsv.h );           
        hsv.s = Math.round( hsv.s );    
        hsv.v = Math.round( max*100/255 );      

        if( typeof rgb == "undefined"){
            this._h = hsv.h;         
            this._s = hsv.s;  
            this._v = hsv.v;     
        } 

        return hsv;
    };

    /**
     * converts hsv values into rgb values, you can pass it an instance of
     * BB.Color as a single parameter or pass it three individual parameters (
     * for h, s and v ) and it returns an object with r,g,b properties.
     *
     * if you don't pass it any parameters it takes its own internal values as
     * arguments and updates it's own internal rgb automatically ( that
     * functionality is used internally, for ex. by the getters && setters )
     *
     * @method hsv2rgb
     * @param  {Number} [hsv] either an instance of BB.Color or a h value between 0 - 359
     * @param  {Number} [s]   a saturation value between 0 - 100
     * @param  {Number} [v]   a brightness/lightness value value between 0 - 100
     * @return {Object}     an object with r, g, b properties
     */
    BB.Color.prototype.hsv2rgb = function( h, s, v ) { 
        var rgb, hsv;

        if( typeof h == "undefined"){

            rgb = { r:this.r, g:this.g, b:this.b };
            hsv = { h:this.h, s:this.s, v:this.v }; 

        } else {

            rgb = {};
            hsv = ( h instanceof BB.Color ) ? h.clone() : { h:h, s:s, v:v };
        }
   
        hsv.h /= 60;
        hsv.s /= 100;
        hsv.v /= 100;
        
        var i = Math.floor( hsv.h );
        var f = hsv.h - i;
        var p = hsv.v * ( 1- hsv.s );
        var q = hsv.v * ( 1 - hsv.s * f );
        var t = hsv.v * ( 1 - hsv.s * (1-f) );
        
        switch( i ) {
            case 0: rgb.r = hsv.v; rgb.g = t; rgb.b = p; break;
            case 1: rgb.r = q; rgb.g = hsv.v; rgb.b = p; break;
            case 2: rgb.r = p; rgb.g = hsv.v; rgb.b = t; break;
            case 3: rgb.r = p; rgb.g = q; rgb.b = hsv.v; break;
            case 4: rgb.r = t; rgb.g = p; rgb.b = hsv.v; break;
            default: rgb.r = hsv.v; rgb.g = p; rgb.b = q;
        }

        rgb.r = Math.round(rgb.r * 255);
        rgb.g = Math.round(rgb.g * 255);
        rgb.b = Math.round(rgb.b * 255);

        if( arguments.length === 0 ){

            this._r = rgb.r;         
            this._g = rgb.g;  
            this._b = rgb.b;    

        } 
        
        return rgb;
    
    };


    //

    /**
     * changes the color by shifting current hue value by a number of degrees,
     * also chainable ( see example )
     *
     * can also take an additional hue parameter when used as a utility ( see
     * example ), used this way internally by <code>.createScheme</code>
     * @method shift
     * @chainable
     * @param {Number} degrees number of degress to shift current hue by ( think
     * rotating a color wheel )
     * @param {Number} [hue] The hue parameter to use. Including this parameter
     * changes the behavior of this function to act as a utility function.
     * @return {BB.Color} this color
     * @example <code class="code prettyprint"> &nbsp; color.shift( 10 ); //
     * shifts by 10 degrees <br> &nbsp; var comp = color.clone().shift( 180 );
     * // new complementary color obj <br><br> &nbsp; // as a utility ( without
     * changing the color ) <br> &nbsp; color.shift( 180, color.h ); // returns
     * the complementary hue ( in degrees ) </code>
     */
    BB.Color.prototype.shift = function( degrees, hue ) { 
        var h;

        if( typeof hue === "undefined" ) h = this.h;
        else  h = hue;
        h += degrees; 
        
        while ( h>=360.0 )  h -= 360.0; 
        while ( h<0.0 )     h += 360.0; 

        if( typeof hue === "undefined" ){
            this.h = h;
            return this; // for chaining
        } 
        else {  return h; }
    };

    /**
     * changes the color by lightening it by a certain percentage
     *
     * @method tint
     * @param {Number} percentage float between 0 and 1
     * @return {BB.Color} this color
     * @chainable
     */
    BB.Color.prototype.tint = function( percentage, _schemeUse ) { 
        var col = {};
        var tint = percentage;
        col.r = Math.round( this.r+(255-this.r ) * tint );
        col.g = Math.round( this.g+(255-this.g ) * tint );
        col.b = Math.round( this.b+(255-this.b ) * tint );
        col.a = this.a;
        if( typeof _schemeUse !== "undefined" && _schemeUse === true) {
            return new BB.Color( col.r, col.g, col.b, col.a );
        }
        else { 
            this.setRGBA( col.r, col.g, col.b, col.a );
            return this;
        }
    };


    /**
     * changes the color by darkening it by a certain percentage
     *
     * @method shade
     * @param {Number} percentage float between 0 and 1
     * @return {BB.Color} this color
     * @chainable
     */
    BB.Color.prototype.shade = function( percentage, _schemeUse ) { 
        var col = {};
        var shade = percentage;
        col.r = Math.round( this.r * shade );
        col.g = Math.round( this.g * shade );
        col.b = Math.round( this.b * shade );
        col.a = this.a;
        if( typeof _schemeUse !== "undefined" && _schemeUse === true) {
            return new BB.Color( col.r, col.g, col.b, col.a );
        }
        else { 
            this.setRGBA( col.r, col.g, col.b, col.a );
            return this;
        }
    };



    /**
     * generates a color scheme ( array of additional color values ) from the
     * base color.
     *
     * the colors are stored in an array in the <code>.schemes</code> property (
     * object ) and can be accessed by querying the key ( name ) of the color
     * scheme you generated like so: <code> .schemes.triadic </code>, which
     * will return an array of BB.Color objects
     * 
     * @method createScheme
     * 
     * @param  {String} scheme name of the color scheme you want to generate.
     * can be either "monochromatic", "analogous", "complementary", 
     * "splitcomplementary", "triadic", "tetradic" or "random"
     * 
     * @param  {Object} optional config object with properties for angle (Number) for hue
     * shift ( for schemes other than "complimentary" or "triadic" which have fixed 
     * angles ), tint (Array of Floats) and shade (Array of Floats), which
     * are used to create aditional monochromatic colors ( tint for light variations of
     * the base color and shade for dark ) in relation to the base colors of each scheme
     *
     * the "random" scheme takes an entirely different config object with values for hue,
     * saturation and value. when no config is sent it generates entirely random colors.
     * when a <code>{ hue: 200 }</code> is passed than you'd get random shades of blue, etc.
     *
     * if you need a color scheme/theory refersher: <a href="http://www.tigercolor.com/color-lab/color-theory/color-theory-intro.htm" target="_blank"> check this out</a>
     * 
     * @example  <code class="code prettyprint">  
     * &nbsp; color.createScheme("complementary"); // creates single complementary color <br><br>
     * &nbsp; // creates two analogous colors <br>
     * &nbsp; // as well as 2 shades and 2 tints for each of the two analogous colors<br>
     * &nbsp; // so color.schemes.analogous.length will be 10<br>
     * &nbsp; color.createScheme("analogous",{ <br> 
     * &nbsp;&nbsp;&nbsp;&nbsp; angle: 30,<br> 
     * &nbsp;&nbsp;&nbsp;&nbsp; tint:[ 0.4, 0.8 ], <br>
     * &nbsp;&nbsp;&nbsp;&nbsp; shade:[ 0.3, 0.6 ] <br> 
     * &nbsp; }); <br><br>
     * &nbsp; color.createScheme("random",{ <br> 
     * &nbsp;&nbsp;&nbsp;&nbsp; hue: 200,<br> 
     * &nbsp; }); <br><br>
     * &nbsp; color.schemes.analogous[0] // returns first analogous color <br> 
     * &nbsp; color.schemes.analogous[1] // returns second analogous color <br> 
     * &nbsp; color.schemes.random[0] // returns first random blue shade <br> </code>
     */
    BB.Color.prototype.createScheme = function( scheme, config ) { 

        // ERROR CHECKING -----------------------------------------------------------

        if( !(scheme in this.schemes) ) {
            throw new Error("BB.Color.createScheme: '"+scheme+"' is not a valid scheme name, choose from: "+Object.keys(this.schemes) );
        }

        if( typeof config === "object" || typeof config === "undefined"  ){  
                        
            if( typeof config === "undefined" ) config = {};

            // defaults for color schemes
            
            if( typeof config.angle === "undefined" ){
                if(scheme=="tetradic") config.angle = 40;
                else config.angle = 30;
            }
            if( scheme == "monochromatic" ){
                if( typeof config.tint === "undefined" ){ config.tint = [0.4,0.8]; }
                else if( !(config.tint instanceof Array) ){
                  throw new Error("BB.Color.createScheme: tint should be an Array of floats between 0.0-1.0");  
                } 
                if( typeof config.shade === "undefined" ){ config.shade = [0.3,0.6]; }
                else if( !(config.shade instanceof Array) ){
                  throw new Error("BB.Color.createScheme: shade should be an Array of floats between 0.0-1.0");  
                } 
            }

            // defaults for random schemes
            
            if( scheme == "random" ){
                if( typeof config.count === "undefined" ){ config.count = 5; } 
            }
        }

        if( typeof config !== "object" ) {

            throw new Error("BB.Color.createScheme: config parameter should be an Object" );

        } else {

        // GENERATING THE SCHEME ----------------------------------------------------

            this.schemes[scheme] = []; // clear previous colors

            var angles;
            switch( scheme ) {
                case "analogous": angles = [ config.angle, 0-config.angle ];  break;
                case "complementary" : angles = [ 180 ];  break;
                case "splitcomplementary": angles = [ 180-config.angle, 180+config.angle];  break;
                case "triadic" : angles = [ 240, 120 ];  break;
                case "tetradic": angles = [ 180, -config.angle, -config.angle+180 ];  break;
            }

            var ones = ["analogous","complementary","splitcomplementary","triadic","tetradic"];
            var twos = ["analogous","splitcomplementary","triadic","tetradic"];
            var threes = ["tetradic"];

            if( scheme == "monochromatic" )      this._schemeVarient( scheme, config );
            if( ones.indexOf( scheme ) >= 0 )    this._schemeVarient( scheme, config, angles[0] );
            if( twos.indexOf( scheme ) >= 0 )    this._schemeVarient( scheme, config, angles[1] );
            if( threes.indexOf( scheme ) >= 0 )  this._schemeVarient( scheme, config, angles[2] );

            if( scheme == "random" ) this._randomVarients( scheme, config );
                         
        }

    };

    // private function for creating scheme variants
    // used by scheme functions 
    BB.Color.prototype._schemeVarient = function( scheme, config, angle ) { 

        var rgb, hsv;
        var self;

        if( scheme == "monochromatic" ){
            rgb = {r:this.r, g:this.g, b:this.b };
        } else {
            rgb     = { r:this.r, g:this.g, b:this.b };
            hsv     = this.rgb2hsv(     rgb.r, rgb.g, rgb.b     );
            hsv.h   = this.shift(   hsv.h, angle  );
            rgb     = this.hsv2rgb(     hsv.h, hsv.s, hsv.v     );       
        }

        self = new BB.Color(rgb.r, rgb.g, rgb.b );

        if( typeof config.tint !== "undefined" ){
            config.tint.sort(function(a,b){return b - a;}); // reorder largest to smallest

            for (var i = 0; i < config.tint.length; i++) {
                var col = self.tint( config.tint[i], true );
                this.schemes[scheme].push( col );
            }
        }

        var copy = self.clone();
        this.schemes[scheme].push( copy );
        
        if( typeof config.shade !== "undefined" ){
            config.shade.sort(function(a,b){return b - a;}); // reorder largest to smallest

            for (var j = 0; j < config.shade.length; j++) {
                var col2 = self.shade( config.shade[j], true );
                this.schemes[scheme].push( col2 );
            }
        }
    };

    // private function for creating random variants
    // used by scheme functions 
    BB.Color.prototype._randomVarients = function( scheme, config ) { 

        if( typeof config.count === "undefined" ) config.count = 5;

        for (var i = 0; i < config.count; i++) {

            var hue = ( typeof config.hue === "undefined" ) ? Math.floor( Math.random()*360 ) : config.hue;
            var sat = ( typeof config.saturation === "undefined" ) ? Math.floor( Math.random()*100 ) : config.saturation;
            var value = ( typeof config.value === "undefined" ) ? Math.floor( Math.random()*100 ) : config.value;
            var alpha;
            if( typeof config.alpha !== "undefined" ){
                alpha = ( config.alpha == "random" ) ? Math.floor( Math.random() * 255 ) : config.alpha;
            } else { alpha = 255; }

            var clr = this.hsv2rgb( hue, sat, value ); 
                clr.a = alpha;

            var col = new BB.Color( clr.r, clr.g, clr.b, clr.a );

            this.schemes[scheme].push( col );
        }
    
    };

    return BB.Color;
});
/**
 * A module for standardizing mouse events from an HTML5 canvas so that they may be used with
 * the event funnel suite of modules.
 * <br>
 * <i>NOTE: For use with HTML5 canvas only.<i>
 * @module BB.MouseInput
 */
define('BB.MouseInput',['./BB'], 
function(  BB){
    
    'use strict';
    
    /**
     * A module for standardizing mouse events from an HTML5 canvas so that they may be used with
     * the event funnel suite of modules.
     * <br>
     * <br>
     * <i>Note: For use with HTML5 canvas only.<i>
     * @class  BB.MouseInput
     * @constructor
     * @param {HTMLCanvasElement} canvasElement The HTML5 canvas object listening for mouse input.
     */
    BB.MouseInput = function(canvasElement) {

        if (typeof canvasElement === 'undefined' || 
            !(canvasElement instanceof HTMLCanvasElement)) {
            throw new Error('BB.MouseInput: An HTML5 canvas object must be supplied as a first parameter.');
        }

        var self = this;
        var movingTimeout = null;

        /**
         * The current x position.
         * @property x
         * @type {Number}
         * @default 0
         */
        this.x          = 0;

        /**
         * The current y position.
         * @property y
         * @type {Number}
         * @default 0
         */
        this.y          = 0;

        /**
         * The last clicked x position.
         * @property clickX
         * @type {Number}
         * @default 0
         */
        this.clickX     = 0;

        /**
         * The last clicked y position.
         * @property clickY
         * @type {Number}
         * @default 0
         */
        this.clickY     = 0;

        /**
         * Time in milliseconds that the mouse has been still before its movement is considering to be finished.
         * @property moveDebounce
         * @type {Number}
         * @default 150
         */
        this.moveDebounce = 150;

        this._isMoving = false;
        this._isDown = false;

        /**
         * The HTML5 canvas element passed into BB.MouseInput during
         * construction.
         * @property canvasElem
         * @type {Object}
         */
        this.canvasElem = canvasElement;

        this.canvasElem.addEventListener('mousemove', function(e) {

            var mouse = getCanvasMouseCoords(e);
            self.x = mouse.x;
            self.y = mouse.y;
                
            if (!self.isMoving && self.hasOwnProperty('_moveStartCallback') &&
                typeof self._moveStartCallback === 'function') {

                self._moveStartCallback(self.x, self.y);
            }
        
            self._isMoving = true;

            clearTimeout(movingTimeout);
            movingTimeout = setTimeout(function(){

                if (self.isMoving &&
                    self.hasOwnProperty('_moveStopCallback') &&
                    typeof self._moveStartCallback === 'function') {

                    self._isMoving = false;
                    self._moveStopCallback(self.x, self.y);
                }
            }, self.moveDebounce);
        });

        this.canvasElem.addEventListener('mousedown', function(e){
            
            if (e.button === BB.MouseInput.LEFT_BUTTON) {

                self._isDown = true;

                if (self.hasOwnProperty('_activeStartCallback') && 
                    typeof self._activeStartCallback === 'function') {

                    self._activeStartCallback(self.x, self.y);
                }
            }
        });

        this.canvasElem.addEventListener('mouseup', function(e){

            if (e.button === BB.MouseInput.LEFT_BUTTON) {
                self._isDown = false;

                if (self.hasOwnProperty('_activeStopCallback') &&
                    typeof self._activeStopCallback === 'function') {

                    self._activeStopCallback(self.x, self.y);
                }
            }
        });

        this.canvasElem.addEventListener('click', function(e){

            var mouse = getCanvasMouseCoords(e);
            self.clickX = mouse.x;
            self.clickY = mouse.y;
        });

        this.canvasElem.addEventListener('mouseleave', function() {

            if (self._isDown && 
                self.hasOwnProperty('_activeStopCallback') && 
                typeof self._activeStopCallback === 'function') {

                self._activeStopCallback(self.x, self.y);
            }

            if (self.isMoving &&
                self.hasOwnProperty('_moveStopCallback') && 
                typeof self._moveStopCallback === 'function') {

                self._moveStopCallback(self.x, self.y);
            }

            self._isMoving = false;
            self._isDown   = false;
        });

        function getCanvasMouseCoords(e) {

            var rect = self.canvasElem.getBoundingClientRect();

            return {
                x: Math.round((e.clientX - rect.left) / (rect.right - rect.left) * self.canvasElem.width),
                y: Math.round((e.clientY - rect.top) / (rect.bottom - rect.top) * self.canvasElem.height)
            };
        }
    };

    /**
     * Utility property that hold's the value of a JavaScript MouseEvent's left mouse button.
     * @property LEFT_BUTTON
     * @static 
     * @type {Number}
     * @default 0
     * @readOnly
     */
    BB.MouseInput.LEFT_BUTTON   = 0;

    /**
     * Utility property that hold's the value of a JavaScript MouseEvent's scroll wheel button.
     * @property SCROLL_BUTTON
     * @static 
     * @type {Number}
     * @default 1
     * @readOnly
     */
    BB.MouseInput.SCROLL_BUTTON = 1;

    /**
     * Utility property that hold's the value of a JavaScript MouseEvent's right mouse button.
     * @property RIGHT_BUTTON
     * @static
     * @type {Number}
     * @default 2
     * @readOnly
     */
    BB.MouseInput.RIGHT_BUTTON  = 2;

    /**
     * Holds wether or not the mouse is currently moving. This property is read-only.
     * @property isMoving
     * @type {Boolean}
     * @default false
     * @readOnly
     */
    Object.defineProperty(BB.MouseInput.prototype, 'isMoving', {
        get: function(){
            return this._isMoving;
        },
        set: function(val){
            throw new Error('BB.MouseInput.isMoving (setter): BB.MouseInput.isMoving is a read-only property.');
        }
    });

     /**
     * Holds wether or not the left mouse button is currently depressed. This property is read-only.
     * @property isDown
     * @type {Boolean}
     * @default false
     * @readOnly
     */
    Object.defineProperty(BB.MouseInput.prototype, 'isDown', {
        get: function(){
            return this._isDown;
        },
        set: function(val){
            throw new Error('BB.MouseInput.isDown (setter): BB.MouseInput.isDown is a read-only property.');
        }
    });

    BB.MouseInput.prototype.update = function() {

        if (this.isMoving &&
            this.hasOwnProperty('_moveCallback') &&
            typeof this._moveCallback === 'function') {
            
            this._moveCallback(this.x, this.y);
        }
    };

    return BB.MouseInput;
});

// A module for funneling in and standardizing pointer-like events
// like mouse, touch, computer-vision detected hands, etc...
// It has basic properties like x, y, isMoving and if the eventModule
// that is passed into its update() has a selection interface (like the 
// click on a mouse), then it also has an isDown property.
// Note: This module is for use with HTML5 canvas only.

/**
 * A module for funneling in and standardizing basic pointer-like interfaces
 * like mouse and touch.
 * @module BB.Pointer
 */
define('BB.Pointer',['./BB', './BB.MouseInput'],
function(  BB,        MouseInput){

    'use strict';

    BB.MouseInput = MouseInput;

    //NOTE: called inside BB.Pointer using .call()
    //to bind this to BB.Pointer instance
    function bindEventsToControllerModule() {
    /*jshint validthis: true */
    
        // the BBMouseInput module uses event listeners attatched to it's
        // HTML5 canvas to fire these callbacks directly, so pass them along.
        if (this.controllerModule instanceof BB.MouseInput) {

            this.controllerModule._activeStartCallback = this._activeStartCallback;
            this.controllerModule._activeStopCallback  = this._activeStopCallback;
            this.controllerModule._moveStartCallback   = this._moveStartCallback;
            this.controllerModule._moveStopCallback    = this._moveStopCallback;
            this.controllerModule._moveCallback        = this._moveCallback;
        }
    }

    /**
     * A module for funneling in and standardizing basic pointer-like interfaces
     * like mouse and touch.
     * @class BB.Pointer
     * @param {Object} controllerModule The input module you would like to control
     * this pointer with.
     * @constructor
     */
    BB.Pointer = function(controllerModule) {

        if (typeof controllerModule === "undefined") {
            throw new Error('BB.Pointer: controllerModule parameter is missing from the BB.Pointer constructor.');
        } else if (! (controllerModule instanceof BB.MouseInput)) {
            this.controllerModule = null;
            throw new Error("BB.Pointer.update: controllerModule is not a supported object type.");
        }

        this.controllerModule = controllerModule;


        /**
         * The pointer's current x position as supplied by the eventModule in BB.Pointer.update(...).
         * @property x
         * @type {Number}
         * @default undefined
         */
        this.x = null;

        /**
         * The pointer's current y position as supplied by the eventModule in BB.Pointer.update(...).
         * @property y
         * @type {Number}
         * @default undefined
         */
        this.y = null;

        /**
         * A variable holding wether or not the event module controlling this
         * pointer object (via BB.Pointer.update(...)) is moving
         * @property isMoving
         * @type {Boolean}
         * @default false
         */
        this.isMoving = false;

        /**
         * A variable holding wether or not the selection interface (i.e. mouse
         * button, etc...) controlling this pointer object (via
         * BB.Pointer.update(...)) is active.
         * @property isDown
         * @type {Boolean}
         * @default false
         */
        this.isDown = false;

        /**
         * Does the selection interface controlling this pointer have a
         * selection interface (like a button)?
         * @property hasSelectionInterface
         * @type {Boolean}
         * @default false
         */
        this.hasSelectionInterface = false;

        this._activeStartCallback = null;
        this._activeStopCallback  = null;
        this._moveStartCallback   = null;
        this._moveStopCallback    = null;
        this._moveCallback        = null;
    };

    Object.defineProperty(BB.Pointer.prototype, "controllerModule", {
        get: function(){
            return this._controllerModule;
        },
        set: function(val){

            this._controllerModule = val;

            // rebind the event callbacks in case this is 
            // a new controller module
            bindEventsToControllerModule.call(this);
        }
    });

    /**
     * Update the pointer using the controllerModule. Usually called once per animation frame.
     * @method update
     * @param  {Object} controllerModule 
     */
    BB.Pointer.prototype.update = function() {

        // add a new conditional for each module that pointer supports and then
        // update BB.Pointer's internals (x, y, isMoving) in a custom way for
        // each type of input (kinect, etc...)
        if (this.controllerModule instanceof BB.MouseInput) {

            // these assignments are easy for a mouse input object but will take
            // more work for other types of modules (i.e. kinect)...
            this.x                     = this.controllerModule.x;
            this.y                     = this.controllerModule.y;
            this.isMoving              = this.controllerModule.isMoving;
            this.isDown                = this.controllerModule.isDown;
            this.hasSelectionInterface = false;
        }
    };

    /**
     * A method used to register "activestart", "activestop", "movestart", "movestop", and "move" events.
     * @method on
     * @param  {String}   eventName   The event to register callback to.
     * "activestart", "activestop", "movestart", and "movestop" are all valid
     * events.
     * @param  {Function} callback    The callback to execute once the
     * registered event has fired.
     */
    BB.Pointer.prototype.on = function(eventName, callback){
        
        // save the callback so that it can be used later in update() if it needs to be    
        if (eventName == "activestart")      this._activeStartCallback       = callback;
        else if (eventName == "activestop")  this._activeStopCallback        = callback;
        else if (eventName == "movestart")   this._moveStartCallback         = callback;
        else if (eventName == "movestop")    this._moveStopCallback          = callback;
        else if (eventName == "move")        this._moveCallback              = callback;
        else {
            throw new Error('BB.Pointer.on: eventName is not a supported event.');
        }

        if (this._controllerModule === null) {
            throw new Error('BB.Pointer.on: pointer has no controller module.' +
                            ' You must first call BB.Pointer.update() to assign this pointer a controller module.');
        }

        bindEventsToControllerModule.call(this);
    };

    return BB.Pointer;
});

/**
 * Basic scene manager for brushes and pointers. BB.BrushManager2D allows a
 * drawing scene (that uses brushes) to persist while the rest of the canvas is
 * cleared each frame. It also provides functionality to undo/redo manager to
 * your drawing actions. <br><br> Note: The BB.BrushManager2D class creates a new canvas
 * that is added to the DOM on top of the canvas object that you pass to its
 * constructor. This is acheived through some fancy CSS inside of
 * BB.BrushManager2D.updateCanvasPosition(...). For this reason the canvas
 * passed to the constructor must be absolutely positioned and
 * BB.BrushManager2D.updateCanvasPosition(...) should be called each time that
 * canvas' position or size is updated.
 * @module BB.BrushManager2D
 */
define('BB.BrushManager2D',['./BB', './BB.Pointer'],
function(  BB,      Pointer ){

    'use strict';

    BB.Pointer = Pointer;

    /**
     * Basic scene manager for brushes and pointers. BB.BrushManager2D allows a
     * drawing scene (that uses brushes) to persist while the rest of the canvas is
     * cleared each frame. It also provides functionality to undo/redo manager to
     * your drawing actions. <br><br> <i>Note: The BB.BrushManager2D class creates a new canvas
     * that is added to the DOM on top of the canvas object that you pass to its
     * constructor. This is acheived through some fancy CSS inside of
     * BB.BrushManager2D.updateCanvasPosition(...). For this reason the canvas
     * passed to the constructor must be absolutely positioned and
     * BB.BrushManager2D.updateCanvasPosition(...) should be called each time that
     * canvas' position or size is updated.</i>
     * @class BB.BrushManager2D
     * @constructor
     * @param {[HTMLCanvasElement]} canvas The HTML5 canvas element for the
     * brush manager to use.
     * @example
     * <code class="code prettyprint">&nbsp;var brushManager = new BB.BrushManager2D(document.getElementById('canvas'));
     * </code>
     */    
    BB.BrushManager2D = function(canvas) {

        var self = this;

        if (typeof canvas === 'undefined' || 
            !(canvas instanceof HTMLCanvasElement)) {
            throw new Error('BB.BrushManager2D: An HTML5 canvas object must be supplied as a first parameter.');
        }

        if (window.getComputedStyle(canvas).getPropertyValue('position') !== 'absolute') {
            throw new Error('BB.BrushManager2D: the HTML5 canvas passed into the BB.BrushManager2D' + 
                ' constructor must be absolutely positioned. Sorry ;).');
        }

        /**
         * The canvas element passed into the BB.BrushManager2D constructor
         * @property _parentCanvas
         * @type {HTMLCanvasElement}
         * @protected
         */
        this._parentCanvas    = canvas;

        /**
         * The 2D drawing context of the canvas element passed into the
         * BB.BrushManager2D constructor
         * @property _parentContext
         * @type {CanvasRenderingContext2D}
         * @protected
         */
        this._parentContext   = canvas.getContext('2d');

         /**
          * An in-memory canvas object used internally by BB.BrushManager to
          * draw to and read pixels from
          * @property canvas
          * @type {HTMLCanvasElement}
         */
        this.canvas           = document.createElement('canvas');

        /**
          * The 2D drawing context of canvas
          * @property context
          * @type {CanvasRenderingContext2D}
         */
        this.context          = this.canvas.getContext('2d');

        /**
         * A secondary canvas that is used internally by BB.BrushManager. This
         * canvas is written to the DOM on top of _parentCanvas (the canvas
         * passed into the BB.BaseBrush2D constructor). It is absolutely
         * positioned and has a z-index 1 higher than _parentCanvas.
         * @property secondaryCanvas
         * @type {HTMLCanvasElement}
         */
        this.secondaryCanvas  = document.createElement('canvas');

        /**
          * The 2D drawing context of secondaryCanvas
          * @property secondaryContext
          * @type {CanvasRenderingContext2D}
         */
        this.secondaryContext = this.secondaryCanvas.getContext('2d');

        this._parentCanvas.parentNode.insertBefore(this.secondaryCanvas, this._parentCanvas.nextSibling);
        this.updateCanvasPosition();

        this._numUndos = 5; // matches public numUndos w/ getter and setter

        /**
         * An array of base-64 encoded images that represent undo states.
         * @property _history
         * @type {Array}
         * @protected
         */
        this._history   = [];

        /**
         * An array of base-64 encoded images that represent redo states.
         * @property _purgatory
         * @type {Array}
         * @protected
         */
        this._purgatory = [];

        /**
         * An internal FBO (Frame Buffer Object) that is assigned the pixels
         * from canvas and is drawn during BB.BrushManager2D.draw()
         * @property _fboImage
         * @type {Image}
         * @protected
         */
        this._fboImage = new Image();
        this._fboImage.onload = function() {
            
            self.secondaryContext.clearRect(0, 0, self.canvas.width, self.canvas.height);
            self.secondaryCanvas.style.display = self._parentCanvas.style.display;
            self._fboImageLoadWaiting = false;
        };

        /**
         * A deep copy of _fboImage that is drawn in BB.BrushManager2D.draw()
         * when _fboImage is reloading
         * @property _fboImageTemp
         * @type {Image}
         * @default null
         * @protected
         */
        this._fboImageTemp = null;

        this._fboImage.onerror = function(err) {
           console.log('BB.BrushManager2D: src failed to load: ' + err.target.src);
        };

        /**
         * A secondary internal FBO (Frame Buffer Object) that is assigned the
         * pixels from _secondaryCanvas
         * @property _secondaryFboImage
         * @type {Image}
         * @protected
         */
        this._secondaryFboImage = new Image();

        // called by assigning src during this.update() when 
        // all pointers are up and at least one was down last frame
        this._secondaryFboImage.onload = function() {

            self.context.clearRect(0, 0, self.canvas.width, self.canvas.height);
    
            self.context.drawImage(self._fboImage, 0, 0);
            self.context.drawImage(self._secondaryFboImage, 0, 0);

            if (self._history.length === self.numUndos + 1) {
                self._history.shift();
            }

            var image = self.canvas.toDataURL();
            self._history.push(image);

            self._fboImageTemp = self._fboImage.cloneNode(true);
            self._fboImageTemp.onload = function(){}; //no-op

            self._fboImage.src = image;

            self.secondaryCanvas.style.display = "none";
            self._parentContext.drawImage(self._secondaryFboImage, 0, 0);
            self._fboImageLoadWaiting = true;
        };

        //// https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image
        //// uncommenting this causes error described here:
        //// https://github.com/brangerbriz/BBMod.js/issues/1
        // this._fboImage.crossOrigin = "anonymous";

        /**
         * An array of BB.Pointer object used to control the brushes drawn to
         * brush mananger
         * @property _pointers
         * @type {Array}
         * @protected
         */
        this._pointers = [];

        /**
         * An array of booleans indicating which pointers are currently active (down)
         * @property _pointerStates
         * @type {Array}
         * @protected
         */
        this._pointerStates = [];

        /**
         * Internal flag to determine if BB.BrushManager2D.undo() was called
         * since the BB.BrushManager2D.update()
         * @property _needsUndo
         * @type {Boolean}
         * @protected
         */
        this._needsUndo = false;

        /**
         * Internal flag to determine if BB.BrushManager2D.redo() was called
         * since the BB.BrushManager2D.update()
         * @property _needsRedo
         * @type {Boolean}
         * @protected
         */
        this._needsRedo = false;

        /**
         * Boolean that holds true if at least one pointer is active (down)
         * @property _somePointersDown
         * @type {Boolean}
         * @protected
         */
        this._somePointersDown = false;

        /**
         * Internal flag checked against in BB.BrushManager2D.draw() that
         * holds wether or not _fboImage is finished loaded. Note: this flag is
         * purposefully not set when _fboImage.src is set from undo() or redo().
         * @property _fboImageLoadWaiting
         * @type {Boolean}
         * @protected
         */
        this._fboImageLoadWaiting = false;

        // add empty canvas to the history
        this._history.push(this.canvas.toDataURL());
    };

    /**
     * The number of undo/redo states to save
     * @property numUndos
     * @type {Number}
     * @default 5
     */
    Object.defineProperty(BB.BrushManager2D.prototype, "numUndos", {
        get: function() {
            return this._numUndos;
        },
        set: function(val) {
            
            this._numUndos = val;
            
            // remove old undos if they exist
            if (this._numUndos < this._history.length - 1) {
                this._history.splice(0, this._history.length - this._numUndos - 1);
            }
        }
    });

    /**
     * Set the brush manager to use these pointers when drawing.
     * BB.BrushManager2D must be tracking at least one pointer in order to
     * update().
     * @method trackPointers
     * @param  {Array} pointers An array of BB.Pointer objects for
     * BB.BrushManager2D to track.
     */
    BB.BrushManager2D.prototype.trackPointers = function(pointers) {
        
        if (pointers instanceof Array) {

            for (var i = 0; i < pointers.length; i++) {
             
                var pointer = pointers[i];
                if (! (pointer instanceof BB.Pointer)) {
                    throw new Error('BB.BrushManager2D.trackPointers: pointers[' +
                        i + '] is not an instance of BB.Pointer.');
                } else {
                    this._pointers.push(pointer);
                    this._pointerStates.push(pointer.isDown);
                }
            }

        } else {
            throw new Error('BB.BrushManager2D.trackPointers: pointers parameter must be an array of pointers.');
        }
    };

    /**
     * Untrack all pointers.
     * @method untrackPointers
     */
    BB.BrushManager2D.prototype.untrackPointers = function() {
        this._pointers = [];
        this._pointerStates = [];
    };

    /**
     * Untrack one pointer at index. Pointers tracked by BB.BrushManager2D
     * have indexes based on the order they were added by calls to
     * BB.BrushManager2D.trackPointers(...). Untracking a pointer removes it
     * from the internal _pointers array which changes the index of all pointers
     * after it. Keep this in mind when using this method.
     * @method untrackPointerAtIndex
     * @param {Number} index The index of the pointer to untrack.
     */
    BB.BrushManager2D.prototype.untrackPointerAtIndex = function(index) {
        
        if (typeof this._pointers[index] !== 'undefined') {
            this._pointers.splice(index, 1);
            this._pointerStates.splice(index, 1);
        } else {
            throw new Error('BB.BrushManager2D.untrackPointerAtIndex: Invalid pointer index ' +
                index + '. there is no pointer at that index.');
        }
    };

    /**
     * A method to determine if the brush manager is currently tracking pointers.
     * @method hasPointers
     * @return {Boolean} True if brush manager is tracking pointers.
     */
    BB.BrushManager2D.prototype.hasPointers = function() {
        return this._pointers.length > 0;
    };

    /**
     * A method to determine if the brush manager currently has an undo state.
     * @method hasUndo
     * @return {Boolean} True if brush manager has an undo state in its queue.
     */
    BB.BrushManager2D.prototype.hasUndo = function() {
        return this._history.length > 1;
    };

    /**
     * A method to determine if the brush manager currently has an redo state.
     * @method hasRedo
     * @return {Boolean} True if brush manager has an redo state in its queue.
     */
    BB.BrushManager2D.prototype.hasRedo = function() {
        return this._purgatory.length > 0;
    };

    /**
     * BB.BrushManager2D's update method. Should be called once per animation frame.
     * @method update
     */
    BB.BrushManager2D.prototype.update = function() {

        if (! this.hasPointers()) {
            throw new Error('BB.BrushManager2D.update: You must add at least one pointer to ' +
                            'the brush manager with BB.BrushManager2D.addPointers(...)');
        }

        var somePointersDown = this._pointerStates.some(function(val){ return val === true; });

        // if there are no pointers down this frame
        // but there were some last frame
        if (this._somePointersDown && !somePointersDown) {

            this._secondaryFboImage.src = this.secondaryCanvas.toDataURL();
        }

        for (var i = 0; i < this._pointers.length; i++) {

            this._pointerStates[i] = this._pointers[i].isDown;
        }

        this._somePointersDown = somePointersDown;
       
        var image;

        if (this._needsUndo) {
            
            if (this._purgatory.length == this.numUndos + 1) {
                this._purgatory.shift();
            }

            this._purgatory.push(this._history.pop());

            this._fboImage.src = this._history[this._history.length - 1];
            
            this._needsUndo = false;

        } else if (this._needsRedo) {
            
            if (this._purgatory.length > 0) {

                image = this._purgatory.pop();
                this._fboImage.src = image;
                this._history.push(image);
                this._needsRedo = false;
            }
        
        } else if (this._somePointersDown) {

            if (this._purgatory.length > 0) {
                this._purgatory = [];
            }
        }
    };


    /**
     * Draws the brush manager scene to the canvas supplied in the
     * BB.BrushManager2D constructor or the optionally, "context" if it was
     * provided as a parameter. Should be called once per animation frame.
     * @method update
     * @param {[CanvasRenderingContext2D]} context An optional drawing context
     * that will be drawn to if it is supplied.
     */
    BB.BrushManager2D.prototype.draw = function(context) {

        if (typeof context === "undefined" ) {
            context = this._parentContext;
        } else if(! (context instanceof CanvasRenderingContext2D)) {
            throw new Error('BB.BrushManager2D.draw: context is not an instance of CanvasRenderingContext2D');
        }

        // if the image has loaded
        if (this._fboImage.complete) {

            context.drawImage(this._fboImage, 0, 0);   

        } else if (this._fboImageTemp !== null){

            context.drawImage(this._fboImageTemp, 0, 0);

            if (this._fboImageLoadWaiting) {

                context.drawImage(this._secondaryFboImage, 0, 0);

            }
        }
    };

    /**
     * Undo one drawing action if available
     * @method undo
     */
    BB.BrushManager2D.prototype.undo = function() {

        if (this._history.length > 1) {
            this._needsUndo = true; 
        }
    };

    /**
     * Redo one drawing action if available
     * @method redo
     */
    BB.BrushManager2D.prototype.redo = function() {

        if (this._history.length > 0) {
            this._needsRedo = true;
        }
    };

    /**
     * Notifies brush manager that the canvas passed into the
     * BB.BrushManager2D constructor has been moved or resized. It is
     * important to call this method whenever the positional CSS from the parent
     * canvas is changed so that BB.BrushManager2D's internal canvases may be
     * updated appropriately.
     * @method updateCanvasPosition
     * @example
     * <code class="code prettyprint">
     * &nbsp;var canvas = document.getElementById('canvas');<br>
     * &nbsp;var brushManager = new BB.BrushManager(canvas);<br>
     * <br>
     * &nbsp;window.onresize = function() {<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;canvas.width  = window.innerWidth;<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;canvas.height = window.innerHeight;<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;brushManager.updateCanvasPosition();<br>
     * &nbsp;}
     * </code>
     */
    BB.BrushManager2D.prototype.updateCanvasPosition = function() {

        this.canvas.width = this._parentCanvas.width;
        this.canvas.height = this._parentCanvas.height;

        this.secondaryCanvas.width  = this.canvas.width;
        this.secondaryCanvas.height = this.canvas.height;

        var parentCanvasStyle = window.getComputedStyle(this._parentCanvas);

        this.secondaryCanvas.style.position      = 'absolute';
        this.secondaryCanvas.style.pointerEvents = 'none';
        this.secondaryCanvas.style.top           = parentCanvasStyle.getPropertyValue('top');
        this.secondaryCanvas.style.right         = parentCanvasStyle.getPropertyValue('right');
        this.secondaryCanvas.style.bottom        = parentCanvasStyle.getPropertyValue('bottom');
        this.secondaryCanvas.style.left          = parentCanvasStyle.getPropertyValue('left');
        this.secondaryCanvas.style.margin        = parentCanvasStyle.getPropertyValue('margin');
        this.secondaryCanvas.style.border        = parentCanvasStyle.getPropertyValue('border');
        this.secondaryCanvas.style.padding       = parentCanvasStyle.getPropertyValue('padding');
        
        var parentZIndex = parentCanvasStyle.getPropertyValue('z-index');

        if (isNaN(parentZIndex)) {

            parentZIndex = 0;
            this.secondaryCanvas.style.zIndex = parentZIndex + 1;

            throw new Error('BB.BrushManager2D: the HTML5 canvas passed into the BB.BrushManager2D' +
                ' constructor should have a z-index property value that is numeric. Currently the value is "' +
                parentZIndex + '".');

        } else {
            parentZIndex = parseInt(parentZIndex);
            this.secondaryCanvas.style.zIndex = parentZIndex + 1;
        } 
    };

    return BB.BrushManager2D;
});

/**
 * Base 2D brush class extended by BB.ImageBrush2D, BB.LineBrush2D, etc...
 * @module BB.BaseBrush2D
 */
define('BB.BaseBrush2D',['./BB', './BB.BrushManager2D', './BB.Color'],
function(  BB,        BrushManager2D,        Color){

    'use strict';

    BB.BaseBrush2D = BrushManager2D;
    BB.Color       = Color;

    /**
     * Base 2D brush class extended by BB.ImageBrush2D, BB.LineBrush2D,
     * etc...
     * @class BB.BaseBrush2D
     * @constructor
     * @param {Object} [config] An optional config hash to initialize any of
     * BB.BaseBrush2D's public properties
     * @example <code class="code prettyprint">&nbsp;var brush = new BB.BaseBrush2D({ width: 100,
     * height: 100, color: new BB.Color(255, 0, 0) }); </code>
     */
    BB.BaseBrush2D = function(config) {

        /**
         * The brush's x position.
         * @property x
         * @type Number
         * @default 0
         */
        this.x        = (config && config.x && typeof config.x === 'number') ? config.x : 0;

        /**
         * The brush's y position.
         * @property y
         * @type Number
         * @default 0
         */
        this.y        = (config && config.y && typeof config.y === 'number') ? config.y : 0;

        /**
         * The brush's width.
         * @property width
         * @type Number
         * @default 10
         */
        this.width    = (config && config.width && typeof config.width === 'number') ? config.width : 10;

        /**
         * The brush's height.
         * @property height
         * @type Number
         * @default 10
         */
        this.height   = (config && config.height && typeof config.height === 'number') ? config.height : 10;

        /**
         * The brush's rotation in degrees. This property is not always used with each brush variant.
         * @property rotation
         * @type Number
         * @default 0
         */
        this.rotation = (config && config.rotation && typeof config.rotation === 'number') ? config.rotation : 0;
        
        /**
         * The brush's color.
         * @property color
         * @type BB.Color
         * @default null
         */
        this.color    = (config && config.color && config.color instanceof BB.Color) ? config.color : null;
        
        /**
         * Wether or not to draw the brush to the screen. Toggle this variable
         * to hide and show the brush.
         * @property hidden
         * @type Boolean
         * @default false
         */
        this.hidden   = (config && config.hidden && typeof hidden === 'boolean') ? config.hidden : false;
        
        /**
         * The type of brush. Defaults to "base" for BB.BaseBrush, "image" for
         * BB.ImageBrush, etc... and should be treated as read-only.
         * @property type
         * @type String
         * @default "base"
         */
        this.type    = "base";

        this.manager = (config && config.manager && config.manager instanceof BB.BrushManager2D) ? config.manager : null;
    };

    /**
     * Base update method. Usually called once per animation frame.
     * @method update
     * @param {Object} controllerModule An object with x and y properties and
     * optionally an isDown boolean (used for beginning and ending
     * strokeds/marks).
     * @example <code class="code prettyprint">
     * &nbsp;var mouseInput = new BB.MouseInput(document.getElementById('canvas'));<br>
     * &nbsp;var pointer = new BB.Pointer(mouseInput);<br>
     * &nbsp;var brush = new BB.BaseBrush2D();<br>
     * <br>
     * &nbsp; // called once per animation frame (from somewhere else in your app)<br>
     * &nbsp;function update() {<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;mouseInput.update();<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;pointer.update();<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;brush.update(pointer); // update the brush using the pointer<br>
     * &nbsp;}
     * </code>
     */
    BB.BaseBrush2D.prototype.update = function(controllerModule) {

        if (controllerModule !== undefined) {
            
            if (controllerModule.x !== undefined && typeof controllerModule.x === 'number') {
                this.x = controllerModule.x;
            } else {
                throw new Error('BB.BaseBrush.update: controllerModule parameter does not have a valid x parameter');
            }

            if (controllerModule.y !== undefined && typeof controllerModule.y === 'number') {
                this.y = controllerModule.y;
            } else {
                throw new Error('BB.BaseBrush.update: controllerModule parameter does not have a valid y parameter');
            }

        } else {
            throw new Error('BB.BaseBrush.update: missing controllerModule parameter');
        }
    };

    /**
     * Base draw method. Usually called once per animation frame.
     * @method draw 
     */
    BB.BaseBrush2D.prototype.draw = function(context) {

        if (!context) {
            throw new Error('BB.BaseBrush.draw: Invalid context parameter');
        }

        var returnContext = context;

        if(this.manager instanceof BB.BrushManager2D) {
            returnContext = this.manager.secondaryContext;   
        }

        return returnContext;
    };

    /**
     * Multiplies width and height properties by amount.
     * @method scale
     * @param {Number} amount Amount to scale width and height by
     * @example <code class="code prettyprint"> &nbsp; var brush = new BB.BaseBrush2D({ width: 50, height: 100 });<br>
     * &nbsp; brush.scale(2);<br>
     * &nbsp; brush.width // 100<br>
     * &nbsp; brush.height // 200
     * </code>
     */
    BB.BaseBrush2D.prototype.scale = function(amount) {
        
        if (typeof amount === 'number') {
            
            this.width *= amount;
            this.height *= amount;

        } else {
            throw new Error("BB.BaseBrush2D.scale: scale is not a number type");
        }
    };

    return BB.BaseBrush2D;
});

/**
 * A 2D brush module for drawing images in a stamp-like style.
 * @module BB.ImageBrush2D
 * @extends BB.BaseBrush2D
 */
define('BB.ImageBrush2D',['./BB', './BB.BaseBrush2D', './BB.Color', './BB.MathUtils'], 
function(  BB,        BaseBrush2D,        Color,        MathUtils){

    'use strict';

    BB.BaseBrush2D = BaseBrush2D;
    BB.Color       = Color;
    BB.MathUtils   = MathUtils;

    var drawReady = false;
    var initSrcSet = false;

    /**
     * A brush module for drawing images in a stamp-like style.
     * @class BB.ImageBrush2D
     * @constructor
     * @extends BB.BaseBrush2D
     * @param {Object} [config] A optional config hash to initialize any of
     * BB.ImageBrush2D's public properties.
     * @example <code class="code prettyprint">&nbsp;var imageBrush = new BB.ImageBrush2D({ width: 100,
     * height: 100, src: "some/image.png" }); </code>
     */
    BB.ImageBrush2D = function(config) {

        BB.BaseBrush2D.call(this, config);

        /**
         * The type of brush. This property should be treated as read-only.
         * @property type
         * @type String
         * @default "image"
         */
        
        this.type = 'image';

        /**
         * The current brush variant.
         * @property variant
         * @type String
         * @default null
         */
        this.variant = null;

        /**
         * The internal image element used to load and draw to screen.
         * @protected
         * @property _image
         * @type Image
         * @default null
         */
        this._image = null;

        /**
         * An internal variable to check if the variant has been changed since
         * the last update().
         * @protected
         * @property _lastVariant
         * @type String
         * @default null
         */
        this._lastVariant = null;

        /**
         * An internal variable to check if the color has been changed since
         * the last update().
         * @protected
         * @property _lastColor
         * @type Object
         * @default null
         */
        this._lastColor = new BB.Color();


        /**
         * A private method used by src's getters and setters.
         * @private
         * @property _src
         * @type String
         * @default null
         */
        this._src = null;

         /**
          * An array of all supported variants. For the BB.ImageBrush2D class
          * these are a list of pre-made SVGs with programmatic control for
          * changing their color.
          * @property variants
          * @type Array
         */
        this.variants = [
            'star',
            'wave',
            'heart',
            'bolt',
            'balls',
            'drips',
            'flames',
            'grid',
            'cube',
            'circles',
            'shield',
            'locking',
            'seal',
            'circleslash'
        ];

        if (config) {

            if (config.src && config.variant) {
                throw new Error('BB.ImageBrush2D: The config.src and config.variant properties are mutually exlusive'+
                                'and cannot both be included in the same config object.');
            }

            if (config.src && typeof config.src === 'string') this.src = config.src;
            if (config.variant && 
                typeof config.variant === 'string' && 
                this.variants.indexOf(config.variant) !== -1) {
                this.variant = config.variant;
            }  
        }   
    };

    BB.ImageBrush2D.prototype = Object.create(BB.BaseBrush2D.prototype);
    BB.ImageBrush2D.prototype.constructor = BB.ImageBrush2D;

    /**
     * The brush's image src. Functionally equivalent to the src property of an
     * Image element. When src is not null no variants are used (i.e. the
     * variant property is set to null).
     * @property src
     * @type String
     * @default null
     */   
    Object.defineProperty(BB.ImageBrush2D.prototype, 'src', {
        get: function() {
            return this._src;
        },
        set: function(val) {
            
            this._src = val;
            this.variant = null;

            drawReady = false;
            this._image = new Image();
            this._image.src = this.src;
            this._image.onload = function() {
                drawReady = true;
            };

            initSrcSet = true; // notify debug that source has been set
        }
    });

    /**
     * Update method. Usually called once per animation frame.
     * @method update
     * @param {Object} controllerModule An object with x and y properties and
     * optionally an isDown boolean (used for beginning and ending
     * strokeds/marks).
     * @example <code class="code prettyprint">
     * &nbsp;var mouseInput = new BB.MouseInput(document.getElementById('canvas'));<br>
     * &nbsp;var pointer = new BB.Pointer(mouseInput);<br>
     * &nbsp;var brush = new BB.ImageBrush2D();<br>
     * <br>
     * &nbsp; // called once per animation frame (from somewhere else in your app)<br>
     * &nbsp;function update() {<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;mouseInput.update();<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;pointer.update();<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;brush.update(pointer); // update the brush using the pointer<br>
     * &nbsp;}
     * </code>
     */
    BB.ImageBrush2D.prototype.update = function(controllerModule) {
        
        BB.BaseBrush2D.prototype.update.call(this, controllerModule);

        if (controllerModule.hasOwnProperty('isDown')) {
            this.hidden = (controllerModule.isDown === false);
        }

    };

    /**
     * Draws the brush to the context. Usually called once per animation frame.
     * @method draw
     * @param {Object} context The HTML5 canvas context you would like to draw
     * to.
     */
    BB.ImageBrush2D.prototype.draw = function(context) {
        
        function getColoredSVGVariant() {
        
            var r, g, b, a;
            if (self.color && self.color instanceof BB.Color) {
                r = self.color.r;
                g = self.color.g;
                b = self.color.b;
                a = self.color.a;
            } else {
                r = 255;
                g = 255;
                b = 255;
                a = 255;
            }

            switch(self.variant){
                    case 'star' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="200px" height="200px" viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M143.169,166.502L100,135.139l-43.169,31.363l16.489-50.746L30.152,84.391h53.359L100,33.644l16.489,50.748h53.358 l-43.168,31.365L143.169,166.502z M100,127.723l31.756,23.072l-12.13-37.332l31.757-23.072H112.13L100,53.06L87.87,90.391H48.618 l31.756,23.072l-12.13,37.332L100,127.723z"/></svg>';
                    case 'wave' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="200px" height="200px" viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><g><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M163.888,97.971c-5.43-5.354-11.042-10.887-22.235-10.887c-11.195,0-16.806,5.533-22.234,10.887 c-5.101,5.027-9.918,9.777-19.685,9.777c-9.766,0-14.581-4.75-19.684-9.777c-5.427-5.354-11.039-10.887-22.233-10.887 c-11.193,0-16.806,5.533-22.233,10.887c-5.1,5.027-9.919,9.777-19.684,9.777c-0.13,0-0.25-0.01-0.379-0.012v5.169 c0.129,0.002,0.249,0.012,0.379,0.012c11.192,0,16.806-5.536,22.233-10.887c5.101-5.028,9.917-9.781,19.684-9.781 c9.766,0,14.584,4.753,19.685,9.781c5.427,5.351,11.04,10.887,22.232,10.887c11.194,0,16.807-5.536,22.233-10.887 c5.102-5.028,9.919-9.781,19.686-9.781c9.766,0,14.584,4.753,19.688,9.781c5.428,5.351,11.04,10.887,22.234,10.887 c0.312,0,0.602-0.02,0.905-0.028v-5.169c-0.302,0.011-0.594,0.028-0.905,0.028C173.808,107.748,168.987,102.998,163.888,97.971z"/><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M183.574,113.917c-11.601,0-17.361-5.679-22.932-11.169c-4.964-4.892-9.641-9.499-18.99-9.499 c-9.352,0-14.027,4.608-18.977,9.486c-5.581,5.503-11.341,11.182-22.942,11.182c-11.601,0-17.361-5.68-22.932-11.173 c-4.957-4.886-9.632-9.495-18.985-9.495c-9.352,0-14.026,4.608-18.974,9.485c-5.583,5.504-11.343,11.183-22.943,11.183 c-0.087,0-0.17-0.003-0.253-0.007l-1.125-0.02v-7.17l1.379,0.027c9.355,0,14.031-4.609,18.981-9.489 c5.57-5.494,11.33-11.175,22.936-11.175c11.608,0,17.367,5.681,22.936,11.175c4.957,4.884,9.631,9.489,18.981,9.489 c9.354,0,14.03-4.607,18.979-9.487c5.574-5.497,11.334-11.177,22.939-11.177c11.604,0,17.365,5.681,22.938,11.175 c4.95,4.88,9.626,9.489,18.984,9.489c0.209,0,0.408-0.009,0.608-0.018l1.297-0.047v7.176l-1.278,0.041 C183.994,113.908,183.789,113.917,183.574,113.917z M57.816,91.249c10.173,0,15.132,4.889,20.382,10.065 c5.291,5.216,10.754,10.603,21.535,10.603c10.782,0,16.245-5.386,21.527-10.595c5.261-5.186,10.22-10.073,20.392-10.073 c10.17,0,15.129,4.887,20.381,10.06c5.281,5.207,10.729,10.576,21.446,10.608v-3.169c-10.114-0.03-15.06-4.905-20.294-10.065 c-5.285-5.21-10.75-10.599-21.533-10.599c-10.785,0-16.248,5.388-21.531,10.598c-5.254,5.178-10.213,10.066-20.388,10.066 c-10.17,0-15.128-4.885-20.376-10.056c-5.292-5.22-10.753-10.608-21.541-10.608c-10.786,0-16.249,5.388-21.531,10.599 c-5.143,5.069-10.006,9.864-19.765,10.06v3.169c10.37-0.203,15.725-5.481,20.906-10.589C42.687,96.136,47.645,91.249,57.816,91.249 z"/></g><g><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M163.888,76.934c-5.43-5.352-11.042-10.884-22.235-10.884c-11.195,0-16.806,5.532-22.234,10.884 c-5.101,5.031-9.918,9.781-19.685,9.781c-9.766,0-14.581-4.75-19.684-9.781C74.623,71.582,69.011,66.05,57.816,66.05 c-11.193,0-16.806,5.532-22.233,10.884c-5.1,5.031-9.919,9.781-19.684,9.781c-0.13,0-0.25-0.011-0.379-0.012v5.165 c0.129,0.002,0.249,0.012,0.379,0.012c11.192,0,16.806-5.532,22.233-10.883c5.101-5.031,9.917-9.782,19.684-9.782 c9.766,0,14.584,4.751,19.685,9.782c5.427,5.351,11.04,10.883,22.232,10.883c11.194,0,16.807-5.532,22.233-10.883 c5.102-5.031,9.919-9.782,19.686-9.782c9.766,0,14.584,4.751,19.688,9.782c5.428,5.351,11.04,10.883,22.234,10.883 c0.312,0,0.602-0.019,0.905-0.028v-5.165c-0.302,0.011-0.594,0.028-0.905,0.028C173.808,86.715,168.987,81.965,163.888,76.934z"/><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M183.574,92.88c-11.604,0-17.365-5.679-22.937-11.171c-4.953-4.883-9.631-9.494-18.985-9.494 c-9.356,0-14.033,4.612-18.983,9.494c-5.57,5.492-11.329,11.171-22.936,11.171c-11.605,0-17.364-5.679-22.935-11.171 c-4.95-4.882-9.625-9.494-18.982-9.494c-9.356,0-14.032,4.612-18.981,9.494C33.264,87.201,27.503,92.88,15.899,92.88 c-0.087,0-0.17-0.003-0.253-0.007l-1.125-0.02v-7.158l1.379,0.02c9.359,0,14.033-4.611,18.981-9.493 c5.571-5.493,11.331-11.172,22.936-11.172c11.607,0,17.366,5.679,22.936,11.172c4.953,4.883,9.628,9.493,18.981,9.493 c9.358,0,14.033-4.611,18.982-9.493c5.573-5.494,11.333-11.172,22.937-11.172c11.603,0,17.364,5.679,22.936,11.17 c4.95,4.883,9.624,9.495,18.986,9.495c0.209,0,0.408-0.009,0.608-0.017l1.297-0.047v7.169l-1.251,0.042 C184.014,92.871,183.799,92.88,183.574,92.88z M57.816,70.215c10.178,0,15.137,4.892,20.387,10.07 c5.283,5.208,10.746,10.595,21.53,10.595c10.786,0,16.249-5.386,21.531-10.595c5.251-5.179,10.211-10.07,20.388-10.07 c10.175,0,15.136,4.891,20.389,10.069c5.27,5.195,10.717,10.564,21.438,10.596v-3.165c-10.118-0.03-15.062-4.907-20.294-10.069 c-5.285-5.209-10.75-10.596-21.533-10.596s-16.246,5.385-21.529,10.594c-5.252,5.18-10.211,10.071-20.39,10.071 c-10.174,0-15.133-4.89-20.383-10.066C74.065,72.437,68.603,67.05,57.816,67.05c-10.785,0-16.248,5.387-21.531,10.596 c-5.141,5.072-10.002,9.868-19.765,10.063v3.166c10.374-0.203,15.729-5.481,20.91-10.589C42.681,75.106,47.64,70.215,57.816,70.215 z"/></g><g><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M163.888,119.004c-5.43-5.351-11.042-10.884-22.235-10.884c-11.195,0-16.806,5.533-22.234,10.884 c-5.101,5.031-9.918,9.781-19.685,9.781c-9.766,0-14.581-4.75-19.684-9.781c-5.427-5.351-11.039-10.884-22.233-10.884 c-11.193,0-16.806,5.533-22.233,10.884c-5.1,5.031-9.919,9.781-19.684,9.781c-0.13,0-0.25-0.01-0.379-0.012v5.165 c0.129,0.002,0.249,0.012,0.379,0.012c11.192,0,16.806-5.532,22.233-10.883c5.101-5.031,9.917-9.781,19.684-9.781 c9.766,0,14.584,4.75,19.685,9.781c5.427,5.351,11.04,10.883,22.232,10.883c11.194,0,16.807-5.532,22.233-10.883 c5.102-5.031,9.919-9.781,19.686-9.781c9.766,0,14.584,4.75,19.688,9.781c5.428,5.351,11.04,10.883,22.234,10.883 c0.312,0,0.602-0.019,0.905-0.028v-5.165c-0.302,0.011-0.594,0.028-0.905,0.028C173.808,128.785,168.987,124.035,163.888,119.004z" /><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M183.574,134.95c-11.604,0-17.365-5.679-22.937-11.171c-4.952-4.882-9.63-9.493-18.985-9.493 c-9.357,0-14.033,4.611-18.983,9.493c-5.57,5.492-11.329,11.171-22.936,11.171c-11.605,0-17.364-5.679-22.935-11.171 c-4.949-4.882-9.624-9.493-18.982-9.493c-9.357,0-14.032,4.611-18.981,9.493c-5.571,5.492-11.332,11.171-22.936,11.171 c-0.087,0-0.17-0.003-0.253-0.007l-1.125-0.02v-7.166l1.379,0.027c9.359,0,14.033-4.611,18.981-9.493 c5.572-5.493,11.333-11.172,22.936-11.172c11.604,0,17.365,5.679,22.936,11.172c4.953,4.884,9.628,9.493,18.981,9.493 c9.358,0,14.033-4.611,18.982-9.493c5.575-5.495,11.335-11.172,22.937-11.172c11.601,0,17.361,5.677,22.934,11.167 c4.952,4.887,9.626,9.498,18.988,9.498c0.209,0,0.408-0.009,0.608-0.018l1.297-0.047v7.17l-1.251,0.041 C184.014,134.941,183.799,134.95,183.574,134.95z M57.816,112.286c10.179,0,15.137,4.892,20.387,10.069 c5.283,5.209,10.746,10.595,21.53,10.595c10.786,0,16.249-5.386,21.531-10.595c5.251-5.178,10.21-10.069,20.388-10.069 c10.176,0,15.137,4.892,20.39,10.069c5.269,5.193,10.716,10.562,21.438,10.595v-3.165c-10.118-0.03-15.062-4.907-20.294-10.069 c-5.288-5.211-10.752-10.596-21.533-10.596s-16.244,5.384-21.527,10.591c-5.254,5.184-10.213,10.074-20.392,10.074 c-10.174,0-15.133-4.89-20.383-10.066c-5.286-5.212-10.75-10.599-21.534-10.599c-10.783,0-16.247,5.386-21.53,10.595 c-5.142,5.072-10.003,9.869-19.766,10.064v3.165c10.374-0.203,15.729-5.481,20.91-10.589 C42.68,117.178,47.639,112.286,57.816,112.286z"/></g></svg>';
                    case 'heart' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="200px" height="200px" viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M100.857,149.971l-1.664-1.108c-0.396-0.265-9.854-6.593-21.034-16.174c-15.13-12.966-25.576-25.093-31.049-36.041 c-4.48-8.961-3.554-20.14,2.479-29.903c6.141-9.937,16.242-16.109,26.361-16.109c6.568,0,15.979,2.534,24.906,14.006 c8.923-11.473,18.333-14.006,24.901-14.006c10.118,0,20.219,6.173,26.361,16.111c6.033,9.763,6.961,20.941,2.48,29.902 c-5.474,10.948-15.92,23.075-31.048,36.041c-11.179,9.581-20.635,15.909-21.031,16.173L100.857,149.971z M75.951,56.635 c-8.056,0-16.201,5.083-21.258,13.264c-4.932,7.981-5.761,16.978-2.216,24.066c10.766,21.538,40.951,43.557,48.38,48.758 c7.428-5.201,37.608-27.221,48.376-48.758c3.544-7.087,2.715-16.083-2.218-24.064c-5.057-8.183-13.202-13.266-21.257-13.266 c-8.201,0-15.949,5.119-22.405,14.804l-2.496,3.744l-2.496-3.744C91.903,61.754,84.153,56.635,75.951,56.635z"/></svg>';
                    case 'bolt' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="200px" height="200px" viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M76.247,183.564l19.897-73.016l-30.646,8.619L124.41,16.836l-18.489,70.369l30.463-7.496L76.247,183.564z M103.289,103.345 l-12.116,44.466l34.996-60.438L98.948,94.07l11.108-42.281l-34.107,59.244L103.289,103.345z"/></svg>';
                    case 'balls' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="200px" height="200px" viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><g> <g> <circle fill="#FFFFFF" cx="29.57" cy="100" r="6.961"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M29.569,109.461c-5.217,0-9.461-4.244-9.461-9.461c0-5.217,4.244-9.461,9.461-9.461c5.217,0,9.462,4.244,9.462,9.461 C39.031,105.217,34.787,109.461,29.569,109.461z M29.569,95.539c-2.46,0-4.461,2.001-4.461,4.461s2.001,4.461,4.461,4.461 c2.46,0,4.462-2.001,4.462-4.461S32.03,95.539,29.569,95.539z"/> </g> <g> <circle fill="#FFFFFF" cx="40.77" cy="100" r="11.2"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M40.77,113.699c-7.554,0-13.7-6.145-13.7-13.699s6.146-13.7,13.7-13.7s13.7,6.146,13.7,13.7S48.324,113.699,40.77,113.699 z M40.77,91.3c-4.797,0-8.7,3.903-8.7,8.7c0,4.796,3.903,8.699,8.7,8.699s8.7-3.902,8.7-8.699 C49.47,95.203,45.567,91.3,40.77,91.3z"/> </g> <g> <circle fill="#FFFFFF" cx="56.45" cy="100.001" r="15.68"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M56.45,118.18c-10.025,0-18.181-8.154-18.181-18.179c0-10.025,8.156-18.181,18.181-18.181 c10.024,0,18.18,8.156,18.18,18.181C74.63,110.025,66.475,118.18,56.45,118.18z M56.45,86.82c-7.268,0-13.181,5.913-13.181,13.181 c0,7.267,5.913,13.179,13.181,13.179c7.267,0,13.18-5.912,13.18-13.179C69.63,92.733,63.717,86.82,56.45,86.82z"/> </g> <g> <path fill="#FFFFFF" d="M97.411,100.001c0,12.124-9.826,21.95-21.951,21.95s-21.953-9.826-21.953-21.95 c0-12.126,9.828-21.953,21.953-21.953S97.411,87.875,97.411,100.001z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M75.46,124.451c-13.483,0-24.453-10.968-24.453-24.45c0-13.483,10.97-24.453,24.453-24.453 c13.482,0,24.451,10.97,24.451,24.453C99.911,113.483,88.942,124.451,75.46,124.451z M75.46,80.548 c-10.727,0-19.453,8.727-19.453,19.453c0,10.725,8.727,19.45,19.453,19.45c10.726,0,19.451-8.725,19.451-19.45 C94.911,89.275,86.186,80.548,75.46,80.548z"/> </g> <g> <path fill="#FFFFFF" d="M131.52,100.002c0,16.973-13.757,30.73-30.732,30.73c-16.975,0-30.734-13.758-30.734-30.73 c0-16.977,13.76-30.734,30.734-30.734C117.763,69.268,131.52,83.025,131.52,100.002z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M100.787,133.232c-18.326,0-33.234-14.907-33.234-33.23c0-18.326,14.909-33.234,33.234-33.234 c18.324,0,33.232,14.909,33.232,33.234C134.02,118.325,119.111,133.232,100.787,133.232z M100.787,71.768 c-15.568,0-28.234,12.666-28.234,28.234c0,15.566,12.666,28.23,28.234,28.23c15.567,0,28.232-12.664,28.232-28.23 C129.02,84.434,116.354,71.768,100.787,71.768z"/> </g> <g> <path fill="#FFFFFF" d="M177.392,100.002c0,23.762-19.26,43.023-43.025,43.023c-23.765,0-43.028-19.262-43.028-43.023 c0-23.767,19.264-43.027,43.028-43.027C158.132,56.975,177.392,76.235,177.392,100.002z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M134.366,145.525c-25.104,0-45.528-20.422-45.528-45.523c0-25.104,20.424-45.527,45.528-45.527 c25.103,0,45.525,20.423,45.525,45.527C179.892,125.104,159.469,145.525,134.366,145.525z M134.366,59.475 c-22.347,0-40.528,18.181-40.528,40.527c0,22.345,18.182,40.523,40.528,40.523c22.346,0,40.525-18.179,40.525-40.523 C174.892,77.655,156.712,59.475,134.366,59.475z"/> </g></g></svg>';
                    case 'drips' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="200px" height="200px" viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><g> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" fill-rule="evenodd" clip-rule="evenodd" d="M101.807,72.491c2.018-6.874,5.617-16.757,1.506-23.193 c-3.905-6.113-11.555-2.917-9.19,2.807c0.845,2.044,2.733,4.043,4.164,5.59C102.023,61.739,102.396,67.181,101.807,72.491z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" fill-rule="evenodd" clip-rule="evenodd" d="M102.5,78.583c3.533-7.633,8.01-19.14,16.618-21.642 c8.178-2.376,12.458,6.369,5.941,9.589c-2.327,1.153-5.542,1.453-8.001,1.715C110.631,68.921,106.088,73.441,102.5,78.583z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" fill-rule="evenodd" clip-rule="evenodd" d="M91.772,109.562c-3.189,0-5.788-2.6-5.788-5.787c0-3.188,2.599-5.789,5.788-5.789 c3.187,0,5.787,2.6,5.787,5.789C97.559,106.963,94.959,109.562,91.772,109.562z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" fill-rule="evenodd" clip-rule="evenodd" d="M92.194,131.234c-6.503-19.299-14.249-48.189-34.315-56.477 c-19.065-7.87-31.666,12.05-16.825,21.523c5.301,3.386,12.955,4.963,18.809,6.231C75.167,105.832,84.912,117.914,92.194,131.234z" /> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" fill-rule="evenodd" clip-rule="evenodd" d="M76.101,133.059c-3.35,0-6.083-2.73-6.083-6.082c0-3.35,2.733-6.082,6.083-6.082 s6.083,2.732,6.083,6.082C82.184,130.328,79.451,133.059,76.101,133.059z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" fill-rule="evenodd" clip-rule="evenodd" d="M89.065,158.012c5.576-29.148,11.079-72.364,38.403-88.272 c25.97-15.111,48.07,11.163,28.528,27.756c-6.976,5.93-17.731,9.706-25.92,12.691C108.635,117.994,96.933,137.352,89.065,158.012z" /> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" fill-rule="evenodd" clip-rule="evenodd" d="M87.855,94.271c-7.565,0-13.765-6.177-13.765-13.762 c0-7.574,6.2-13.766,13.765-13.766c7.582,0,13.779,6.192,13.779,13.766C101.635,88.095,95.438,94.271,87.855,94.271z"/></g></svg>';
                    case 'flames' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="200px" height="200px" viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><g> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M63.483,90.598c-3.254,1.794-8.575,0.489-11.714,3.509c-5.267,5.55-0.616,10.749,2.557,11.73 c1.243,0.247,15.215,4.718,19.764-14.904c3.639-20.603,16.573-21.23,18.261-21.391c9.035-0.595,18.811,12.88,30.622,1.43 c-9.957,14.972-25.383,1.251-32.25,5.278c-6.976,5.473,0.198,14.331,8.895,14.506c8.654-0.223,23.721-21.253,39.99-20.315 c14.516,0.197,26.641,9.619,38.249,3.321c-17.349,13.542-34.842-6.068-46.412,7.426c-7.613,10.392,1.68,16.533,5.605,12.43 c4.882-5.322,5.061-10.038,15.093-13.023c-1.984,0.992-6.08,1.887-8.061,7.266c-7.678,19.46-15.369,10.928-32.023,8.443 c-21.055-1.89-38.226,8.402-34.416,16.959c6.045,10.555,14.871-2.84,17.743-5.967c12.424-13.883,18.651-0.719,28.922-3.318 c-9.886,4.56-10.58-2.643-18.756,0.986c-9.647,4.283-6.109,17.09-24.423,20.043c-12.009,2.284-14.78-4.71-27.778-7.777 c-4.35-1.104-8.429,0.705-8.606,4.795c1.343,10.4,13.821-1.748,21.315,3.486c-9.809-1.088-9.978,6.889-18.995,6.968 c-10.778-0.355-19.255-8.405-22.362-21.401c-2.542-13.35,3.411-25.616,21.315-24.789c27.918,2.146,21.619-8.761,32.04-14.024 C70.507,78.472,74.096,85.54,63.483,90.598"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M47.063,132.568h-0.002c-5.319-0.176-10.201-2.246-14.117-5.986c-3.923-3.746-6.804-9.101-8.33-15.484 c-1.417-7.443-0.151-14.012,3.563-18.5c3.758-4.541,9.958-6.764,17.844-6.4c2.383,0.183,4.598,0.276,6.586,0.276 c13.106,0,15.871-3.9,18.799-8.03c1.586-2.238,3.227-4.552,6.61-6.261l0.099,0.15c-3.255,2.676-4.435,5.528-5.576,8.287 c-1.528,3.692-2.972,7.179-9.017,10.06c-1.384,0.763-3.106,0.966-4.931,1.181c-2.441,0.288-4.967,0.586-6.76,2.311 c-2.521,2.657-2.568,5.06-2.164,6.606c0.65,2.49,2.899,4.419,4.685,4.972c0.053,0.011,0.146,0.033,0.267,0.062 c0.666,0.162,2.224,0.541,4.195,0.541c5.295,0,12.229-2.679,15.188-15.441c1.499-8.489,4.732-14.617,9.61-18.208 c2.545-1.873,5.435-2.963,8.587-3.24l0.143-0.013c0.199-0.013,0.399-0.02,0.601-0.02c2.966,0,5.978,1.389,9.166,2.858 c3.434,1.583,6.983,3.219,10.743,3.219c3.573,0,6.863-1.505,10.059-4.603l0.138,0.115c-3.234,4.863-7.427,7.228-12.817,7.228 c-3.174,0-6.29-0.76-9.305-1.495c-2.51-0.612-4.882-1.19-6.893-1.19c-1.321,0-2.39,0.25-3.265,0.763 c-2.446,1.92-3.312,4.438-2.428,7.084c1.348,4.033,6.196,7.151,11.278,7.253c3.505-0.09,8.1-3.648,13.42-7.768 c7.237-5.604,16.244-12.579,25.506-12.579c0.356,0,0.715,0.011,1.067,0.031c5.645,0.077,10.889,1.535,15.959,2.946 c4.698,1.307,9.136,2.541,13.459,2.541c3.237,0,6.11-0.705,8.783-2.155l0.099,0.151c-4.416,3.447-9.129,5.052-14.832,5.053 c-0.001,0-0.002,0-0.003,0c-3.783,0-7.47-0.704-11.035-1.385c-3.304-0.631-6.424-1.227-9.392-1.227 c-4.689,0-8.229,1.581-11.138,4.974c-3.861,5.271-3.026,8.846-2.184,10.507c0.942,1.858,2.782,3.059,4.688,3.059 c1.154,0,2.181-0.435,2.968-1.258c1.358-1.48,2.345-2.905,3.298-4.282c2.454-3.544,4.574-6.605,11.835-8.765l0.065,0.167 c-0.311,0.155-0.678,0.311-1.067,0.475c-2.106,0.89-5.289,2.234-6.948,6.741c-4.338,10.995-8.667,12.51-12.7,12.51 c-2.685,0-5.699-0.803-9.191-1.734c-2.989-0.797-6.378-1.7-10.23-2.275c-1.669-0.149-3.366-0.226-5.039-0.226 c-6.442,0-12.655,1.104-17.965,3.192c-4.929,1.938-8.672,4.591-10.54,7.467c-1.406,2.167-1.675,4.38-0.775,6.399 c1.493,2.606,3.288,3.932,5.332,3.932c4.098,0,8.351-5.193,10.891-8.297c0.539-0.658,1.004-1.227,1.371-1.625 c3.971-4.438,7.626-6.505,11.502-6.505c2.54,0,4.935,0.884,7.25,1.738c2.355,0.87,4.791,1.769,7.421,1.769 c0.954,0,1.868-0.113,2.793-0.348l0.061,0.17c-2.301,1.061-4.306,1.576-6.132,1.576c-1.697,0-3.04-0.434-4.339-0.854 c-1.256-0.407-2.442-0.79-3.899-0.79c-1.352,0-2.787,0.345-4.387,1.055c-3.8,1.688-5.55,4.723-7.401,7.936 c-2.79,4.84-5.952,10.326-17.044,12.114c-1.597,0.304-3.056,0.452-4.461,0.452c-4.63,0-7.831-1.653-11.536-3.567 c-3.132-1.618-6.681-3.451-11.816-4.663c-0.826-0.209-1.649-0.315-2.448-0.315c-3.541,0-5.915,1.973-6.048,5.026 c0.383,2.949,1.664,4.271,4.153,4.271c1.541,0,3.396-0.494,5.359-1.018c2.28-0.608,4.639-1.236,6.916-1.236 c1.922,0,3.508,0.455,4.849,1.391L66.05,125.6c-0.607-0.066-1.197-0.102-1.756-0.102c-3.988,0-6.122,1.676-8.381,3.449 c-2.244,1.762-4.564,3.583-8.848,3.621H47.063z M44.333,86.338c-7.026,0-12.564,2.204-16.016,6.375 c-3.681,4.447-4.933,10.963-3.526,18.347c1.518,6.346,4.38,11.67,8.278,15.392c3.883,3.709,8.724,5.762,13.996,5.936 c4.221-0.037,6.517-1.84,8.736-3.582c2.184-1.715,4.441-3.486,8.492-3.486c0.452,0,0.925,0.021,1.41,0.065 c-1.244-0.779-2.701-1.159-4.441-1.159c-2.254,0-4.601,0.626-6.87,1.23c-1.975,0.527-3.841,1.024-5.405,1.024 c-2.564,0-3.941-1.412-4.333-4.444c0.135-3.126,2.638-5.215,6.228-5.215c0.813,0,1.652,0.107,2.491,0.32 c5.155,1.217,8.716,3.056,11.856,4.678c3.685,1.904,6.867,3.547,11.453,3.547c1.394,0,2.842-0.146,4.43-0.449 c11.01-1.774,14.148-7.221,16.918-12.025c1.867-3.24,3.632-6.3,7.484-8.011c1.624-0.721,3.083-1.071,4.461-1.071 c1.485,0,2.685,0.389,3.955,0.8c1.285,0.416,2.614,0.847,4.283,0.846c1.583,0,3.307-0.396,5.248-1.205 c-0.648,0.112-1.299,0.169-1.97,0.169c-2.662,0-5.113-0.906-7.484-1.781c-2.3-0.849-4.679-1.727-7.187-1.727 c-3.82,0-7.434,2.048-11.368,6.445c-0.364,0.396-0.828,0.963-1.364,1.618c-2.562,3.128-6.849,8.364-11.031,8.364 c-2.113,0-3.962-1.356-5.493-4.031c-0.93-2.087-0.657-4.359,0.785-6.58c1.889-2.908,5.662-5.584,10.625-7.536 c5.331-2.097,11.566-3.205,18.031-3.205c1.678,0,3.381,0.077,5.061,0.228c3.868,0.577,7.262,1.481,10.256,2.28 c3.479,0.927,6.484,1.728,9.145,1.728c3.969,0,8.233-1.501,12.531-12.394c1.521-4.129,4.294-5.643,6.39-6.562 c-5.791,2.095-7.735,4.903-9.956,8.111c-0.958,1.382-1.947,2.812-3.315,4.303c-0.812,0.849-1.912,1.315-3.1,1.315 c-1.973,0-3.876-1.24-4.849-3.158c-0.861-1.698-1.72-5.346,2.203-10.701c2.951-3.441,6.533-5.042,11.279-5.042 c2.984,0,6.113,0.598,9.426,1.23c3.557,0.679,7.235,1.382,11.001,1.382c0.001,0,0.002,0,0.003,0c5.31,0,9.753-1.402,13.9-4.398 c-2.438,1.15-5.05,1.71-7.95,1.71c-4.349,0-8.797-1.237-13.508-2.548c-5.06-1.407-10.291-2.862-15.916-2.939 c-0.354-0.02-0.709-0.03-1.062-0.03c-9.199,0-17.804,6.662-25.396,12.541c-5.345,4.139-9.962,7.713-13.53,7.805 c-5.158-0.104-10.079-3.275-11.45-7.376c-0.91-2.724-0.023-5.313,2.498-7.291c0.914-0.537,2.012-0.794,3.366-0.794 c2.033,0,4.414,0.581,6.936,1.196c3.004,0.732,6.109,1.49,9.262,1.489c5.138,0,9.03-2.057,12.189-6.456 c-3.038,2.742-6.176,4.078-9.568,4.078c-3.8,0-7.368-1.645-10.819-3.236c-3.169-1.461-6.163-2.841-9.09-2.841 c-0.196,0-0.394,0.006-0.586,0.019l-0.141,0.013c-3.12,0.273-5.979,1.352-8.496,3.205c-4.839,3.563-8.049,9.652-9.541,18.099 c-2.986,12.882-10.004,15.587-15.364,15.587c-0.001,0,0,0,0,0c-1.993,0-3.566-0.383-4.237-0.547 c-0.118-0.029-0.209-0.051-0.269-0.062c-1.887-0.584-4.142-2.521-4.816-5.103c-0.416-1.591-0.369-4.059,2.212-6.779 c1.84-1.771,4.396-2.072,6.867-2.363c1.806-0.213,3.512-0.415,4.868-1.163c5.987-2.854,7.418-6.31,8.932-9.969 c1.074-2.593,2.182-5.27,4.999-7.814c-2.861,1.643-4.361,3.759-5.816,5.812c-2.955,4.168-5.746,8.106-18.946,8.106 c-1.992,0-4.212-0.093-6.597-0.276C45.446,86.351,44.882,86.338,44.333,86.338z"/></g></svg>';
                    case 'grid' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="200px" height="200px" viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><g> <g> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="104.088" y="132.575" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -67.3253 122.6343)" width="20.564" height="20.023"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="133.034" y="132.249" transform="matrix(0.7071 -0.7072 0.7072 0.7071 -58.8638 142.9646)" width="20.182" height="20.563"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="104.142" y="103.742" transform="matrix(0.707 0.7072 -0.7072 0.707 114.0192 -47.5699)" width="20.566" height="20.179"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="132.899" y="103.764" transform="matrix(-0.7071 0.7071 -0.7071 -0.7071 324.8759 92.9823)" width="20.564" height="20.023"/> </g> <g> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="46.538" y="132.575" transform="matrix(0.7072 -0.7071 0.7071 0.7072 -84.1771 81.931)" width="20.565" height="20.023"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="75.484" y="132.249" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -75.7197 102.257)" width="20.183" height="20.563"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="46.592" y="103.742" transform="matrix(0.707 0.7072 -0.7072 0.707 97.1598 -6.8727)" width="20.566" height="20.181"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="75.349" y="103.763" transform="matrix(-0.7071 0.7071 -0.7071 -0.7071 226.6322 133.6762)" width="20.564" height="20.024"/> </g> <g> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="104.088" y="76.215" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -27.4725 106.1268)" width="20.564" height="20.022"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="133.034" y="75.888" transform="matrix(0.7071 -0.7072 0.7072 0.7071 -19.0079 126.4542)" width="20.182" height="20.563"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="104.142" y="47.382" transform="matrix(0.7071 0.7072 -0.7072 0.7071 74.1607 -64.0803)" width="20.565" height="20.179"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="132.899" y="47.403" transform="matrix(-0.7071 0.7071 -0.7071 -0.7071 285.0229 -3.2313)" width="20.564" height="20.023"/> </g> <g> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="46.538" y="76.215" transform="matrix(0.7072 -0.7071 0.7071 0.7072 -44.327 65.4261)" width="20.565" height="20.022"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="75.484" y="75.888" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -35.8666 85.7492)" width="20.183" height="20.563"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="46.537" y="47.381" transform="matrix(0.7071 0.7072 -0.7072 0.7071 57.2857 -23.3444)" width="20.565" height="20.18"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="75.349" y="47.403" transform="matrix(-0.7071 0.7071 -0.7071 -0.7071 186.7792 37.4626)" width="20.564" height="20.024"/> </g></g></svg>';
                    case 'cube' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="200px" height="200px" viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><g><polygon fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" points="50.689,71.558 58.907,76.305 108.227,47.858 100.002,43.115    "/><polygon fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" points="67.123,81.049 75.342,85.795 124.66,57.351 116.437,52.606   "/><polygon fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" points="83.558,90.541 91.775,95.286 141.095,66.842 132.87,62.1     "/><polygon fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" points="100.002,156.885 100.003,147.394 50.689,118.91 50.689,128.442   "/><polygon fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" points="100.005,137.905 100.007,128.416 50.686,99.938 50.689,109.433   "/><polygon fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" points="100.008,118.929 100.01,109.438 50.716,80.948 50.72,90.442  "/><polygon fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" points="149.314,71.558 141.095,76.301 141.098,133.181 149.314,128.442  "/><polygon fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" points="132.877,81.044 124.657,85.787 124.662,142.66 132.879,137.922   "/><polygon fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" points="116.439,90.531 108.22,95.273 108.227,152.142 116.444,147.4     "/></g></svg>';
                    case 'circles' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="200px" height="200px" viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><g> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M62.923,108.923c-0.35,3.989-3.862,6.939-7.851,6.59c-3.989-0.348-6.936-3.864-6.591-7.853 c0.35-3.988,3.863-6.936,7.852-6.588C60.324,101.424,63.273,104.935,62.923,108.923z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M151.409,89.511c1.694,3.628,0.125,7.939-3.506,9.631c-3.623,1.691-7.937,0.121-9.63-3.504 c-1.688-3.628-0.125-7.938,3.504-9.632C145.41,84.314,149.722,85.883,151.409,89.511z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M72.172,126.46c1.693,3.631,0.125,7.94-3.504,9.632c-3.627,1.694-7.938,0.121-9.633-3.504 c-1.691-3.629-0.123-7.938,3.506-9.633C66.17,121.266,70.481,122.83,72.172,126.46z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M139.098,65.406c3.28,2.296,4.077,6.813,1.778,10.093c-2.291,3.276-6.812,4.072-10.091,1.781 c-3.275-2.298-4.078-6.813-1.781-10.093C131.305,63.906,135.82,63.107,139.098,65.406z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M88.95,137.023c3.282,2.299,4.079,6.813,1.781,10.095c-2.293,3.28-6.813,4.073-10.095,1.781 c-3.28-2.298-4.075-6.815-1.779-10.095C81.155,135.525,85.67,134.727,88.95,137.023z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M116.383,50.687c3.988,0.349,6.938,3.862,6.587,7.852c-0.347,3.983-3.864,6.933-7.85,6.587 c-3.985-0.35-6.937-3.86-6.589-7.848C108.883,53.285,112.396,50.335,116.383,50.687z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M108.762,137.783c3.992,0.35,6.939,3.862,6.59,7.851c-0.346,3.987-3.863,6.935-7.852,6.591 c-3.988-0.35-6.936-3.864-6.589-7.854C101.263,140.383,104.773,137.433,108.762,137.783z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M89.351,49.296c3.627-1.692,7.938-0.123,9.63,3.508c1.692,3.621,0.121,7.936-3.503,9.629 c-3.627,1.688-7.938,0.125-9.632-3.503C84.156,55.296,85.722,50.984,89.351,49.296z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M126.299,128.534c3.633-1.693,7.943-0.124,9.633,3.505c1.695,3.626,0.122,7.938-3.505,9.634 c-3.628,1.69-7.938,0.12-9.632-3.508C121.105,134.536,122.671,130.226,126.299,128.534z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M65.247,61.607c2.295-3.277,6.812-4.075,10.092-1.777c3.276,2.291,4.073,6.812,1.781,10.091 c-2.296,3.276-6.812,4.077-10.093,1.784C63.746,69.402,62.947,64.886,65.247,61.607z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M136.863,111.757c2.299-3.282,6.816-4.08,10.094-1.781c3.281,2.294,4.075,6.813,1.781,10.096 c-2.296,3.278-6.814,4.074-10.096,1.778C135.365,119.551,134.566,115.035,136.863,111.757z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M50.527,84.322c0.348-3.987,3.861-6.936,7.851-6.585c3.983,0.346,6.934,3.862,6.587,7.85 c-0.35,3.984-3.861,6.937-7.849,6.589C53.124,91.823,50.174,88.312,50.527,84.322z"/></g><g> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="75.462" cy="83.061" r="4.851"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M129.641,119.463c-0.916,2.519-3.698,3.816-6.217,2.899c-2.515-0.914-3.812-3.699-2.898-6.215 c0.918-2.517,3.697-3.815,6.215-2.901C129.261,114.165,130.559,116.948,129.641,119.463z"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="70.1" cy="97.793" r="4.851"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M135.221,102.23c0.467,2.64-1.295,5.153-3.934,5.618c-2.635,0.466-5.15-1.297-5.619-3.934 c-0.463-2.636,1.295-5.153,3.934-5.618C132.242,97.834,134.758,99.592,135.221,102.23z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M77.6,112.39c0.465,2.642-1.294,5.154-3.934,5.62c-2.638,0.467-5.152-1.297-5.621-3.934 c-0.465-2.641,1.297-5.153,3.935-5.619C74.619,107.992,77.134,109.751,77.6,112.39z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M131.438,84.516c1.723,2.052,1.455,5.111-0.598,6.832c-2.049,1.723-5.109,1.453-6.832-0.597 c-1.722-2.052-1.456-5.109,0.595-6.832C126.66,82.196,129.717,82.463,131.438,84.516z"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="82.899" cy="125.244" r="4.85"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M119.304,71.065c2.518,0.915,3.815,3.698,2.897,6.218c-0.913,2.514-3.698,3.812-6.215,2.897 c-2.516-0.917-3.816-3.696-2.9-6.215C114.006,71.446,116.787,70.146,119.304,71.065z"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="97.632" cy="130.606" r="4.85"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M102.07,65.484c2.638-0.465,5.153,1.295,5.617,3.935c0.467,2.635-1.295,5.152-3.933,5.619 c-2.637,0.463-5.153-1.295-5.621-3.933C97.672,68.464,99.431,65.948,102.07,65.484z"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="113.072" cy="127.884" r="4.85"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M84.355,69.268c2.052-1.722,5.11-1.455,6.832,0.599c1.722,2.049,1.455,5.109-0.597,6.833 c-2.051,1.72-5.11,1.455-6.832-0.596C82.036,74.046,82.302,70.989,84.355,69.268z"/></g><g> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="97.263" cy="83.369" r="2.775"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M104.455,120.013c-1.39,0.647-3.04,0.048-3.688-1.342c-0.648-1.387-0.046-3.039,1.341-3.688 c1.39-0.646,3.039-0.048,3.688,1.341C106.443,117.716,105.844,119.367,104.455,120.013z"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="89.135" cy="87.159" r="2.775"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="111.41" cy="113.707" r="2.775"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="83.99" cy="94.507" r="2.776"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="116.555" cy="106.36" r="2.775"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="83.207" cy="103.442" r="2.775"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M119.852,96.253c0.648,1.388,0.048,3.039-1.344,3.687c-1.385,0.647-3.037,0.046-3.686-1.343 c-0.646-1.389-0.049-3.038,1.34-3.688C117.555,94.263,119.206,94.861,119.852,96.253z"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="86.998" cy="111.571" r="2.775"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="113.547" cy="89.295" r="2.775"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="94.345" cy="116.716" r="2.775"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M106.441,81.387c1.525,0.133,2.656,1.478,2.521,3.005c-0.133,1.526-1.479,2.656-3.006,2.523 c-1.525-0.134-2.656-1.479-2.523-3.005C103.57,82.381,104.914,81.252,106.441,81.387z"/></g><g> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="105.747" cy="92.615" r="1.529"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="94.798" cy="108.252" r="1.528"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="101.105" cy="90.924" r="1.528"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="99.441" cy="109.942" r="1.528"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="96.239" cy="91.783" r="1.53"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="104.307" cy="109.085" r="1.528"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="92.453" cy="94.958" r="1.529"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="108.092" cy="105.909" r="1.528"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="90.764" cy="99.601" r="1.529"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="109.782" cy="101.266" r="1.529"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="91.621" cy="104.467" r="1.529"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="108.924" cy="96.4" r="1.528"/></g></svg>';
                    case 'shield' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="200px" height="200px" viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><g><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M142.824,81.079c-0.005-0.145-0.007-0.291-0.019-0.432c-0.235-4.191-2.952-8.801-6.518-10.924l-29.664-17.67c-1.024-0.611-2.061-0.98-3.089-1.113c-1.143-0.297-2.372-0.455-3.626-0.455c-1.345,0-2.651,0.184-3.859,0.523c-0.891,0.17-1.785,0.515-2.674,1.045l-29.661,17.67c-3.564,2.123-6.287,6.738-6.519,10.934c-0.01,0.139-0.016,0.284-0.018,0.427c-0.002,0.052-0.008,0.101-0.008,0.151v0.065v37.398v0.067c0,0.05,0.006,0.103,0.008,0.153c0.003,0.147,0.008,0.293,0.018,0.432c0.236,4.192,2.957,8.804,6.519,10.926l29.662,17.671c1.028,0.609,2.063,0.979,3.091,1.11c1.143,0.3,2.372,0.456,3.626,0.456c1.344,0,2.649-0.182,3.86-0.521c0.893-0.172,1.784-0.518,2.672-1.047l29.662-17.669c3.566-2.124,6.284-6.739,6.518-10.934c0.012-0.14,0.014-0.284,0.019-0.428c0-0.051,0.005-0.103,0.005-0.149v-0.067V81.301v-0.065C142.829,81.184,142.824,81.131,142.824,81.079z M63.815,118.579V81.421l29.561,17.612l0.027,0.016c0.391,0.236,0.774,0.565,1.133,0.953c-0.367,0.394-0.758,0.729-1.16,0.965L63.815,118.579z M136.188,81.419v37.16l-29.562-17.612l-0.028-0.014c-0.39-0.234-0.772-0.564-1.132-0.951c0.367-0.397,0.759-0.732,1.16-0.969L136.188,81.419z M132.791,75.539c0.044,0.026,0.084,0.053,0.122,0.078c-0.038,0.023-0.076,0.052-0.122,0.077l-29.464,17.562V57.989L132.791,75.539z M96.675,93.263L67.114,75.653c-0.043-0.028-0.084-0.055-0.122-0.081c0.038-0.022,0.079-0.049,0.122-0.074l29.561-17.62V93.263z M67.212,124.461c-0.044-0.026-0.085-0.053-0.125-0.077c0.04-0.026,0.081-0.052,0.125-0.078l29.463-17.563v35.269L67.212,124.461z M103.327,106.739l29.562,17.608c0.044,0.025,0.085,0.052,0.122,0.078c-0.037,0.026-0.078,0.052-0.122,0.076l-29.562,17.62V106.739z"/></g></svg>';
                    case 'locking' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="200px" height="200px" viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><g><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M109.25,83.803c-4.012,0-7.275,3.266-7.275,7.278c0,1.32,0,1.32,0,1.32c0.537,1.271-0.816,4.129-2.996,6.352c-2.188,2.227-4.984,3.638-6.215,3.137c0,0,0,0-1.275,0c-4.01,0-7.275,3.266-7.275,7.277s3.266,7.278,7.275,7.278c4.014,0,7.279-3.267,7.279-7.278c0-1.327,0-1.327,0-1.327c-0.541-1.277,0.799-4.139,2.984-6.362c2.18-2.221,4.98-3.624,6.217-3.119c0,0,0,0,1.281,0c4.014,0,7.279-3.263,7.279-7.277C116.529,87.068,113.264,83.803,109.25,83.803z"/><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M110.24,48.69c-4.014,0-7.275,3.266-7.275,7.278c0,1.32,0,1.32,0,1.32c0.535,1.267-0.814,4.126-2.998,6.352c-2.186,2.224-4.982,3.634-6.215,3.137c0,0,0,0-1.273,0c-4.014,0-7.277,3.263-7.277,7.273c0,4.016,3.264,7.278,7.277,7.278s7.277-3.263,7.277-7.278c0-1.327,0-1.327,0-1.327c-0.543-1.277,0.801-4.135,2.982-6.358s4.982-3.627,6.223-3.123c0,0,0,0,1.279,0c4.016,0,7.277-3.263,7.277-7.273C117.518,51.956,114.256,48.69,110.24,48.69z"/><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M143.869,82.318c-4.01,0-7.275,3.27-7.275,7.278c0,1.323,0,1.323,0,1.323c0.535,1.268-0.814,4.126-2.998,6.349c-2.186,2.227-4.98,3.638-6.213,3.137c0,0,0,0-1.275,0c-4.012,0-7.275,3.266-7.275,7.277c0,4.016,3.264,7.278,7.275,7.278c4.014,0,7.279-3.263,7.279-7.278c0-1.327,0-1.327,0-1.327c-0.541-1.277,0.801-4.139,2.98-6.362c2.184-2.219,4.982-3.624,6.223-3.119c0,0,0,0,1.279,0c4.014,0,7.279-3.263,7.279-7.277C151.148,85.588,147.883,82.318,143.869,82.318z"/><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M73.889,85.039c-4.012,0-7.275,3.267-7.275,7.278c0,1.32,0,1.32,0,1.32c0.535,1.271-0.812,4.129-2.998,6.352c-2.188,2.228-4.98,3.638-6.213,3.137c0,0,0,0-1.275,0c-4.012,0-7.275,3.267-7.275,7.277c0,4.016,3.264,7.278,7.275,7.278c4.014,0,7.277-3.263,7.277-7.278c0-1.327,0-1.327,0-1.327c-0.541-1.277,0.801-4.139,2.984-6.362c2.182-2.223,4.982-3.623,6.221-3.119c0,0,0,0,1.279,0c4.016,0,7.277-3.263,7.277-7.277C81.166,88.306,77.904,85.039,73.889,85.039z"/><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M107.52,118.671c-4.012,0-7.277,3.266-7.277,7.278c0,1.32,0,1.32,0,1.32c0.537,1.267-0.812,4.125-2.998,6.352c-2.186,2.224-4.98,3.634-6.213,3.137c0,0,0,0-1.271,0c-4.014,0-7.279,3.264-7.279,7.276s3.266,7.275,7.279,7.275c4.01,0,7.275-3.263,7.275-7.275c0-1.33,0-1.33,0-1.33c-0.541-1.276,0.799-4.135,2.984-6.358c2.18-2.223,4.98-3.627,6.219-3.12c0,0,0,0,1.281,0c4.016,0,7.279-3.266,7.279-7.276C114.799,121.937,111.535,118.671,107.52,118.671z"/><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M99.381,91.695c0-4.011-3.264-7.277-7.277-7.277c-1.318,0-5.445-0.812-7.672-2.999c-2.221-2.183-3.135-6.211-3.135-7.485c0-4.011-3.266-7.277-7.277-7.277c-4.016,0-7.277,3.267-7.277,7.277c0,4.013,3.262,7.278,7.277,7.278c1.328,0,5.469,0.799,7.689,2.979c2.219,2.183,3.117,6.222,3.117,7.505c0,4.013,3.266,7.275,7.277,7.275C96.117,98.971,99.381,95.708,99.381,91.695z"/><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M133.752,126.066c0-4.013-3.262-7.278-7.271-7.278c-1.322,0-5.449-0.812-7.676-2.996c-2.225-2.187-3.137-6.214-3.137-7.487c0-4.013-3.266-7.278-7.275-7.278c-4.014,0-7.279,3.266-7.279,7.278c0,4.015,3.266,7.277,7.279,7.277c1.326,0,5.467,0.799,7.686,2.982c2.223,2.181,3.123,6.221,3.123,7.502c0,4.015,3.264,7.276,7.279,7.276C130.49,133.343,133.752,130.081,133.752,126.066z"/><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M97.65,127.056c0-4.012-3.264-7.277-7.277-7.277c-1.32,0-5.449-0.813-7.672-2.996c-2.223-2.187-3.137-6.215-3.137-7.488c0-4.012-3.264-7.278-7.275-7.278c-4.014,0-7.277,3.267-7.277,7.278c0,4.011,3.264,7.278,7.277,7.278c1.328,0,5.467,0.798,7.686,2.981c2.223,2.183,3.121,6.221,3.121,7.502c0,4.012,3.268,7.278,7.277,7.278C94.387,134.334,97.65,131.067,97.65,127.056z"/><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M134.248,90.459c0-4.012-3.264-7.277-7.275-7.277c-1.32,0-5.447-0.815-7.674-2.999c-2.225-2.184-3.135-6.212-3.135-7.485c0-4.012-3.266-7.278-7.277-7.278s-7.277,3.267-7.277,7.278c0,4.011,3.266,7.278,7.277,7.278c1.328,0,5.467,0.798,7.688,2.978c2.223,2.187,3.119,6.223,3.119,7.506c0,4.012,3.266,7.274,7.279,7.274C130.984,97.733,134.248,94.471,134.248,90.459z"/></g></svg>';
                    case 'seal' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="200px" height="200px" viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M114.785,171.178L100,137.172l-14.787,34.005l0.322-37.075l-27.333,25.041l15.371-33.735l-35.165,11.765L66.184,112.6 l-36.919-3.562l35.372-11.14L32.361,79.633l36.845,4.206l-22.05-29.817l31.945,18.827L71.07,36.653l21.539,30.179l7.389-36.34 l7.398,36.34l21.529-30.179l-8.021,36.196l31.953-18.832l-22.062,29.821l36.85-4.206L135.37,97.897l35.362,11.14l-36.916,3.562 l27.773,24.572l-35.163-11.765l15.372,33.735l-27.336-25.041L114.785,171.178z M91.655,120.357l-0.186,21.386L100,122.125 l8.529,19.617l-0.186-21.384l15.772,14.448l-8.871-19.468l20.282,6.786l-16.02-14.172l21.291-2.055l-20.396-6.425l18.615-10.534 l-21.254,2.425l12.725-17.198l-18.428,10.861l4.629-20.892l-12.42,17.411l-4.268-20.959L95.74,81.547L83.313,64.136l4.635,20.893 L69.513,74.162l12.721,17.202L60.99,88.939l18.615,10.534l-20.4,6.425l21.288,2.055l-16.02,14.172l20.281-6.786l-8.87,19.468 L91.655,120.357z"/></svg>';
                    case 'circleslash' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="200px" height="200px" viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><g> <defs> <circle id="SVGID_1_" cx="106" cy="96" r="55"/> </defs> <clipPath id="SVGID_2_"> <use xlink:href="#SVGID_1_"  overflow="visible"/> </clipPath> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="62.944" y="-32.696" transform="matrix(0.7072 0.707 -0.707 0.7072 64.7871 -26.4693)" clip-path="url(#SVGID_2_)" width="2.814" height="195.359"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="69.481" y="-26.157" transform="matrix(0.7068 0.7074 -0.7074 0.7068 71.3731 -29.1772)" clip-path="url(#SVGID_2_)" width="2.814" height="195.357"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="76.018" y="-19.619" transform="matrix(0.7069 0.7073 -0.7073 0.7069 77.9011 -31.8846)" clip-path="url(#SVGID_2_)" width="2.814" height="195.358"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="82.556" y="-13.081" transform="matrix(0.7069 0.7073 -0.7073 0.7069 84.441 -34.5925)" clip-path="url(#SVGID_2_)" width="2.814" height="195.358"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="89.093" y="-6.544" transform="matrix(0.7068 0.7074 -0.7074 0.7068 90.996 -37.2999)" clip-path="url(#SVGID_2_)" width="2.814" height="195.357"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="95.631" y="-0.007" transform="matrix(0.7069 0.7073 -0.7073 0.7069 97.5205 -40.0089)" clip-path="url(#SVGID_2_)" width="2.815" height="195.358"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="102.168" y="6.531" transform="matrix(0.7069 0.7073 -0.7073 0.7069 104.0597 -42.7162)" clip-path="url(#SVGID_2_)" width="2.814" height="195.358"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="108.706" y="13.068" transform="matrix(0.7069 0.7073 -0.7073 0.7069 110.5993 -45.4245)" clip-path="url(#SVGID_2_)" width="2.814" height="195.357"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="115.242" y="19.606" transform="matrix(0.7068 0.7074 -0.7074 0.7068 117.1593 -48.132)" clip-path="url(#SVGID_2_)" width="2.815" height="195.357"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="121.78" y="26.143" transform="matrix(0.7069 0.7073 -0.7073 0.7069 123.6781 -50.8401)" clip-path="url(#SVGID_2_)" width="2.814" height="195.357"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="128.318" y="32.681" transform="matrix(0.7071 0.7071 -0.7071 0.7071 130.1735 -53.5478)" clip-path="url(#SVGID_2_)" width="2.813" height="195.358"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="134.856" y="39.217" transform="matrix(0.7075 0.7067 -0.7067 0.7075 136.5923 -56.2565)" clip-path="url(#SVGID_2_)" width="2.814" height="195.359"/></g></svg>';
            }
        }

        var self = this;

        context = BB.BaseBrush2D.prototype.draw.call(this, context);

        // if the variant is present and is the right variable type
        if (this.variant !== null && 
            typeof this.variant === 'string') {

            // if the variant is new or has changed
            // or if the color is new or has changed
            if (this.variant !== this._lastVariant || !this.color.isEqual(this._lastColor) ) {

                // if this is an acceptable variant
                if (this.variants.indexOf(this.variant) !== -1) {
                    
                    // create a tmp variant, because this.src setter sets this.variant to null
                    var variant = this.variant;
                    this.src = 'data:image/svg+xml;base64,' + window.btoa(getColoredSVGVariant());
                    this.variant = variant;

                    this._lastVariant = this.variant;  
                    this._lastColor.copy( this.color );
                
                } else {
                    throw new Error('BB.ImageBrush2D draw: ' + this.variant + ' is not a valid variant for BB.ImageBrush2D');
                }
            }            
        }

        if (!initSrcSet) {
            console.error('BB.ImageBrush2D draw: you are attempting to draw an image brush without first setting its source with the .src property');
        }

        if (!this.hidden && drawReady) {

            context.save();
        
            context.translate(this.x, this.y);
            context.rotate(BB.MathUtils.degToRad(this.rotation));

            // draw to screen
            context.drawImage(this._image, - this.width/2, - this.height/2, this.width, this.height);

            context.restore();
        }
    };

    return BB.ImageBrush2D;
});

/**
 * A 2D brush module for drawing contiguous lines in a stamp-like fashion.
 * @module BB.LineBrush2D
 * @extends BB.BaseBrush2D
 */
define('BB.LineBrush2D',['./BB', './BB.BaseBrush2D', './BB.Color', "./BB.MathUtils"], 
function(  BB,        BaseBrush2D,        Color,        MathUtils){

    'use strict';

    BB.BaseBrush2D = BaseBrush2D;
    BB.Color       = Color;
    BB.MathUtils   = MathUtils;

    var justReset = false;
    var controllerModuleHasIsDown = false;

    /**
     * A 2D brush module for drawing contiguous lines in a stamp-like fashion.
     * What makes BB.LineBrush2D fundamentally different from BB.BaseBrush
     * is that each new drawing instance is influenced by the previous position of
     * the brush (usually to adjust for drawing angle or brush width).
     * @class BB.LineBrush2D
     * @constructor
     * @extends BB.BaseBrush2D
     * @param {Object} [config] A optional config hash to initialize any of
     * BB.LineBrush2D's public properties.
     * @example <code class="code prettyprint">&nbsp; var lineBrush = new BB.LineBrush2D({ width: 100,
     * height: 100, variant: "soft" }); </code>
     */
    BB.LineBrush2D = function(config) {

        BB.BaseBrush2D.call(this, config);

        /**
         * The brush's previous x position. This property is unique to
         * BB.LineBrush.
         * @property prevX
         * @type Number
         * @default null
         */
        this.prevX = null;

        /**
         * The brush's previous y position. This property is unique to
         * BB.LineBrush.
         * @property prevY
         * @type Number
         * @default null
         */
        this.prevY = null;

        /**
         * The type of brush. This property should be treated as read-only.
         * @property type
         * @type String
         * @default "line"
         */
        this.type = "line";

        /**
         * The current brush variant.
         * @property variant
         * @type String
         * @default solid
         */
        this.variant = "solid";

        /**
         * The brush's line weight.
         * @property weight
         * @type Number
         * @default 1
         */
        this.weight = 1;
    
        /**
         * An array of all supported variants.
         * @property variants
         * @type Array
         */
        this.variants = [
            'solid',
            'soft',
            'lines',
            'calligraphy'
        ];

        /**
         * Keeps track of wether or not the controllerModule passed into update
         * was made active (for instance if it was pressed) this frame.
         * @property variants
         * @protected
         * @type Boolean
         */
        this._lineStartedThisFrame = !this.hidden;

        if (config) {

            if (typeof config.variant === 'string') this.variant = config.variant;
            if (typeof config.weight === 'number') this.weight = config.weight;
        }   
    };

    BB.LineBrush2D.prototype = Object.create(BB.BaseBrush2D.prototype);
    BB.LineBrush2D.prototype.constructor = BB.LineBrush2D;

    /**
     * Update method. Usually called once per animation frame.
     * @method update
     * @param {Object} controllerModule An object with x and y properties and
     * optionally an isDown boolean (used for beginning and ending
     * strokeds/marks).
     * @example <code class="code prettyprint">
     * &nbsp;var mouseInput = new BB.MouseInput(document.getElementById('canvas'));<br>
     * &nbsp;var pointer = new BB.Pointer(mouseInput);<br>
     * &nbsp;var brush = new BB.LineBrush2D();<br>
     * <br>
     * &nbsp; // called once per animation frame (from somewhere else in your app)<br>
     * &nbsp;function update() {<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;mouseInput.update();<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;pointer.update();<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;brush.update(pointer); // update the brush using the pointer<br>
     * &nbsp;}
     * </code>
     */
    BB.LineBrush2D.prototype.update = function(controllerModule) {
        
        BB.BaseBrush2D.prototype.update.call(this, controllerModule);

        if (controllerModule.hasOwnProperty('isDown')) {
            controllerModuleHasIsDown = true;
            this.hidden = (controllerModule.isDown === false);
        } else {
            controllerModuleHasIsDown = false;
        }
    };

    /**
     * Draws the brush to the context. Usually called once per animation frame.
     * @method draw
     * @param {Object} context The HTML5 canvas context you would like to draw
     * to.
     */
    BB.LineBrush2D.prototype.draw = function(context) {
        

        context = BB.BaseBrush2D.prototype.draw.call(this, context);

        context.save();

        context.lineJoin = "round";
        context.lineCap = "round";

        if (typeof this.variant !== 'string' ||
            this.variants.indexOf(this.variant) === -1) {
            throw new Error("BB.BaseBrush2D.draw: " + this.variant + " is not a valid variant for BB.ImageBrush2D");
        }      

        // draw down here...
        if (!this.hidden) {

            if (controllerModuleHasIsDown) {
                
                if (this._lineStartedThisFrame) {
                    
                    context.beginPath();
                    context.moveTo(this.x, this.y);

                    this._lineStartedThisFrame = false;

                } else { // we are in the middle of the line

                    var r, g, b, alphaFloat;
                    if (this.color && this.color instanceof BB.Color) {
                        r = this.color.r;
                        g = this.color.g;
                        b = this.color.b;
                        alphaFloat = BB.MathUtils.map(this.color.a, 0, 255, 0.0, 1.0);
                    } else {
                        r = 255;
                        g = 255;
                        b = 255;
                        alphaFloat = 1.0;
                    }

                    if(this.variant == 'solid'){

                        var dx = (this.prevX > this.x) ? this.prevX - this.x : this.x - this.prevX;
                        var dy = (this.prevY > this.y) ? this.prevY - this.y : this.y - this.prevY;

                        this.weight = Math.abs(dx - dy);

                        if( this.weight > 100){ this.weight = 100; }

                        context.lineWidth = BB.MathUtils.map(this.weight, 0, 100, this.width / 2.5, this.width * 2.5);
                        context.lineTo(this.x, this.y);
                        context.strokeStyle = "rgba(" + r + ", " + g + ", " + b + ", " + alphaFloat + ")";
                        context.stroke();
                        context.closePath();
                        context.beginPath();
                        context.moveTo(this.x, this.y);

                    } else if(this.variant == 'soft'){
                        
                        var dist = BB.MathUtils.dist(this.prevX, this.prevY, this.x, this.y);
                        var angle = BB.MathUtils.angleBtw(this.prevX, this.prevY, this.x, this.y);
                        for (var i = 0; i < dist; i++) {
                            var x = this.prevX + (Math.sin(angle) * i);
                            var y = this.prevY + (Math.cos(angle) * i);
                            var gradient = context.createRadialGradient(x, y, this.width/6, x, y, this.width/2);
                            gradient.addColorStop(0, "rgba(" + r + ", " + g + ", " + b + ', 0.1)');
                            gradient.addColorStop(1, "rgba(" + r + ", " + g + ", " + b + ', 0)');
                            context.fillStyle = gradient;
                            context.fillRect(x - this.width/2, y - this.width/2, this.width, this.width);
                        }

                    } else if(this.variant == 'lines' || this.variant == 'calligraphy'){

                        if(this.variant == 'lines'){ context.lineWidth = (this.width < 1) ? 1 : this.width * 0.05; }
                        if(this.variant == 'calligraphy'){ context.lineWidth = this.width * 0.25; }

                        context.strokeStyle = "rgb(" + r + ", " + g + ", " + b + ")";
                        context.moveTo(this.prevX, this.prevY);
                        context.lineTo(this.x, this.y);
                        context.stroke();
                        context.moveTo(this.prevX - this.width * 0.2, this.prevY - this.width * 0.2);
                        context.lineTo(this.x - this.width * 0.2, this.y - this.width * 0.2);
                        context.stroke();
                        context.moveTo(this.prevX - this.width * 0.1, this.prevY - this.width * 0.1);
                        context.lineTo(this.x - this.width * 0.1, this.y - this.width * 0.1);
                        context.stroke();
                        context.moveTo(this.prevX + this.width * 0.1, this.prevY + this.width * 0.1);
                        context.lineTo(this.x + this.width * 0.1, this.y + this.width * 0.1);
                        context.stroke();
                        context.moveTo(this.prevX + this.width * 0.2, this.prevY + this.width * 0.2);
                        context.lineTo(this.x + this.width * 0.2, this.y + this.width * 0.2);
                        context.stroke();
                    }
                }

            } else { // this controller has no "button", so assume it is always pressed
                
            }

        } else {
            this._lineStartedThisFrame = true;
        }

        context.restore();

        this.prevX = this.x;
        this.prevY = this.y;
    };

    return BB.LineBrush2D;
});

/*!                                                              
 * LeapJS v0.6.4                                                  
 * http://github.com/leapmotion/leapjs/                                        
 *                                                                             
 * Copyright 2013 LeapMotion, Inc. and other contributors                      
 * Released under the Apache-2.0 license                                     
 * http://github.com/leapmotion/leapjs/blob/master/LICENSE.txt                 
 */
;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
var Pointable = require('./pointable'),
  glMatrix = require("gl-matrix")
  , vec3 = glMatrix.vec3
  , mat3 = glMatrix.mat3
  , mat4 = glMatrix.mat4
  , _ = require('underscore');


var Bone = module.exports = function(finger, data) {
  this.finger = finger;

  this._center = null, this._matrix = null;

  /**
  * An integer code for the name of this bone.
  *
  * * 0 -- metacarpal
  * * 1 -- proximal
  * * 2 -- medial
  * * 3 -- distal
  * * 4 -- arm
  *
  * @member type
  * @type {number}
  * @memberof Leap.Bone.prototype
  */
  this.type = data.type;

  /**
   * The position of the previous, or base joint of the bone closer to the wrist.
   * @type {vector3}
   */
  this.prevJoint = data.prevJoint;

  /**
   * The position of the next joint, or the end of the bone closer to the finger tip.
   * @type {vector3}
   */
  this.nextJoint = data.nextJoint;

  /**
   * The estimated width of the tool in millimeters.
   *
   * The reported width is the average width of the visible portion of the
   * tool from the hand to the tip. If the width isn't known,
   * then a value of 0 is returned.
   *
   * Pointable objects representing fingers do not have a width property.
   *
   * @member width
   * @type {number}
   * @memberof Leap.Pointable.prototype
   */
  this.width = data.width;

  var displacement = new Array(3);
  vec3.sub(displacement, data.nextJoint, data.prevJoint);

  this.length = vec3.length(displacement);


  /**
   *
   * These fully-specify the orientation of the bone.
   * See examples/threejs-bones.html for more info
   * Three vec3s:
   *  x (red): The rotation axis of the finger, pointing outwards.  (In general, away from the thumb )
   *  y (green): The "up" vector, orienting the top of the finger
   *  z (blue): The roll axis of the bone.
   *
   *  Most up vectors will be pointing the same direction, except for the thumb, which is more rightwards.
   *
   *  The thumb has one fewer bones than the fingers, but there are the same number of joints & joint-bases provided
   *  the first two appear in the same position, but only the second (proximal) rotates.
   *
   *  Normalized.
   */
  this.basis = data.basis;
};

Bone.prototype.left = function(){

  if (this._left) return this._left;

  this._left =  mat3.determinant(this.basis[0].concat(this.basis[1]).concat(this.basis[2])) < 0;

  return this._left;

};


/**
 * The Affine transformation matrix describing the orientation of the bone, in global Leap-space.
 * It contains a 3x3 rotation matrix (in the "top left"), and center coordinates in the fourth column.
 *
 * Unlike the basis, the right and left hands have the same coordinate system.
 *
 */
Bone.prototype.matrix = function(){

  if (this._matrix) return this._matrix;

  var b = this.basis,
      t = this._matrix = mat4.create();

  // open transform mat4 from rotation mat3
  t[0] = b[0][0], t[1] = b[0][1], t[2]  = b[0][2];
  t[4] = b[1][0], t[5] = b[1][1], t[6]  = b[1][2];
  t[8] = b[2][0], t[9] = b[2][1], t[10] = b[2][2];

  t[3] = this.center()[0];
  t[7] = this.center()[1];
  t[11] = this.center()[2];

  if ( this.left() ) {
    // flip the basis to be right-handed
    t[0] *= -1;
    t[1] *= -1;
    t[2] *= -1;
  }

  return this._matrix;
};

/**
 * Helper method to linearly interpolate between the two ends of the bone.
 *
 * when t = 0, the position of prevJoint will be returned
 * when t = 1, the position of nextJoint will be returned
 */
Bone.prototype.lerp = function(out, t){

  vec3.lerp(out, this.prevJoint, this.nextJoint, t);

};

/**
 *
 * The center position of the bone
 * Returns a vec3 array.
 *
 */
Bone.prototype.center = function(){

  if (this._center) return this._center;

  var center = vec3.create();
  this.lerp(center, 0.5);
  this._center = center;
  return center;

};

// The negative of the z-basis
Bone.prototype.direction = function(){

 return [
   this.basis[2][0] * -1,
   this.basis[2][1] * -1,
   this.basis[2][2] * -1
 ];

};

},{"./pointable":14,"gl-matrix":23,"underscore":24}],2:[function(require,module,exports){
var CircularBuffer = module.exports = function(size) {
  this.pos = 0;
  this._buf = [];
  this.size = size;
}

CircularBuffer.prototype.get = function(i) {
  if (i == undefined) i = 0;
  if (i >= this.size) return undefined;
  if (i >= this._buf.length) return undefined;
  return this._buf[(this.pos - i - 1) % this.size];
}

CircularBuffer.prototype.push = function(o) {
  this._buf[this.pos % this.size] = o;
  return this.pos++;
}

},{}],3:[function(require,module,exports){
var chooseProtocol = require('../protocol').chooseProtocol
  , EventEmitter = require('events').EventEmitter
  , _ = require('underscore');

var BaseConnection = module.exports = function(opts) {
  this.opts = _.defaults(opts || {}, {
    host : '127.0.0.1',
    enableGestures: false,
    scheme: this.getScheme(),
    port: this.getPort(),
    background: false,
    optimizeHMD: false,
    requestProtocolVersion: BaseConnection.defaultProtocolVersion
  });
  this.host = this.opts.host;
  this.port = this.opts.port;
  this.scheme = this.opts.scheme;
  this.protocolVersionVerified = false;
  this.background = null;
  this.optimizeHMD = null;
  this.on('ready', function() {
    this.enableGestures(this.opts.enableGestures);
    this.setBackground(this.opts.background);
    this.setOptimizeHMD(this.opts.optimizeHMD);

    if (this.opts.optimizeHMD){
      console.log("Optimized for head mounted display usage.");
    }else {
      console.log("Optimized for desktop usage.");
    }

  });
};

// The latest available:
BaseConnection.defaultProtocolVersion = 6;

BaseConnection.prototype.getUrl = function() {
  return this.scheme + "//" + this.host + ":" + this.port + "/v" + this.opts.requestProtocolVersion + ".json";
}


BaseConnection.prototype.getScheme = function(){
  return 'ws:'
}

BaseConnection.prototype.getPort = function(){
  return 6437
}


BaseConnection.prototype.setBackground = function(state) {
  this.opts.background = state;
  if (this.protocol && this.protocol.sendBackground && this.background !== this.opts.background) {
    this.background = this.opts.background;
    this.protocol.sendBackground(this, this.opts.background);
  }
}

BaseConnection.prototype.setOptimizeHMD = function(state) {
  this.opts.optimizeHMD = state;
  if (this.protocol && this.protocol.sendOptimizeHMD && this.optimizeHMD !== this.opts.optimizeHMD) {
    this.optimizeHMD = this.opts.optimizeHMD;
    this.protocol.sendOptimizeHMD(this, this.opts.optimizeHMD);
  }
}

BaseConnection.prototype.handleOpen = function() {
  if (!this.connected) {
    this.connected = true;
    this.emit('connect');
  }
}

BaseConnection.prototype.enableGestures = function(enabled) {
  this.gesturesEnabled = enabled ? true : false;
  this.send(this.protocol.encode({"enableGestures": this.gesturesEnabled}));
}

BaseConnection.prototype.handleClose = function(code, reason) {
  if (!this.connected) return;
  this.disconnect();

  // 1001 - an active connection is closed
  // 1006 - cannot connect
  if (code === 1001 && this.opts.requestProtocolVersion > 1) {
    if (this.protocolVersionVerified) {
      this.protocolVersionVerified = false;
    }else{
      this.opts.requestProtocolVersion--;
    }
  }
  this.startReconnection();
}

BaseConnection.prototype.startReconnection = function() {
  var connection = this;
  if(!this.reconnectionTimer){
    (this.reconnectionTimer = setInterval(function() { connection.reconnect() }, 500));
  }
}

BaseConnection.prototype.stopReconnection = function() {
  this.reconnectionTimer = clearInterval(this.reconnectionTimer);
}

// By default, disconnect will prevent auto-reconnection.
// Pass in true to allow the reconnection loop not be interrupted continue
BaseConnection.prototype.disconnect = function(allowReconnect) {
  if (!allowReconnect) this.stopReconnection();
  if (!this.socket) return;
  this.socket.close();
  delete this.socket;
  delete this.protocol;
  delete this.background; // This is not persisted when reconnecting to the web socket server
  delete this.optimizeHMD;
  delete this.focusedState;
  if (this.connected) {
    this.connected = false;
    this.emit('disconnect');
  }
  return true;
}

BaseConnection.prototype.reconnect = function() {
  if (this.connected) {
    this.stopReconnection();
  } else {
    this.disconnect(true);
    this.connect();
  }
}

BaseConnection.prototype.handleData = function(data) {
  var message = JSON.parse(data);

  var messageEvent;
  if (this.protocol === undefined) {
    messageEvent = this.protocol = chooseProtocol(message);
    this.protocolVersionVerified = true;
    this.emit('ready');
  } else {
    messageEvent = this.protocol(message);
  }
  this.emit(messageEvent.type, messageEvent);
}

BaseConnection.prototype.connect = function() {
  if (this.socket) return;
  this.socket = this.setupSocket();
  return true;
}

BaseConnection.prototype.send = function(data) {
  this.socket.send(data);
}

BaseConnection.prototype.reportFocus = function(state) {
  if (!this.connected || this.focusedState === state) return;
  this.focusedState = state;
  this.emit(this.focusedState ? 'focus' : 'blur');
  if (this.protocol && this.protocol.sendFocused) {
    this.protocol.sendFocused(this, this.focusedState);
  }
}

_.extend(BaseConnection.prototype, EventEmitter.prototype);
},{"../protocol":15,"events":21,"underscore":24}],4:[function(require,module,exports){
var BaseConnection = module.exports = require('./base')
  , _ = require('underscore');


var BrowserConnection = module.exports = function(opts) {
  BaseConnection.call(this, opts);
  var connection = this;
  this.on('ready', function() { connection.startFocusLoop(); })
  this.on('disconnect', function() { connection.stopFocusLoop(); })
}

_.extend(BrowserConnection.prototype, BaseConnection.prototype);

BrowserConnection.__proto__ = BaseConnection;

BrowserConnection.prototype.useSecure = function(){
  return location.protocol === 'https:'
}

BrowserConnection.prototype.getScheme = function(){
  return this.useSecure() ? 'wss:' : 'ws:'
}

BrowserConnection.prototype.getPort = function(){
  return this.useSecure() ? 6436 : 6437
}

BrowserConnection.prototype.setupSocket = function() {
  var connection = this;
  var socket = new WebSocket(this.getUrl());
  socket.onopen = function() { connection.handleOpen(); };
  socket.onclose = function(data) { connection.handleClose(data['code'], data['reason']); };
  socket.onmessage = function(message) { connection.handleData(message.data) };
  socket.onerror = function(error) {

    // attempt to degrade to ws: after one failed attempt for older Leap Service installations.
    if (connection.useSecure() && connection.scheme === 'wss:'){
      connection.scheme = 'ws:';
      connection.port = 6437;
      connection.disconnect();
      connection.connect();
    }

  };
  return socket;
}

BrowserConnection.prototype.startFocusLoop = function() {
  if (this.focusDetectorTimer) return;
  var connection = this;
  var propertyName = null;
  if (typeof document.hidden !== "undefined") {
    propertyName = "hidden";
  } else if (typeof document.mozHidden !== "undefined") {
    propertyName = "mozHidden";
  } else if (typeof document.msHidden !== "undefined") {
    propertyName = "msHidden";
  } else if (typeof document.webkitHidden !== "undefined") {
    propertyName = "webkitHidden";
  } else {
    propertyName = undefined;
  }

  if (connection.windowVisible === undefined) {
    connection.windowVisible = propertyName === undefined ? true : document[propertyName] === false;
  }

  var focusListener = window.addEventListener('focus', function(e) {
    connection.windowVisible = true;
    updateFocusState();
  });

  var blurListener = window.addEventListener('blur', function(e) {
    connection.windowVisible = false;
    updateFocusState();
  });

  this.on('disconnect', function() {
    window.removeEventListener('focus', focusListener);
    window.removeEventListener('blur', blurListener);
  });

  var updateFocusState = function() {
    var isVisible = propertyName === undefined ? true : document[propertyName] === false;
    connection.reportFocus(isVisible && connection.windowVisible);
  }

  // save 100ms when resuming focus
  updateFocusState();

  this.focusDetectorTimer = setInterval(updateFocusState, 100);
}

BrowserConnection.prototype.stopFocusLoop = function() {
  if (!this.focusDetectorTimer) return;
  clearTimeout(this.focusDetectorTimer);
  delete this.focusDetectorTimer;
}

},{"./base":3,"underscore":24}],5:[function(require,module,exports){
var process=require("__browserify_process");var Frame = require('./frame')
  , Hand = require('./hand')
  , Pointable = require('./pointable')
  , Finger = require('./finger')
  , CircularBuffer = require("./circular_buffer")
  , Pipeline = require("./pipeline")
  , EventEmitter = require('events').EventEmitter
  , gestureListener = require('./gesture').gestureListener
  , Dialog = require('./dialog')
  , _ = require('underscore');

/**
 * Constructs a Controller object.
 *
 * When creating a Controller object, you may optionally pass in options
 * to set the host , set the port, enable gestures, or select the frame event type.
 *
 * ```javascript
 * var controller = new Leap.Controller({
 *   host: '127.0.0.1',
 *   port: 6437,
 *   enableGestures: true,
 *   frameEventName: 'animationFrame'
 * });
 * ```
 *
 * @class Controller
 * @memberof Leap
 * @classdesc
 * The Controller class is your main interface to the Leap Motion Controller.
 *
 * Create an instance of this Controller class to access frames of tracking data
 * and configuration information. Frame data can be polled at any time using the
 * [Controller.frame]{@link Leap.Controller#frame}() function. Call frame() or frame(0) to get the most recent
 * frame. Set the history parameter to a positive integer to access previous frames.
 * A controller stores up to 60 frames in its frame history.
 *
 * Polling is an appropriate strategy for applications which already have an
 * intrinsic update loop, such as a game.
 *
 * loopWhileDisconnected defaults to true, and maintains a 60FPS frame rate even when Leap Motion is not streaming
 * data at that rate (such as no hands in frame).  This is important for VR/WebGL apps which rely on rendering for
 * regular visual updates, including from other input devices.  Flipping this to false should be considered an
 * optimization for very specific use-cases.
 *
 *
 */


var Controller = module.exports = function(opts) {
  var inNode = (typeof(process) !== 'undefined' && process.versions && process.versions.node),
    controller = this;

  opts = _.defaults(opts || {}, {
    inNode: inNode
  });

  this.inNode = opts.inNode;

  opts = _.defaults(opts || {}, {
    frameEventName: this.useAnimationLoop() ? 'animationFrame' : 'deviceFrame',
    suppressAnimationLoop: !this.useAnimationLoop(),
    loopWhileDisconnected: true,
    useAllPlugins: false,
    checkVersion: true
  });

  this.animationFrameRequested = false;
  this.onAnimationFrame = function(timestamp) {
    if (controller.lastConnectionFrame.valid){
      controller.emit('animationFrame', controller.lastConnectionFrame);
    }
    controller.emit('frameEnd', timestamp);
    if (
      controller.loopWhileDisconnected &&
      ( ( controller.connection.focusedState !== false )  // loop while undefined, pre-ready.
        || controller.connection.opts.background) ){
      window.requestAnimationFrame(controller.onAnimationFrame);
    }else{
      controller.animationFrameRequested = false;
    }
  };
  this.suppressAnimationLoop = opts.suppressAnimationLoop;
  this.loopWhileDisconnected = opts.loopWhileDisconnected;
  this.frameEventName = opts.frameEventName;
  this.useAllPlugins = opts.useAllPlugins;
  this.history = new CircularBuffer(200);
  this.lastFrame = Frame.Invalid;
  this.lastValidFrame = Frame.Invalid;
  this.lastConnectionFrame = Frame.Invalid;
  this.accumulatedGestures = [];
  this.checkVersion = opts.checkVersion;
  if (opts.connectionType === undefined) {
    this.connectionType = (this.inBrowser() ? require('./connection/browser') : require('./connection/node'));
  } else {
    this.connectionType = opts.connectionType;
  }
  this.connection = new this.connectionType(opts);
  this.streamingCount = 0;
  this.devices = {};
  this.plugins = {};
  this._pluginPipelineSteps = {};
  this._pluginExtendedMethods = {};
  if (opts.useAllPlugins) this.useRegisteredPlugins();
  this.setupFrameEvents(opts);
  this.setupConnectionEvents();
  
  this.startAnimationLoop(); // immediately when started
}

Controller.prototype.gesture = function(type, cb) {
  var creator = gestureListener(this, type);
  if (cb !== undefined) {
    creator.stop(cb);
  }
  return creator;
}

/*
 * @returns the controller
 */
Controller.prototype.setBackground = function(state) {
  this.connection.setBackground(state);
  return this;
}

Controller.prototype.setOptimizeHMD = function(state) {
  this.connection.setOptimizeHMD(state);
  return this;
}

Controller.prototype.inBrowser = function() {
  return !this.inNode;
}

Controller.prototype.useAnimationLoop = function() {
  return this.inBrowser() && !this.inBackgroundPage();
}

Controller.prototype.inBackgroundPage = function(){
  // http://developer.chrome.com/extensions/extension#method-getBackgroundPage
  return (typeof(chrome) !== "undefined") &&
    chrome.extension &&
    chrome.extension.getBackgroundPage &&
    (chrome.extension.getBackgroundPage() === window)
}

/*
 * @returns the controller
 */
Controller.prototype.connect = function() {
  this.connection.connect();
  return this;
}

Controller.prototype.streaming = function() {
  return this.streamingCount > 0;
}

Controller.prototype.connected = function() {
  return !!this.connection.connected;
}

Controller.prototype.startAnimationLoop = function(){
  if (!this.suppressAnimationLoop && !this.animationFrameRequested) {
    this.animationFrameRequested = true;
    window.requestAnimationFrame(this.onAnimationFrame);
  }
}

/*
 * @returns the controller
 */
Controller.prototype.disconnect = function() {
  this.connection.disconnect();
  return this;
}

/**
 * Returns a frame of tracking data from the Leap.
 *
 * Use the optional history parameter to specify which frame to retrieve.
 * Call frame() or frame(0) to access the most recent frame; call frame(1) to
 * access the previous frame, and so on. If you use a history value greater
 * than the number of stored frames, then the controller returns an invalid frame.
 *
 * @method frame
 * @memberof Leap.Controller.prototype
 * @param {number} history The age of the frame to return, counting backwards from
 * the most recent frame (0) into the past and up to the maximum age (59).
 * @returns {Leap.Frame} The specified frame; or, if no history
 * parameter is specified, the newest frame. If a frame is not available at
 * the specified history position, an invalid Frame is returned.
 **/
Controller.prototype.frame = function(num) {
  return this.history.get(num) || Frame.Invalid;
}

Controller.prototype.loop = function(callback) {
  if (callback) {
    if (typeof callback === 'function'){
      this.on(this.frameEventName, callback);
    }else{
      // callback is actually of the form: {eventName: callback}
      this.setupFrameEvents(callback);
    }
  }

  return this.connect();
}

Controller.prototype.addStep = function(step) {
  if (!this.pipeline) this.pipeline = new Pipeline(this);
  this.pipeline.addStep(step);
}

// this is run on every deviceFrame
Controller.prototype.processFrame = function(frame) {
  if (frame.gestures) {
    this.accumulatedGestures = this.accumulatedGestures.concat(frame.gestures);
  }
  // lastConnectionFrame is used by the animation loop
  this.lastConnectionFrame = frame;
  this.startAnimationLoop(); // Only has effect if loopWhileDisconnected: false
  this.emit('deviceFrame', frame);
}

// on a this.deviceEventName (usually 'animationFrame' in browsers), this emits a 'frame'
Controller.prototype.processFinishedFrame = function(frame) {
  this.lastFrame = frame;
  if (frame.valid) {
    this.lastValidFrame = frame;
  }
  frame.controller = this;
  frame.historyIdx = this.history.push(frame);
  if (frame.gestures) {
    frame.gestures = this.accumulatedGestures;
    this.accumulatedGestures = [];
    for (var gestureIdx = 0; gestureIdx != frame.gestures.length; gestureIdx++) {
      this.emit("gesture", frame.gestures[gestureIdx], frame);
    }
  }
  if (this.pipeline) {
    frame = this.pipeline.run(frame);
    if (!frame) frame = Frame.Invalid;
  }
  this.emit('frame', frame);
  this.emitHandEvents(frame);
}

/**
 * The controller will emit 'hand' events for every hand on each frame.  The hand in question will be passed
 * to the event callback.
 *
 * @param frame
 */
Controller.prototype.emitHandEvents = function(frame){
  for (var i = 0; i < frame.hands.length; i++){
    this.emit('hand', frame.hands[i]);
  }
}

Controller.prototype.setupFrameEvents = function(opts){
  if (opts.frame){
    this.on('frame', opts.frame);
  }
  if (opts.hand){
    this.on('hand', opts.hand);
  }
}

/**
  Controller events.  The old 'deviceConnected' and 'deviceDisconnected' have been depricated -
  use 'deviceStreaming' and 'deviceStopped' instead, except in the case of an unexpected disconnect.

  There are 4 pairs of device events recently added/changed:
  -deviceAttached/deviceRemoved - called when a device's physical connection to the computer changes
  -deviceStreaming/deviceStopped - called when a device is paused or resumed.
  -streamingStarted/streamingStopped - called when there is/is no longer at least 1 streaming device.
									  Always comes after deviceStreaming.
  
  The first of all of the above event pairs is triggered as appropriate upon connection.  All of
  these events receives an argument with the most recent info about the device that triggered it.
  These events will always be fired in the order they are listed here, with reverse ordering for the
  matching shutdown call. (ie, deviceStreaming always comes after deviceAttached, and deviceStopped 
  will come before deviceRemoved).
  
  -deviceConnected/deviceDisconnected - These are considered deprecated and will be removed in
  the next revision.  In contrast to the other events and in keeping with it's original behavior,
  it will only be fired when a device begins streaming AFTER a connection has been established.
  It is not paired, and receives no device info.  Nearly identical functionality to
  streamingStarted/Stopped if you need to port.
*/
Controller.prototype.setupConnectionEvents = function() {
  var controller = this;
  this.connection.on('frame', function(frame) {
    controller.processFrame(frame);
  });
  // either deviceFrame or animationFrame:
  this.on(this.frameEventName, function(frame) {
    controller.processFinishedFrame(frame);
  });


  // here we backfill the 0.5.0 deviceEvents as best possible
  // backfill begin streaming events
  var backfillStreamingStartedEventsHandler = function(){
    if (controller.connection.opts.requestProtocolVersion < 5 && controller.streamingCount == 0){
      controller.streamingCount = 1;
      var info = {
        attached: true,
        streaming: true,
        type: 'unknown',
        id: "Lx00000000000"
      };
      controller.devices[info.id] = info;

      controller.emit('deviceAttached', info);
      controller.emit('deviceStreaming', info);
      controller.emit('streamingStarted', info);
      controller.connection.removeListener('frame', backfillStreamingStartedEventsHandler)
    }
  }

  var backfillStreamingStoppedEvents = function(){
    if (controller.streamingCount > 0) {
      for (var deviceId in controller.devices){
        controller.emit('deviceStopped', controller.devices[deviceId]);
        controller.emit('deviceRemoved', controller.devices[deviceId]);
      }
      // only emit streamingStopped once, with the last device
      controller.emit('streamingStopped', controller.devices[deviceId]);

      controller.streamingCount = 0;

      for (var deviceId in controller.devices){
        delete controller.devices[deviceId];
      }
    }
  }
  // Delegate connection events
  this.connection.on('focus', function() {

    if ( controller.loopWhileDisconnected ){

      controller.startAnimationLoop();

    }

    controller.emit('focus');

  });
  this.connection.on('blur', function() { controller.emit('blur') });
  this.connection.on('protocol', function(protocol) {

    protocol.on('beforeFrameCreated', function(frameData){
      controller.emit('beforeFrameCreated', frameData)
    });

    protocol.on('afterFrameCreated', function(frame, frameData){
      controller.emit('afterFrameCreated', frame, frameData)
    });

    controller.emit('protocol', protocol); 
  });

  this.connection.on('ready', function() {

    if (controller.checkVersion && !controller.inNode){
      // show dialog only to web users
      controller.checkOutOfDate();
    }

    controller.emit('ready');
  });

  this.connection.on('connect', function() {
    controller.emit('connect');
    controller.connection.removeListener('frame', backfillStreamingStartedEventsHandler)
    controller.connection.on('frame', backfillStreamingStartedEventsHandler);
  });

  this.connection.on('disconnect', function() {
    controller.emit('disconnect');
    backfillStreamingStoppedEvents();
  });

  // this does not fire when the controller is manually disconnected
  // or for Leap Service v1.2.0+
  this.connection.on('deviceConnect', function(evt) {
    if (evt.state){
      controller.emit('deviceConnected');
      controller.connection.removeListener('frame', backfillStreamingStartedEventsHandler)
      controller.connection.on('frame', backfillStreamingStartedEventsHandler);
    }else{
      controller.emit('deviceDisconnected');
      backfillStreamingStoppedEvents();
    }
  });

  // Does not fire for Leap Service pre v1.2.0
  this.connection.on('deviceEvent', function(evt) {
    var info = evt.state,
        oldInfo = controller.devices[info.id];

    //Grab a list of changed properties in the device info
    var changed = {};
    for(var property in info) {
      //If a property i doesn't exist the cache, or has changed...
      if( !oldInfo || !oldInfo.hasOwnProperty(property) || oldInfo[property] != info[property] ) {
        changed[property] = true;
      }
    }

    //Update the device list
    controller.devices[info.id] = info;

    //Fire events based on change list
    if(changed.attached) {
      controller.emit(info.attached ? 'deviceAttached' : 'deviceRemoved', info);
    }

    if(!changed.streaming) return;

    if(info.streaming) {
      controller.streamingCount++;
      controller.emit('deviceStreaming', info);
      if( controller.streamingCount == 1 ) {
        controller.emit('streamingStarted', info);
      }
      //if attached & streaming both change to true at the same time, that device was streaming
      //already when we connected.
      if(!changed.attached) {
        controller.emit('deviceConnected');
      }
    }
    //Since when devices are attached all fields have changed, don't send events for streaming being false.
    else if(!(changed.attached && info.attached)) {
      controller.streamingCount--;
      controller.emit('deviceStopped', info);
      if(controller.streamingCount == 0){
        controller.emit('streamingStopped', info);
      }
      controller.emit('deviceDisconnected');
    }

  });


  this.on('newListener', function(event, listener) {
    if( event == 'deviceConnected' || event == 'deviceDisconnected' ) {
      console.warn(event + " events are depricated.  Consider using 'streamingStarted/streamingStopped' or 'deviceStreaming/deviceStopped' instead");
    }
  });

};




// Checks if the protocol version is the latest, if if not, shows the dialog.
Controller.prototype.checkOutOfDate = function(){
  console.assert(this.connection && this.connection.protocol);

  var serviceVersion = this.connection.protocol.serviceVersion;
  var protocolVersion = this.connection.protocol.version;
  var defaultProtocolVersion = this.connectionType.defaultProtocolVersion;

  if (defaultProtocolVersion > protocolVersion){

    console.warn("Your Protocol Version is v" + protocolVersion +
        ", this app was designed for v" + defaultProtocolVersion);

    Dialog.warnOutOfDate({
      sV: serviceVersion,
      pV: protocolVersion
    });
    return true
  }else{
    return false
  }

};



Controller._pluginFactories = {};

/*
 * Registers a plugin, making is accessible to controller.use later on.
 *
 * @member plugin
 * @memberof Leap.Controller.prototype
 * @param {String} name The name of the plugin (usually camelCase).
 * @param {function} factory A factory method which will return an instance of a plugin.
 * The factory receives an optional hash of options, passed in via controller.use.
 *
 * Valid keys for the object include frame, hand, finger, tool, and pointable.  The value
 * of each key can be either a function or an object.  If given a function, that function
 * will be called once for every instance of the object, with that instance injected as an
 * argument.  This allows decoration of objects with additional data:
 *
 * ```javascript
 * Leap.Controller.plugin('testPlugin', function(options){
 *   return {
 *     frame: function(frame){
 *       frame.foo = 'bar';
 *     }
 *   }
 * });
 * ```
 *
 * When hand is used, the callback is called for every hand in `frame.hands`.  Note that
 * hand objects are recreated with every new frame, so that data saved on the hand will not
 * persist.
 *
 * ```javascript
 * Leap.Controller.plugin('testPlugin', function(){
 *   return {
 *     hand: function(hand){
 *       console.log('testPlugin running on hand ' + hand.id);
 *     }
 *   }
 * });
 * ```
 *
 * A factory can return an object to add custom functionality to Frames, Hands, or Pointables.
 * The methods are added directly to the object's prototype.  Finger and Tool cannot be used here, Pointable
 * must be used instead.
 * This is encouraged for calculations which may not be necessary on every frame.
 * Memoization is also encouraged, for cases where the method may be called many times per frame by the application.
 *
 * ```javascript
 * // This plugin allows hand.usefulData() to be called later.
 * Leap.Controller.plugin('testPlugin', function(){
 *   return {
 *     hand: {
 *       usefulData: function(){
 *         console.log('usefulData on hand', this.id);
 *         // memoize the results on to the hand, preventing repeat work:
 *         this.x || this.x = someExpensiveCalculation();
 *         return this.x;
 *       }
 *     }
 *   }
 * });
 *
 * Note that the factory pattern allows encapsulation for every plugin instance.
 *
 * ```javascript
 * Leap.Controller.plugin('testPlugin', function(options){
 *   options || options = {}
 *   options.center || options.center = [0,0,0]
 *
 *   privatePrintingMethod = function(){
 *     console.log('privatePrintingMethod - options', options);
 *   }
 *
 *   return {
 *     pointable: {
 *       publicPrintingMethod: function(){
 *         privatePrintingMethod();
 *       }
 *     }
 *   }
 * });
 *
 */
Controller.plugin = function(pluginName, factory) {
  if (this._pluginFactories[pluginName]) {
    console.warn("Plugin \"" + pluginName + "\" already registered");
  }
  return this._pluginFactories[pluginName] = factory;
};

/*
 * Returns a list of registered plugins.
 * @returns {Array} Plugin Factories.
 */
Controller.plugins = function() {
  return _.keys(this._pluginFactories);
};



var setPluginCallbacks = function(pluginName, type, callback){
  
  if ( ['beforeFrameCreated', 'afterFrameCreated'].indexOf(type) != -1 ){
    
      // todo - not able to "unuse" a plugin currently
      this.on(type, callback);
      
    }else {
      
      if (!this.pipeline) this.pipeline = new Pipeline(this);
    
      if (!this._pluginPipelineSteps[pluginName]) this._pluginPipelineSteps[pluginName] = [];

      this._pluginPipelineSteps[pluginName].push(
        
        this.pipeline.addWrappedStep(type, callback)
        
      );
      
    }
  
};

var setPluginMethods = function(pluginName, type, hash){
  var klass;
  
  if (!this._pluginExtendedMethods[pluginName]) this._pluginExtendedMethods[pluginName] = [];

  switch (type) {
    case 'frame':
      klass = Frame;
      break;
    case 'hand':
      klass = Hand;
      break;
    case 'pointable':
      klass = Pointable;
      _.extend(Finger.prototype, hash);
      _.extend(Finger.Invalid,   hash);
      break;
    case 'finger':
      klass = Finger;
      break;
    default:
      throw pluginName + ' specifies invalid object type "' + type + '" for prototypical extension'
  }

  _.extend(klass.prototype, hash);
  _.extend(klass.Invalid, hash);
  this._pluginExtendedMethods[pluginName].push([klass, hash])
  
}



/*
 * Begin using a registered plugin.  The plugin's functionality will be added to all frames
 * returned by the controller (and/or added to the objects within the frame).
 *  - The order of plugin execution inside the loop will match the order in which use is called by the application.
 *  - The plugin be run for both deviceFrames and animationFrames.
 *
 *  If called a second time, the options will be merged with those of the already instantiated plugin.
 *
 * @method use
 * @memberOf Leap.Controller.prototype
 * @param pluginName
 * @param {Hash} Options to be passed to the plugin's factory.
 * @returns the controller
 */
Controller.prototype.use = function(pluginName, options) {
  var functionOrHash, pluginFactory, key, pluginInstance;

  pluginFactory = (typeof pluginName == 'function') ? pluginName : Controller._pluginFactories[pluginName];

  if (!pluginFactory) {
    throw 'Leap Plugin ' + pluginName + ' not found.';
  }

  options || (options = {});

  if (this.plugins[pluginName]){
    _.extend(this.plugins[pluginName], options);
    return this;
  }

  this.plugins[pluginName] = options;

  pluginInstance = pluginFactory.call(this, options);

  for (key in pluginInstance) {

    functionOrHash = pluginInstance[key];

    if (typeof functionOrHash === 'function') {
      
      setPluginCallbacks.call(this, pluginName, key, functionOrHash);
      
    } else {
      
      setPluginMethods.call(this, pluginName, key, functionOrHash);
      
    }

  }

  return this;
};




/*
 * Stop using a used plugin.  This will remove any of the plugin's pipeline methods (those called on every frame)
 * and remove any methods which extend frame-object prototypes.
 *
 * @method stopUsing
 * @memberOf Leap.Controller.prototype
 * @param pluginName
 * @returns the controller
 */
Controller.prototype.stopUsing = function (pluginName) {
  var steps = this._pluginPipelineSteps[pluginName],
      extMethodHashes = this._pluginExtendedMethods[pluginName],
      i = 0, klass, extMethodHash;

  if (!this.plugins[pluginName]) return;

  if (steps) {
    for (i = 0; i < steps.length; i++) {
      this.pipeline.removeStep(steps[i]);
    }
  }

  if (extMethodHashes){
    for (i = 0; i < extMethodHashes.length; i++){
      klass = extMethodHashes[i][0];
      extMethodHash = extMethodHashes[i][1];
      for (var methodName in extMethodHash) {
        delete klass.prototype[methodName];
        delete klass.Invalid[methodName];
      }
    }
  }

  delete this.plugins[pluginName];

  return this;
}

Controller.prototype.useRegisteredPlugins = function(){
  for (var plugin in Controller._pluginFactories){
    this.use(plugin);
  }
}


_.extend(Controller.prototype, EventEmitter.prototype);

},{"./circular_buffer":2,"./connection/browser":4,"./connection/node":20,"./dialog":6,"./finger":7,"./frame":8,"./gesture":9,"./hand":10,"./pipeline":13,"./pointable":14,"__browserify_process":22,"events":21,"underscore":24}],6:[function(require,module,exports){
var process=require("__browserify_process");var Dialog = module.exports = function(message, options){
  this.options = (options || {});
  this.message = message;

  this.createElement();
};

Dialog.prototype.createElement = function(){
  this.element = document.createElement('div');
  this.element.className = "leapjs-dialog";
  this.element.style.position = "fixed";
  this.element.style.top = '8px';
  this.element.style.left = 0;
  this.element.style.right = 0;
  this.element.style.textAlign = 'center';
  this.element.style.zIndex = 1000;

  var dialog  = document.createElement('div');
  this.element.appendChild(dialog);
  dialog.style.className = "leapjs-dialog";
  dialog.style.display = "inline-block";
  dialog.style.margin = "auto";
  dialog.style.padding = "8px";
  dialog.style.color = "#222";
  dialog.style.background = "#eee";
  dialog.style.borderRadius = "4px";
  dialog.style.border = "1px solid #999";
  dialog.style.textAlign = "left";
  dialog.style.cursor = "pointer";
  dialog.style.whiteSpace = "nowrap";
  dialog.style.transition = "box-shadow 1s linear";
  dialog.innerHTML = this.message;


  if (this.options.onclick){
    dialog.addEventListener('click', this.options.onclick);
  }

  if (this.options.onmouseover){
    dialog.addEventListener('mouseover', this.options.onmouseover);
  }

  if (this.options.onmouseout){
    dialog.addEventListener('mouseout', this.options.onmouseout);
  }

  if (this.options.onmousemove){
    dialog.addEventListener('mousemove', this.options.onmousemove);
  }
};

Dialog.prototype.show = function(){
  document.body.appendChild(this.element);
  return this;
};

Dialog.prototype.hide = function(){
  document.body.removeChild(this.element);
  return this;
};




// Shows a DOM dialog box with links to developer.leapmotion.com to upgrade
// This will work whether or not the Leap is plugged in,
// As long as it is called after a call to .connect() and the 'ready' event has fired.
Dialog.warnOutOfDate = function(params){
  params || (params = {});

  var url = "http://developer.leapmotion.com?";

  params.returnTo = window.location.href;

  for (var key in params){
    url += key + '=' + encodeURIComponent(params[key]) + '&';
  }

  var dialog,
    onclick = function(event){

       if (event.target.id != 'leapjs-decline-upgrade'){

         var popup = window.open(url,
           '_blank',
           'height=800,width=1000,location=1,menubar=1,resizable=1,status=1,toolbar=1,scrollbars=1'
         );

         if (window.focus) {popup.focus()}

       }

       dialog.hide();

       return true;
    },


    message = "This site requires Leap Motion Tracking V2." +
      "<button id='leapjs-accept-upgrade'  style='color: #444; transition: box-shadow 100ms linear; cursor: pointer; vertical-align: baseline; margin-left: 16px;'>Upgrade</button>" +
      "<button id='leapjs-decline-upgrade' style='color: #444; transition: box-shadow 100ms linear; cursor: pointer; vertical-align: baseline; margin-left: 8px; '>Not Now</button>";

  dialog = new Dialog(message, {
      onclick: onclick,
      onmousemove: function(e){
        if (e.target == document.getElementById('leapjs-decline-upgrade')){
          document.getElementById('leapjs-decline-upgrade').style.color = '#000';
          document.getElementById('leapjs-decline-upgrade').style.boxShadow = '0px 0px 2px #5daa00';

          document.getElementById('leapjs-accept-upgrade').style.color = '#444';
          document.getElementById('leapjs-accept-upgrade').style.boxShadow = 'none';
        }else{
          document.getElementById('leapjs-accept-upgrade').style.color = '#000';
          document.getElementById('leapjs-accept-upgrade').style.boxShadow = '0px 0px 2px #5daa00';

          document.getElementById('leapjs-decline-upgrade').style.color = '#444';
          document.getElementById('leapjs-decline-upgrade').style.boxShadow = 'none';
        }
      },
      onmouseout: function(){
        document.getElementById('leapjs-decline-upgrade').style.color = '#444';
        document.getElementById('leapjs-decline-upgrade').style.boxShadow = 'none';
        document.getElementById('leapjs-accept-upgrade').style.color = '#444';
        document.getElementById('leapjs-accept-upgrade').style.boxShadow = 'none';
      }
    }
  );

  return dialog.show();
};


// Tracks whether we've warned for lack of bones API.  This will be shown only for early private-beta members.
Dialog.hasWarnedBones = false;

Dialog.warnBones = function(){
  if (this.hasWarnedBones) return;
  this.hasWarnedBones = true;

  console.warn("Your Leap Service is out of date");

  if ( !(typeof(process) !== 'undefined' && process.versions && process.versions.node) ){
    this.warnOutOfDate({reason: 'bones'});
  }

}
},{"__browserify_process":22}],7:[function(require,module,exports){
var Pointable = require('./pointable'),
  Bone = require('./bone')
  , Dialog = require('./dialog')
  , _ = require('underscore');

/**
* Constructs a Finger object.
*
* An uninitialized finger is considered invalid.
* Get valid Finger objects from a Frame or a Hand object.
*
* @class Finger
* @memberof Leap
* @classdesc
* The Finger class reports the physical characteristics of a finger.
*
* Both fingers and tools are classified as Pointable objects. Use the
* Pointable.tool property to determine whether a Pointable object represents a
* tool or finger. The Leap classifies a detected entity as a tool when it is
* thinner, straighter, and longer than a typical finger.
*
* Note that Finger objects can be invalid, which means that they do not
* contain valid tracking data and do not correspond to a physical entity.
* Invalid Finger objects can be the result of asking for a Finger object
* using an ID from an earlier frame when no Finger objects with that ID
* exist in the current frame. A Finger object created from the Finger
* constructor is also invalid. Test for validity with the Pointable.valid
* property.
*/
var Finger = module.exports = function(data) {
  Pointable.call(this, data); // use pointable as super-constructor
  
  /**
  * The position of the distal interphalangeal joint of the finger.
  * This joint is closest to the tip.
  * 
  * The distal interphalangeal joint is located between the most extreme segment
  * of the finger (the distal phalanx) and the middle segment (the medial
  * phalanx).
  *
  * @member dipPosition
  * @type {number[]}
  * @memberof Leap.Finger.prototype
  */  
  this.dipPosition = data.dipPosition;

  /**
  * The position of the proximal interphalangeal joint of the finger. This joint is the middle
  * joint of a finger.
  *
  * The proximal interphalangeal joint is located between the two finger segments
  * closest to the hand (the proximal and the medial phalanges). On a thumb,
  * which lacks an medial phalanx, this joint index identifies the knuckle joint
  * between the proximal phalanx and the metacarpal bone.
  *
  * @member pipPosition
  * @type {number[]}
  * @memberof Leap.Finger.prototype
  */  
  this.pipPosition = data.pipPosition;

  /**
  * The position of the metacarpopophalangeal joint, or knuckle, of the finger.
  *
  * The metacarpopophalangeal joint is located at the base of a finger between
  * the metacarpal bone and the first phalanx. The common name for this joint is
  * the knuckle.
  *
  * On a thumb, which has one less phalanx than a finger, this joint index
  * identifies the thumb joint near the base of the hand, between the carpal
  * and metacarpal bones.
  *
  * @member mcpPosition
  * @type {number[]}
  * @memberof Leap.Finger.prototype
  */  
  this.mcpPosition = data.mcpPosition;

  /**
   * The position of the Carpometacarpal joint
   *
   * This is at the distal end of the wrist, and has no common name.
   *
   */
  this.carpPosition = data.carpPosition;

  /**
  * Whether or not this finger is in an extended posture.
  *
  * A finger is considered extended if it is extended straight from the hand as if
  * pointing. A finger is not extended when it is bent down and curled towards the 
  * palm.
  * @member extended
  * @type {Boolean}
  * @memberof Leap.Finger.prototype
  */
  this.extended = data.extended;

  /**
  * An integer code for the name of this finger.
  * 
  * * 0 -- thumb
  * * 1 -- index finger
  * * 2 -- middle finger
  * * 3 -- ring finger
  * * 4 -- pinky
  *
  * @member type
  * @type {number}
  * @memberof Leap.Finger.prototype
  */
  this.type = data.type;

  this.finger = true;
  
  /**
  * The joint positions of this finger as an array in the order base to tip.
  *
  * @member positions
  * @type {array[]}
  * @memberof Leap.Finger.prototype
  */
  this.positions = [this.carpPosition, this.mcpPosition, this.pipPosition, this.dipPosition, this.tipPosition];

  if (data.bases){
    this.addBones(data);
  } else {
    Dialog.warnBones();
  }

};

_.extend(Finger.prototype, Pointable.prototype);


Finger.prototype.addBones = function(data){
  /**
  * Four bones per finger, from wrist outwards:
  * metacarpal, proximal, medial, and distal.
  *
  * See http://en.wikipedia.org/wiki/Interphalangeal_articulations_of_hand
  */
  this.metacarpal   = new Bone(this, {
    type: 0,
    width: this.width,
    prevJoint: this.carpPosition,
    nextJoint: this.mcpPosition,
    basis: data.bases[0]
  });

  this.proximal     = new Bone(this, {
    type: 1,
    width: this.width,
    prevJoint: this.mcpPosition,
    nextJoint: this.pipPosition,
    basis: data.bases[1]
  });

  this.medial = new Bone(this, {
    type: 2,
    width: this.width,
    prevJoint: this.pipPosition,
    nextJoint: this.dipPosition,
    basis: data.bases[2]
  });

  /**
   * Note that the `distal.nextJoint` position is slightly different from the `finger.tipPosition`.
   * The former is at the very end of the bone, where the latter is the center of a sphere positioned at
   * the tip of the finger.  The btipPosition "bone tip position" is a few mm closer to the wrist than
   * the tipPosition.
   * @type {Bone}
   */
  this.distal       = new Bone(this, {
    type: 3,
    width: this.width,
    prevJoint: this.dipPosition,
    nextJoint: data.btipPosition,
    basis: data.bases[3]
  });

  this.bones = [this.metacarpal, this.proximal, this.medial, this.distal];
};

Finger.prototype.toString = function() {
    return "Finger [ id:" + this.id + " " + this.length + "mmx | width:" + this.width + "mm | direction:" + this.direction + ' ]';
};

Finger.Invalid = { valid: false };

},{"./bone":1,"./dialog":6,"./pointable":14,"underscore":24}],8:[function(require,module,exports){
var Hand = require("./hand")
  , Pointable = require("./pointable")
  , createGesture = require("./gesture").createGesture
  , glMatrix = require("gl-matrix")
  , mat3 = glMatrix.mat3
  , vec3 = glMatrix.vec3
  , InteractionBox = require("./interaction_box")
  , Finger = require('./finger')
  , _ = require("underscore");

/**
 * Constructs a Frame object.
 *
 * Frame instances created with this constructor are invalid.
 * Get valid Frame objects by calling the
 * [Controller.frame]{@link Leap.Controller#frame}() function.
 *<C-D-Space>
 * @class Frame
 * @memberof Leap
 * @classdesc
 * The Frame class represents a set of hand and finger tracking data detected
 * in a single frame.
 *
 * The Leap detects hands, fingers and tools within the tracking area, reporting
 * their positions, orientations and motions in frames at the Leap frame rate.
 *
 * Access Frame objects using the [Controller.frame]{@link Leap.Controller#frame}() function.
 */
var Frame = module.exports = function(data) {
  /**
   * Reports whether this Frame instance is valid.
   *
   * A valid Frame is one generated by the Controller object that contains
   * tracking data for all detected entities. An invalid Frame contains no
   * actual tracking data, but you can call its functions without risk of a
   * undefined object exception. The invalid Frame mechanism makes it more
   * convenient to track individual data across the frame history. For example,
   * you can invoke:
   *
   * ```javascript
   * var finger = controller.frame(n).finger(fingerID);
   * ```
   *
   * for an arbitrary Frame history value, "n", without first checking whether
   * frame(n) returned a null object. (You should still check that the
   * returned Finger instance is valid.)
   *
   * @member valid
   * @memberof Leap.Frame.prototype
   * @type {Boolean}
   */
  this.valid = true;
  /**
   * A unique ID for this Frame. Consecutive frames processed by the Leap
   * have consecutive increasing values.
   * @member id
   * @memberof Leap.Frame.prototype
   * @type {String}
   */
  this.id = data.id;
  /**
   * The frame capture time in microseconds elapsed since the Leap started.
   * @member timestamp
   * @memberof Leap.Frame.prototype
   * @type {number}
   */
  this.timestamp = data.timestamp;
  /**
   * The list of Hand objects detected in this frame, given in arbitrary order.
   * The list can be empty if no hands are detected.
   *
   * @member hands[]
   * @memberof Leap.Frame.prototype
   * @type {Leap.Hand}
   */
  this.hands = [];
  this.handsMap = {};
  /**
   * The list of Pointable objects (fingers and tools) detected in this frame,
   * given in arbitrary order. The list can be empty if no fingers or tools are
   * detected.
   *
   * @member pointables[]
   * @memberof Leap.Frame.prototype
   * @type {Leap.Pointable}
   */
  this.pointables = [];
  /**
   * The list of Tool objects detected in this frame, given in arbitrary order.
   * The list can be empty if no tools are detected.
   *
   * @member tools[]
   * @memberof Leap.Frame.prototype
   * @type {Leap.Pointable}
   */
  this.tools = [];
  /**
   * The list of Finger objects detected in this frame, given in arbitrary order.
   * The list can be empty if no fingers are detected.
   * @member fingers[]
   * @memberof Leap.Frame.prototype
   * @type {Leap.Pointable}
   */
  this.fingers = [];

  /**
   * The InteractionBox associated with the current frame.
   *
   * @member interactionBox
   * @memberof Leap.Frame.prototype
   * @type {Leap.InteractionBox}
   */
  if (data.interactionBox) {
    this.interactionBox = new InteractionBox(data.interactionBox);
  }
  this.gestures = [];
  this.pointablesMap = {};
  this._translation = data.t;
  this._rotation = _.flatten(data.r);
  this._scaleFactor = data.s;
  this.data = data;
  this.type = 'frame'; // used by event emitting
  this.currentFrameRate = data.currentFrameRate;

  if (data.gestures) {
   /**
    * The list of Gesture objects detected in this frame, given in arbitrary order.
    * The list can be empty if no gestures are detected.
    *
    * Circle and swipe gestures are updated every frame. Tap gestures
    * only appear in the list for a single frame.
    * @member gestures[]
    * @memberof Leap.Frame.prototype
    * @type {Leap.Gesture}
    */
    for (var gestureIdx = 0, gestureCount = data.gestures.length; gestureIdx != gestureCount; gestureIdx++) {
      this.gestures.push(createGesture(data.gestures[gestureIdx]));
    }
  }
  this.postprocessData(data);
};

Frame.prototype.postprocessData = function(data){
  if (!data) {
    data = this.data;
  }

  for (var handIdx = 0, handCount = data.hands.length; handIdx != handCount; handIdx++) {
    var hand = new Hand(data.hands[handIdx]);
    hand.frame = this;
    this.hands.push(hand);
    this.handsMap[hand.id] = hand;
  }

  data.pointables = _.sortBy(data.pointables, function(pointable) { return pointable.id });

  for (var pointableIdx = 0, pointableCount = data.pointables.length; pointableIdx != pointableCount; pointableIdx++) {
    var pointableData = data.pointables[pointableIdx];
    var pointable = pointableData.dipPosition ? new Finger(pointableData) : new Pointable(pointableData);
    pointable.frame = this;
    this.addPointable(pointable);
  }
};

/**
 * Adds data from a pointable element into the pointablesMap; 
 * also adds the pointable to the frame.handsMap hand to which it belongs,
 * and to the hand's tools or hand's fingers map.
 * 
 * @param pointable {Object} a Pointable
 */
Frame.prototype.addPointable = function (pointable) {
  this.pointables.push(pointable);
  this.pointablesMap[pointable.id] = pointable;
  (pointable.tool ? this.tools : this.fingers).push(pointable);
  if (pointable.handId !== undefined && this.handsMap.hasOwnProperty(pointable.handId)) {
    var hand = this.handsMap[pointable.handId];
    hand.pointables.push(pointable);
    (pointable.tool ? hand.tools : hand.fingers).push(pointable);
    switch (pointable.type){
      case 0:
        hand.thumb = pointable;
        break;
      case 1:
        hand.indexFinger = pointable;
        break;
      case 2:
        hand.middleFinger = pointable;
        break;
      case 3:
        hand.ringFinger = pointable;
        break;
      case 4:
        hand.pinky = pointable;
        break;
    }
  }
};

/**
 * The tool with the specified ID in this frame.
 *
 * Use the Frame tool() function to retrieve a tool from
 * this frame using an ID value obtained from a previous frame.
 * This function always returns a Pointable object, but if no tool
 * with the specified ID is present, an invalid Pointable object is returned.
 *
 * Note that ID values persist across frames, but only until tracking of a
 * particular object is lost. If tracking of a tool is lost and subsequently
 * regained, the new Pointable object representing that tool may have a
 * different ID than that representing the tool in an earlier frame.
 *
 * @method tool
 * @memberof Leap.Frame.prototype
 * @param {String} id The ID value of a Tool object from a previous frame.
 * @returns {Leap.Pointable} The tool with the
 * matching ID if one exists in this frame; otherwise, an invalid Pointable object
 * is returned.
 */
Frame.prototype.tool = function(id) {
  var pointable = this.pointable(id);
  return pointable.tool ? pointable : Pointable.Invalid;
};

/**
 * The Pointable object with the specified ID in this frame.
 *
 * Use the Frame pointable() function to retrieve the Pointable object from
 * this frame using an ID value obtained from a previous frame.
 * This function always returns a Pointable object, but if no finger or tool
 * with the specified ID is present, an invalid Pointable object is returned.
 *
 * Note that ID values persist across frames, but only until tracking of a
 * particular object is lost. If tracking of a finger or tool is lost and subsequently
 * regained, the new Pointable object representing that finger or tool may have
 * a different ID than that representing the finger or tool in an earlier frame.
 *
 * @method pointable
 * @memberof Leap.Frame.prototype
 * @param {String} id The ID value of a Pointable object from a previous frame.
 * @returns {Leap.Pointable} The Pointable object with
 * the matching ID if one exists in this frame;
 * otherwise, an invalid Pointable object is returned.
 */
Frame.prototype.pointable = function(id) {
  return this.pointablesMap[id] || Pointable.Invalid;
};

/**
 * The finger with the specified ID in this frame.
 *
 * Use the Frame finger() function to retrieve the finger from
 * this frame using an ID value obtained from a previous frame.
 * This function always returns a Finger object, but if no finger
 * with the specified ID is present, an invalid Pointable object is returned.
 *
 * Note that ID values persist across frames, but only until tracking of a
 * particular object is lost. If tracking of a finger is lost and subsequently
 * regained, the new Pointable object representing that physical finger may have
 * a different ID than that representing the finger in an earlier frame.
 *
 * @method finger
 * @memberof Leap.Frame.prototype
 * @param {String} id The ID value of a finger from a previous frame.
 * @returns {Leap.Pointable} The finger with the
 * matching ID if one exists in this frame; otherwise, an invalid Pointable
 * object is returned.
 */
Frame.prototype.finger = function(id) {
  var pointable = this.pointable(id);
  return !pointable.tool ? pointable : Pointable.Invalid;
};

/**
 * The Hand object with the specified ID in this frame.
 *
 * Use the Frame hand() function to retrieve the Hand object from
 * this frame using an ID value obtained from a previous frame.
 * This function always returns a Hand object, but if no hand
 * with the specified ID is present, an invalid Hand object is returned.
 *
 * Note that ID values persist across frames, but only until tracking of a
 * particular object is lost. If tracking of a hand is lost and subsequently
 * regained, the new Hand object representing that physical hand may have
 * a different ID than that representing the physical hand in an earlier frame.
 *
 * @method hand
 * @memberof Leap.Frame.prototype
 * @param {String} id The ID value of a Hand object from a previous frame.
 * @returns {Leap.Hand} The Hand object with the matching
 * ID if one exists in this frame; otherwise, an invalid Hand object is returned.
 */
Frame.prototype.hand = function(id) {
  return this.handsMap[id] || Hand.Invalid;
};

/**
 * The angle of rotation around the rotation axis derived from the overall
 * rotational motion between the current frame and the specified frame.
 *
 * The returned angle is expressed in radians measured clockwise around
 * the rotation axis (using the right-hand rule) between the start and end frames.
 * The value is always between 0 and pi radians (0 and 180 degrees).
 *
 * The Leap derives frame rotation from the relative change in position and
 * orientation of all objects detected in the field of view.
 *
 * If either this frame or sinceFrame is an invalid Frame object, then the
 * angle of rotation is zero.
 *
 * @method rotationAngle
 * @memberof Leap.Frame.prototype
 * @param {Leap.Frame} sinceFrame The starting frame for computing the relative rotation.
 * @param {number[]} [axis] The axis to measure rotation around.
 * @returns {number} A positive value containing the heuristically determined
 * rotational change between the current frame and that specified in the sinceFrame parameter.
 */
Frame.prototype.rotationAngle = function(sinceFrame, axis) {
  if (!this.valid || !sinceFrame.valid) return 0.0;

  var rot = this.rotationMatrix(sinceFrame);
  var cs = (rot[0] + rot[4] + rot[8] - 1.0)*0.5;
  var angle = Math.acos(cs);
  angle = isNaN(angle) ? 0.0 : angle;

  if (axis !== undefined) {
    var rotAxis = this.rotationAxis(sinceFrame);
    angle *= vec3.dot(rotAxis, vec3.normalize(vec3.create(), axis));
  }

  return angle;
};

/**
 * The axis of rotation derived from the overall rotational motion between
 * the current frame and the specified frame.
 *
 * The returned direction vector is normalized.
 *
 * The Leap derives frame rotation from the relative change in position and
 * orientation of all objects detected in the field of view.
 *
 * If either this frame or sinceFrame is an invalid Frame object, or if no
 * rotation is detected between the two frames, a zero vector is returned.
 *
 * @method rotationAxis
 * @memberof Leap.Frame.prototype
 * @param {Leap.Frame} sinceFrame The starting frame for computing the relative rotation.
 * @returns {number[]} A normalized direction vector representing the axis of the heuristically determined
 * rotational change between the current frame and that specified in the sinceFrame parameter.
 */
Frame.prototype.rotationAxis = function(sinceFrame) {
  if (!this.valid || !sinceFrame.valid) return vec3.create();
  return vec3.normalize(vec3.create(), [
    this._rotation[7] - sinceFrame._rotation[5],
    this._rotation[2] - sinceFrame._rotation[6],
    this._rotation[3] - sinceFrame._rotation[1]
  ]);
}

/**
 * The transform matrix expressing the rotation derived from the overall
 * rotational motion between the current frame and the specified frame.
 *
 * The Leap derives frame rotation from the relative change in position and
 * orientation of all objects detected in the field of view.
 *
 * If either this frame or sinceFrame is an invalid Frame object, then
 * this method returns an identity matrix.
 *
 * @method rotationMatrix
 * @memberof Leap.Frame.prototype
 * @param {Leap.Frame} sinceFrame The starting frame for computing the relative rotation.
 * @returns {number[]} A transformation matrix containing the heuristically determined
 * rotational change between the current frame and that specified in the sinceFrame parameter.
 */
Frame.prototype.rotationMatrix = function(sinceFrame) {
  if (!this.valid || !sinceFrame.valid) return mat3.create();
  var transpose = mat3.transpose(mat3.create(), this._rotation)
  return mat3.multiply(mat3.create(), sinceFrame._rotation, transpose);
}

/**
 * The scale factor derived from the overall motion between the current frame and the specified frame.
 *
 * The scale factor is always positive. A value of 1.0 indicates no scaling took place.
 * Values between 0.0 and 1.0 indicate contraction and values greater than 1.0 indicate expansion.
 *
 * The Leap derives scaling from the relative inward or outward motion of all
 * objects detected in the field of view (independent of translation and rotation).
 *
 * If either this frame or sinceFrame is an invalid Frame object, then this method returns 1.0.
 *
 * @method scaleFactor
 * @memberof Leap.Frame.prototype
 * @param {Leap.Frame} sinceFrame The starting frame for computing the relative scaling.
 * @returns {number} A positive value representing the heuristically determined
 * scaling change ratio between the current frame and that specified in the sinceFrame parameter.
 */
Frame.prototype.scaleFactor = function(sinceFrame) {
  if (!this.valid || !sinceFrame.valid) return 1.0;
  return Math.exp(this._scaleFactor - sinceFrame._scaleFactor);
}

/**
 * The change of position derived from the overall linear motion between the
 * current frame and the specified frame.
 *
 * The returned translation vector provides the magnitude and direction of the
 * movement in millimeters.
 *
 * The Leap derives frame translation from the linear motion of all objects
 * detected in the field of view.
 *
 * If either this frame or sinceFrame is an invalid Frame object, then this
 * method returns a zero vector.
 *
 * @method translation
 * @memberof Leap.Frame.prototype
 * @param {Leap.Frame} sinceFrame The starting frame for computing the relative translation.
 * @returns {number[]} A vector representing the heuristically determined change in
 * position of all objects between the current frame and that specified in the sinceFrame parameter.
 */
Frame.prototype.translation = function(sinceFrame) {
  if (!this.valid || !sinceFrame.valid) return vec3.create();
  return vec3.subtract(vec3.create(), this._translation, sinceFrame._translation);
}

/**
 * A string containing a brief, human readable description of the Frame object.
 *
 * @method toString
 * @memberof Leap.Frame.prototype
 * @returns {String} A brief description of this frame.
 */
Frame.prototype.toString = function() {
  var str = "Frame [ id:"+this.id+" | timestamp:"+this.timestamp+" | Hand count:("+this.hands.length+") | Pointable count:("+this.pointables.length+")";
  if (this.gestures) str += " | Gesture count:("+this.gestures.length+")";
  str += " ]";
  return str;
}

/**
 * Returns a JSON-formatted string containing the hands, pointables and gestures
 * in this frame.
 *
 * @method dump
 * @memberof Leap.Frame.prototype
 * @returns {String} A JSON-formatted string.
 */
Frame.prototype.dump = function() {
  var out = '';
  out += "Frame Info:<br/>";
  out += this.toString();
  out += "<br/><br/>Hands:<br/>"
  for (var handIdx = 0, handCount = this.hands.length; handIdx != handCount; handIdx++) {
    out += "  "+ this.hands[handIdx].toString() + "<br/>";
  }
  out += "<br/><br/>Pointables:<br/>";
  for (var pointableIdx = 0, pointableCount = this.pointables.length; pointableIdx != pointableCount; pointableIdx++) {
      out += "  "+ this.pointables[pointableIdx].toString() + "<br/>";
  }
  if (this.gestures) {
    out += "<br/><br/>Gestures:<br/>";
    for (var gestureIdx = 0, gestureCount = this.gestures.length; gestureIdx != gestureCount; gestureIdx++) {
        out += "  "+ this.gestures[gestureIdx].toString() + "<br/>";
    }
  }
  out += "<br/><br/>Raw JSON:<br/>";
  out += JSON.stringify(this.data);
  return out;
}

/**
 * An invalid Frame object.
 *
 * You can use this invalid Frame in comparisons testing
 * whether a given Frame instance is valid or invalid. (You can also check the
 * [Frame.valid]{@link Leap.Frame#valid} property.)
 *
 * @static
 * @type {Leap.Frame}
 * @name Invalid
 * @memberof Leap.Frame
 */
Frame.Invalid = {
  valid: false,
  hands: [],
  fingers: [],
  tools: [],
  gestures: [],
  pointables: [],
  pointable: function() { return Pointable.Invalid },
  finger: function() { return Pointable.Invalid },
  hand: function() { return Hand.Invalid },
  toString: function() { return "invalid frame" },
  dump: function() { return this.toString() },
  rotationAngle: function() { return 0.0; },
  rotationMatrix: function() { return mat3.create(); },
  rotationAxis: function() { return vec3.create(); },
  scaleFactor: function() { return 1.0; },
  translation: function() { return vec3.create(); }
};

},{"./finger":7,"./gesture":9,"./hand":10,"./interaction_box":12,"./pointable":14,"gl-matrix":23,"underscore":24}],9:[function(require,module,exports){
var glMatrix = require("gl-matrix")
  , vec3 = glMatrix.vec3
  , EventEmitter = require('events').EventEmitter
  , _ = require('underscore');

/**
 * Constructs a new Gesture object.
 *
 * An uninitialized Gesture object is considered invalid. Get valid instances
 * of the Gesture class, which will be one of the Gesture subclasses, from a
 * Frame object.
 *
 * @class Gesture
 * @abstract
 * @memberof Leap
 * @classdesc
 * The Gesture class represents a recognized movement by the user.
 *
 * The Leap watches the activity within its field of view for certain movement
 * patterns typical of a user gesture or command. For example, a movement from side to
 * side with the hand can indicate a swipe gesture, while a finger poking forward
 * can indicate a screen tap gesture.
 *
 * When the Leap recognizes a gesture, it assigns an ID and adds a
 * Gesture object to the frame gesture list. For continuous gestures, which
 * occur over many frames, the Leap updates the gesture by adding
 * a Gesture object having the same ID and updated properties in each
 * subsequent frame.
 *
 * **Important:** Recognition for each type of gesture must be enabled;
 * otherwise **no gestures are recognized or reported**.
 *
 * Subclasses of Gesture define the properties for the specific movement patterns
 * recognized by the Leap.
 *
 * The Gesture subclasses for include:
 *
 * * CircleGesture -- A circular movement by a finger.
 * * SwipeGesture -- A straight line movement by the hand with fingers extended.
 * * ScreenTapGesture -- A forward tapping movement by a finger.
 * * KeyTapGesture -- A downward tapping movement by a finger.
 *
 * Circle and swipe gestures are continuous and these objects can have a
 * state of start, update, and stop.
 *
 * The screen tap gesture is a discrete gesture. The Leap only creates a single
 * ScreenTapGesture object appears for each tap and it always has a stop state.
 *
 * Get valid Gesture instances from a Frame object. You can get a list of gestures
 * from the Frame gestures array. You can also use the Frame gesture() method
 * to find a gesture in the current frame using an ID value obtained in a
 * previous frame.
 *
 * Gesture objects can be invalid. For example, when you get a gesture by ID
 * using Frame.gesture(), and there is no gesture with that ID in the current
 * frame, then gesture() returns an Invalid Gesture object (rather than a null
 * value). Always check object validity in situations where a gesture might be
 * invalid.
 */
var createGesture = exports.createGesture = function(data) {
  var gesture;
  switch (data.type) {
    case 'circle':
      gesture = new CircleGesture(data);
      break;
    case 'swipe':
      gesture = new SwipeGesture(data);
      break;
    case 'screenTap':
      gesture = new ScreenTapGesture(data);
      break;
    case 'keyTap':
      gesture = new KeyTapGesture(data);
      break;
    default:
      throw "unknown gesture type";
  }

 /**
  * The gesture ID.
  *
  * All Gesture objects belonging to the same recognized movement share the
  * same ID value. Use the ID value with the Frame::gesture() method to
  * find updates related to this Gesture object in subsequent frames.
  *
  * @member id
  * @memberof Leap.Gesture.prototype
  * @type {number}
  */
  gesture.id = data.id;
 /**
  * The list of hands associated with this Gesture, if any.
  *
  * If no hands are related to this gesture, the list is empty.
  *
  * @member handIds
  * @memberof Leap.Gesture.prototype
  * @type {Array}
  */
  gesture.handIds = data.handIds.slice();
 /**
  * The list of fingers and tools associated with this Gesture, if any.
  *
  * If no Pointable objects are related to this gesture, the list is empty.
  *
  * @member pointableIds
  * @memberof Leap.Gesture.prototype
  * @type {Array}
  */
  gesture.pointableIds = data.pointableIds.slice();
 /**
  * The elapsed duration of the recognized movement up to the
  * frame containing this Gesture object, in microseconds.
  *
  * The duration reported for the first Gesture in the sequence (with the
  * start state) will typically be a small positive number since
  * the movement must progress far enough for the Leap to recognize it as
  * an intentional gesture.
  *
  * @member duration
  * @memberof Leap.Gesture.prototype
  * @type {number}
  */
  gesture.duration = data.duration;
 /**
  * The gesture ID.
  *
  * Recognized movements occur over time and have a beginning, a middle,
  * and an end. The 'state()' attribute reports where in that sequence this
  * Gesture object falls.
  *
  * Possible values for the state field are:
  *
  * * start
  * * update
  * * stop
  *
  * @member state
  * @memberof Leap.Gesture.prototype
  * @type {String}
  */
  gesture.state = data.state;
 /**
  * The gesture type.
  *
  * Possible values for the type field are:
  *
  * * circle
  * * swipe
  * * screenTap
  * * keyTap
  *
  * @member type
  * @memberof Leap.Gesture.prototype
  * @type {String}
  */
  gesture.type = data.type;
  return gesture;
}

/*
 * Returns a builder object, which uses method chaining for gesture callback binding.
 */
var gestureListener = exports.gestureListener = function(controller, type) {
  var handlers = {};
  var gestureMap = {};

  controller.on('gesture', function(gesture, frame) {
    if (gesture.type == type) {
      if (gesture.state == "start" || gesture.state == "stop") {
        if (gestureMap[gesture.id] === undefined) {
          var gestureTracker = new Gesture(gesture, frame);
          gestureMap[gesture.id] = gestureTracker;
          _.each(handlers, function(cb, name) {
            gestureTracker.on(name, cb);
          });
        }
      }
      gestureMap[gesture.id].update(gesture, frame);
      if (gesture.state == "stop") {
        delete gestureMap[gesture.id];
      }
    }
  });
  var builder = {
    start: function(cb) {
      handlers['start'] = cb;
      return builder;
    },
    stop: function(cb) {
      handlers['stop'] = cb;
      return builder;
    },
    complete: function(cb) {
      handlers['stop'] = cb;
      return builder;
    },
    update: function(cb) {
      handlers['update'] = cb;
      return builder;
    }
  }
  return builder;
}

var Gesture = exports.Gesture = function(gesture, frame) {
  this.gestures = [gesture];
  this.frames = [frame];
}

Gesture.prototype.update = function(gesture, frame) {
  this.lastGesture = gesture;
  this.lastFrame = frame;
  this.gestures.push(gesture);
  this.frames.push(frame);
  this.emit(gesture.state, this);
}

Gesture.prototype.translation = function() {
  return vec3.subtract(vec3.create(), this.lastGesture.startPosition, this.lastGesture.position);
}

_.extend(Gesture.prototype, EventEmitter.prototype);

/**
 * Constructs a new CircleGesture object.
 *
 * An uninitialized CircleGesture object is considered invalid. Get valid instances
 * of the CircleGesture class from a Frame object.
 *
 * @class CircleGesture
 * @memberof Leap
 * @augments Leap.Gesture
 * @classdesc
 * The CircleGesture classes represents a circular finger movement.
 *
 * A circle movement is recognized when the tip of a finger draws a circle
 * within the Leap field of view.
 *
 * ![CircleGesture](images/Leap_Gesture_Circle.png)
 *
 * Circle gestures are continuous. The CircleGesture objects for the gesture have
 * three possible states:
 *
 * * start -- The circle gesture has just started. The movement has
 *  progressed far enough for the recognizer to classify it as a circle.
 * * update -- The circle gesture is continuing.
 * * stop -- The circle gesture is finished.
 */
var CircleGesture = function(data) {
 /**
  * The center point of the circle within the Leap frame of reference.
  *
  * @member center
  * @memberof Leap.CircleGesture.prototype
  * @type {number[]}
  */
  this.center = data.center;
 /**
  * The normal vector for the circle being traced.
  *
  * If you draw the circle clockwise, the normal vector points in the same
  * general direction as the pointable object drawing the circle. If you draw
  * the circle counterclockwise, the normal points back toward the
  * pointable. If the angle between the normal and the pointable object
  * drawing the circle is less than 90 degrees, then the circle is clockwise.
  *
  * ```javascript
  *    var clockwiseness;
  *    if (circle.pointable.direction.angleTo(circle.normal) <= PI/4) {
  *        clockwiseness = "clockwise";
  *    }
  *    else
  *    {
  *        clockwiseness = "counterclockwise";
  *    }
  * ```
  *
  * @member normal
  * @memberof Leap.CircleGesture.prototype
  * @type {number[]}
  */
  this.normal = data.normal;
 /**
  * The number of times the finger tip has traversed the circle.
  *
  * Progress is reported as a positive number of the number. For example,
  * a progress value of .5 indicates that the finger has gone halfway
  * around, while a value of 3 indicates that the finger has gone around
  * the the circle three times.
  *
  * Progress starts where the circle gesture began. Since the circle
  * must be partially formed before the Leap can recognize it, progress
  * will be greater than zero when a circle gesture first appears in the
  * frame.
  *
  * @member progress
  * @memberof Leap.CircleGesture.prototype
  * @type {number}
  */
  this.progress = data.progress;
 /**
  * The radius of the circle in mm.
  *
  * @member radius
  * @memberof Leap.CircleGesture.prototype
  * @type {number}
  */
  this.radius = data.radius;
}

CircleGesture.prototype.toString = function() {
  return "CircleGesture ["+JSON.stringify(this)+"]";
}

/**
 * Constructs a new SwipeGesture object.
 *
 * An uninitialized SwipeGesture object is considered invalid. Get valid instances
 * of the SwipeGesture class from a Frame object.
 *
 * @class SwipeGesture
 * @memberof Leap
 * @augments Leap.Gesture
 * @classdesc
 * The SwipeGesture class represents a swiping motion of a finger or tool.
 *
 * ![SwipeGesture](images/Leap_Gesture_Swipe.png)
 *
 * Swipe gestures are continuous.
 */
var SwipeGesture = function(data) {
 /**
  * The starting position within the Leap frame of
  * reference, in mm.
  *
  * @member startPosition
  * @memberof Leap.SwipeGesture.prototype
  * @type {number[]}
  */
  this.startPosition = data.startPosition;
 /**
  * The current swipe position within the Leap frame of
  * reference, in mm.
  *
  * @member position
  * @memberof Leap.SwipeGesture.prototype
  * @type {number[]}
  */
  this.position = data.position;
 /**
  * The unit direction vector parallel to the swipe motion.
  *
  * You can compare the components of the vector to classify the swipe as
  * appropriate for your application. For example, if you are using swipes
  * for two dimensional scrolling, you can compare the x and y values to
  * determine if the swipe is primarily horizontal or vertical.
  *
  * @member direction
  * @memberof Leap.SwipeGesture.prototype
  * @type {number[]}
  */
  this.direction = data.direction;
 /**
  * The speed of the finger performing the swipe gesture in
  * millimeters per second.
  *
  * @member speed
  * @memberof Leap.SwipeGesture.prototype
  * @type {number}
  */
  this.speed = data.speed;
}

SwipeGesture.prototype.toString = function() {
  return "SwipeGesture ["+JSON.stringify(this)+"]";
}

/**
 * Constructs a new ScreenTapGesture object.
 *
 * An uninitialized ScreenTapGesture object is considered invalid. Get valid instances
 * of the ScreenTapGesture class from a Frame object.
 *
 * @class ScreenTapGesture
 * @memberof Leap
 * @augments Leap.Gesture
 * @classdesc
 * The ScreenTapGesture class represents a tapping gesture by a finger or tool.
 *
 * A screen tap gesture is recognized when the tip of a finger pokes forward
 * and then springs back to approximately the original postion, as if
 * tapping a vertical screen. The tapping finger must pause briefly before beginning the tap.
 *
 * ![ScreenTap](images/Leap_Gesture_Tap2.png)
 *
 * ScreenTap gestures are discrete. The ScreenTapGesture object representing a tap always
 * has the state, STATE_STOP. Only one ScreenTapGesture object is created for each
 * screen tap gesture recognized.
 */
var ScreenTapGesture = function(data) {
 /**
  * The position where the screen tap is registered.
  *
  * @member position
  * @memberof Leap.ScreenTapGesture.prototype
  * @type {number[]}
  */
  this.position = data.position;
 /**
  * The direction of finger tip motion.
  *
  * @member direction
  * @memberof Leap.ScreenTapGesture.prototype
  * @type {number[]}
  */
  this.direction = data.direction;
 /**
  * The progess value is always 1.0 for a screen tap gesture.
  *
  * @member progress
  * @memberof Leap.ScreenTapGesture.prototype
  * @type {number}
  */
  this.progress = data.progress;
}

ScreenTapGesture.prototype.toString = function() {
  return "ScreenTapGesture ["+JSON.stringify(this)+"]";
}

/**
 * Constructs a new KeyTapGesture object.
 *
 * An uninitialized KeyTapGesture object is considered invalid. Get valid instances
 * of the KeyTapGesture class from a Frame object.
 *
 * @class KeyTapGesture
 * @memberof Leap
 * @augments Leap.Gesture
 * @classdesc
 * The KeyTapGesture class represents a tapping gesture by a finger or tool.
 *
 * A key tap gesture is recognized when the tip of a finger rotates down toward the
 * palm and then springs back to approximately the original postion, as if
 * tapping. The tapping finger must pause briefly before beginning the tap.
 *
 * ![KeyTap](images/Leap_Gesture_Tap.png)
 *
 * Key tap gestures are discrete. The KeyTapGesture object representing a tap always
 * has the state, STATE_STOP. Only one KeyTapGesture object is created for each
 * key tap gesture recognized.
 */
var KeyTapGesture = function(data) {
    /**
     * The position where the key tap is registered.
     *
     * @member position
     * @memberof Leap.KeyTapGesture.prototype
     * @type {number[]}
     */
    this.position = data.position;
    /**
     * The direction of finger tip motion.
     *
     * @member direction
     * @memberof Leap.KeyTapGesture.prototype
     * @type {number[]}
     */
    this.direction = data.direction;
    /**
     * The progess value is always 1.0 for a key tap gesture.
     *
     * @member progress
     * @memberof Leap.KeyTapGesture.prototype
     * @type {number}
     */
    this.progress = data.progress;
}

KeyTapGesture.prototype.toString = function() {
  return "KeyTapGesture ["+JSON.stringify(this)+"]";
}

},{"events":21,"gl-matrix":23,"underscore":24}],10:[function(require,module,exports){
var Pointable = require("./pointable")
  , Bone = require('./bone')
  , glMatrix = require("gl-matrix")
  , mat3 = glMatrix.mat3
  , vec3 = glMatrix.vec3
  , _ = require("underscore");

/**
 * Constructs a Hand object.
 *
 * An uninitialized hand is considered invalid.
 * Get valid Hand objects from a Frame object.
 * @class Hand
 * @memberof Leap
 * @classdesc
 * The Hand class reports the physical characteristics of a detected hand.
 *
 * Hand tracking data includes a palm position and velocity; vectors for
 * the palm normal and direction to the fingers; properties of a sphere fit
 * to the hand; and lists of the attached fingers and tools.
 *
 * Note that Hand objects can be invalid, which means that they do not contain
 * valid tracking data and do not correspond to a physical entity. Invalid Hand
 * objects can be the result of asking for a Hand object using an ID from an
 * earlier frame when no Hand objects with that ID exist in the current frame.
 * A Hand object created from the Hand constructor is also invalid.
 * Test for validity with the [Hand.valid]{@link Leap.Hand#valid} property.
 */
var Hand = module.exports = function(data) {
  /**
   * A unique ID assigned to this Hand object, whose value remains the same
   * across consecutive frames while the tracked hand remains visible. If
   * tracking is lost (for example, when a hand is occluded by another hand
   * or when it is withdrawn from or reaches the edge of the Leap field of view),
   * the Leap may assign a new ID when it detects the hand in a future frame.
   *
   * Use the ID value with the {@link Frame.hand}() function to find this
   * Hand object in future frames.
   *
   * @member id
   * @memberof Leap.Hand.prototype
   * @type {String}
   */
  this.id = data.id;
  /**
   * The center position of the palm in millimeters from the Leap origin.
   * @member palmPosition
   * @memberof Leap.Hand.prototype
   * @type {number[]}
   */
  this.palmPosition = data.palmPosition;
  /**
   * The direction from the palm position toward the fingers.
   *
   * The direction is expressed as a unit vector pointing in the same
   * direction as the directed line from the palm position to the fingers.
   *
   * @member direction
   * @memberof Leap.Hand.prototype
   * @type {number[]}
   */
  this.direction = data.direction;
  /**
   * The rate of change of the palm position in millimeters/second.
   *
   * @member palmVeclocity
   * @memberof Leap.Hand.prototype
   * @type {number[]}
   */
  this.palmVelocity = data.palmVelocity;
  /**
   * The normal vector to the palm. If your hand is flat, this vector will
   * point downward, or "out" of the front surface of your palm.
   *
   * ![Palm Vectors](images/Leap_Palm_Vectors.png)
   *
   * The direction is expressed as a unit vector pointing in the same
   * direction as the palm normal (that is, a vector orthogonal to the palm).
   * @member palmNormal
   * @memberof Leap.Hand.prototype
   * @type {number[]}
   */
  this.palmNormal = data.palmNormal;
  /**
   * The center of a sphere fit to the curvature of this hand.
   *
   * This sphere is placed roughly as if the hand were holding a ball.
   *
   * ![Hand Ball](images/Leap_Hand_Ball.png)
   * @member sphereCenter
   * @memberof Leap.Hand.prototype
   * @type {number[]}
   */
  this.sphereCenter = data.sphereCenter;
  /**
   * The radius of a sphere fit to the curvature of this hand, in millimeters.
   *
   * This sphere is placed roughly as if the hand were holding a ball. Thus the
   * size of the sphere decreases as the fingers are curled into a fist.
   *
   * @member sphereRadius
   * @memberof Leap.Hand.prototype
   * @type {number}
   */
  this.sphereRadius = data.sphereRadius;
  /**
   * Reports whether this is a valid Hand object.
   *
   * @member valid
   * @memberof Leap.Hand.prototype
   * @type {boolean}
   */
  this.valid = true;
  /**
   * The list of Pointable objects (fingers and tools) detected in this frame
   * that are associated with this hand, given in arbitrary order. The list
   * can be empty if no fingers or tools associated with this hand are detected.
   *
   * Use the {@link Pointable} tool property to determine
   * whether or not an item in the list represents a tool or finger.
   * You can also get only the tools using the Hand.tools[] list or
   * only the fingers using the Hand.fingers[] list.
   *
   * @member pointables[]
   * @memberof Leap.Hand.prototype
   * @type {Leap.Pointable[]}
   */
  this.pointables = [];
  /**
   * The list of fingers detected in this frame that are attached to
   * this hand, given in arbitrary order.
   *
   * The list can be empty if no fingers attached to this hand are detected.
   *
   * @member fingers[]
   * @memberof Leap.Hand.prototype
   * @type {Leap.Pointable[]}
   */
  this.fingers = [];
  
  if (data.armBasis){
    this.arm = new Bone(this, {
      type: 4,
      width: data.armWidth,
      prevJoint: data.elbow,
      nextJoint: data.wrist,
      basis: data.armBasis
    });
  }else{
    this.arm = null;
  }
  
  /**
   * The list of tools detected in this frame that are held by this
   * hand, given in arbitrary order.
   *
   * The list can be empty if no tools held by this hand are detected.
   *
   * @member tools[]
   * @memberof Leap.Hand.prototype
   * @type {Leap.Pointable[]}
   */
  this.tools = [];
  this._translation = data.t;
  this._rotation = _.flatten(data.r);
  this._scaleFactor = data.s;

  /**
   * Time the hand has been visible in seconds.
   *
   * @member timeVisible
   * @memberof Leap.Hand.prototype
   * @type {number}
   */
   this.timeVisible = data.timeVisible;

  /**
   * The palm position with stabalization
   * @member stabilizedPalmPosition
   * @memberof Leap.Hand.prototype
   * @type {number[]}
   */
   this.stabilizedPalmPosition = data.stabilizedPalmPosition;

   /**
   * Reports whether this is a left or a right hand.
   *
   * @member type
   * @type {String}
   * @memberof Leap.Hand.prototype
   */
   this.type = data.type;
   this.grabStrength = data.grabStrength;
   this.pinchStrength = data.pinchStrength;
   this.confidence = data.confidence;
}

/**
 * The finger with the specified ID attached to this hand.
 *
 * Use this function to retrieve a Pointable object representing a finger
 * attached to this hand using an ID value obtained from a previous frame.
 * This function always returns a Pointable object, but if no finger
 * with the specified ID is present, an invalid Pointable object is returned.
 *
 * Note that the ID values assigned to fingers persist across frames, but only
 * until tracking of a particular finger is lost. If tracking of a finger is
 * lost and subsequently regained, the new Finger object representing that
 * finger may have a different ID than that representing the finger in an
 * earlier frame.
 *
 * @method finger
 * @memberof Leap.Hand.prototype
 * @param {String} id The ID value of a finger from a previous frame.
 * @returns {Leap.Pointable} The Finger object with
 * the matching ID if one exists for this hand in this frame; otherwise, an
 * invalid Finger object is returned.
 */
Hand.prototype.finger = function(id) {
  var finger = this.frame.finger(id);
  return (finger && (finger.handId == this.id)) ? finger : Pointable.Invalid;
}

/**
 * The angle of rotation around the rotation axis derived from the change in
 * orientation of this hand, and any associated fingers and tools, between the
 * current frame and the specified frame.
 *
 * The returned angle is expressed in radians measured clockwise around the
 * rotation axis (using the right-hand rule) between the start and end frames.
 * The value is always between 0 and pi radians (0 and 180 degrees).
 *
 * If a corresponding Hand object is not found in sinceFrame, or if either
 * this frame or sinceFrame are invalid Frame objects, then the angle of rotation is zero.
 *
 * @method rotationAngle
 * @memberof Leap.Hand.prototype
 * @param {Leap.Frame} sinceFrame The starting frame for computing the relative rotation.
 * @param {numnber[]} [axis] The axis to measure rotation around.
 * @returns {number} A positive value representing the heuristically determined
 * rotational change of the hand between the current frame and that specified in
 * the sinceFrame parameter.
 */
Hand.prototype.rotationAngle = function(sinceFrame, axis) {
  if (!this.valid || !sinceFrame.valid) return 0.0;
  var sinceHand = sinceFrame.hand(this.id);
  if(!sinceHand.valid) return 0.0;
  var rot = this.rotationMatrix(sinceFrame);
  var cs = (rot[0] + rot[4] + rot[8] - 1.0)*0.5
  var angle = Math.acos(cs);
  angle = isNaN(angle) ? 0.0 : angle;
  if (axis !== undefined) {
    var rotAxis = this.rotationAxis(sinceFrame);
    angle *= vec3.dot(rotAxis, vec3.normalize(vec3.create(), axis));
  }
  return angle;
}

/**
 * The axis of rotation derived from the change in orientation of this hand, and
 * any associated fingers and tools, between the current frame and the specified frame.
 *
 * The returned direction vector is normalized.
 *
 * If a corresponding Hand object is not found in sinceFrame, or if either
 * this frame or sinceFrame are invalid Frame objects, then this method returns a zero vector.
 *
 * @method rotationAxis
 * @memberof Leap.Hand.prototype
 * @param {Leap.Frame} sinceFrame The starting frame for computing the relative rotation.
 * @returns {number[]} A normalized direction Vector representing the axis of the heuristically determined
 * rotational change of the hand between the current frame and that specified in the sinceFrame parameter.
 */
Hand.prototype.rotationAxis = function(sinceFrame) {
  if (!this.valid || !sinceFrame.valid) return vec3.create();
  var sinceHand = sinceFrame.hand(this.id);
  if (!sinceHand.valid) return vec3.create();
  return vec3.normalize(vec3.create(), [
    this._rotation[7] - sinceHand._rotation[5],
    this._rotation[2] - sinceHand._rotation[6],
    this._rotation[3] - sinceHand._rotation[1]
  ]);
}

/**
 * The transform matrix expressing the rotation derived from the change in
 * orientation of this hand, and any associated fingers and tools, between
 * the current frame and the specified frame.
 *
 * If a corresponding Hand object is not found in sinceFrame, or if either
 * this frame or sinceFrame are invalid Frame objects, then this method returns
 * an identity matrix.
 *
 * @method rotationMatrix
 * @memberof Leap.Hand.prototype
 * @param {Leap.Frame} sinceFrame The starting frame for computing the relative rotation.
 * @returns {number[]} A transformation Matrix containing the heuristically determined
 * rotational change of the hand between the current frame and that specified in the sinceFrame parameter.
 */
Hand.prototype.rotationMatrix = function(sinceFrame) {
  if (!this.valid || !sinceFrame.valid) return mat3.create();
  var sinceHand = sinceFrame.hand(this.id);
  if(!sinceHand.valid) return mat3.create();
  var transpose = mat3.transpose(mat3.create(), this._rotation);
  var m = mat3.multiply(mat3.create(), sinceHand._rotation, transpose);
  return m;
}

/**
 * The scale factor derived from the hand's motion between the current frame and the specified frame.
 *
 * The scale factor is always positive. A value of 1.0 indicates no scaling took place.
 * Values between 0.0 and 1.0 indicate contraction and values greater than 1.0 indicate expansion.
 *
 * The Leap derives scaling from the relative inward or outward motion of a hand
 * and its associated fingers and tools (independent of translation and rotation).
 *
 * If a corresponding Hand object is not found in sinceFrame, or if either this frame or sinceFrame
 * are invalid Frame objects, then this method returns 1.0.
 *
 * @method scaleFactor
 * @memberof Leap.Hand.prototype
 * @param {Leap.Frame} sinceFrame The starting frame for computing the relative scaling.
 * @returns {number} A positive value representing the heuristically determined
 * scaling change ratio of the hand between the current frame and that specified in the sinceFrame parameter.
 */
Hand.prototype.scaleFactor = function(sinceFrame) {
  if (!this.valid || !sinceFrame.valid) return 1.0;
  var sinceHand = sinceFrame.hand(this.id);
  if(!sinceHand.valid) return 1.0;

  return Math.exp(this._scaleFactor - sinceHand._scaleFactor);
}

/**
 * The change of position of this hand between the current frame and the specified frame
 *
 * The returned translation vector provides the magnitude and direction of the
 * movement in millimeters.
 *
 * If a corresponding Hand object is not found in sinceFrame, or if either this frame or
 * sinceFrame are invalid Frame objects, then this method returns a zero vector.
 *
 * @method translation
 * @memberof Leap.Hand.prototype
 * @param {Leap.Frame} sinceFrame The starting frame for computing the relative translation.
 * @returns {number[]} A Vector representing the heuristically determined change in hand
 * position between the current frame and that specified in the sinceFrame parameter.
 */
Hand.prototype.translation = function(sinceFrame) {
  if (!this.valid || !sinceFrame.valid) return vec3.create();
  var sinceHand = sinceFrame.hand(this.id);
  if(!sinceHand.valid) return vec3.create();
  return [
    this._translation[0] - sinceHand._translation[0],
    this._translation[1] - sinceHand._translation[1],
    this._translation[2] - sinceHand._translation[2]
  ];
}

/**
 * A string containing a brief, human readable description of the Hand object.
 * @method toString
 * @memberof Leap.Hand.prototype
 * @returns {String} A description of the Hand as a string.
 */
Hand.prototype.toString = function() {
  return "Hand (" + this.type + ") [ id: "+ this.id + " | palm velocity:"+this.palmVelocity+" | sphere center:"+this.sphereCenter+" ] ";
}

/**
 * The pitch angle in radians.
 *
 * Pitch is the angle between the negative z-axis and the projection of
 * the vector onto the y-z plane. In other words, pitch represents rotation
 * around the x-axis.
 * If the vector points upward, the returned angle is between 0 and pi radians
 * (180 degrees); if it points downward, the angle is between 0 and -pi radians.
 *
 * @method pitch
 * @memberof Leap.Hand.prototype
 * @returns {number} The angle of this vector above or below the horizon (x-z plane).
 *
 */
Hand.prototype.pitch = function() {
  return Math.atan2(this.direction[1], -this.direction[2]);
}

/**
 *  The yaw angle in radians.
 *
 * Yaw is the angle between the negative z-axis and the projection of
 * the vector onto the x-z plane. In other words, yaw represents rotation
 * around the y-axis. If the vector points to the right of the negative z-axis,
 * then the returned angle is between 0 and pi radians (180 degrees);
 * if it points to the left, the angle is between 0 and -pi radians.
 *
 * @method yaw
 * @memberof Leap.Hand.prototype
 * @returns {number} The angle of this vector to the right or left of the y-axis.
 *
 */
Hand.prototype.yaw = function() {
  return Math.atan2(this.direction[0], -this.direction[2]);
}

/**
 *  The roll angle in radians.
 *
 * Roll is the angle between the y-axis and the projection of
 * the vector onto the x-y plane. In other words, roll represents rotation
 * around the z-axis. If the vector points to the left of the y-axis,
 * then the returned angle is between 0 and pi radians (180 degrees);
 * if it points to the right, the angle is between 0 and -pi radians.
 *
 * @method roll
 * @memberof Leap.Hand.prototype
 * @returns {number} The angle of this vector to the right or left of the y-axis.
 *
 */
Hand.prototype.roll = function() {
  return Math.atan2(this.palmNormal[0], -this.palmNormal[1]);
}

/**
 * An invalid Hand object.
 *
 * You can use an invalid Hand object in comparisons testing
 * whether a given Hand instance is valid or invalid. (You can also use the
 * Hand valid property.)
 *
 * @static
 * @type {Leap.Hand}
 * @name Invalid
 * @memberof Leap.Hand
 */
Hand.Invalid = {
  valid: false,
  fingers: [],
  tools: [],
  pointables: [],
  left: false,
  pointable: function() { return Pointable.Invalid },
  finger: function() { return Pointable.Invalid },
  toString: function() { return "invalid frame" },
  dump: function() { return this.toString(); },
  rotationAngle: function() { return 0.0; },
  rotationMatrix: function() { return mat3.create(); },
  rotationAxis: function() { return vec3.create(); },
  scaleFactor: function() { return 1.0; },
  translation: function() { return vec3.create(); }
};

},{"./bone":1,"./pointable":14,"gl-matrix":23,"underscore":24}],11:[function(require,module,exports){
/**
 * Leap is the global namespace of the Leap API.
 * @namespace Leap
 */
module.exports = {
  Controller: require("./controller"),
  Frame: require("./frame"),
  Gesture: require("./gesture"),
  Hand: require("./hand"),
  Pointable: require("./pointable"),
  Finger: require("./finger"),
  InteractionBox: require("./interaction_box"),
  CircularBuffer: require("./circular_buffer"),
  UI: require("./ui"),
  JSONProtocol: require("./protocol").JSONProtocol,
  glMatrix: require("gl-matrix"),
  mat3: require("gl-matrix").mat3,
  vec3: require("gl-matrix").vec3,
  loopController: undefined,
  version: require('./version.js'),

  /**
   * Expose utility libraries for convenience
   * Use carefully - they may be subject to upgrade or removal in different versions of LeapJS.
   *
   */
  _: require('underscore'),
  EventEmitter: require('events').EventEmitter,

  /**
   * The Leap.loop() function passes a frame of Leap data to your
   * callback function and then calls window.requestAnimationFrame() after
   * executing your callback function.
   *
   * Leap.loop() sets up the Leap controller and WebSocket connection for you.
   * You do not need to create your own controller when using this method.
   *
   * Your callback function is called on an interval determined by the client
   * browser. Typically, this is on an interval of 60 frames/second. The most
   * recent frame of Leap data is passed to your callback function. If the Leap
   * is producing frames at a slower rate than the browser frame rate, the same
   * frame of Leap data can be passed to your function in successive animation
   * updates.
   *
   * As an alternative, you can create your own Controller object and use a
   * {@link Controller#onFrame onFrame} callback to process the data at
   * the frame rate of the Leap device. See {@link Controller} for an
   * example.
   *
   * @method Leap.loop
   * @param {function} callback A function called when the browser is ready to
   * draw to the screen. The most recent {@link Frame} object is passed to
   * your callback function.
   *
   * ```javascript
   *    Leap.loop( function( frame ) {
   *        // ... your code here
   *    })
   * ```
   */
  loop: function(opts, callback) {
    if (opts && callback === undefined &&  ( ({}).toString.call(opts) === '[object Function]' ) ) {
      callback = opts;
      opts = {};
    }

    if (this.loopController) {
      if (opts){
        this.loopController.setupFrameEvents(opts);
      }
    }else{
      this.loopController = new this.Controller(opts);
    }

    this.loopController.loop(callback);
    return this.loopController;
  },

  /*
   * Convenience method for Leap.Controller.plugin
   */
  plugin: function(name, options){
    this.Controller.plugin(name, options)
  }
}

},{"./circular_buffer":2,"./controller":5,"./finger":7,"./frame":8,"./gesture":9,"./hand":10,"./interaction_box":12,"./pointable":14,"./protocol":15,"./ui":16,"./version.js":19,"events":21,"gl-matrix":23,"underscore":24}],12:[function(require,module,exports){
var glMatrix = require("gl-matrix")
  , vec3 = glMatrix.vec3;

/**
 * Constructs a InteractionBox object.
 *
 * @class InteractionBox
 * @memberof Leap
 * @classdesc
 * The InteractionBox class represents a box-shaped region completely within
 * the field of view of the Leap Motion controller.
 *
 * The interaction box is an axis-aligned rectangular prism and provides
 * normalized coordinates for hands, fingers, and tools within this box.
 * The InteractionBox class can make it easier to map positions in the
 * Leap Motion coordinate system to 2D or 3D coordinate systems used
 * for application drawing.
 *
 * ![Interaction Box](images/Leap_InteractionBox.png)
 *
 * The InteractionBox region is defined by a center and dimensions along the x, y, and z axes.
 */
var InteractionBox = module.exports = function(data) {
  /**
   * Indicates whether this is a valid InteractionBox object.
   *
   * @member valid
   * @type {Boolean}
   * @memberof Leap.InteractionBox.prototype
   */
  this.valid = true;
  /**
   * The center of the InteractionBox in device coordinates (millimeters).
   * This point is equidistant from all sides of the box.
   *
   * @member center
   * @type {number[]}
   * @memberof Leap.InteractionBox.prototype
   */
  this.center = data.center;

  this.size = data.size;
  /**
   * The width of the InteractionBox in millimeters, measured along the x-axis.
   *
   * @member width
   * @type {number}
   * @memberof Leap.InteractionBox.prototype
   */
  this.width = data.size[0];
  /**
   * The height of the InteractionBox in millimeters, measured along the y-axis.
   *
   * @member height
   * @type {number}
   * @memberof Leap.InteractionBox.prototype
   */
  this.height = data.size[1];
  /**
   * The depth of the InteractionBox in millimeters, measured along the z-axis.
   *
   * @member depth
   * @type {number}
   * @memberof Leap.InteractionBox.prototype
   */
  this.depth = data.size[2];
}

/**
 * Converts a position defined by normalized InteractionBox coordinates
 * into device coordinates in millimeters.
 *
 * This function performs the inverse of normalizePoint().
 *
 * @method denormalizePoint
 * @memberof Leap.InteractionBox.prototype
 * @param {number[]} normalizedPosition The input position in InteractionBox coordinates.
 * @returns {number[]} The corresponding denormalized position in device coordinates.
 */
InteractionBox.prototype.denormalizePoint = function(normalizedPosition) {
  return vec3.fromValues(
    (normalizedPosition[0] - 0.5) * this.size[0] + this.center[0],
    (normalizedPosition[1] - 0.5) * this.size[1] + this.center[1],
    (normalizedPosition[2] - 0.5) * this.size[2] + this.center[2]
  );
}

/**
 * Normalizes the coordinates of a point using the interaction box.
 *
 * Coordinates from the Leap Motion frame of reference (millimeters) are
 * converted to a range of [0..1] such that the minimum value of the
 * InteractionBox maps to 0 and the maximum value of the InteractionBox maps to 1.
 *
 * @method normalizePoint
 * @memberof Leap.InteractionBox.prototype
 * @param {number[]} position The input position in device coordinates.
 * @param {Boolean} clamp Whether or not to limit the output value to the range [0,1]
 * when the input position is outside the InteractionBox. Defaults to true.
 * @returns {number[]} The normalized position.
 */
InteractionBox.prototype.normalizePoint = function(position, clamp) {
  var vec = vec3.fromValues(
    ((position[0] - this.center[0]) / this.size[0]) + 0.5,
    ((position[1] - this.center[1]) / this.size[1]) + 0.5,
    ((position[2] - this.center[2]) / this.size[2]) + 0.5
  );

  if (clamp) {
    vec[0] = Math.min(Math.max(vec[0], 0), 1);
    vec[1] = Math.min(Math.max(vec[1], 0), 1);
    vec[2] = Math.min(Math.max(vec[2], 0), 1);
  }
  return vec;
}

/**
 * Writes a brief, human readable description of the InteractionBox object.
 *
 * @method toString
 * @memberof Leap.InteractionBox.prototype
 * @returns {String} A description of the InteractionBox object as a string.
 */
InteractionBox.prototype.toString = function() {
  return "InteractionBox [ width:" + this.width + " | height:" + this.height + " | depth:" + this.depth + " ]";
}

/**
 * An invalid InteractionBox object.
 *
 * You can use this InteractionBox instance in comparisons testing
 * whether a given InteractionBox instance is valid or invalid. (You can also use the
 * InteractionBox.valid property.)
 *
 * @static
 * @type {Leap.InteractionBox}
 * @name Invalid
 * @memberof Leap.InteractionBox
 */
InteractionBox.Invalid = { valid: false };

},{"gl-matrix":23}],13:[function(require,module,exports){
var Pipeline = module.exports = function (controller) {
  this.steps = [];
  this.controller = controller;
}

Pipeline.prototype.addStep = function (step) {
  this.steps.push(step);
}

Pipeline.prototype.run = function (frame) {
  var stepsLength = this.steps.length;
  for (var i = 0; i != stepsLength; i++) {
    if (!frame) break;
    frame = this.steps[i](frame);
  }
  return frame;
}

Pipeline.prototype.removeStep = function(step){
  var index = this.steps.indexOf(step);
  if (index === -1) throw "Step not found in pipeline";
  this.steps.splice(index, 1);
}

/*
 * Wraps a plugin callback method in method which can be run inside the pipeline.
 * This wrapper method loops the callback over objects within the frame as is appropriate,
 * calling the callback for each in turn.
 *
 * @method createStepFunction
 * @memberOf Leap.Controller.prototype
 * @param {Controller} The controller on which the callback is called.
 * @param {String} type What frame object the callback is run for and receives.
 *       Can be one of 'frame', 'finger', 'hand', 'pointable', 'tool'
 * @param {function} callback The method which will be run inside the pipeline loop.  Receives one argument, such as a hand.
 * @private
 */
Pipeline.prototype.addWrappedStep = function (type, callback) {
  var controller = this.controller,
    step = function (frame) {
      var dependencies, i, len;
      dependencies = (type == 'frame') ? [frame] : (frame[type + 's'] || []);

      for (i = 0, len = dependencies.length; i < len; i++) {
        callback.call(controller, dependencies[i]);
      }

      return frame;
    };

  this.addStep(step);
  return step;
};
},{}],14:[function(require,module,exports){
var glMatrix = require("gl-matrix")
  , vec3 = glMatrix.vec3;

/**
 * Constructs a Pointable object.
 *
 * An uninitialized pointable is considered invalid.
 * Get valid Pointable objects from a Frame or a Hand object.
 *
 * @class Pointable
 * @memberof Leap
 * @classdesc
 * The Pointable class reports the physical characteristics of a detected
 * finger or tool.
 *
 * Both fingers and tools are classified as Pointable objects. Use the
 * Pointable.tool property to determine whether a Pointable object represents a
 * tool or finger. The Leap classifies a detected entity as a tool when it is
 * thinner, straighter, and longer than a typical finger.
 *
 * Note that Pointable objects can be invalid, which means that they do not
 * contain valid tracking data and do not correspond to a physical entity.
 * Invalid Pointable objects can be the result of asking for a Pointable object
 * using an ID from an earlier frame when no Pointable objects with that ID
 * exist in the current frame. A Pointable object created from the Pointable
 * constructor is also invalid. Test for validity with the Pointable.valid
 * property.
 */
var Pointable = module.exports = function(data) {
  /**
   * Indicates whether this is a valid Pointable object.
   *
   * @member valid
   * @type {Boolean}
   * @memberof Leap.Pointable.prototype
   */
  this.valid = true;
  /**
   * A unique ID assigned to this Pointable object, whose value remains the
   * same across consecutive frames while the tracked finger or tool remains
   * visible. If tracking is lost (for example, when a finger is occluded by
   * another finger or when it is withdrawn from the Leap field of view), the
   * Leap may assign a new ID when it detects the entity in a future frame.
   *
   * Use the ID value with the pointable() functions defined for the
   * {@link Frame} and {@link Frame.Hand} classes to find this
   * Pointable object in future frames.
   *
   * @member id
   * @type {String}
   * @memberof Leap.Pointable.prototype
   */
  this.id = data.id;
  this.handId = data.handId;
  /**
   * The estimated length of the finger or tool in millimeters.
   *
   * The reported length is the visible length of the finger or tool from the
   * hand to tip. If the length isn't known, then a value of 0 is returned.
   *
   * @member length
   * @type {number}
   * @memberof Leap.Pointable.prototype
   */
  this.length = data.length;
  /**
   * Whether or not the Pointable is believed to be a tool.
   * Tools are generally longer, thinner, and straighter than fingers.
   *
   * If tool is false, then this Pointable must be a finger.
   *
   * @member tool
   * @type {Boolean}
   * @memberof Leap.Pointable.prototype
   */
  this.tool = data.tool;
  /**
   * The estimated width of the tool in millimeters.
   *
   * The reported width is the average width of the visible portion of the
   * tool from the hand to the tip. If the width isn't known,
   * then a value of 0 is returned.
   *
   * Pointable objects representing fingers do not have a width property.
   *
   * @member width
   * @type {number}
   * @memberof Leap.Pointable.prototype
   */
  this.width = data.width;
  /**
   * The direction in which this finger or tool is pointing.
   *
   * The direction is expressed as a unit vector pointing in the same
   * direction as the tip.
   *
   * ![Finger](images/Leap_Finger_Model.png)
   * @member direction
   * @type {number[]}
   * @memberof Leap.Pointable.prototype
   */
  this.direction = data.direction;
  /**
   * The tip position in millimeters from the Leap origin.
   * Stabilized
   *
   * @member stabilizedTipPosition
   * @type {number[]}
   * @memberof Leap.Pointable.prototype
   */
  this.stabilizedTipPosition = data.stabilizedTipPosition;
  /**
   * The tip position in millimeters from the Leap origin.
   *
   * @member tipPosition
   * @type {number[]}
   * @memberof Leap.Pointable.prototype
   */
  this.tipPosition = data.tipPosition;
  /**
   * The rate of change of the tip position in millimeters/second.
   *
   * @member tipVelocity
   * @type {number[]}
   * @memberof Leap.Pointable.prototype
   */
  this.tipVelocity = data.tipVelocity;
  /**
   * The current touch zone of this Pointable object.
   *
   * The Leap Motion software computes the touch zone based on a floating touch
   * plane that adapts to the user's finger movement and hand posture. The Leap
   * Motion software interprets purposeful movements toward this plane as potential touch
   * points. When a Pointable moves close to the adaptive touch plane, it enters the
   * "hovering" zone. When a Pointable reaches or passes through the plane, it enters
   * the "touching" zone.
   *
   * The possible states include:
   *
   * * "none" -- The Pointable is outside the hovering zone.
   * * "hovering" -- The Pointable is close to, but not touching the touch plane.
   * * "touching" -- The Pointable has penetrated the touch plane.
   *
   * The touchDistance value provides a normalized indication of the distance to
   * the touch plane when the Pointable is in the hovering or touching zones.
   *
   * @member touchZone
   * @type {String}
   * @memberof Leap.Pointable.prototype
   */
  this.touchZone = data.touchZone;
  /**
   * A value proportional to the distance between this Pointable object and the
   * adaptive touch plane.
   *
   * ![Touch Distance](images/Leap_Touch_Plane.png)
   *
   * The touch distance is a value in the range [-1, 1]. The value 1.0 indicates the
   * Pointable is at the far edge of the hovering zone. The value 0 indicates the
   * Pointable is just entering the touching zone. A value of -1.0 indicates the
   * Pointable is firmly within the touching zone. Values in between are
   * proportional to the distance from the plane. Thus, the touchDistance of 0.5
   * indicates that the Pointable is halfway into the hovering zone.
   *
   * You can use the touchDistance value to modulate visual feedback given to the
   * user as their fingers close in on a touch target, such as a button.
   *
   * @member touchDistance
   * @type {number}
   * @memberof Leap.Pointable.prototype
   */
  this.touchDistance = data.touchDistance;

  /**
   * How long the pointable has been visible in seconds.
   *
   * @member timeVisible
   * @type {number}
   * @memberof Leap.Pointable.prototype
   */
  this.timeVisible = data.timeVisible;
}

/**
 * A string containing a brief, human readable description of the Pointable
 * object.
 *
 * @method toString
 * @memberof Leap.Pointable.prototype
 * @returns {String} A description of the Pointable object as a string.
 */
Pointable.prototype.toString = function() {
  return "Pointable [ id:" + this.id + " " + this.length + "mmx | width:" + this.width + "mm | direction:" + this.direction + ' ]';
}

/**
 * Returns the hand which the pointable is attached to.
 */
Pointable.prototype.hand = function(){
  return this.frame.hand(this.handId);
}

/**
 * An invalid Pointable object.
 *
 * You can use this Pointable instance in comparisons testing
 * whether a given Pointable instance is valid or invalid. (You can also use the
 * Pointable.valid property.)

 * @static
 * @type {Leap.Pointable}
 * @name Invalid
 * @memberof Leap.Pointable
 */
Pointable.Invalid = { valid: false };

},{"gl-matrix":23}],15:[function(require,module,exports){
var Frame = require('./frame')
  , Hand = require('./hand')
  , Pointable = require('./pointable')
  , Finger = require('./finger')
  , _ = require('underscore')
  , EventEmitter = require('events').EventEmitter;

var Event = function(data) {
  this.type = data.type;
  this.state = data.state;
};

exports.chooseProtocol = function(header) {
  var protocol;
  switch(header.version) {
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
    case 6:
      protocol = JSONProtocol(header);
      protocol.sendBackground = function(connection, state) {
        connection.send(protocol.encode({background: state}));
      }
      protocol.sendFocused = function(connection, state) {
        connection.send(protocol.encode({focused: state}));
      }
      protocol.sendOptimizeHMD = function(connection, state) {
        connection.send(protocol.encode({optimizeHMD: state}));
      }
      break;
    default:
      throw "unrecognized version";
  }
  return protocol;
}

var JSONProtocol = exports.JSONProtocol = function(header) {

  var protocol = function(frameData) {

    if (frameData.event) {

      return new Event(frameData.event);

    } else {

      protocol.emit('beforeFrameCreated', frameData);

      var frame = new Frame(frameData);

      protocol.emit('afterFrameCreated', frame, frameData);

      return frame;

    }

  };

  protocol.encode = function(message) {
    return JSON.stringify(message);
  };
  protocol.version = header.version;
  protocol.serviceVersion = header.serviceVersion;
  protocol.versionLong = 'Version ' + header.version;
  protocol.type = 'protocol';

  _.extend(protocol, EventEmitter.prototype);

  return protocol;
};



},{"./finger":7,"./frame":8,"./hand":10,"./pointable":14,"events":21,"underscore":24}],16:[function(require,module,exports){
exports.UI = {
  Region: require("./ui/region"),
  Cursor: require("./ui/cursor")
};
},{"./ui/cursor":17,"./ui/region":18}],17:[function(require,module,exports){
var Cursor = module.exports = function() {
  return function(frame) {
    var pointable = frame.pointables.sort(function(a, b) { return a.z - b.z })[0]
    if (pointable && pointable.valid) {
      frame.cursorPosition = pointable.tipPosition
    }
    return frame
  }
}

},{}],18:[function(require,module,exports){
var EventEmitter = require('events').EventEmitter
  , _ = require('underscore')

var Region = module.exports = function(start, end) {
  this.start = new Vector(start)
  this.end = new Vector(end)
  this.enteredFrame = null
}

Region.prototype.hasPointables = function(frame) {
  for (var i = 0; i != frame.pointables.length; i++) {
    var position = frame.pointables[i].tipPosition
    if (position.x >= this.start.x && position.x <= this.end.x && position.y >= this.start.y && position.y <= this.end.y && position.z >= this.start.z && position.z <= this.end.z) {
      return true
    }
  }
  return false
}

Region.prototype.listener = function(opts) {
  var region = this
  if (opts && opts.nearThreshold) this.setupNearRegion(opts.nearThreshold)
  return function(frame) {
    return region.updatePosition(frame)
  }
}

Region.prototype.clipper = function() {
  var region = this
  return function(frame) {
    region.updatePosition(frame)
    return region.enteredFrame ? frame : null
  }
}

Region.prototype.setupNearRegion = function(distance) {
  var nearRegion = this.nearRegion = new Region(
    [this.start.x - distance, this.start.y - distance, this.start.z - distance],
    [this.end.x + distance, this.end.y + distance, this.end.z + distance]
  )
  var region = this
  nearRegion.on("enter", function(frame) {
    region.emit("near", frame)
  })
  nearRegion.on("exit", function(frame) {
    region.emit("far", frame)
  })
  region.on('exit', function(frame) {
    region.emit("near", frame)
  })
}

Region.prototype.updatePosition = function(frame) {
  if (this.nearRegion) this.nearRegion.updatePosition(frame)
  if (this.hasPointables(frame) && this.enteredFrame == null) {
    this.enteredFrame = frame
    this.emit("enter", this.enteredFrame)
  } else if (!this.hasPointables(frame) && this.enteredFrame != null) {
    this.enteredFrame = null
    this.emit("exit", this.enteredFrame)
  }
  return frame
}

Region.prototype.normalize = function(position) {
  return new Vector([
    (position.x - this.start.x) / (this.end.x - this.start.x),
    (position.y - this.start.y) / (this.end.y - this.start.y),
    (position.z - this.start.z) / (this.end.z - this.start.z)
  ])
}

Region.prototype.mapToXY = function(position, width, height) {
  var normalized = this.normalize(position)
  var x = normalized.x, y = normalized.y
  if (x > 1) x = 1
  else if (x < -1) x = -1
  if (y > 1) y = 1
  else if (y < -1) y = -1
  return [
    (x + 1) / 2 * width,
    (1 - y) / 2 * height,
    normalized.z
  ]
}

_.extend(Region.prototype, EventEmitter.prototype)
},{"events":21,"underscore":24}],19:[function(require,module,exports){
// This file is automatically updated from package.json by grunt.
module.exports = {
  full: '0.6.4',
  major: 0,
  minor: 6,
  dot: 4
}
},{}],20:[function(require,module,exports){

},{}],21:[function(require,module,exports){
var process=require("__browserify_process");if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;
function indexOf (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (x === xs[i]) return i;
    }
    return -1;
}

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = indexOf(list, listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  if (arguments.length === 0) {
    this._events = {};
    return this;
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (typeof emitter._events[type] === 'function')
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

},{"__browserify_process":22}],22:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],23:[function(require,module,exports){
/**
 * @fileoverview gl-matrix - High performance matrix and vector operations
 * @author Brandon Jones
 * @author Colin MacKenzie IV
 * @version 2.2.1
 */

/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */


(function(_global) {
  "use strict";

  var shim = {};
  if (typeof(exports) === 'undefined') {
    if(typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
      shim.exports = {};
      define('../libs/leap-0.6.4',[],function() {
        return shim.exports;
      });
    } else {
      // gl-matrix lives in a browser, define its namespaces in global
      shim.exports = typeof(window) !== 'undefined' ? window : _global;
    }
  }
  else {
    // gl-matrix lives in commonjs, define its namespaces in exports
    shim.exports = exports;
  }

  (function(exports) {
    /* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */


if(!GLMAT_EPSILON) {
    var GLMAT_EPSILON = 0.000001;
}

if(!GLMAT_ARRAY_TYPE) {
    var GLMAT_ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
}

if(!GLMAT_RANDOM) {
    var GLMAT_RANDOM = Math.random;
}

/**
 * @class Common utilities
 * @name glMatrix
 */
var glMatrix = {};

/**
 * Sets the type of array used when creating new vectors and matricies
 *
 * @param {Type} type Array type, such as Float32Array or Array
 */
glMatrix.setMatrixArrayType = function(type) {
    GLMAT_ARRAY_TYPE = type;
}

if(typeof(exports) !== 'undefined') {
    exports.glMatrix = glMatrix;
}

var degree = Math.PI / 180;

/**
* Convert Degree To Radian
*
* @param {Number} Angle in Degrees
*/
glMatrix.toRadian = function(a){
     return a * degree;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 2 Dimensional Vector
 * @name vec2
 */

var vec2 = {};

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */
vec2.create = function() {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = 0;
    out[1] = 0;
    return out;
};

/**
 * Creates a new vec2 initialized with values from an existing vector
 *
 * @param {vec2} a vector to clone
 * @returns {vec2} a new 2D vector
 */
vec2.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

/**
 * Creates a new vec2 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} a new 2D vector
 */
vec2.fromValues = function(x, y) {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = x;
    out[1] = y;
    return out;
};

/**
 * Copy the values from one vec2 to another
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the source vector
 * @returns {vec2} out
 */
vec2.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

/**
 * Set the components of a vec2 to the given values
 *
 * @param {vec2} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} out
 */
vec2.set = function(out, x, y) {
    out[0] = x;
    out[1] = y;
    return out;
};

/**
 * Adds two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    return out;
};

/**
 * Subtracts vector b from vector a
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    return out;
};

/**
 * Alias for {@link vec2.subtract}
 * @function
 */
vec2.sub = vec2.subtract;

/**
 * Multiplies two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    return out;
};

/**
 * Alias for {@link vec2.multiply}
 * @function
 */
vec2.mul = vec2.multiply;

/**
 * Divides two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    return out;
};

/**
 * Alias for {@link vec2.divide}
 * @function
 */
vec2.div = vec2.divide;

/**
 * Returns the minimum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    return out;
};

/**
 * Returns the maximum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    return out;
};

/**
 * Scales a vec2 by a scalar number
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec2} out
 */
vec2.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    return out;
};

/**
 * Adds two vec2's after scaling the second operand by a scalar value
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec2} out
 */
vec2.scaleAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    return out;
};

/**
 * Calculates the euclidian distance between two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} distance between a and b
 */
vec2.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1];
    return Math.sqrt(x*x + y*y);
};

/**
 * Alias for {@link vec2.distance}
 * @function
 */
vec2.dist = vec2.distance;

/**
 * Calculates the squared euclidian distance between two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec2.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1];
    return x*x + y*y;
};

/**
 * Alias for {@link vec2.squaredDistance}
 * @function
 */
vec2.sqrDist = vec2.squaredDistance;

/**
 * Calculates the length of a vec2
 *
 * @param {vec2} a vector to calculate length of
 * @returns {Number} length of a
 */
vec2.length = function (a) {
    var x = a[0],
        y = a[1];
    return Math.sqrt(x*x + y*y);
};

/**
 * Alias for {@link vec2.length}
 * @function
 */
vec2.len = vec2.length;

/**
 * Calculates the squared length of a vec2
 *
 * @param {vec2} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec2.squaredLength = function (a) {
    var x = a[0],
        y = a[1];
    return x*x + y*y;
};

/**
 * Alias for {@link vec2.squaredLength}
 * @function
 */
vec2.sqrLen = vec2.squaredLength;

/**
 * Negates the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to negate
 * @returns {vec2} out
 */
vec2.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    return out;
};

/**
 * Normalize a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to normalize
 * @returns {vec2} out
 */
vec2.normalize = function(out, a) {
    var x = a[0],
        y = a[1];
    var len = x*x + y*y;
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} dot product of a and b
 */
vec2.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1];
};

/**
 * Computes the cross product of two vec2's
 * Note that the cross product must by definition produce a 3D vector
 *
 * @param {vec3} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec3} out
 */
vec2.cross = function(out, a, b) {
    var z = a[0] * b[1] - a[1] * b[0];
    out[0] = out[1] = 0;
    out[2] = z;
    return out;
};

/**
 * Performs a linear interpolation between two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec2} out
 */
vec2.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    return out;
};

/**
 * Generates a random vector with the given scale
 *
 * @param {vec2} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec2} out
 */
vec2.random = function (out, scale) {
    scale = scale || 1.0;
    var r = GLMAT_RANDOM() * 2.0 * Math.PI;
    out[0] = Math.cos(r) * scale;
    out[1] = Math.sin(r) * scale;
    return out;
};

/**
 * Transforms the vec2 with a mat2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat2} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat2 = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[2] * y;
    out[1] = m[1] * x + m[3] * y;
    return out;
};

/**
 * Transforms the vec2 with a mat2d
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat2d} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat2d = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[2] * y + m[4];
    out[1] = m[1] * x + m[3] * y + m[5];
    return out;
};

/**
 * Transforms the vec2 with a mat3
 * 3rd vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat3} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat3 = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[3] * y + m[6];
    out[1] = m[1] * x + m[4] * y + m[7];
    return out;
};

/**
 * Transforms the vec2 with a mat4
 * 3rd vector component is implicitly '0'
 * 4th vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat4 = function(out, a, m) {
    var x = a[0], 
        y = a[1];
    out[0] = m[0] * x + m[4] * y + m[12];
    out[1] = m[1] * x + m[5] * y + m[13];
    return out;
};

/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec2.forEach = (function() {
    var vec = vec2.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 2;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1];
        }
        
        return a;
    };
})();

/**
 * Returns a string representation of a vector
 *
 * @param {vec2} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec2.str = function (a) {
    return 'vec2(' + a[0] + ', ' + a[1] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.vec2 = vec2;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 3 Dimensional Vector
 * @name vec3
 */

var vec3 = {};

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */
vec3.create = function() {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    return out;
};

/**
 * Creates a new vec3 initialized with values from an existing vector
 *
 * @param {vec3} a vector to clone
 * @returns {vec3} a new 3D vector
 */
vec3.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
};

/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */
vec3.fromValues = function(x, y, z) {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
};

/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the source vector
 * @returns {vec3} out
 */
vec3.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
};

/**
 * Set the components of a vec3 to the given values
 *
 * @param {vec3} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} out
 */
vec3.set = function(out, x, y, z) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
};

/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
};

/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
};

/**
 * Alias for {@link vec3.subtract}
 * @function
 */
vec3.sub = vec3.subtract;

/**
 * Multiplies two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    return out;
};

/**
 * Alias for {@link vec3.multiply}
 * @function
 */
vec3.mul = vec3.multiply;

/**
 * Divides two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    return out;
};

/**
 * Alias for {@link vec3.divide}
 * @function
 */
vec3.div = vec3.divide;

/**
 * Returns the minimum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    return out;
};

/**
 * Returns the maximum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    return out;
};

/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */
vec3.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    return out;
};

/**
 * Adds two vec3's after scaling the second operand by a scalar value
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec3} out
 */
vec3.scaleAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);
    return out;
};

/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} distance between a and b
 */
vec3.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2];
    return Math.sqrt(x*x + y*y + z*z);
};

/**
 * Alias for {@link vec3.distance}
 * @function
 */
vec3.dist = vec3.distance;

/**
 * Calculates the squared euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec3.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2];
    return x*x + y*y + z*z;
};

/**
 * Alias for {@link vec3.squaredDistance}
 * @function
 */
vec3.sqrDist = vec3.squaredDistance;

/**
 * Calculates the length of a vec3
 *
 * @param {vec3} a vector to calculate length of
 * @returns {Number} length of a
 */
vec3.length = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    return Math.sqrt(x*x + y*y + z*z);
};

/**
 * Alias for {@link vec3.length}
 * @function
 */
vec3.len = vec3.length;

/**
 * Calculates the squared length of a vec3
 *
 * @param {vec3} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec3.squaredLength = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    return x*x + y*y + z*z;
};

/**
 * Alias for {@link vec3.squaredLength}
 * @function
 */
vec3.sqrLen = vec3.squaredLength;

/**
 * Negates the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to negate
 * @returns {vec3} out
 */
vec3.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    return out;
};

/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to normalize
 * @returns {vec3} out
 */
vec3.normalize = function(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    var len = x*x + y*y + z*z;
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
        out[2] = a[2] * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} dot product of a and b
 */
vec3.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
};

/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.cross = function(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2],
        bx = b[0], by = b[1], bz = b[2];

    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
};

/**
 * Performs a linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec3} out
 */
vec3.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1],
        az = a[2];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    return out;
};

/**
 * Generates a random vector with the given scale
 *
 * @param {vec3} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec3} out
 */
vec3.random = function (out, scale) {
    scale = scale || 1.0;

    var r = GLMAT_RANDOM() * 2.0 * Math.PI;
    var z = (GLMAT_RANDOM() * 2.0) - 1.0;
    var zScale = Math.sqrt(1.0-z*z) * scale;

    out[0] = Math.cos(r) * zScale;
    out[1] = Math.sin(r) * zScale;
    out[2] = z * scale;
    return out;
};

/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec3} out
 */
vec3.transformMat4 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12];
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13];
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14];
    return out;
};

/**
 * Transforms the vec3 with a mat3.
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m the 3x3 matrix to transform with
 * @returns {vec3} out
 */
vec3.transformMat3 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = x * m[0] + y * m[3] + z * m[6];
    out[1] = x * m[1] + y * m[4] + z * m[7];
    out[2] = x * m[2] + y * m[5] + z * m[8];
    return out;
};

/**
 * Transforms the vec3 with a quat
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {quat} q quaternion to transform with
 * @returns {vec3} out
 */
vec3.transformQuat = function(out, a, q) {
    // benchmarks: http://jsperf.com/quaternion-transform-vec3-implementations

    var x = a[0], y = a[1], z = a[2],
        qx = q[0], qy = q[1], qz = q[2], qw = q[3],

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return out;
};

/*
* Rotate a 3D vector around the x-axis
* @param {vec3} out The receiving vec3
* @param {vec3} a The vec3 point to rotate
* @param {vec3} b The origin of the rotation
* @param {Number} c The angle of rotation
* @returns {vec3} out
*/
vec3.rotateX = function(out, a, b, c){
   var p = [], r=[];
	  //Translate point to the origin
	  p[0] = a[0] - b[0];
	  p[1] = a[1] - b[1];
  	p[2] = a[2] - b[2];

	  //perform rotation
	  r[0] = p[0];
	  r[1] = p[1]*Math.cos(c) - p[2]*Math.sin(c);
	  r[2] = p[1]*Math.sin(c) + p[2]*Math.cos(c);

	  //translate to correct position
	  out[0] = r[0] + b[0];
	  out[1] = r[1] + b[1];
	  out[2] = r[2] + b[2];

  	return out;
};

/*
* Rotate a 3D vector around the y-axis
* @param {vec3} out The receiving vec3
* @param {vec3} a The vec3 point to rotate
* @param {vec3} b The origin of the rotation
* @param {Number} c The angle of rotation
* @returns {vec3} out
*/
vec3.rotateY = function(out, a, b, c){
  	var p = [], r=[];
  	//Translate point to the origin
  	p[0] = a[0] - b[0];
  	p[1] = a[1] - b[1];
  	p[2] = a[2] - b[2];
  
  	//perform rotation
  	r[0] = p[2]*Math.sin(c) + p[0]*Math.cos(c);
  	r[1] = p[1];
  	r[2] = p[2]*Math.cos(c) - p[0]*Math.sin(c);
  
  	//translate to correct position
  	out[0] = r[0] + b[0];
  	out[1] = r[1] + b[1];
  	out[2] = r[2] + b[2];
  
  	return out;
};

/*
* Rotate a 3D vector around the z-axis
* @param {vec3} out The receiving vec3
* @param {vec3} a The vec3 point to rotate
* @param {vec3} b The origin of the rotation
* @param {Number} c The angle of rotation
* @returns {vec3} out
*/
vec3.rotateZ = function(out, a, b, c){
  	var p = [], r=[];
  	//Translate point to the origin
  	p[0] = a[0] - b[0];
  	p[1] = a[1] - b[1];
  	p[2] = a[2] - b[2];
  
  	//perform rotation
  	r[0] = p[0]*Math.cos(c) - p[1]*Math.sin(c);
  	r[1] = p[0]*Math.sin(c) + p[1]*Math.cos(c);
  	r[2] = p[2];
  
  	//translate to correct position
  	out[0] = r[0] + b[0];
  	out[1] = r[1] + b[1];
  	out[2] = r[2] + b[2];
  
  	return out;
};

/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec3.forEach = (function() {
    var vec = vec3.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 3;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2];
        }
        
        return a;
    };
})();

/**
 * Returns a string representation of a vector
 *
 * @param {vec3} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec3.str = function (a) {
    return 'vec3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.vec3 = vec3;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 4 Dimensional Vector
 * @name vec4
 */

var vec4 = {};

/**
 * Creates a new, empty vec4
 *
 * @returns {vec4} a new 4D vector
 */
vec4.create = function() {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    return out;
};

/**
 * Creates a new vec4 initialized with values from an existing vector
 *
 * @param {vec4} a vector to clone
 * @returns {vec4} a new 4D vector
 */
vec4.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Creates a new vec4 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} a new 4D vector
 */
vec4.fromValues = function(x, y, z, w) {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
};

/**
 * Copy the values from one vec4 to another
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the source vector
 * @returns {vec4} out
 */
vec4.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Set the components of a vec4 to the given values
 *
 * @param {vec4} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} out
 */
vec4.set = function(out, x, y, z, w) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
};

/**
 * Adds two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    return out;
};

/**
 * Subtracts vector b from vector a
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    return out;
};

/**
 * Alias for {@link vec4.subtract}
 * @function
 */
vec4.sub = vec4.subtract;

/**
 * Multiplies two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    out[3] = a[3] * b[3];
    return out;
};

/**
 * Alias for {@link vec4.multiply}
 * @function
 */
vec4.mul = vec4.multiply;

/**
 * Divides two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    out[3] = a[3] / b[3];
    return out;
};

/**
 * Alias for {@link vec4.divide}
 * @function
 */
vec4.div = vec4.divide;

/**
 * Returns the minimum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    out[3] = Math.min(a[3], b[3]);
    return out;
};

/**
 * Returns the maximum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    out[3] = Math.max(a[3], b[3]);
    return out;
};

/**
 * Scales a vec4 by a scalar number
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec4} out
 */
vec4.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    return out;
};

/**
 * Adds two vec4's after scaling the second operand by a scalar value
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec4} out
 */
vec4.scaleAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);
    out[3] = a[3] + (b[3] * scale);
    return out;
};

/**
 * Calculates the euclidian distance between two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} distance between a and b
 */
vec4.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2],
        w = b[3] - a[3];
    return Math.sqrt(x*x + y*y + z*z + w*w);
};

/**
 * Alias for {@link vec4.distance}
 * @function
 */
vec4.dist = vec4.distance;

/**
 * Calculates the squared euclidian distance between two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec4.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2],
        w = b[3] - a[3];
    return x*x + y*y + z*z + w*w;
};

/**
 * Alias for {@link vec4.squaredDistance}
 * @function
 */
vec4.sqrDist = vec4.squaredDistance;

/**
 * Calculates the length of a vec4
 *
 * @param {vec4} a vector to calculate length of
 * @returns {Number} length of a
 */
vec4.length = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    return Math.sqrt(x*x + y*y + z*z + w*w);
};

/**
 * Alias for {@link vec4.length}
 * @function
 */
vec4.len = vec4.length;

/**
 * Calculates the squared length of a vec4
 *
 * @param {vec4} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec4.squaredLength = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    return x*x + y*y + z*z + w*w;
};

/**
 * Alias for {@link vec4.squaredLength}
 * @function
 */
vec4.sqrLen = vec4.squaredLength;

/**
 * Negates the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to negate
 * @returns {vec4} out
 */
vec4.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = -a[3];
    return out;
};

/**
 * Normalize a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to normalize
 * @returns {vec4} out
 */
vec4.normalize = function(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    var len = x*x + y*y + z*z + w*w;
    if (len > 0) {
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
        out[2] = a[2] * len;
        out[3] = a[3] * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} dot product of a and b
 */
vec4.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
};

/**
 * Performs a linear interpolation between two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec4} out
 */
vec4.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1],
        az = a[2],
        aw = a[3];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    out[3] = aw + t * (b[3] - aw);
    return out;
};

/**
 * Generates a random vector with the given scale
 *
 * @param {vec4} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec4} out
 */
vec4.random = function (out, scale) {
    scale = scale || 1.0;

    //TODO: This is a pretty awful way of doing this. Find something better.
    out[0] = GLMAT_RANDOM();
    out[1] = GLMAT_RANDOM();
    out[2] = GLMAT_RANDOM();
    out[3] = GLMAT_RANDOM();
    vec4.normalize(out, out);
    vec4.scale(out, out, scale);
    return out;
};

/**
 * Transforms the vec4 with a mat4.
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec4} out
 */
vec4.transformMat4 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2], w = a[3];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return out;
};

/**
 * Transforms the vec4 with a quat
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to transform
 * @param {quat} q quaternion to transform with
 * @returns {vec4} out
 */
vec4.transformQuat = function(out, a, q) {
    var x = a[0], y = a[1], z = a[2],
        qx = q[0], qy = q[1], qz = q[2], qw = q[3],

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return out;
};

/**
 * Perform some operation over an array of vec4s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec4.forEach = (function() {
    var vec = vec4.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 4;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2]; vec[3] = a[i+3];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2]; a[i+3] = vec[3];
        }
        
        return a;
    };
})();

/**
 * Returns a string representation of a vector
 *
 * @param {vec4} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec4.str = function (a) {
    return 'vec4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.vec4 = vec4;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 2x2 Matrix
 * @name mat2
 */

var mat2 = {};

/**
 * Creates a new identity mat2
 *
 * @returns {mat2} a new 2x2 matrix
 */
mat2.create = function() {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Creates a new mat2 initialized with values from an existing matrix
 *
 * @param {mat2} a matrix to clone
 * @returns {mat2} a new 2x2 matrix
 */
mat2.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Copy the values from one mat2 to another
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Set a mat2 to the identity matrix
 *
 * @param {mat2} out the receiving matrix
 * @returns {mat2} out
 */
mat2.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Transpose the values of a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a1 = a[1];
        out[1] = a[2];
        out[2] = a1;
    } else {
        out[0] = a[0];
        out[1] = a[2];
        out[2] = a[1];
        out[3] = a[3];
    }
    
    return out;
};

/**
 * Inverts a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.invert = function(out, a) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],

        // Calculate the determinant
        det = a0 * a3 - a2 * a1;

    if (!det) {
        return null;
    }
    det = 1.0 / det;
    
    out[0] =  a3 * det;
    out[1] = -a1 * det;
    out[2] = -a2 * det;
    out[3] =  a0 * det;

    return out;
};

/**
 * Calculates the adjugate of a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.adjoint = function(out, a) {
    // Caching this value is nessecary if out == a
    var a0 = a[0];
    out[0] =  a[3];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] =  a0;

    return out;
};

/**
 * Calculates the determinant of a mat2
 *
 * @param {mat2} a the source matrix
 * @returns {Number} determinant of a
 */
mat2.determinant = function (a) {
    return a[0] * a[3] - a[2] * a[1];
};

/**
 * Multiplies two mat2's
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the first operand
 * @param {mat2} b the second operand
 * @returns {mat2} out
 */
mat2.multiply = function (out, a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = a0 * b0 + a2 * b1;
    out[1] = a1 * b0 + a3 * b1;
    out[2] = a0 * b2 + a2 * b3;
    out[3] = a1 * b2 + a3 * b3;
    return out;
};

/**
 * Alias for {@link mat2.multiply}
 * @function
 */
mat2.mul = mat2.multiply;

/**
 * Rotates a mat2 by the given angle
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2} out
 */
mat2.rotate = function (out, a, rad) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        s = Math.sin(rad),
        c = Math.cos(rad);
    out[0] = a0 *  c + a2 * s;
    out[1] = a1 *  c + a3 * s;
    out[2] = a0 * -s + a2 * c;
    out[3] = a1 * -s + a3 * c;
    return out;
};

/**
 * Scales the mat2 by the dimensions in the given vec2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the matrix to rotate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat2} out
 **/
mat2.scale = function(out, a, v) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        v0 = v[0], v1 = v[1];
    out[0] = a0 * v0;
    out[1] = a1 * v0;
    out[2] = a2 * v1;
    out[3] = a3 * v1;
    return out;
};

/**
 * Returns a string representation of a mat2
 *
 * @param {mat2} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat2.str = function (a) {
    return 'mat2(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

/**
 * Returns Frobenius norm of a mat2
 *
 * @param {mat2} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
mat2.frob = function (a) {
    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2)))
};

/**
 * Returns L, D and U matrices (Lower triangular, Diagonal and Upper triangular) by factorizing the input matrix
 * @param {mat2} L the lower triangular matrix 
 * @param {mat2} D the diagonal matrix 
 * @param {mat2} U the upper triangular matrix 
 * @param {mat2} a the input matrix to factorize
 */

mat2.LDU = function (L, D, U, a) { 
    L[2] = a[2]/a[0]; 
    U[0] = a[0]; 
    U[1] = a[1]; 
    U[3] = a[3] - L[2] * U[1]; 
    return [L, D, U];       
}; 

if(typeof(exports) !== 'undefined') {
    exports.mat2 = mat2;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 2x3 Matrix
 * @name mat2d
 * 
 * @description 
 * A mat2d contains six elements defined as:
 * <pre>
 * [a, c, tx,
 *  b, d, ty]
 * </pre>
 * This is a short form for the 3x3 matrix:
 * <pre>
 * [a, c, tx,
 *  b, d, ty,
 *  0, 0, 1]
 * </pre>
 * The last row is ignored so the array is shorter and operations are faster.
 */

var mat2d = {};

/**
 * Creates a new identity mat2d
 *
 * @returns {mat2d} a new 2x3 matrix
 */
mat2d.create = function() {
    var out = new GLMAT_ARRAY_TYPE(6);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;
    return out;
};

/**
 * Creates a new mat2d initialized with values from an existing matrix
 *
 * @param {mat2d} a matrix to clone
 * @returns {mat2d} a new 2x3 matrix
 */
mat2d.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(6);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    return out;
};

/**
 * Copy the values from one mat2d to another
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the source matrix
 * @returns {mat2d} out
 */
mat2d.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    return out;
};

/**
 * Set a mat2d to the identity matrix
 *
 * @param {mat2d} out the receiving matrix
 * @returns {mat2d} out
 */
mat2d.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;
    return out;
};

/**
 * Inverts a mat2d
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the source matrix
 * @returns {mat2d} out
 */
mat2d.invert = function(out, a) {
    var aa = a[0], ab = a[1], ac = a[2], ad = a[3],
        atx = a[4], aty = a[5];

    var det = aa * ad - ab * ac;
    if(!det){
        return null;
    }
    det = 1.0 / det;

    out[0] = ad * det;
    out[1] = -ab * det;
    out[2] = -ac * det;
    out[3] = aa * det;
    out[4] = (ac * aty - ad * atx) * det;
    out[5] = (ab * atx - aa * aty) * det;
    return out;
};

/**
 * Calculates the determinant of a mat2d
 *
 * @param {mat2d} a the source matrix
 * @returns {Number} determinant of a
 */
mat2d.determinant = function (a) {
    return a[0] * a[3] - a[1] * a[2];
};

/**
 * Multiplies two mat2d's
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the first operand
 * @param {mat2d} b the second operand
 * @returns {mat2d} out
 */
mat2d.multiply = function (out, a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5],
        b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5];
    out[0] = a0 * b0 + a2 * b1;
    out[1] = a1 * b0 + a3 * b1;
    out[2] = a0 * b2 + a2 * b3;
    out[3] = a1 * b2 + a3 * b3;
    out[4] = a0 * b4 + a2 * b5 + a4;
    out[5] = a1 * b4 + a3 * b5 + a5;
    return out;
};

/**
 * Alias for {@link mat2d.multiply}
 * @function
 */
mat2d.mul = mat2d.multiply;


/**
 * Rotates a mat2d by the given angle
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2d} out
 */
mat2d.rotate = function (out, a, rad) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5],
        s = Math.sin(rad),
        c = Math.cos(rad);
    out[0] = a0 *  c + a2 * s;
    out[1] = a1 *  c + a3 * s;
    out[2] = a0 * -s + a2 * c;
    out[3] = a1 * -s + a3 * c;
    out[4] = a4;
    out[5] = a5;
    return out;
};

/**
 * Scales the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to translate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat2d} out
 **/
mat2d.scale = function(out, a, v) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5],
        v0 = v[0], v1 = v[1];
    out[0] = a0 * v0;
    out[1] = a1 * v0;
    out[2] = a2 * v1;
    out[3] = a3 * v1;
    out[4] = a4;
    out[5] = a5;
    return out;
};

/**
 * Translates the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to translate
 * @param {vec2} v the vec2 to translate the matrix by
 * @returns {mat2d} out
 **/
mat2d.translate = function(out, a, v) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5],
        v0 = v[0], v1 = v[1];
    out[0] = a0;
    out[1] = a1;
    out[2] = a2;
    out[3] = a3;
    out[4] = a0 * v0 + a2 * v1 + a4;
    out[5] = a1 * v0 + a3 * v1 + a5;
    return out;
};

/**
 * Returns a string representation of a mat2d
 *
 * @param {mat2d} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat2d.str = function (a) {
    return 'mat2d(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + 
                    a[3] + ', ' + a[4] + ', ' + a[5] + ')';
};

/**
 * Returns Frobenius norm of a mat2d
 *
 * @param {mat2d} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
mat2d.frob = function (a) { 
    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + 1))
}; 

if(typeof(exports) !== 'undefined') {
    exports.mat2d = mat2d;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 3x3 Matrix
 * @name mat3
 */

var mat3 = {};

/**
 * Creates a new identity mat3
 *
 * @returns {mat3} a new 3x3 matrix
 */
mat3.create = function() {
    var out = new GLMAT_ARRAY_TYPE(9);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
};

/**
 * Copies the upper-left 3x3 values into the given mat3.
 *
 * @param {mat3} out the receiving 3x3 matrix
 * @param {mat4} a   the source 4x4 matrix
 * @returns {mat3} out
 */
mat3.fromMat4 = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[4];
    out[4] = a[5];
    out[5] = a[6];
    out[6] = a[8];
    out[7] = a[9];
    out[8] = a[10];
    return out;
};

/**
 * Creates a new mat3 initialized with values from an existing matrix
 *
 * @param {mat3} a matrix to clone
 * @returns {mat3} a new 3x3 matrix
 */
mat3.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(9);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Copy the values from one mat3 to another
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Set a mat3 to the identity matrix
 *
 * @param {mat3} out the receiving matrix
 * @returns {mat3} out
 */
mat3.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
};

/**
 * Transpose the values of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a01 = a[1], a02 = a[2], a12 = a[5];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a01;
        out[5] = a[7];
        out[6] = a02;
        out[7] = a12;
    } else {
        out[0] = a[0];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a[1];
        out[4] = a[4];
        out[5] = a[7];
        out[6] = a[2];
        out[7] = a[5];
        out[8] = a[8];
    }
    
    return out;
};

/**
 * Inverts a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.invert = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        b01 = a22 * a11 - a12 * a21,
        b11 = -a22 * a10 + a12 * a20,
        b21 = a21 * a10 - a11 * a20,

        // Calculate the determinant
        det = a00 * b01 + a01 * b11 + a02 * b21;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = b01 * det;
    out[1] = (-a22 * a01 + a02 * a21) * det;
    out[2] = (a12 * a01 - a02 * a11) * det;
    out[3] = b11 * det;
    out[4] = (a22 * a00 - a02 * a20) * det;
    out[5] = (-a12 * a00 + a02 * a10) * det;
    out[6] = b21 * det;
    out[7] = (-a21 * a00 + a01 * a20) * det;
    out[8] = (a11 * a00 - a01 * a10) * det;
    return out;
};

/**
 * Calculates the adjugate of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.adjoint = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8];

    out[0] = (a11 * a22 - a12 * a21);
    out[1] = (a02 * a21 - a01 * a22);
    out[2] = (a01 * a12 - a02 * a11);
    out[3] = (a12 * a20 - a10 * a22);
    out[4] = (a00 * a22 - a02 * a20);
    out[5] = (a02 * a10 - a00 * a12);
    out[6] = (a10 * a21 - a11 * a20);
    out[7] = (a01 * a20 - a00 * a21);
    out[8] = (a00 * a11 - a01 * a10);
    return out;
};

/**
 * Calculates the determinant of a mat3
 *
 * @param {mat3} a the source matrix
 * @returns {Number} determinant of a
 */
mat3.determinant = function (a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8];

    return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
};

/**
 * Multiplies two mat3's
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the first operand
 * @param {mat3} b the second operand
 * @returns {mat3} out
 */
mat3.multiply = function (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        b00 = b[0], b01 = b[1], b02 = b[2],
        b10 = b[3], b11 = b[4], b12 = b[5],
        b20 = b[6], b21 = b[7], b22 = b[8];

    out[0] = b00 * a00 + b01 * a10 + b02 * a20;
    out[1] = b00 * a01 + b01 * a11 + b02 * a21;
    out[2] = b00 * a02 + b01 * a12 + b02 * a22;

    out[3] = b10 * a00 + b11 * a10 + b12 * a20;
    out[4] = b10 * a01 + b11 * a11 + b12 * a21;
    out[5] = b10 * a02 + b11 * a12 + b12 * a22;

    out[6] = b20 * a00 + b21 * a10 + b22 * a20;
    out[7] = b20 * a01 + b21 * a11 + b22 * a21;
    out[8] = b20 * a02 + b21 * a12 + b22 * a22;
    return out;
};

/**
 * Alias for {@link mat3.multiply}
 * @function
 */
mat3.mul = mat3.multiply;

/**
 * Translate a mat3 by the given vector
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to translate
 * @param {vec2} v vector to translate by
 * @returns {mat3} out
 */
mat3.translate = function(out, a, v) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],
        x = v[0], y = v[1];

    out[0] = a00;
    out[1] = a01;
    out[2] = a02;

    out[3] = a10;
    out[4] = a11;
    out[5] = a12;

    out[6] = x * a00 + y * a10 + a20;
    out[7] = x * a01 + y * a11 + a21;
    out[8] = x * a02 + y * a12 + a22;
    return out;
};

/**
 * Rotates a mat3 by the given angle
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat3} out
 */
mat3.rotate = function (out, a, rad) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        s = Math.sin(rad),
        c = Math.cos(rad);

    out[0] = c * a00 + s * a10;
    out[1] = c * a01 + s * a11;
    out[2] = c * a02 + s * a12;

    out[3] = c * a10 - s * a00;
    out[4] = c * a11 - s * a01;
    out[5] = c * a12 - s * a02;

    out[6] = a20;
    out[7] = a21;
    out[8] = a22;
    return out;
};

/**
 * Scales the mat3 by the dimensions in the given vec2
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to rotate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat3} out
 **/
mat3.scale = function(out, a, v) {
    var x = v[0], y = v[1];

    out[0] = x * a[0];
    out[1] = x * a[1];
    out[2] = x * a[2];

    out[3] = y * a[3];
    out[4] = y * a[4];
    out[5] = y * a[5];

    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Copies the values from a mat2d into a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat2d} a the matrix to copy
 * @returns {mat3} out
 **/
mat3.fromMat2d = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = 0;

    out[3] = a[2];
    out[4] = a[3];
    out[5] = 0;

    out[6] = a[4];
    out[7] = a[5];
    out[8] = 1;
    return out;
};

/**
* Calculates a 3x3 matrix from the given quaternion
*
* @param {mat3} out mat3 receiving operation result
* @param {quat} q Quaternion to create matrix from
*
* @returns {mat3} out
*/
mat3.fromQuat = function (out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        yx = y * x2,
        yy = y * y2,
        zx = z * x2,
        zy = z * y2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - yy - zz;
    out[3] = yx - wz;
    out[6] = zx + wy;

    out[1] = yx + wz;
    out[4] = 1 - xx - zz;
    out[7] = zy - wx;

    out[2] = zx - wy;
    out[5] = zy + wx;
    out[8] = 1 - xx - yy;

    return out;
};

/**
* Calculates a 3x3 normal matrix (transpose inverse) from the 4x4 matrix
*
* @param {mat3} out mat3 receiving operation result
* @param {mat4} a Mat4 to derive the normal matrix from
*
* @returns {mat3} out
*/
mat3.normalFromMat4 = function (out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;

    out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;

    out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;

    return out;
};

/**
 * Returns a string representation of a mat3
 *
 * @param {mat3} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat3.str = function (a) {
    return 'mat3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + 
                    a[3] + ', ' + a[4] + ', ' + a[5] + ', ' + 
                    a[6] + ', ' + a[7] + ', ' + a[8] + ')';
};

/**
 * Returns Frobenius norm of a mat3
 *
 * @param {mat3} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
mat3.frob = function (a) {
    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + Math.pow(a[6], 2) + Math.pow(a[7], 2) + Math.pow(a[8], 2)))
};


if(typeof(exports) !== 'undefined') {
    exports.mat3 = mat3;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 4x4 Matrix
 * @name mat4
 */

var mat4 = {};

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */
mat4.create = function() {
    var out = new GLMAT_ARRAY_TYPE(16);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
};

/**
 * Creates a new mat4 initialized with values from an existing matrix
 *
 * @param {mat4} a matrix to clone
 * @returns {mat4} a new 4x4 matrix
 */
mat4.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(16);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Copy the values from one mat4 to another
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */
mat4.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
};

/**
 * Transpose the values of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a01 = a[1], a02 = a[2], a03 = a[3],
            a12 = a[6], a13 = a[7],
            a23 = a[11];

        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a01;
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a02;
        out[9] = a12;
        out[11] = a[14];
        out[12] = a03;
        out[13] = a13;
        out[14] = a23;
    } else {
        out[0] = a[0];
        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a[1];
        out[5] = a[5];
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a[2];
        out[9] = a[6];
        out[10] = a[10];
        out[11] = a[14];
        out[12] = a[3];
        out[13] = a[7];
        out[14] = a[11];
        out[15] = a[15];
    }
    
    return out;
};

/**
 * Inverts a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.invert = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return out;
};

/**
 * Calculates the adjugate of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.adjoint = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    out[0]  =  (a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22));
    out[1]  = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
    out[2]  =  (a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12));
    out[3]  = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
    out[4]  = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
    out[5]  =  (a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22));
    out[6]  = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
    out[7]  =  (a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12));
    out[8]  =  (a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21));
    out[9]  = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
    out[10] =  (a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11));
    out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
    out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
    out[13] =  (a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21));
    out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
    out[15] =  (a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11));
    return out;
};

/**
 * Calculates the determinant of a mat4
 *
 * @param {mat4} a the source matrix
 * @returns {Number} determinant of a
 */
mat4.determinant = function (a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32;

    // Calculate the determinant
    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
};

/**
 * Multiplies two mat4's
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the first operand
 * @param {mat4} b the second operand
 * @returns {mat4} out
 */
mat4.multiply = function (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    // Cache only the current line of the second matrix
    var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];  
    out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    return out;
};

/**
 * Alias for {@link mat4.multiply}
 * @function
 */
mat4.mul = mat4.multiply;

/**
 * Translate a mat4 by the given vector
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to translate
 * @param {vec3} v vector to translate by
 * @returns {mat4} out
 */
mat4.translate = function (out, a, v) {
    var x = v[0], y = v[1], z = v[2],
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23;

    if (a === out) {
        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
        a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
        a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
        a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

        out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
        out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
        out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;

        out[12] = a00 * x + a10 * y + a20 * z + a[12];
        out[13] = a01 * x + a11 * y + a21 * z + a[13];
        out[14] = a02 * x + a12 * y + a22 * z + a[14];
        out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }

    return out;
};

/**
 * Scales the mat4 by the dimensions in the given vec3
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to scale
 * @param {vec3} v the vec3 to scale the matrix by
 * @returns {mat4} out
 **/
mat4.scale = function(out, a, v) {
    var x = v[0], y = v[1], z = v[2];

    out[0] = a[0] * x;
    out[1] = a[1] * x;
    out[2] = a[2] * x;
    out[3] = a[3] * x;
    out[4] = a[4] * y;
    out[5] = a[5] * y;
    out[6] = a[6] * y;
    out[7] = a[7] * y;
    out[8] = a[8] * z;
    out[9] = a[9] * z;
    out[10] = a[10] * z;
    out[11] = a[11] * z;
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Rotates a mat4 by the given angle
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @param {vec3} axis the axis to rotate around
 * @returns {mat4} out
 */
mat4.rotate = function (out, a, rad, axis) {
    var x = axis[0], y = axis[1], z = axis[2],
        len = Math.sqrt(x * x + y * y + z * z),
        s, c, t,
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23,
        b00, b01, b02,
        b10, b11, b12,
        b20, b21, b22;

    if (Math.abs(len) < GLMAT_EPSILON) { return null; }
    
    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;

    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;

    a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
    a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
    a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

    // Construct the elements of the rotation matrix
    b00 = x * x * t + c; b01 = y * x * t + z * s; b02 = z * x * t - y * s;
    b10 = x * y * t - z * s; b11 = y * y * t + c; b12 = z * y * t + x * s;
    b20 = x * z * t + y * s; b21 = y * z * t - x * s; b22 = z * z * t + c;

    // Perform rotation-specific matrix multiplication
    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22;

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }
    return out;
};

/**
 * Rotates a matrix by the given angle around the X axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.rotateX = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
        out[0]  = a[0];
        out[1]  = a[1];
        out[2]  = a[2];
        out[3]  = a[3];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[4] = a10 * c + a20 * s;
    out[5] = a11 * c + a21 * s;
    out[6] = a12 * c + a22 * s;
    out[7] = a13 * c + a23 * s;
    out[8] = a20 * c - a10 * s;
    out[9] = a21 * c - a11 * s;
    out[10] = a22 * c - a12 * s;
    out[11] = a23 * c - a13 * s;
    return out;
};

/**
 * Rotates a matrix by the given angle around the Y axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.rotateY = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
        out[4]  = a[4];
        out[5]  = a[5];
        out[6]  = a[6];
        out[7]  = a[7];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[0] = a00 * c - a20 * s;
    out[1] = a01 * c - a21 * s;
    out[2] = a02 * c - a22 * s;
    out[3] = a03 * c - a23 * s;
    out[8] = a00 * s + a20 * c;
    out[9] = a01 * s + a21 * c;
    out[10] = a02 * s + a22 * c;
    out[11] = a03 * s + a23 * c;
    return out;
};

/**
 * Rotates a matrix by the given angle around the Z axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.rotateZ = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7];

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[8]  = a[8];
        out[9]  = a[9];
        out[10] = a[10];
        out[11] = a[11];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[0] = a00 * c + a10 * s;
    out[1] = a01 * c + a11 * s;
    out[2] = a02 * c + a12 * s;
    out[3] = a03 * c + a13 * s;
    out[4] = a10 * c - a00 * s;
    out[5] = a11 * c - a01 * s;
    out[6] = a12 * c - a02 * s;
    out[7] = a13 * c - a03 * s;
    return out;
};

/**
 * Creates a matrix from a quaternion rotation and vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     var quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {vec3} v Translation vector
 * @returns {mat4} out
 */
mat4.fromRotationTranslation = function (out, q, v) {
    // Quaternion math
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    
    return out;
};

mat4.fromQuat = function (out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        yx = y * x2,
        yy = y * y2,
        zx = z * x2,
        zy = z * y2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - yy - zz;
    out[1] = yx + wz;
    out[2] = zx - wy;
    out[3] = 0;

    out[4] = yx - wz;
    out[5] = 1 - xx - zz;
    out[6] = zy + wx;
    out[7] = 0;

    out[8] = zx + wy;
    out[9] = zy - wx;
    out[10] = 1 - xx - yy;
    out[11] = 0;

    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;

    return out;
};

/**
 * Generates a frustum matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Number} left Left bound of the frustum
 * @param {Number} right Right bound of the frustum
 * @param {Number} bottom Bottom bound of the frustum
 * @param {Number} top Top bound of the frustum
 * @param {Number} near Near bound of the frustum
 * @param {Number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.frustum = function (out, left, right, bottom, top, near, far) {
    var rl = 1 / (right - left),
        tb = 1 / (top - bottom),
        nf = 1 / (near - far);
    out[0] = (near * 2) * rl;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = (near * 2) * tb;
    out[6] = 0;
    out[7] = 0;
    out[8] = (right + left) * rl;
    out[9] = (top + bottom) * tb;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (far * near * 2) * nf;
    out[15] = 0;
    return out;
};

/**
 * Generates a perspective projection matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.perspective = function (out, fovy, aspect, near, far) {
    var f = 1.0 / Math.tan(fovy / 2),
        nf = 1 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (2 * far * near) * nf;
    out[15] = 0;
    return out;
};

/**
 * Generates a orthogonal projection matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.ortho = function (out, left, right, bottom, top, near, far) {
    var lr = 1 / (left - right),
        bt = 1 / (bottom - top),
        nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return out;
};

/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {vec3} eye Position of the viewer
 * @param {vec3} center Point the viewer is looking at
 * @param {vec3} up vec3 pointing up
 * @returns {mat4} out
 */
mat4.lookAt = function (out, eye, center, up) {
    var x0, x1, x2, y0, y1, y2, z0, z1, z2, len,
        eyex = eye[0],
        eyey = eye[1],
        eyez = eye[2],
        upx = up[0],
        upy = up[1],
        upz = up[2],
        centerx = center[0],
        centery = center[1],
        centerz = center[2];

    if (Math.abs(eyex - centerx) < GLMAT_EPSILON &&
        Math.abs(eyey - centery) < GLMAT_EPSILON &&
        Math.abs(eyez - centerz) < GLMAT_EPSILON) {
        return mat4.identity(out);
    }

    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;

    len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= len;
    z1 *= len;
    z2 *= len;

    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (!len) {
        x0 = 0;
        x1 = 0;
        x2 = 0;
    } else {
        len = 1 / len;
        x0 *= len;
        x1 *= len;
        x2 *= len;
    }

    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;

    len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (!len) {
        y0 = 0;
        y1 = 0;
        y2 = 0;
    } else {
        len = 1 / len;
        y0 *= len;
        y1 *= len;
        y2 *= len;
    }

    out[0] = x0;
    out[1] = y0;
    out[2] = z0;
    out[3] = 0;
    out[4] = x1;
    out[5] = y1;
    out[6] = z1;
    out[7] = 0;
    out[8] = x2;
    out[9] = y2;
    out[10] = z2;
    out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;

    return out;
};

/**
 * Returns a string representation of a mat4
 *
 * @param {mat4} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat4.str = function (a) {
    return 'mat4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' +
                    a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' +
                    a[8] + ', ' + a[9] + ', ' + a[10] + ', ' + a[11] + ', ' + 
                    a[12] + ', ' + a[13] + ', ' + a[14] + ', ' + a[15] + ')';
};

/**
 * Returns Frobenius norm of a mat4
 *
 * @param {mat4} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
mat4.frob = function (a) {
    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + Math.pow(a[6], 2) + Math.pow(a[6], 2) + Math.pow(a[7], 2) + Math.pow(a[8], 2) + Math.pow(a[9], 2) + Math.pow(a[10], 2) + Math.pow(a[11], 2) + Math.pow(a[12], 2) + Math.pow(a[13], 2) + Math.pow(a[14], 2) + Math.pow(a[15], 2) ))
};


if(typeof(exports) !== 'undefined') {
    exports.mat4 = mat4;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class Quaternion
 * @name quat
 */

var quat = {};

/**
 * Creates a new identity quat
 *
 * @returns {quat} a new quaternion
 */
quat.create = function() {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Sets a quaternion to represent the shortest rotation from one
 * vector to another.
 *
 * Both vectors are assumed to be unit length.
 *
 * @param {quat} out the receiving quaternion.
 * @param {vec3} a the initial vector
 * @param {vec3} b the destination vector
 * @returns {quat} out
 */
quat.rotationTo = (function() {
    var tmpvec3 = vec3.create();
    var xUnitVec3 = vec3.fromValues(1,0,0);
    var yUnitVec3 = vec3.fromValues(0,1,0);

    return function(out, a, b) {
        var dot = vec3.dot(a, b);
        if (dot < -0.999999) {
            vec3.cross(tmpvec3, xUnitVec3, a);
            if (vec3.length(tmpvec3) < 0.000001)
                vec3.cross(tmpvec3, yUnitVec3, a);
            vec3.normalize(tmpvec3, tmpvec3);
            quat.setAxisAngle(out, tmpvec3, Math.PI);
            return out;
        } else if (dot > 0.999999) {
            out[0] = 0;
            out[1] = 0;
            out[2] = 0;
            out[3] = 1;
            return out;
        } else {
            vec3.cross(tmpvec3, a, b);
            out[0] = tmpvec3[0];
            out[1] = tmpvec3[1];
            out[2] = tmpvec3[2];
            out[3] = 1 + dot;
            return quat.normalize(out, out);
        }
    };
})();

/**
 * Sets the specified quaternion with values corresponding to the given
 * axes. Each axis is a vec3 and is expected to be unit length and
 * perpendicular to all other specified axes.
 *
 * @param {vec3} view  the vector representing the viewing direction
 * @param {vec3} right the vector representing the local "right" direction
 * @param {vec3} up    the vector representing the local "up" direction
 * @returns {quat} out
 */
quat.setAxes = (function() {
    var matr = mat3.create();

    return function(out, view, right, up) {
        matr[0] = right[0];
        matr[3] = right[1];
        matr[6] = right[2];

        matr[1] = up[0];
        matr[4] = up[1];
        matr[7] = up[2];

        matr[2] = -view[0];
        matr[5] = -view[1];
        matr[8] = -view[2];

        return quat.normalize(out, quat.fromMat3(out, matr));
    };
})();

/**
 * Creates a new quat initialized with values from an existing quaternion
 *
 * @param {quat} a quaternion to clone
 * @returns {quat} a new quaternion
 * @function
 */
quat.clone = vec4.clone;

/**
 * Creates a new quat initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} a new quaternion
 * @function
 */
quat.fromValues = vec4.fromValues;

/**
 * Copy the values from one quat to another
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the source quaternion
 * @returns {quat} out
 * @function
 */
quat.copy = vec4.copy;

/**
 * Set the components of a quat to the given values
 *
 * @param {quat} out the receiving quaternion
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} out
 * @function
 */
quat.set = vec4.set;

/**
 * Set a quat to the identity quaternion
 *
 * @param {quat} out the receiving quaternion
 * @returns {quat} out
 */
quat.identity = function(out) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Sets a quat from the given angle and rotation axis,
 * then returns it.
 *
 * @param {quat} out the receiving quaternion
 * @param {vec3} axis the axis around which to rotate
 * @param {Number} rad the angle in radians
 * @returns {quat} out
 **/
quat.setAxisAngle = function(out, axis, rad) {
    rad = rad * 0.5;
    var s = Math.sin(rad);
    out[0] = s * axis[0];
    out[1] = s * axis[1];
    out[2] = s * axis[2];
    out[3] = Math.cos(rad);
    return out;
};

/**
 * Adds two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {quat} out
 * @function
 */
quat.add = vec4.add;

/**
 * Multiplies two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {quat} out
 */
quat.multiply = function(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = b[0], by = b[1], bz = b[2], bw = b[3];

    out[0] = ax * bw + aw * bx + ay * bz - az * by;
    out[1] = ay * bw + aw * by + az * bx - ax * bz;
    out[2] = az * bw + aw * bz + ax * by - ay * bx;
    out[3] = aw * bw - ax * bx - ay * by - az * bz;
    return out;
};

/**
 * Alias for {@link quat.multiply}
 * @function
 */
quat.mul = quat.multiply;

/**
 * Scales a quat by a scalar number
 *
 * @param {quat} out the receiving vector
 * @param {quat} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {quat} out
 * @function
 */
quat.scale = vec4.scale;

/**
 * Rotates a quaternion by the given angle about the X axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateX = function (out, a, rad) {
    rad *= 0.5; 

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw + aw * bx;
    out[1] = ay * bw + az * bx;
    out[2] = az * bw - ay * bx;
    out[3] = aw * bw - ax * bx;
    return out;
};

/**
 * Rotates a quaternion by the given angle about the Y axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateY = function (out, a, rad) {
    rad *= 0.5; 

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        by = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw - az * by;
    out[1] = ay * bw + aw * by;
    out[2] = az * bw + ax * by;
    out[3] = aw * bw - ay * by;
    return out;
};

/**
 * Rotates a quaternion by the given angle about the Z axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateZ = function (out, a, rad) {
    rad *= 0.5; 

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bz = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw + ay * bz;
    out[1] = ay * bw - ax * bz;
    out[2] = az * bw + aw * bz;
    out[3] = aw * bw - az * bz;
    return out;
};

/**
 * Calculates the W component of a quat from the X, Y, and Z components.
 * Assumes that quaternion is 1 unit in length.
 * Any existing W component will be ignored.
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate W component of
 * @returns {quat} out
 */
quat.calculateW = function (out, a) {
    var x = a[0], y = a[1], z = a[2];

    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = -Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
    return out;
};

/**
 * Calculates the dot product of two quat's
 *
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {Number} dot product of a and b
 * @function
 */
quat.dot = vec4.dot;

/**
 * Performs a linear interpolation between two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {quat} out
 * @function
 */
quat.lerp = vec4.lerp;

/**
 * Performs a spherical linear interpolation between two quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {quat} out
 */
quat.slerp = function (out, a, b, t) {
    // benchmarks:
    //    http://jsperf.com/quaternion-slerp-implementations

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = b[0], by = b[1], bz = b[2], bw = b[3];

    var        omega, cosom, sinom, scale0, scale1;

    // calc cosine
    cosom = ax * bx + ay * by + az * bz + aw * bw;
    // adjust signs (if necessary)
    if ( cosom < 0.0 ) {
        cosom = -cosom;
        bx = - bx;
        by = - by;
        bz = - bz;
        bw = - bw;
    }
    // calculate coefficients
    if ( (1.0 - cosom) > 0.000001 ) {
        // standard case (slerp)
        omega  = Math.acos(cosom);
        sinom  = Math.sin(omega);
        scale0 = Math.sin((1.0 - t) * omega) / sinom;
        scale1 = Math.sin(t * omega) / sinom;
    } else {        
        // "from" and "to" quaternions are very close 
        //  ... so we can do a linear interpolation
        scale0 = 1.0 - t;
        scale1 = t;
    }
    // calculate final values
    out[0] = scale0 * ax + scale1 * bx;
    out[1] = scale0 * ay + scale1 * by;
    out[2] = scale0 * az + scale1 * bz;
    out[3] = scale0 * aw + scale1 * bw;
    
    return out;
};

/**
 * Calculates the inverse of a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate inverse of
 * @returns {quat} out
 */
quat.invert = function(out, a) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        dot = a0*a0 + a1*a1 + a2*a2 + a3*a3,
        invDot = dot ? 1.0/dot : 0;
    
    // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0

    out[0] = -a0*invDot;
    out[1] = -a1*invDot;
    out[2] = -a2*invDot;
    out[3] = a3*invDot;
    return out;
};

/**
 * Calculates the conjugate of a quat
 * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate conjugate of
 * @returns {quat} out
 */
quat.conjugate = function (out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = a[3];
    return out;
};

/**
 * Calculates the length of a quat
 *
 * @param {quat} a vector to calculate length of
 * @returns {Number} length of a
 * @function
 */
quat.length = vec4.length;

/**
 * Alias for {@link quat.length}
 * @function
 */
quat.len = quat.length;

/**
 * Calculates the squared length of a quat
 *
 * @param {quat} a vector to calculate squared length of
 * @returns {Number} squared length of a
 * @function
 */
quat.squaredLength = vec4.squaredLength;

/**
 * Alias for {@link quat.squaredLength}
 * @function
 */
quat.sqrLen = quat.squaredLength;

/**
 * Normalize a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quaternion to normalize
 * @returns {quat} out
 * @function
 */
quat.normalize = vec4.normalize;

/**
 * Creates a quaternion from the given 3x3 rotation matrix.
 *
 * NOTE: The resultant quaternion is not normalized, so you should be sure
 * to renormalize the quaternion yourself where necessary.
 *
 * @param {quat} out the receiving quaternion
 * @param {mat3} m rotation matrix
 * @returns {quat} out
 * @function
 */
quat.fromMat3 = function(out, m) {
    // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
    // article "Quaternion Calculus and Fast Animation".
    var fTrace = m[0] + m[4] + m[8];
    var fRoot;

    if ( fTrace > 0.0 ) {
        // |w| > 1/2, may as well choose w > 1/2
        fRoot = Math.sqrt(fTrace + 1.0);  // 2w
        out[3] = 0.5 * fRoot;
        fRoot = 0.5/fRoot;  // 1/(4w)
        out[0] = (m[7]-m[5])*fRoot;
        out[1] = (m[2]-m[6])*fRoot;
        out[2] = (m[3]-m[1])*fRoot;
    } else {
        // |w| <= 1/2
        var i = 0;
        if ( m[4] > m[0] )
          i = 1;
        if ( m[8] > m[i*3+i] )
          i = 2;
        var j = (i+1)%3;
        var k = (i+2)%3;
        
        fRoot = Math.sqrt(m[i*3+i]-m[j*3+j]-m[k*3+k] + 1.0);
        out[i] = 0.5 * fRoot;
        fRoot = 0.5 / fRoot;
        out[3] = (m[k*3+j] - m[j*3+k]) * fRoot;
        out[j] = (m[j*3+i] + m[i*3+j]) * fRoot;
        out[k] = (m[k*3+i] + m[i*3+k]) * fRoot;
    }
    
    return out;
};

/**
 * Returns a string representation of a quatenion
 *
 * @param {quat} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
quat.str = function (a) {
    return 'quat(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.quat = quat;
}
;













  })(shim.exports);
})(this);

},{}],24:[function(require,module,exports){
//     Underscore.js 1.4.4
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.4.4';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? null : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value || _.identity);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(concat.apply(ArrayProto, arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(context, args.concat(slice.call(arguments)));
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent, but `Object`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(n);
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

},{}],25:[function(require,module,exports){
if (typeof(window) !== 'undefined' && typeof(window.requestAnimationFrame) !== 'function') {
  window.requestAnimationFrame = (
    window.webkitRequestAnimationFrame   ||
    window.mozRequestAnimationFrame      ||
    window.oRequestAnimationFrame        ||
    window.msRequestAnimationFrame       ||
    function(callback) { setTimeout(callback, 1000 / 60); }
  );
}

Leap = require("../lib/index");

},{"../lib/index":11}]},{},[25])
;

// module to get x, y from leapmotion
// used leap-0.6.4.js as needed for the leapmotion to function
/**
 * A module for obtaining the X and Y values from 
 * the LeapMotion sensor.
 * @module BB.LeapMotion
 */
define('BB.LeapMotion',['./BB', '../libs/leap-0.6.4', './BB.Vector2' ],
function(  BB,LeapMotion, Vector2){

   // 'use strict';

   BB.Vector2 = Vector2;
   /**
     * A module for obtaining the X and Y values from 
     * the LeapMotion sensor.
     * @class BB.LeapMotion
     * @param [null] The LeapMotion controller does not need an input to function.
     * @constructor
     */
   BB.LeapMotion = function(){  };
   // create variables that can be accesed later on to be able to have the data
   // canvasX, canvasY each will contain a numeric value that represent the position.


  /**
  * The users current x position as supplied by the LeapMotion Sensor.
  * @property canvasX
  * @type {Number}
  * @default undefined
  */
   BB.LeapMotion.prototype.canvasX = 0;
   /**
  * The users current y position as supplied by the LeapMotion Sensor.
  * @property canvasY
  * @type {Number}
  * @default undefined
  */
   BB.LeapMotion.prototype.canvasY = 0;
   //creating function to be called to access x,y in a fast and easy way
   // function requires a canvas.
   BB.LeapMotion.prototype.LeapGetXY= function(canvas){
   // using Leap. controller to create the connection to our sensor
        var controller = new Leap.Controller();
        // the controller.on method lets us se what the sensor is telling us on each frame
        // frames are sent 200 frames per second
        controller.on("frame",function(frame){
          // frame.pointables allows us to detect when a frame has a pointable.(hand,finger)
                if(frame.pointables.length>0)
                    {
                    var pointable = frame.pointables[0];
                    // creates and interaction box it provides normalized coordinates for hands, fingers, and tools within this box.
                    var interactionBox = frame.interactionBox;
                    // provides the stabalized tip position
                    var normalizedPosition = interactionBox.normalizePoint(pointable.stabilizedTipPosition, true);
                    // Convert the normalized coordinates to span the canvas
                    BB.LeapMotion.prototype.canvasX = canvas.width * normalizedPosition[0];
                    BB.LeapMotion.prototype.canvasY = canvas.height * (1 - normalizedPosition[1]);
                     }
                 });
        // connecto to the leap motion sensor to get data
                controller.connect();
                };
   return BB.LeapMotion;
});

/**
 * A 2D Particle class for all your physics needs
 * @module BB.particle2D
 */
define('BB.Particle2D',['./BB', './BB.Vector2'], 
function(  BB,        Vector2){

    'use strict';

    BB.Vector2 = Vector2;


    /**
     * A 2D Particle class for all your physics needs
     * @class BB.Particle2D
     * @constructor
     * @param {Object} [config] An optional config object to initialize
     * Particle2D properties, including: position ( object with x and y ), mass
     * ( defaults to 1 ), radius ( defaults to 0 ) and friction ( defaults to 1
     * ).
     *
     * an initial velocity or acceleration can also be set by passing a
     * BB.Vector2 to either of those properties ( ie. velocity or acceleration
     * ). Or an alternative approach is to initialize with a heading property
     * (radians) and speed property ( number ). If no velocity or acceleration
     * or heading/speed is set, the default velocity is BB.Vector2(0,0).
     * 
     * @example  <code class="code prettyprint">&nbsp; var WIDTH = window.innerWidth;<br>
     * &nbsp; var HEIGHT = window.innerHeight;<br><br>
     * &nbsp; var star = newBB.Particle2D({ <br>
     * &nbsp;&nbsp;&nbsp;&nbsp; position: new BB.Vector2(WIDTH/2, HEIGHT/2 ),<br> 
     * &nbsp;&nbsp;&nbsp;&nbsp; mass: 20000 <br> 
     * &nbsp;}); <br><br> 
     * &nbsp; var planet = new BB.Particle2D({ <br>
     * &nbsp;&nbsp;&nbsp;&nbsp; position: new BB.Vector2( WIDTH/2+200, HEIGHT/2),<br> 
     * &nbsp;&nbsp;&nbsp;&nbsp; heading: -Math.PI / 2, <br>
     * &nbsp;&nbsp;&nbsp;&nbsp; speed: 10 <br> 
     * &nbsp; }); <br><br>
     * &nbsp; var comet = new BB.Particle2D({<br>
     * &nbsp;&nbsp;&nbsp;&nbsp; position: new BB.Vector2( <br>
     * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; BB.MathUtils.randomInt(WIDTH), <br>
     * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; BB.MathUtils.randomInt(HEIGHT) ), <br>
     * &nbsp;&nbsp;&nbsp;&nbsp; velocity: new BB.Vector2( <br>
     * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; BB.MathUtils.randomInt(10),<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; BB.MathUtils.randomInt(10)) <br>
     * &nbsp; });
     * </code>
     */
    
    BB.Particle2D = function(config) {

        // position -------------------------------------------------
        var x = (config && typeof config.x === 'number') ? config.x : 0;
        var y = (config && typeof config.y === 'number') ? config.y : 0;
        this.position = (config && typeof config.position === 'object' && config.position instanceof BB.Vector2) 
                            ? config.position : new BB.Vector2(x, y);
        /**
         * the particle's velocity ( see acceleration also )
         * @property velocity
         * @type BB.Vector2
         */  
        if( typeof config.velocity !== "undefined" && typeof config.heading !== 'undefined' || 
            typeof config.velocity !== "undefined" && typeof config.speed !== 'undefined' ){

            throw new Error("BB.Particle2D: either use heading/speed or velocity (can't initialize with both)");
        }
        else if (typeof config.velocity !== 'undefined' && config.velocity instanceof BB.Vector2) {
            this.velocity = config.velocity; // set velocity as per config vector
        } 
        else if(typeof config.velocity !== 'undefined' && !(config.velocity instanceof BB.Vector2) ) {
            throw new Error("BB.Particle2D: velocity must be an instance of BB.Vector2");
        }        
        else if(typeof config.speed !== 'undefined' || typeof config.heading !== 'undefined'){
            
            if(typeof config.speed !== 'undefined' && typeof config.speed !== 'number' ){
                throw new Error("BB.Particle2D: speed must be a number");
            }
            else if(typeof config.heading !== 'undefined' && typeof config.heading !== 'number' ){
                throw new Error("BB.Particle2D: heading must be a number in radians");
            }
            else if(typeof config.heading !== 'undefined' && typeof config.speed === 'undefined'){
                throw new Error("BB.Particle2D: when setting a heading, a speed parameter is also required");
            }
            else if(typeof config.speed !== 'undefined' && typeof config.heading === 'undefined'){
                throw new Error("BB.Particle2D: when setting a speed, a heading parameter is also required");
            }
            else {
                // we've got both heading + speed, && their both numbers, 
                // so create velocity vector based on heading/speed
                this.velocity = new BB.Vector2(0, 0);
                this.velocity.x = Math.cos(config.heading) * config.speed;
                this.velocity.y = Math.sin(config.heading) * config.speed;
            }
        }
        else {
            this.velocity = new BB.Vector2(0, 0); // default velocity vector
        }


        /**
         * Usually used to accumulate forces to be added to velocity each frame
         * @property acceleration
         * @type BB.Vector2
         */  
        if( typeof config.acceleration !== "undefined" && typeof config.velocity !== "undefined" || 
            typeof config.acceleration !== "undefined" && typeof config.heading !== "undefined" || 
            typeof config.acceleration !== "undefined" && typeof config.speed !== "undefined"){
            throw new Error("BB.Particle2D: acceleration shouldn't be initialized along with velocity or heading/speed, use one or the other");
        } else {
            this.acceleration = (config && typeof config.acceleration === 'object' && config.acceleration instanceof BB.Vector2) 
                            ? config.acceleration : new BB.Vector2(0, 0);
        }
        

        /**
         * the particle's mass
         * @property mass
         * @type Number
         * @default 1
         */  
        this.mass     = (config && typeof config.mass === 'number') ? config.mass : 1;
        /**
         * the particle's radius, used for callculating collistions
         * @property radius
         * @type Number
         * @default 0
         */  
        this.radius   = (config && typeof config.radius === 'number') ? config.radius : 0;
        /**
         * the particle's friction ( not environment's friction ) multiplied by velocity each frame
         * @property friction
         * @type Number
         * @default 1
         */  
        this.friction = (config && typeof config.friction === 'number') ? config.friction : 1;
        /**
         * how bouncy it is when it collides with an object
         * @property elasticity
         * @type Number
         * @default 0.05
         */  
        this.elasticity = (config && typeof config.elasticity === 'number') ? config.elasticity : 0.05;

        this.maxSpeed = (config && typeof config.maxSpeed === 'number') ? config.maxSpeed : 100;

        this._springs      = []; 
        this._colliders    = []; // array of: other Particles ( x,y,r ) to collide against
        this._world        = {}; // object w/: left, right, top, bottom properties, "walls", ie. perimeter for colliding    
        this._gravitations = []; // array of: Vectors or Object{ position:..., mass:... }

    };



    /**
     * the particle's "heading", essentially: Math.atan2( velocity.y,  velocity.x );
     * @property heading
     * @type Number
     */   
    Object.defineProperty(BB.Particle2D.prototype, 'heading', {
        get: function() {
            return Math.atan2(this.velocity.y, this.velocity.x);
        },
        set: function(heading) {
            this.velocity.x = Math.cos(heading) * this.speed;
            this.velocity.y = Math.sin(heading) * this.speed;
        }
    });

    /**
     * the particle's "speed", essentially: the square root of velocity.x&#178; + velocity.y&#178;
     * @property speed
     * @type Number
     */  
    Object.defineProperty(BB.Particle2D.prototype, 'speed', {
        get: function() {
            return Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        },
        set: function(speed) {
            this.velocity.x = Math.cos(this.heading) * speed;
            this.velocity.y = Math.sin(this.heading) * speed;
        }
    });




    /**
     * identifies something to gravitate towards. the object of gravitation needs to
     * have a position ( x, y ) and mass
     * 
     * @method gravitate
     * 
     * @param {Object} particle if passed as the only argument it should be an
     * Object with a position.x, position.y and mass ( ie. an instance of
     * BB.Particle2D ). Otherwise the first argument needs to be an Object with
     * an x and y ( ie. instance of BB.Vector2 or at the very least { x: ..., y:
     * ... } )
     *
     * alternatively, gravitate could also be passed an <b>array</b> of objects 
     * ( each with position and mass properties )
     * 
     * @param {Number} [mass] when particle is not an instance of BB.Particle2D
     * and is a Vector an additional argument for mass is required
     * 
     * @example 
     * <code class="code prettyprint"> 
     * &nbsp; // assuming star and planet are both instances of BB.Particle2D  <br>
     * &nbsp; planet.gravitate( star ); <br>
     * &nbsp; // or <br>
     * &nbsp; planet.gravitate( star.position, star.mass ); <br>
     * &nbsp; // or <br>
     * &nbsp; planet.gravitate( { x:WIDTH/2, y:HEIGHT/2 }, 20000 ); <br><br>
     * &nbsp; // assuming stars is an array of BB.particle2D <br>
     * &nbsp; planet.gravitate( stars );<br>
     * </code>
     */
    BB.Particle2D.prototype.gravitate = function( particle, mass ) {
        var part;

        // if array --------------------------------------------------------------------
        if( particle instanceof Array ){
            for (var i = 0; i < particle.length; i++) {

                var p = particle[i];

                if( typeof p === "undefined"){
                    throw new Error('BB.Particle2D: gravitate array is empty');
                }
                else if( p instanceof BB.Particle2D ){
                    this._gravitations.push({ position:p.position, mass:p.mass });
                }
                else if( p instanceof BB.Vector2 && typeof mass === "number" ){
                    part = { position:p };
                    this._gravitations.push({ position:part.position, mass:mass });
                }
                else if( p instanceof BB.Vector2 && typeof mass !== "number" ){
                    throw new Error('BB.Particle2D: gravitate array objects are missing a mass');
                }
                else if( !(p instanceof BB.Vector2) ){
                    if( typeof p.x === "undefined" || typeof p.y === "undefined" ){
                        throw new Error('BB.Particle2D: gravitate array items should be objects with x and y properties');
                    } 
                    else if( typeof mass == "undefined"){
                        throw new Error('BB.Particle2D: gravitate array objects are missing a mass' );
                    }
                    else {
                        part = { position:{x:p.x, y:p.y } };
                        this._gravitations.push({ position:part.position, mass:mass });
                    }
                }
            }
        }
        
        // if single particle -----------------------------------------------------------
        else {
           
            if( typeof particle === "undefined"){
                throw new Error('BB.Particle2D: gravitate is missing arguments');
            }
            else if( particle instanceof BB.Particle2D ){
                this._gravitations.push({ position:particle.position, mass:particle.mass });
            }
            else if( particle instanceof BB.Vector2 && typeof mass === "number" ){
                part = { position:particle };
                this._gravitations.push({ position:part.position, mass:mass });
            }
            else if( particle instanceof BB.Vector2 && typeof mass !== "number" ){
                throw new Error('BB.Particle2D: gravitate\'s second argument requires a number ( mass )');
            }
            else if( !(particle instanceof BB.Vector2) ){
                if( typeof particle.x === "undefined" || typeof particle.y === "undefined" ){
                    throw new Error('BB.Particle2D: gravitate argument should be an object with an x and y property');
                } 
                else if( typeof mass == "undefined"){
                    throw new Error('BB.Particle2D: gravitate\'s second argument requires a number ( mass )' );
                }
                else {
                    part = { position:{x:particle.x, y:particle.y } };
                    this._gravitations.push({ position:part.position, mass:mass });
                }
            }            
        }


    };



    /**
     * identifies something to spring towards. the target needs to have an x,y
     * position, a k value which is a constant factor characteristic of the spring 
     * ( ie. its stiffness, usually some decimal ), and a length.
     * 
     * @method spring
     * 
     * @param {Object} config object with properties for point ( vector with x,y ), 
     * k ( number ) and length ( number ).
     *
     * alternatively, spring could also be passed an <b>array</b> of config objects 
     * 
     * @example 
     * <code class="code prettyprint"> 
     * &nbsp; // assuming ball is an instance of BB.Particle2D <br>
     * &nbsp; // and center is an object with x,y positions <br>
     * &nbsp; ball.spring({ <br>
     * &nbsp;&nbsp;&nbsp;&nbsp; position: center.position,<br>
     * &nbsp;&nbsp;&nbsp;&nbsp; k: 0.1,<br>
     * &nbsp;&nbsp;&nbsp; length: 100<br>
     * &nbsp; });<br>
     * &nbsp; <br>
     * &nbsp; // the ball will spring back and forth forever from the center position <br>
     * &nbsp; // unless ball has friction value below the default of 1.0
     * </code>
     */
    BB.Particle2D.prototype.spring = function( config ) {

        // if array --------------------------------------------------------------------
        if( config instanceof Array ){

            for (var i = 0; i < config.length; i++) {

                var p = config[i];

                if( typeof p === "undefined"){
                    throw new Error('BB.Particle2D: spring array is empty, expecting config objects');
                }
                else if( typeof p !== "object" || p.position === "undefined" ||
                          typeof p.k === "undefined" ||  typeof p.length === "undefined"){
                    throw new Error('BB.Particle2D: spring array expecting config objects, with properies for position, length and k');
                }
                else if( typeof p.position.x !== "number" || typeof p.position.y !== "number" ){
                    throw new Error('BB.Particle2D: spring array objects\' positions should have x and y properties ( numbers )');   
                }
                else if( typeof p.k !== "number" ){
                    throw new Error('BB.Particle2D: spring array object\'s k properties should be numbers ( usually a float )');   
                }
                else if( typeof p.length !== "number" ){
                    throw new Error('BB.Particle2D: spring array object\'s length properties should be numbers ( usually a integers ');   
                }
                else {
                    this._springs.push({ position:p.position, k:p.k, length:p.length });
                }

            }
        }
        
        // if single target -----------------------------------------------------------
        else {
           
            if( typeof config === "undefined"){
                throw new Error('BB.Particle2D: spring is missing arguments');
            }
            else if( typeof config !== "object" || config.position === "undefined" ||
                      typeof config.k === "undefined" ||  typeof config.length === "undefined"){
                throw new Error('BB.Particle2D: spring expecting a config object, with properies for position, length and k');
            }
            else if( typeof config.position.x !== "number" || typeof config.position.y !== "number" ){
                throw new Error('BB.Particle2D: config.position should have x and y properties ( numbers )');   
            }
            else if( typeof config.k !== "number" ){
                throw new Error('BB.Particle2D: config.k property should be a number ( usually a float )');   
            }
            else if( typeof config.length !== "number" ){
                throw new Error('BB.Particle2D: config.length property should be a number ( usually an integer )');   
            }
            else {
                this._springs.push( { position:config.position, k:config.k, length:config.length } );
            }
        }


    };


    /**
     * tracks objects to collide against, this can be other particles ( objects with 
     * position vectors and a radius ) and/or a perimeter ( top, left, right, bottom )
     * 
     * @method collide
     * 
     * @param {Object} config object with properties for top, left, bottom, right ( all numbers ) and particles ( array of other 
     * particles or objects with position.x, positon.y and radius properties )
     *       
     * @example 
     * <code class="code prettyprint"> 
     * &nbsp; // assuming ball is an instance of BB.Particle2D <br>
     * &nbsp; // assuming balls is an array of BB.Particle2D objects <br>
     * &nbsp; ball.collide({ <br> 
     * &nbsp;&nbsp;&nbsp;&nbsp; top:0, <br> 
     * &nbsp;&nbsp;&nbsp;&nbsp; right: canvas.width, <br> 
     * &nbsp;&nbsp;&nbsp;&nbsp; bottom: canvas.height, <br> 
     * &nbsp;&nbsp;&nbsp;&nbsp; left: 0, <br> 
     * &nbsp;&nbsp;&nbsp;&nbsp; particles: balls <br> 
     * &nbsp; });<br>
     * </code>
     */
    BB.Particle2D.prototype.collide = function( config ) {

        if( typeof config === "undefined" ){
            throw new Error('BB.Particle2D: collide requires arguments to konw what to collide against');   
        }


        // perimeter -----------------------------------------------
        if( typeof config.dampen !== "undefined") this._world.dampen = config.dampen;
         
        if( typeof config.left !== "undefined" ) this._world.left = config.left;        

        if( typeof config.right !== "undefined" ) this._world.right = config.right;

        if( typeof config.top !== "undefined" ) this._world.top = config.top;
        
        if( typeof config.bottom !== "undefined" ) this._world.bottom = config.bottom;    

        // other particles -----------------------------------------
        var i = 0;
        if( typeof config.particles !== "undefined" ){ // when sent along w/ above parameters
            if( !(config.particles instanceof Array) ){
                throw new Error('BB.Particle2D: collide: particles value expecting array of particles');   
            } 
            else {
                for (i = 0; i < config.particles.length; i++) {
                    // if(  !( config.particles[i] instanceof BB.Particle2D ) ){
                    if( typeof config.particles[i].position.x === "undefined" ) {
                        throw new Error('BB.Particle2D: collide: particles['+i+'] is missing a position.x');  
                    }
                    if( typeof config.particles[i].position.y === "undefined" ) {
                        throw new Error('BB.Particle2D: collide: particles['+i+'] is missing a position.y');  
                    }
                    if( typeof config.particles[i].radius === "undefined" ) {
                        throw new Error('BB.Particle2D: collide: particles['+i+'] is missing a radius');  
                    }
                    this._colliders = config.particles;
                }
            }
        }
        

    };



    BB.Particle2D.prototype.update = function() {

        var i = 0;
        var accVector = new BB.Vector2();
        var dx, dy, ax, ay, tx, ty, 
            dist, distSQ, distMin, 
            force, angle;


        // apply gravitations ---------------------------------------- 
        for (i = 0; i < this._gravitations.length; i++) {
            var g = this._gravitations[i];

            dx = g.position.x - this.position.x; 
            dy = g.position.y - this.position.y;
            distSQ = dx * dx + dy * dy;
            dist = Math.sqrt(distSQ);
            force = g.mass / distSQ;

            ax = dx / dist * force;
            ay = dy / dist * force;
            accVector.set( ax, ay );
            this.applyForce( accVector );
            // this.acceleration.add( new BB.Vector2(ax,ay) );
        }
        


        // apply springs ----------------------------------------
        for (i = 0; i < this._springs.length; i++) {
            var s = this._springs[i];

            dx = s.position.x - this.position.x;
            dy = s.position.y - this.position.y;
            dist = Math.sqrt(dx * dx + dy * dy);
            force = (dist - s.length || 0) * s.k; 
            
            ax = dx / dist * force;
            ay = dy / dist * force;            
            accVector.set( ax, ay );
            this.applyForce( accVector );
        }


        // apply collisions ----------------------------------------
        for (i = 0; i < this._colliders.length; i++) {

            var c = this._colliders[i];            

            if( c !== this ){
                dx = c.position.x - this.position.x;
                dy = c.position.y - this.position.y;
                dist = Math.sqrt(dx*dx + dy*dy);
                distMin = c.radius + this.radius;

                if (dist < distMin) { 
                    angle = Math.atan2(dy, dx);
                    tx = this.position.x + Math.cos(angle) * distMin;
                    ty = this.position.y + Math.sin(angle) * distMin;
                    ax = (tx - c.position.x) * this.elasticity;
                    ay = (ty - c.position.y) * this.elasticity;
                    accVector.set( -ax, -ay);
                    this.applyForce( accVector );
                }         
            }
        }

        if( typeof this._world.left !== "undefined" ){
            if( (this.position.x - this.radius) < this._world.left ){
                this.position.x = this._world.left + this.radius;
                this.velocity.x = -this.velocity.x;
                this.velocity.x *= this._world.dampen || 0.7;
            }
        }

        if( typeof this._world.right !== "undefined" ){
            if( (this.position.x + this.radius) > this._world.right ){
                this.position.x = this._world.right - this.radius;
                this.velocity.x = -this.velocity.x;
                this.velocity.x *= this._world.dampen || 0.7;
            }
        }

        if( typeof this._world.top !== "undefined" ){
            if( (this.position.y - this.radius) < this._world.top ) {
                this.position.y = this._world.top + this.radius;
                this.velocity.y = -this.velocity.y;
                this.velocity.y *= this._world.dampen || 0.7;
            }
        }

        if( typeof this._world.bottom !== "undefined" ){
            if( (this.position.y + this.radius) > this._world.bottom ) {
                this.position.y = this._world.bottom - this.radius;
                this.velocity.y = -this.velocity.y;
                this.velocity.y *= this._world.dampen || 0.7;
            }
        }

        // this.acceleration.multiplyScalar(this.friction); // NOT WORKING?
        this.velocity.multiplyScalar(this.friction);      // APPLYING DIRECTLY TO VELOCITY INSTEAD

        this.velocity.add(this.acceleration);
        
        if (this.velocity.length() > this.maxSpeed) {
            this.velocity.setLength(this.maxSpeed);
        }

        this.position.add(this.velocity);

        this.acceleration.multiplyScalar(0);

        this._gravitations = [];
        this._springs = [];
        this._colliders = [];
        
    };

    /**
     * takes a force, divides it by particle's mass, and applies it to acceleration ( which is added to velocity each frame )
     * 
     * @method applyForce
     * 
     * @param {BB.Vector2} vector force to be applied
     */
    BB.Particle2D.prototype.applyForce = function(force) {

        if (typeof force !== 'object' || ! (force instanceof BB.Vector2)) {
            throw new Error('BB.Particle2D.applyForce: force parameter must be present and an instance of BB.Vector2');
        }

        return this.acceleration.add( force.clone().divideScalar(this.mass) );

    };

    return BB.Particle2D;
});
/**
 * A module for creating audio buffers from audio files
 * @module BB.AudioBufferLoader
 */
define('BB.AudioBufferLoader',['./BB'],
function(  BB){

    'use strict';
    
    /**
     * A module for creating audio buffers from audio files
     * @class BB.AudioBufferLoader
     * @constructor
     * @param {Object} config A config object to initialize the buffer ( context:AudioContext, paths: Array of file paths, autoload:boolean)
     * @param {Function} [callback] A callback, with a buffer Object
     * @example  
     * <code class="code prettyprint">  
     * &nbsp;var context =  new (window.AudioContext || window.webkitAudioContext)();<br>
     * <br>
     * &nbsp;// one way to do it<br>
     * &nbsp;var loader = new BufferLoader({<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;context: context,<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;paths: ['audio/katy.ogg','audio/entro.ogg']<br>
     * &nbsp;}, function(buffers){<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;console.log('loaded:', buffers )<br>
     * &nbsp;});<br>
     * <br>
     * &nbsp;// another way to do it<br>
     * &nbsp;loader = new BufferLoader({ <br>
     * &nbsp;&nbsp;&nbsp;&nbsp;context:context, <br>
     * &nbsp;&nbsp;&nbsp;&nbsp;paths:['katy.ogg','entro.ogg'], <br>
     * &nbsp;&nbsp;&nbsp;&nbsp;autoload:false <br>
     * &nbsp;});<br>
     * &nbsp;loader.load(); // call load later, ex under some other condition<br>
     * </code>
     */


    BB.AudioBufferLoader = function( config, callback ){
        
        /**
         * corresponding Audio Context
         * @type {AudioContext}
         * @property ctx
         */
        this.ctx        = config.context;

        /**
         * array of paths to audio files to load 
         * @type {Array}
         * @property urls
         */
        this.urls       = config.paths;

        /**
         * whether or not to autoload the files
         * @type {Boolean}
         * @property auto
         */
        this.auto       = ( typeof config.autoload !== 'undefined' ) ? config.autoload : true;

        /**
         * callback to run after loading
         * @type {Function}
         * @property onload
         */
        this.onload     = callback;
        
        this._cnt       = 0; // to know when to callback

        /**
         * audio buffers array, accessible in callback
         * @type {Array}
         * @property buffers
         */
        this.buffers    = [];

        if( !config ) throw new Error('BB.AudioBufferLoader: requires a config object');

        if( !(this.ctx instanceof AudioContext) ) 
            throw new Error('BB.AudioBufferLoader: context should be an instance of AudioContext');
        
        if( !(this.urls instanceof Array) ) 
            throw new Error('BB.AudioBufferLoader: paths should be an Array of paths');
        
        if( typeof this.auto !== 'boolean' ) 
            throw new Error('BB.AudioBufferLoader: autoload should be either true or false');

        if( this.auto===true ) this.load();
    };

    /**
     * private function used by load() to load a buffer
     * @method loadbuffer
     * @param {String} path to audio file 
     * @param {Number} index of buffer 
     */
    BB.AudioBufferLoader.prototype.loadbuffer = function(url, index){
        var self = this;

        // create rootpath to get around bug ( which seems to have gone away? )
        // var fullpath = window.location.pathname;
        // var filename = fullpath.replace(/^.*[\\\/]/, '');
        // var rootpath = fullpath.substring(0,fullpath.length-filename.length);
        
        // http://www.html5rocks.com/en/tutorials/webaudio/intro/#toc-load  
        var req = new XMLHttpRequest();
            req.open('GET', url, true);
            req.responseType = 'arraybuffer';
            req.onload = function(){

                self.ctx.decodeAudioData( req.response, function(decodedData){ 
                    // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/decodeAudioData
                    if(!decodedData) throw new Error('BB.AudioBufferLoader: decodeAudioData: could not decode: ' + url );
                    
                    self.buffers[index] = decodedData;
                    
                    if( ++self._cnt == self.urls.length && typeof self.onload !=='undefined') 
                        self.onload( self.buffers ); // if callback do callback 
                
                },function(err){ throw new Error('BB.AudioBufferLoader: decodeAudioData:'+err);});
            };
            req.onerror = function(){ throw new Error('BB.AudioBufferLoader: XHMHttpRequest'); };
            req.send();
    };

    /**
     * creates buffers from url paths set in the constructor, automatically runs in constructor unless autoload is set to false
     * @method load
     */
    BB.AudioBufferLoader.prototype.load = function(){
        for (var i = 0; i < this.urls.length; i++) this.loadbuffer( this.urls[i], i );
    };   

    return BB.AudioBufferLoader;
});
/**
 * A module for creating an audio sampler, an object that can load, sample and play back sound files
 * @module BB.AudioSampler
 */
define('BB.AudioSampler',['./BB','./BB.AudioBufferLoader'],
function(  BB, 		 AudioBufferLoader){

	'use strict';

	BB.AudioBufferLoader = AudioBufferLoader;

	 /**
	 *  A module for creating an audio sampler, an object that can load, sample and play back sound files
	 * @class BB.AudioSampler
	 * @constructor
	 * 
	 * @param {Object} config A config object to initialize the Sampler, must contain a "context: AudioContext" 
	 * property and can contain as many additional properties as there are sound files
	 * @param {Function} [callback] A callback, with a buffer Object Array
	 * 
	 * @example  
	 * <code class="code prettyprint">  
	 *  &nbsp;var context = new (window.AudioContext || window.webkitAudioContext)();<br>
	 *	<br>
	 *	&nbsp;var drum = new BB.AudioSampler({<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp;context: context,<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp;kick: 'audio/808/kick.ogg',<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp;snare: 'audio/808/snare.ogg',<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp;hat: 'audio/808/hat.ogg'<br>
	 *	&nbsp;}, function( bufferObj ){<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp;console.log( bufferObj )<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp;run();<br>
	 *	&nbsp;});<br>
	 *	<br>
	 *	&nbsp;function run(){<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;drum.play('kick');<br>
	 *	&nbsp;}<br>
	 * </code>
	 */
    

	BB.AudioSampler = function( config, callback ){
		
		/**
		 * corresponding Audio Context
		 * @type {AudioContext}
		 * @property ctx
		 */
		this.ctx 		= config.context;

		this.dest 		= this.ctx.destination;


		/**
		 * whether or not to autoload the files
		 * @type {Boolean}
		 * @property auto
		 */
		this.auto 		= ( typeof config.autoload !== 'undefined' ) ? config.autoload : true;

		/**
		 * whether or not the file(s) have loaded
		 * @type {Boolean}
		 * @property loaded
		 */
		this.loaded		= false;

		/**
		 * callback to run after loading
		 * @type {Function}
		 * @property onload
		 */
		this.onload 	= callback;

		/**
		 * array of sample names
		 * @type {Array}
		 * @property keys
		 */
		this.keys 		= []; 
		/**
		 * array of paths to sample audio files
		 * @type {Array}
		 * @property paths
		 */
		this.paths  	= []; 
		/**
		 * collection of sample buffers
		 * @type {Object}
		 * @property buffers
		 */
		this.buffers	= {}; 
		this.loader 	= undefined;


		if( !config ) throw new Error('BB.AudioSampler: requires a config object');

		if( !(this.ctx instanceof AudioContext) ) 
			throw new Error('BB.AudioSampler: context should be an instance of AudioContext');
		
		if( typeof this.auto !== 'boolean' ) 
			throw new Error('BB.AudioSampler: autoload should be either true or false');



		for (var key in config ) {
			if( key!=='context' && key!=='autoload'){
				this.keys.push( key );
				this.paths.push( config[key] );
			}
		}

		if( this.auto===true ) this.load();
	};


    /**
     * creates buffers from url paths using BB.AudioBufferLoader, automatically runs in constructor unless autoload is set to false
     * @method load
     */
	BB.AudioSampler.prototype.load = function(){

		var self = this;

		this.loader = new BB.AudioBufferLoader({

			context: this.ctx,
			autoload: this.auto,
			paths: this.paths

		}, function(buffers){

			for (var i = 0; i < buffers.length; i++) {
				self.buffers[self.keys[i]] = buffers[i];
			}

			self.loaded = true;
			
			if(typeof self.onload !== 'undefined' ) self.onload( self.buffers ); // callback

		});

	};

	BB.AudioSampler.prototype.connect = function( destination){
		// WARNING: keep in mind this connect is a little different from webaudio api connect
		// it has no optional output/input arguments
		this.dest = destination;
	};

    /**
     * schedules an audio buffer to be played
     * @method play
     * @param {String} key name of particular sample ( declared in constructor ) 
     * @param {Number} [when] scheduled time in the AudioContext's timeline/clock (ie. currentTime) to play the file ( default 0, ie. automatically )
     * @param {Number} [offset] default is 0 (ie. beggining of the sample ) but can be offset (seconds) to start at another point in the sample
     * @param {Number} [duration] default is the duration of the entire sample (seconds) can be shortened to a lesser amount
	 * @example  
	 * <code class="code prettyprint">  
	 * &nbsp;// plays the sample "fireworks" <br>
	 * &nbsp;// starts playing it when AudioContext.currentTime == 10<br>
	 * &nbsp;// starts the sample 30 seconds into the track<br>
	 * &nbsp;// plays for half a second, then stops<br>
	 * &nbsp;sampler.play('fireworks', 10, 30, 0.5);
	 * </code>
     */
	BB.AudioSampler.prototype.play = function( key, when, offset, duration ) {

		if( !key || this.keys.indexOf(key)<0 ) throw new Error('BB.AudioSampler: '+key+' was not defined in constructor');

		var source = this.ctx.createBufferSource(); 
			source.buffer = this.buffers[ key ];            
			source.connect( this.dest );   

		var w = ( typeof when !== 'undefined' ) ? when : 0;
		var o = ( typeof offset !== 'undefined' ) ? offset : 0;
		var d = ( typeof duration !== 'undefined' ) ? duration : source.buffer.duration;

	    source.start( w, o, d ); 
    };

	return BB.AudioSampler;
});
/**
 * A module for doing FFT ( Fast Fourier Transform ) analysis on audio 
 * @module BB.AudioAnalyser
 */
define('BB.AudioAnalyser',['./BB'],
function(  BB ){

	'use strict';

	 /**
	 *  A module for doing FFT ( Fast Fourier Transform ) analysis on audio 
	 * @class BB.AudioAnalyser
	 * @constructor
	 * 
	 * @param {Object} config A config object to initialize the Sampler, must contain a "context: AudioContext" 
	 * property and can contain properties for fftSize, smoothing, maxDecibels and minDecibels
	 * ( see <a href="https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode" target="_blank">AnalyserNode</a> for details )
	 * 
	 * @example  
	 * <code class="code prettyprint">  
	 *  &nbsp;var context = new (window.AudioContext || window.webkitAudioContext)();<br>
	 *	<br>
	 *	&nbsp;var fft = new BB.AudioAnalyser({ context: context }); <br>
	 *	&nbsp;// assuming samp is an instanceof BB.AudioSampler <br>
	 *	&nbsp;samp.connect( fft.analyser ); <br>
	 *	&nbsp;// fft will then connect to the context.destination by default <br>
	 *	&nbsp;// ...unless otherwise connected to somthing else
	 * </code>
	 */
    

	BB.AudioAnalyser = function( config ){
		
		this.ctx 			= config.context;
		/**
		 * the AnalyserNode itself ( used by other nodes when connecting to this )
		 * @type {AnalyserNode}
		 * @property analyser
		 */
		this.analyser 		= this.ctx.createAnalyser();
		this.dest 			= this.ctx.destination;
		this.fftSize 		= ( typeof config.fftSize !== 'undefined' ) ? config.fftSize : 2048;
		this.smoothing 		= ( typeof config.smoothing !== 'undefined' ) ? config.smoothing : 0.8;
		this.maxDecibels	= ( typeof config.maxDecibels !== 'undefined' ) ? config.maxDecibels : -30;
		this.minDecibels	= ( typeof config.minDecibels !== 'undefined' ) ? config.minDecibels : -90;

		this.analyser.fftSize 					= this.fftSize;
		this.analyser.smoothingTimeConstant 	= this.smoothing;
		this.analyser.maxDecibels 				= this.maxDecibels;
		this.analyser.minDecibels 				= this.minDecibels;

		this.freqByteData 	= new Uint8Array( this.analyser.frequencyBinCount );
		this.freqFloatData 	= new Float32Array(this.analyser.frequencyBinCount);
		this.timeByteData 	= new Uint8Array( this.analyser.frequencyBinCount );
		this.timeFloatData 	= new Float32Array(this.analyser.frequencyBinCount);

		if( !config ) throw new Error('Analyser: requires a config object');
		if( !(this.ctx instanceof AudioContext) ) 
			throw new Error('Analyser: context should be an instance of AudioContext');
		if( this.fftSize%2 !== 0 || this.fftSize < 32 || this.fftSize > 2048)
			throw new Error('Analyser: fftSize must be a multiple of 2 between 32 and 2048');

		this.analyser.connect( this.dest );		
		
	};

    /**
     * method for connecting to other nodes ( overrides the default connection to context.destination )
     * @method connect
     * @param {Object} destination either an AudioDestinationNode or AudioNode to connect to 
     * @param {Number} [output] this analyser's output, 0 for left channel, 1 for right channel ( default 0 )
     * @param {Number} [input] input of the node you're connecting this to, 0 for left channel, 1 for right channel ( default 0 )
     */
	BB.AudioAnalyser.prototype.connect = function(destination, output, input ){
		if( !(destination instanceof AudioDestinationNode) || !(destination instanceof AudioNode) )
			throw new Error('Analyser: destination should be an instanceof AudioDestinationNode or AudioNode');
		this.dest = destination;
		this.analyser.connect( this.dest, output, input );
	};

    /**
     * returns an array with frequency byte data
     * @method getByteFrequencyData
     */
	BB.AudioAnalyser.prototype.getByteFrequencyData = function(){
		this.analyser.getByteFrequencyData( this.freqByteData );
		return this.freqByteData;
	};

    /**
     * returns an array with frequency float data
     * @method getFloatFrequencyData
     */
	BB.AudioAnalyser.prototype.getFloatFrequencyData = function(){
		this.analyser.getFloatFrequencyData( this.freqFloatData );
		return this.freqFloatData;
	};

    /**
     * returns an array with time domain byte data
     * @method getByteTimeDomainData
     */
	BB.AudioAnalyser.prototype.getByteTimeDomainData = function(){
		// https://en.wikipedia.org/wiki/Time_domain
		this.analyser.getByteTimeDomainData( this.timeByteData );
		return this.timeByteData;
	};

    /**
     * returns an array with time domain float data
     * @method getFloatTimeDomainData
     */
	BB.AudioAnalyser.prototype.getFloatTimeDomainData = function(){
		this.analyser.getFloatTimeDomainData( this.timeFloatData );
		return this.timeFloatData;
	};

	BB.AudioAnalyser.prototype.averageAmp = function( array ){
		var v = 0;
		var averageAmp;
		var l = array.length;
		for (var i = 0; i < l; i++) {
			v += array[i];
		}
		averageAmp = v / l;
		return averageAmp;
	};

    /**
     * returns the averaged amplitude between both channels
     * @method getAmplitude
     */
	BB.AudioAnalyser.prototype.getAmplitude = function(){
		return this.averageAmp( this.getByteFrequencyData() );
	};


	return BB.AudioAnalyser;
});
/**
 * A module for streaming user audio ( getUserMedia )
 * @module BB.AudioStream
 */
define('BB.AudioStream',['./BB'],
function(  BB ){

	'use strict';

	 /**
	 *  A module for streaming user audio ( getUserMedia )
	 * @class BB.AudioStream
	 * @constructor
	 * 
	 * @param {Object} config A config object to initialize the Stream, must contain a "context: AudioContext" 
	 * property and can contain properties for destination ( connect: destinationNode )
	 * 
	 * @example  
	 * <code class="code prettyprint">  
	 *  &nbsp;var context = new (window.AudioContext || window.webkitAudioContext)();<br><br>
	 *  &nbsp;var fft = new BB.AudioAnalyser({ <br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;context: context,<br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;fftSize: 1024<br>
	 *  &nbsp;});<br><br>
	 * &nbsp;var mic = new BB.AudioStream({<br>
	 * &nbsp;&nbsp;&nbsp;&nbsp;context:context,<br>
	 * &nbsp;&nbsp;&nbsp;&nbsp;connect:fft.analyser<br>
	 * &nbsp;});<br>
	 * </code>
	 */
	


	BB.AudioStream = function( config ){
		
		this.ctx 		= config.context;
		this.dest 		= ( typeof config.connect !== 'undefined' ) ? config.connect : this.ctx.destination;

		navigator.getUserMedia = 	navigator.getUserMedia ||
									navigator.webkitGetUserMedia ||
									navigator.mozGetUserMedia;

		var self = this;

		if(navigator.getUserMedia){
			navigator.getUserMedia({audio:true}, 
				function(stream){
					var input = self.ctx.createMediaStreamSource(stream);
					input.connect( self.dest );
				}, 
				function(e){
					throw new Error("Stream: "+ e );
				}
			);
		} else {
			console.log('getUserMedia not supported');
		}

		if( !config ) throw new Error('BufferLoader: requires a config object');

		if( !(this.ctx instanceof AudioContext) ) 
			throw new Error('BufferLoader: context should be an instance of AudioContext');
		
	};

	return BB.AudioStream;
});
/**
 * A base module for representing individual inputs on a midi device.
 * MidiInputSlider, MidiInputButton, etc derive from this base class.
 * @module BB.BaseMidiInput
 */
define('BB.BaseMidiInput',['./BB'], 
function(  BB){

    'use strict';

    /**
     * A base module for representing individual inputs on a midi device.
     * MidiInputSlider, MidiInputButton, etc derive from this base class.
     * @class BB.BaseMidiInput
     * @constructor
     * @param {Number} [note] The midi note to assign this input to.
     */
    BB.BaseMidiInput = function(config) {
        
        this.channel      = null;
        this.command      = null;
        this.type         = null;
        this.velocity     = null;

        if (typeof config === 'number') {
            
            this.note  = config;
            
        } else if (typeof config === 'object') {

            if (typeof config.channel === 'number')  this.channel = config.channel;
            if (typeof config.command === 'number')  this.command = config.command;
            if (typeof config.type === 'number')     this.type = config.type;
            if (typeof config.velocity === 'number') this.velocity = config.velocity;

        } else {
            throw new Error('BB.BaseMidiInput: config parameter must be a number or object type');
        }
        
        this.inputType = 'base';

        this.eventStack = {
            change: []
        };
    };

    /**
     * Register an event for this midi input. Available events include: change.
     * @method on
     * @param  {string}   name     The name of the event. Currently only supports
     * the "change" event.
     * @param  {Function} callback Callback to run when the event has fired
     */
    BB.BaseMidiInput.prototype.on = function(name, callback) {

        if (name === 'change') {
            this.eventStack.change.push(callback);
        }
    };

    return BB.BaseMidiInput;
});
/**
 * A module representing individual button inputs on a midi device.
 * MidiInputSlider, MidiInputButton, etc derive from this base class.
 * @module BB.BaseMidiInput
 */
define('BB.MidiInputButton',['./BB', './BB.BaseMidiInput'], 
function(  BB,        BaseMidiInput){

    'use strict';

    BB.BaseMidiInput = BaseMidiInput;

   /**
     * A module for representing individual button inputs on a midi device. A button
     * is defined as a midi input that only has two values (velocity): 0 and 127.
     * NOTE: Don't use this class for an input unless it only outpus velocity values
     * 0 and 127 exclusively even if it looks like a button, as it will cause the
     * "up" and "down" events to work improperly.
     * @class BB.MidiInputButton
     * @constructor
     * @extends BB.BaseMidiInput
     * @param {Number} [note] The midi note to assign this input to.
     */
    BB.MidiInputButton = function(note) {

        BaseMidiInput.call(this, note);
        this.inputType = 'button';
        this.eventStack.down = [];
        this.eventStack.up   = [];
    };

    BB.MidiInputButton.prototype = Object.create(BaseMidiInput.prototype);
    BB.MidiInputButton.prototype.constructor = BaseMidiInput;

    /**
     * Register an event for this midi input. Available events include: change, up,
     * and down.
     * @method on
     * @param  {string}   name     The name of the event. Supports "change", "up" (button up),
     * and "down" (button down) events.
     * @param  {Function} callback Callback to run when the event has fired
     */
    BB.MidiInputButton.prototype.on = function(name, callback) {

        BaseMidiInput.prototype.on.call(this, name, callback);
        
        if (name === 'down') {
            this.eventStack.down.push(callback);
        } else if (name === 'up') {
            this.eventStack.up.push(callback);
        }
    };

    return BB.MidiInputButton;
});

/**
 * A module representing individual piano-like key inputs on a midi device.
 * MidiInputSlider, MidiInputButton, etc derive from this base class.
 * @module BB.BaseMidiInput
 */
define('BB.MidiInputKey',['./BB', './BB.BaseMidiInput'], 
function(  BB,        BaseMidiInput){

    'use strict';

    BB.BaseMidiInput = BaseMidiInput;

    /**
     * A module for representing individual Key inputs on a midi device. Behaves like BB.MidiInputPad.
     * @class BB.MidiInputKey
     * @constructor
     * @extends BB.BaseMidiInput
     * @param {Number} [note] The midi note to assign this input to.
     */
    BB.MidiInputKey = function(note) {

        BaseMidiInput.call(this, note);
        this.inputType = 'key';
    };

    BB.MidiInputKey.prototype = Object.create(BaseMidiInput.prototype);
    BB.MidiInputKey.prototype.constructor = BaseMidiInput;

    return BB.MidiInputKey;
});

/**
 * A module representing individual knob inputs on a midi device.
 * MidiInputSlider, MidiInputButton, etc derive from this base class.
 * @module BB.BaseMidiInput
 */
define('BB.MidiInputKnob',['./BB', './BB.BaseMidiInput'], 
function(  BB,        BaseMidiInput){

    'use strict';

    BB.BaseMidiInput = BaseMidiInput;

    /**
     * A module for representing individual knob inputs on a midi device. Behaves
     * like MidiInputSlider.
     * @class BB.MidiInputKnob
     * @constructor
     * @extends BB.BaseMidiInput
     * @param {Number} [note] The midi note to assign this input to.
     */
    BB.MidiInputKnob = function(note) {

        BaseMidiInput.call(this, note);
        this.inputType = 'knob';
        this.eventStack.max = [];
        this.eventStack.min = [];
    };

    BB.MidiInputKnob.prototype = Object.create(BaseMidiInput.prototype);
    BB.MidiInputKnob.prototype.constructor = BaseMidiInput;

    /*
     * Register an event for this midi input. Available events include: change, min,
     * and max.
     * @method on
     * @param  {string}   name     The name of the event. Supports "change", "min",
     * and "max" events.
     * @param  {Function} callback Callback to run when the event has fired
     */
    BB.MidiInputKnob.prototype.on = function(name, callback) {

        BaseMidiInput.prototype.on.call(this, name, callback);
        if (name === 'min') {
            this.eventStack.min.push(callback);
        } else if (name === 'max') {
            this.eventStack.max.push(callback);
        } 
    };

    return BB.MidiInputKnob;
});
/**
 * A module representing individual pad inputs on a midi device.
 * MidiInputSlider, MidiInputButton, etc derive from this base class.
 * @module BB.BaseMidiInput
 */
define('BB.MidiInputPad',['./BB', './BB.BaseMidiInput'], 
function(  BB,        BaseMidiInput){

    'use strict';

    BB.BaseMidiInput = BaseMidiInput;

    /**
     * A module for representing individual pad inputs on a midi device. Behaves like BB.MidiInputKey.
     * @class BB.MidiInputPad
     * @constructor
     * @extends BB.BaseMidiInput
     * @param {Number} [note] The midi note to assign this input to.
     */
    BB.MidiInputPad = function(note) {

        BaseMidiInput.call(this, note);
        this.inputType = 'pad';
    };

    BB.MidiInputPad.prototype = Object.create(BaseMidiInput.prototype);
    BB.MidiInputPad.prototype.constructor = BaseMidiInput;

    return BB.MidiInputPad;
});

/**
 * A base module for representing individual slider inputs on a midi device.
 * MidiInputSlider, MidiInputButton, etc derive from this base class.
 * @module BB.BaseMidiInput
 */
define('BB.MidiInputSlider',['./BB', './BB.BaseMidiInput'], 
function(  BB,        BaseMidiInput){

    'use strict';

    BB.BaseMidiInput = BaseMidiInput;

    /**
     * A module for representing individual slider inputs on a midi device. Behaves
     * like MidiInputKnob.
     * @class BB.MidiInputSlider
     * @constructor
     * @extends BB.BaseMidiInput
     * @param {Number} [note] The midi note to assign this input to.
     */
    BB.MidiInputSlider = function (note) {

        BaseMidiInput.call(this, note);
        this.inputType = 'slider';
        this.eventStack.max = [];
        this.eventStack.min = [];
    };

    BB.MidiInputSlider.prototype = Object.create(BaseMidiInput.prototype);
    BB.MidiInputSlider.prototype.constructor = BaseMidiInput;

    /**
     * Register an event for this midi input. Available events include: change, min,
     * and max.
     * @method on
     * @param  {string}   name     The name of the event. Supports "change", "min",
     * and "max" events.
     * @param  {Function} callback Callback to run when the event has fired
     */
    BB.MidiInputSlider.prototype.on = function(name, callback) {

        BaseMidiInput.prototype.on.call(this, name, callback);
        if (name === 'min') {
            this.eventStack.min.push(callback);
        } else if (name === 'max') {
            this.eventStack.max.push(callback);
        } 
    };

    return BB.MidiInputSlider;
});
/**
 * A module for receiving midi messages via USB in the browser. Google Chrome
 * support only at the moment. See support for the Web MIDI API
 * (https://webaudio.github.io/web-midi-api/).
 * @module BB.Midi
 */
define('BB.MidiDevice',['./BB',
        './BB.BaseMidiInput', 
        './BB.MidiInputButton', 
        './BB.MidiInputKey', 
        './BB.MidiInputKnob', 
        './BB.MidiInputPad', 
        './BB.MidiInputSlider'], 
function(  BB,
           BaseMidiInput,
           MidiInputButton,
           MidiInputKey,
           MidiInputKnob,
           MidiInputPad,
           MidiInputSlider){

    'use strict';

    BB.BaseMidiInput   = BaseMidiInput;
    BB.MidiInputButton = MidiInputButton;
    BB.MidiInputKey    = MidiInputKey;
    BB.MidiInputKnob   = MidiInputKnob;
    BB.MidiInputPad    = MidiInputPad;
    BB.MidiInputSlider = MidiInputSlider;

    /**
     * A class for recieving input from Midi controllers in the browser using
     * the experimental Web MIDI API. This constructor returns true if browser
     * supports Midi and false if not.
     * 
     * <em>NOTE: This implementation of
     * BB.MidiDevice currently only supports using one MIDI device connected to
     * the browser at a time. More than one may work but you may run into note
     * clashing and other oddities.</em>
     * <br><br>
     * <img src="../../examples/assets/images/midi.png"/>
     * 
     * @class  BB.MidiDevice
     * @constructor
     * @param {Object} midiMap An object with array properties for knobs, sliders, buttons, keys, and pads.
     * @param {Function} success Function to return once MIDIAccess has been received successfully.
     * @param {Function} failure Function to return if MIDIAccess is not received successfully.
     */
    BB.MidiDevice = function(midiMap, success, failure) {
        
        if (typeof midiMap !== 'object') {
            throw new Error("BB.MidiDevice: midiMap parameter must be an object");
        } else if (typeof success !== 'function') {
            throw new Error("BB.MidiDevice: success parameter must be a function");
        } else if (typeof failure !== 'function') {
            throw new Error("BB.MidiDevice: failure parameter must be a function");
        }

        var self = this;

        /**
         * Dictionary of Midi input object arrays. Includes sliders, knobs,
         * buttons, pads, and keys (only if they are added in the midiMap passed
         * into the constructor).
         * @property inputs
         * @type {Object}
         */
        this.inputs = {
            sliders: [],
            knobs: [],
            buttons: [],
            pads: [],
            keys: []
        };

        /**
         * The Web MIDI API midiAccess object returned from navigator.requestMIDIAccess(...)
         * @property midiAccess
         * @type {MIDIAccess}
         * @default null
         */
        this.midiAccess = null;

        this._connectEvent = null;
        this._disconnectEvent = null;
        this._messageEvent = null;

        // note COME BACK
        var noteLUT = {}; // lookup table

        var input = null;

        var i = 0;
        var key = null;
        var note = null;
        
        // sliders
        if (typeof midiMap.sliders !== 'undefined' && midiMap.sliders instanceof Array) {
            for (i = 0; i < midiMap.sliders.length; i++) {
                input = new BB.MidiInputSlider(midiMap.sliders[i]);
                note = (typeof midiMap.sliders[i] === 'number') ? midiMap.sliders[i] : midiMap.sliders[i].note;
                key = 'key' + note;
                if (typeof noteLUT[key] === 'undefined') {
                    noteLUT[key] = [];
                }
                noteLUT[key].push([ input, i ]);
                self.inputs.sliders.push(input);
            }
        }

        // knobs
        if (typeof midiMap.knobs !== 'undefined' && midiMap.knobs instanceof Array) {
            for (i = 0; i < midiMap.knobs.length; i++) {
                input = new BB.MidiInputKnob(midiMap.knobs[i]);
                note = (typeof midiMap.knobs[i] === 'number') ? midiMap.knobs[i] : midiMap.knobs[i].note;
                key = 'key' + note;
                if (typeof noteLUT[key] === 'undefined') {
                    noteLUT[key] = [];
                }
                noteLUT[key].push([ input, i ]);
                self.inputs.knobs.push(input);
            }
        }

        // buttons
        if (typeof midiMap.buttons !== 'undefined' && midiMap.buttons instanceof Array) {
            for (i = 0; i < midiMap.buttons.length; i++) {
                input = new BB.MidiInputButton(midiMap.buttons[i]);
                note = (typeof midiMap.buttons[i] === 'number') ? midiMap.buttons[i] : midiMap.buttons[i].note;
                key = 'key' + note;
                if (typeof noteLUT[key] === 'undefined') {
                    noteLUT[key] = [];
                }
                noteLUT[key].push([ input, i ]);
                self.inputs.buttons.push(input);
            }
        }

        // pads
        if (typeof midiMap.pads !== 'undefined' && midiMap.pads instanceof Array) {
            for (i = 0; i < midiMap.pads.length; i++) {
                input = new BB.MidiInputPad(midiMap.pads[i]);
                note = (typeof midiMap.pads[i] === 'number') ? midiMap.pads[i] : midiMap.pads[i].note;
                key = 'key' + note;
                if (typeof noteLUT[key] === 'undefined') {
                    noteLUT[key] = [];
                }
                noteLUT[key].push([ input, i ]);
                self.inputs.pads.push(input);
            }
        }

        // keys
        if (typeof midiMap.keys !== 'undefined' && midiMap.keys instanceof Array) {
            for (i = 0; i < midiMap.keys.length; i++) {
                input = new BB.MidiInputKey(midiMap.keys[i]);
                note = (typeof midiMap.keys[i] === 'number') ? midiMap.keys[i] : midiMap.keys[i].note;
                key = 'key' + note;
                if (typeof noteLUT[key] === 'undefined') {
                    noteLUT[key] = [];
                }
                noteLUT[key].push([ input, i ]);
                self.inputs.keys.push(input);
            }
        }

        // request MIDI access
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess({
                sysex: false
            }).then(onMIDISuccess, failure);
        } else {
            failure();
        }

        // midi functions
        function onMIDISuccess(midiAccess) {

            self.midiAccess = midiAccess;
            var inputs = self.midiAccess.inputs.values();
            // loop through all inputs
            for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
                // listen for midi messages
                input.value.onmidimessage = onMIDIMessage;
                // this just lists our inputs in the console
            }
            // listen for connect/disconnect message
            self.midiAccess.onstatechange = onStateChange;
            success(midiAccess);
        }

        function onStateChange(event) {
            
            var port = event.port,
                state = port.state,
                name = port.name,
                type = port.type;

            if (state === 'connected' && self._connectEvent) {
                self._connectEvent(name, type, port);
            } else if (state === 'disconnected' && self._disconnectEvent) {
                self._disconnectEvent(name, type, port);
            }
        }

        function onMIDIMessage(event) {

            var data = event.data;
            var command = data[0] >> 4;
            var channel = data[0] & 0xf;
            var type = data[0] & 0xf0; // channel agnostic message type. Thanks, Phil Burk.
            var note = data[1];
            var velocity = data[2];
            // with pressure and tilt off
            // note off: 128, cmd: 8 
            // note on: 144, cmd: 9
            // pressure / tilt on
            // pressure: 176, cmd 11: 
            // bend: 224, cmd: 14

            if (self._messageEvent) {
                self._messageEvent({
                    command: command,
                    channel: channel,
                    type: type,
                    note: note,
                    velocity: velocity
                }, event);
            }

            var i = 0;
            var key = 'key' + note;

            // if note is in noteLUT
            if (key in noteLUT) {
                
                var input = null;
                var index = null;

                for (i = 0; i < noteLUT[key].length; i++) {
                    
                    if (noteLUT[key][i][0].command === command && 
                        noteLUT[key][i][0].channel === channel) {
                        input = noteLUT[key][i][0];
                        index = noteLUT[key][i][1];
                    } 
                }

                // if no command comparison match was found
                // use the first value in LUT
                if (input === null) {
                    input = noteLUT[key][0][0];
                    index = noteLUT[key][0][1];
                }

                // update input's values
                input.command      = command;
                input.channel      = channel;
                input.type         = type;
                input.velocity     = velocity;

                var changeEventArr = input.eventStack.change;

                var midiData = {}; // reset data

                // all
                for (i = 0; i < changeEventArr.length; i++) {
                    
                    midiData = {
                        velocity: velocity,
                        channel: channel,
                        command: command,
                        type: type,
                        note: note
                    };

                    changeEventArr[i](midiData, input.inputType, index); // fire change event
                }

                // slider and knob
                if (input.inputType == 'slider' || input.inputType == 'knob') {

                    // max
                    if (velocity == 127) {

                        var maxEventArr = input.eventStack.max;
                        for (i = 0; i < maxEventArr.length; i++) {

                            midiData = {
                                velocity: velocity,
                                channel: channel,
                                command: command,
                                type: type,
                                note: note
                            };

                            maxEventArr[i](midiData, input.inputType, index); // fire max event
                        }

                    // min
                    } else if (velocity === 0) { 

                        var minEventArr = input.eventStack.min;
                        for (i = 0; i < minEventArr.length; i++) {

                            midiData = {
                                velocity: velocity,
                                channel: channel,
                                command: command,
                                type: type,
                                note: note
                            };

                            minEventArr[i](midiData, input.inputType, index); // fire min event
                        }
                    }
                }

                // button
                if (input.inputType == 'button') {


                    // down
                    if (velocity == 127) {

                        var downEventArr = input.eventStack.down;
                        for (i = 0; i < downEventArr.length; i++) {

                            midiData = {
                                velocity: velocity,
                                channel: channel,
                                command: command,
                                type: type,
                                note: note
                            };

                            downEventArr[i](midiData, input.inputType, index); // fire down event
                        }

                    // up
                    } else if (velocity === 0) { 

                        var upEventArr = input.eventStack.up;
                        for (i = 0; i < upEventArr.length; i++) {

                            midiData = {
                                velocity: velocity,
                                channel: channel,
                                command: command,
                                type: type,
                                note: note
                            };

                            upEventArr[i](midiData, input.inputType, index); // fire up event
                        }
                    }
                }
            }
        } 
    };

    /**
     * Assigns event handler functions. Valid events include: connect, disconnect, message.
     * @method on
     * @param  {String}   name     Event name. Supports "connect", "disconnect", and "message".
     * @param  {Function} callback Function to run when event occurs.
     */
    BB.MidiDevice.prototype.on = function(name, callback) {
        
        if (typeof name !== 'string') {
            throw new Error("BB.MidiDevice.on: name parameter must be a string type");
        } else if (typeof callback !== 'function') {
            throw new Error("BB.MidiDevice.on: callback parameter must be a function type");
        }

        if (name === 'connect') {
            this._connectEvent = callback;
        } else if (name === 'disconnect') {
            this._disconnectEvent = callback;
        } else if (name === 'message') {
            this._messageEvent = callback;
        } else {
            throw new Error('BB.MidiDevice.on: ' + name + ' is not a valid event name');
        }
    };

    return BB.MidiDevice;
});

define('main',['require','BB','BB.MathUtils','BB.Color','BB.BaseBrush2D','BB.ImageBrush2D','BB.LineBrush2D','BB.BrushManager2D','BB.MouseInput','BB.Pointer','BB.LeapMotion','BB.Vector2','BB.Particle2D','BB.AudioBufferLoader','BB.AudioSampler','BB.AudioAnalyser','BB.AudioStream','BB.MidiDevice','BB.BaseMidiInput','BB.MidiInputKnob','BB.MidiInputSlider','BB.MidiInputButton','BB.MidiInputKey','BB.MidiInputPad'],function (require) {

  'use strict';

  var BB = require('BB');
  
  //utils
  BB.MathUtils      = require('BB.MathUtils');
  BB.Color          = require('BB.Color');

  // brushes
  BB.BaseBrush2D    = require('BB.BaseBrush2D');
  BB.ImageBrush2D   = require('BB.ImageBrush2D');
  BB.LineBrush2D    = require('BB.LineBrush2D');
  BB.BrushManager2D = require('BB.BrushManager2D');
  
  // inputs, etc...
  BB.MouseInput     = require('BB.MouseInput');
  BB.Pointer        = require('BB.Pointer');
  BB.LeapMotion     = require('BB.LeapMotion');
  


  // physics
  BB.Vector2        = require('BB.Vector2');
  BB.Particle2D     = require('BB.Particle2D');

  // audio
  BB.AudioBufferLoader = require('BB.AudioBufferLoader');
  BB.AudioSampler      = require('BB.AudioSampler');
  BB.AudioAnalyser     = require('BB.AudioAnalyser');
  BB.AudioStream       = require('BB.AudioStream');

  // midi
  BB.MidiDevice      = require('BB.MidiDevice');
  BB.BaseMidiInput   = require('BB.BaseMidiInput');
  BB.MidiInputKnob   = require('BB.MidiInputKnob');
  BB.MidiInputSlider = require('BB.MidiInputSlider');
  BB.MidiInputButton = require('BB.MidiInputButton');
  BB.MidiInputKey    = require('BB.MidiInputKey');
  BB.MidiInputPad    = require('BB.MidiInputPad');

  return BB;

});
    //The modules for your project will be inlined above
    //this snippet. Ask almond to synchronously require the
    //module value for 'main' here and return it as the
    //value to use for the public API for the built file.
    return require('main');
}));