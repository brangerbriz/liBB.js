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
        root.BBMod = factory();
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

define('BBModCore',[],function(){

    function BBMod() {
        
    }

    return BBMod;
});
/**
 * A static utilitites class for all things math.
 * @module BBModMathUtils
 * @static
 */
define('BBModMathUtils',{
    /**
     * Scales value using min and max. This is the inverse of BBModMathUtils.lerp(...).
     * @method norm
     * @static
     * @param  {Number} value The value to be scaled.
     * @param  {Number} min
     * @param  {Number} max
     * @return {Number}       Returns the scaled value.
     */
    norm: function(value, min, max) {

        if (typeof value !== "number") {
            throw new Error("BBModMathUtils.norm: value is not a number type");
        } else if (typeof min !== "number") {
            throw new Error("BBModMathUtils.norm: min is not a number type");
        } else if (typeof max !== "number") {
            throw new Error("BBModMathUtils.norm: max is not a number type");
        }

        return (value - min) / (max - min);
    },
     /**
     * Linear interpolate norm from min and max. This is the inverse of BBModMathUtils.norm(...).
     * @method lerp
     * @static
     * @param  {Number} value
     * @param  {Number} min
     * @param  {Number} max
     * @return {Number}       Returns the lerped norm.
     */
    lerp: function(norm, min, max) {

        if (typeof norm !== "number") {
            throw new Error("BBModMathUtils.lerp: norm is not a number type");
        } else if (typeof min !== "number") {
            throw new Error("BBModMathUtils.lerp: min is not a number type");
        } else if (typeof max !== "number") {
            throw new Error("BBModMathUtils.lerp: max is not a number type");
        }

        return (max - min) * norm + min;
    },
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
    map: function(value, sourceMin, sourceMax, destMin, destMax) {

        if (typeof value !== "number") {
            throw new Error("BBModMathUtils.map: value is not a number type");
        } else if (typeof sourceMin !== "number") {
            throw new Error("BBModMathUtils.map: sourceMin is not a number type");
        } else if (typeof sourceMax !== "number") {
            throw new Error("BBModMathUtils.map: sourceMax is not a number type");
        } else if (typeof destMin !== "number") {
            throw new Error("BBModMathUtils.map: destMin is not a number type");
        } else if (typeof destMax !== "number") {
            throw new Error("BBModMathUtils.map: destMax is not a number type");
        }

        return this.lerp(this.norm(value, sourceMin, sourceMax), destMin, destMax);
    },
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
    dist: function(p1x, p1y, p2x, p2y){
        
        if (typeof p1x !== "number") {
            throw new Error("BBModMathUtils.dist: p1x is not a number type");
        } else if (typeof p1y !== "number") {
            throw new Error("BBModMathUtils.dist: p1y is not a number type");
        } else if (typeof p2x !== "number") {
            throw new Error("BBModMathUtils.dist: p2x is not a number type");
        } else if (typeof p2y !== "number") {
            throw new Error("BBModMathUtils.dist: p2y is not a number type");
        }

        return Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2));
    },
    /**
     * Get the angle between two points in radians. For degrees process this
     * return value through BBModMathUtils.radToDegree(...).
     * @method angleBtwn
     * @static
     * @param  {Number} p1x The x value of the first point.
     * @param  {Number} p1y The y value of the first point.
     * @param  {Number} p2x The x value of the second point.
     * @param  {Number} p2y The y value of the second point.
     * @return {Number} Returns the angle between (p1x, p1y) and (p2x, p2y) in
     * radians.
     */
    angleBtw: function(p1x, p1y, p2x, p2y){

        if (typeof p1x !== "number") {
            throw new Error("BBModMathUtils.angleBtwn: p1x is not a number type");
        } else if (typeof p1y !== "number") {
            throw new Error("BBModMathUtils.angleBtwn: p1y is not a number type");
        } else if (typeof p2x !== "number") {
            throw new Error("BBModMathUtils.angleBtwn: p2x is not a number type");
        } else if (typeof p2y !== "number") {
            throw new Error("BBModMathUtils.angleBtwn: p2y is not a number type");
        }

        return Math.atan2( p2x - p1x, p2y - p1y );
    },
    /**
     * Translate radians into degrees.
     * @method  radToDeg
     * @static
     * @param  {[type]} radians
     * @return {[type]}         Returns radians in degrees.
     */
    radToDeg: function(radians) {

        if (typeof radians !== "number") {
            throw new Error("BBModMathUtils.radToDegree: radians is not a number type");
        }

        return radians * (180.0 / Math.PI);
    },
    /**
     * Translate degrees into radians.
     * @method  degToRad
     * @static
     * @param  {[type]} degrees
     * @return {[type]}         Returns degrees in radians.
     */
    degToRad: function(degrees) {

        if (typeof degrees !== "number") {
            throw new Error("BBModMathUtils.degToRad: degrees is not a number type");
        }

        return degrees * (Math.PI / 180.0);
    }  
});
define('BBModColor',[],function(){

    function BBModColor(r, g, b, a) {
        
        this.r = r || 0;
        this.g = g || 0;
        this.b = b || 0;
        this.a = a || 255;
    }

    BBModColor.prototype.set = function(r, g, b, a) {

        if (r !== undefined) this.r = r;
        if (g !== undefined) this.g = g;
        if (b !== undefined) this.b = b;
        if (a !== undefined) this.a = a;
    };

    BBModColor.prototype.isEqual = function(color, excludeAlpha) {

        if (! color || ! (color instanceof BBModColor)) {
            throw new Error("BBModColor.isEqual: color parameter is not an instance of BBModColor");
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

    return BBModColor;
});
/**
 * A module for standardizing mouse events so that they may be used with
 * the event funnel suite of modules. For use with HTML5 canvas only.
 * @module BBModMouseInput
 */
define('BBModMouseInput',[],function(){
    
    /**
     * A module for standardizing mouse events so that they may be used with
     * the event funnel suite of modules.
     * @class  BBModMouseInput
     * @constructor
     * @param {Object} canvasElement The HTML5 canvas object listening for mouse input.
     */
    function BBModMouseInput(canvasElement) {

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
         * Time in milliseconds that the mouse has been still before considering it's movement to be finished.
         * @property moveDebounce
         * @type {Number}
         */
        this.moveDebounce = 150;

        this._isMoving = false;
        this._isDown = false;

        /**
         * The HTML5 canvas element passed into BBModMouseInput during
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
            
            if (e.button === BBModMouseInput.LEFT_BUTTON) {

                self._isDown = true;

                if (self.hasOwnProperty('_activeStartCallback') && 
                    typeof self._activeStartCallback === 'function') {

                    self._activeStartCallback(self.x, self.y);
                }
            }
        });

        this.canvasElem.addEventListener('mouseup', function(e){

            if (e.button === BBModMouseInput.LEFT_BUTTON) {
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
    }

    /**
     * Utility property that hold's the value of a JavaScript MouseEvent's left mouse button.
     * @property
     * @static
     * @type {Number}
     * @default 0
     * @readOnly
     */
    BBModMouseInput.LEFT_BUTTON   = 0;

    /**
     * Utility property that hold's the value of a JavaScript MouseEvent's scroll wheel button.
     * @property
     * @static
     * @type {Number}
     * @default 1
     * @readOnly
     */
    BBModMouseInput.SCROLL_BUTTON = 1;

    /**
     * Utility property that hold's the value of a JavaScript MouseEvent's right mouse button.
     * @property
     * @static
     * @type {Number}
     * @default 2
     * @readOnly
     */
    BBModMouseInput.RIGHT_BUTTON  = 2;

    /**
     * Holds wether or not the mouse is currently moving. This property is read-only.
     * @property isMoving
     * @type {Boolean}
     * @default false
     * @readOnly
     */
    Object.defineProperty(BBModMouseInput.prototype, 'isMoving', {
        get: function(){
            return this._isMoving;
        },
        set: function(val){
            throw new Error('BBModMouseInput.isMoving (setter): BBModMouseInput.isMoving is a read-only property.');
        }
    });

     /**
     * Holds wether or not the left mouse button is currently depressed. This property is read-only.
     * @property isDown
     * @type {Boolean}
     * @default false
     * @readOnly
     */
    Object.defineProperty(BBModMouseInput.prototype, 'isDown', {
        get: function(){
            return this._isDown;
        },
        set: function(val){
            throw new Error('BBModMouseInput.isDown (setter): BBModMouseInput.isDown is a read-only property.');
        }
    });

    BBModMouseInput.prototype.update = function() {

        if (this.isMoving &&
            this.hasOwnProperty('_moveCallback') &&
            typeof this._moveCallback === 'function') {
            
            this._moveCallback(this.x, this.y);
        }
    };

    return BBModMouseInput;
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
 * @module BBModPointer
 */
define('BBModPointer',['./BBModMouseInput'], function(BBModMouseInput){


    //NOTE: called inside BBModPointer using .call()
    //to bind this to BBModPointer instance
    function bindEventsToControllerModule() {

        // the BBMouseInput module uses event listeners attatched to it's
        // HTML5 canvas to fire these callbacks directly, so pass them along.
        if (this.controllerModule instanceof BBModMouseInput) {

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
     * @class BBModPointer
     * @param {Object} controllerModule The input module you would like to control
     * this pointer with.
     * @constructor
     */
    function BBModPointer(controllerModule) {

        if (typeof controllerModule === "undefined") {
            throw new Error('BBModPointer: controllerModule parameter is missing from the BBModPointer constructor.');
        } else if (! (controllerModule instanceof BBModMouseInput)) {
            this.controllerModule = null;
            throw new Error("BBModPointer.update: controllerModule is not a supported object type.");
        }

        this.controllerModule = controllerModule;


        /**
         * The pointer's current x position as supplied by the eventModule in BBModPointer.update(...).
         * @property x
         * @type {Number}
         * @default undefined
         */
        this.x = null;

        /**
         * The pointer's current y position as supplied by the eventModule in BBModPointer.update(...).
         * @property y
         * @type {Number}
         * @default undefined
         */
        this.y = null;

        /**
         * A variable holding wether or not the event module controlling this
         * pointer object (via BBModPointer.update(...)) is moving
         * @property isMoving
         * @type {Boolean}
         * @default false
         */
        this.isMoving = false;

        /**
         * A variable holding wether or not the selection interface (i.e. mouse
         * button, etc...) controlling this pointer object (via
         * BBModPointer.update(...)) is active.
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
    }

    Object.defineProperty(BBModPointer.prototype, "controllerModule", {
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
     * Update the pointer using the controllerModule.
     * @method update
     * @param  {Object} controllerModule 
     */
    BBModPointer.prototype.update = function() {

        // add a new conditional for each module that pointer supports and then
        // update BBModPointer's internals (x, y, isMoving) in a custom way for
        // each type of input (kinect, etc...)
        if (this.controllerModule instanceof BBModMouseInput) {

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
     * A method used to register "activestart", "activestop", "movestart", and
     * "movestop" events.
     * @method on
     * @param  {String}   eventName   The event to register callback to.
     * "activestart", "activestop", "movestart", and "movestop" are all valid
     * events.
     * @param  {Function} callback    The callback to execute once the
     * registered event has fired.
     */
    BBModPointer.prototype.on = function(eventName, callback){
        
        // save the callback so that it can be used later in update() if it needs to be    
        if (eventName == "activestart")      this._activeStartCallback       = callback;
        else if (eventName == "activestop")  this._activeStopCallback        = callback;
        else if (eventName == "movestart")   this._moveStartCallback         = callback;
        else if (eventName == "movestop")    this._moveStopCallback          = callback;
        else if (eventName == "move")        this._moveCallback              = callback;
        else {
            throw new Error('BBModPointer.on: eventName is not a supported event.');
        }

        if (this._controllerModule === null) {
            throw new Error('BBModPointer.on: pointer has no controller module.' +
                            ' You must first call BBModPointer.update() to assign this pointer a controller module.');
        }

        bindEventsToControllerModule.call(this);
    };

    return BBModPointer;
});

/**
 * Basic scene manager for brushes and pointers. BBModBrushManager2D allows a
 * drawing scene (that uses brushes) to persist while the rest of the canvas is
 * cleared each frame. It also provides functionality to undo/redo manager to
 * your drawing actions.
 * @module BBModBrushManager2D
 */
define('BBModBrushManager2D',['BBModPointer'],
function(BBModPointer ){

    /**
     * Basic scene manager for brushes and pointers. BBModBrushManager2D allows a
     * drawing scene (that uses brushes) to persist while the rest of the canvas is
     * cleared each frame. It also provides functionality to undo/redo manager to
     * your drawing actions.
     * @class BBModBrushManager2D
     * @constructor
     * @param {[HTMLCanvasElement]} canvas The HTML5 canvas element for the
     * brush manager to use.
     */
    
    function BBModBrushManager2D(canvas) {

        var self = this;

        if (typeof canvas === 'undefined' || 
            !(canvas instanceof HTMLCanvasElement)) {
            throw new Error('BBModBrushManager2D: An HTML5 canvas object must be supplied as a first parameter.');
        }

        if (window.getComputedStyle(canvas).getPropertyValue('position') !== 'absolute') {
            throw new Error('BBModBrushManager2D: the HTML5 canvas passed into the BBModBrushManager2D' + 
                ' constructor must be absolutely positioned. Sorry ;).');
        }

        /**
         * The canvas element passed into the BBModBrushManager2D constructor
         * @property _parentCanvas
         * @type {HTMLCanvasElement}
         * @protected
         */
        this._parentCanvas    = canvas;

        /**
         * The 2D drawing context of the canvas element passed into the
         * BBModBrushManager2D constructor
         * @property _parentContext
         * @type {CanvasRenderingContext2D}
         * @protected
         */
        this._parentContext   = canvas.getContext('2d');

         /**
          * An in-memory canvas object used internally by BBModBrushManager to
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
         * A secondary canvas that is used internally by BBModBrushManager. This
         * canvas is written to the DOM on top of _parentCanvas (the canvas
         * passed into the BBModBaseBrush2D constructor). It is absolutely
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
         * from canvas and is drawn during BBModBrushManager2D.draw()
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
         * A deep copy of _fboImage that is drawn in BBModBrushManager2D.draw()
         * when _fboImage is reloading
         * @property _fboImageTemp
         * @type {Image}
         * @default null
         */
        this._fboImageTemp = null;

        this._fboImage.onerror = function(err) {
           console.log('BBModBrushManager2D: src failed to load: ' + err.target.src);
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
        //// https://github.com/brangerbriz/bbmod/issues/1
        // this._fboImage.crossOrigin = "anonymous";

        /**
         * An array of BBModPointer object used to control the brushes drawn to
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
         * Internal flag to determin if BBModBrushManager2D.undo() was called
         * since the BBModBrushManager2D.update()
         * @property _needsUndo
         * @type {Boolean}
         * @protected
         */
        this._needsUndo = false;

        /**
         * Internal flag to determin if BBModBrushManager2D.redo() was called
         * since the BBModBrushManager2D.update()
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
         * Internal flag checked against in BBModBrushManager2D.draw() that
         * holds wether or not _fboImage is finished loaded. Note: this flag is
         * purposefully not set when _fboImage.src is set from undo() or redo().
         * @property _fboImageLoadWaiting
         * @type {Boolean}
         * @protected
         */
        this._fboImageLoadWaiting = false;

        // add empty canvas to the history
        this._history.push(this.canvas.toDataURL());
    }

    /**
     * The number of undo/redo states to save
     * @property numUndos
     * @type {Number}
     * @default 5
     */
    Object.defineProperty(BBModBrushManager2D.prototype, "numUndos", {
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
     * BBModBrushManager2D must be tracking at least one pointer in order to
     * update().
     * @method trackPointers
     * @param  {Array} pointers An array of BBModPointer objects for
     * BBModBrushManager2D to track.
     */
    BBModBrushManager2D.prototype.trackPointers = function(pointers) {
        
        if (pointers instanceof Array) {

            for (var i = 0; i < pointers.length; i++) {
             
                var pointer = pointers[i];
                if (! (pointer instanceof BBModPointer)) {
                    throw new Error('BBModBrushManager2D.trackPointers: pointers[' +
                        i + '] is not an instance of BBModPointer.');
                } else {
                    this._pointers.push(pointer);
                    this._pointerStates.push(pointer.isDown);
                }
            }

        } else {
            throw new Error('BBModBrushManager2D.trackPointers: pointers parameter must be an array of pointers.');
        }
    };

    /**
     * Untrack all pointers.
     * @method untrackPointers
     */
    BBModBrushManager2D.prototype.untrackPointers = function() {
        this._pointers = [];
        this._pointerStates = [];
    };

    /**
     * Untrack one pointer at index. Pointers tracked by BBModBrushManager2D
     * have indexes based on the order they were added by calls to
     * BBModBrushManager2D.trackPointers(...). Untracking a pointer removes it
     * from the internal _pointers array which changes the index of all pointers
     * after it. Keep this in mind when using this method.
     * @method untrackPointers
     * @param {Number} index The index of the pointer to untrack.
     */
    BBModBrushManager2D.prototype.untrackPointerAtIndex = function(index) {
        
        if (typeof this._pointers[index] !== 'undefined') {
            this._pointers.splice(index, 1);
            this._pointerStates.splice(index, 1);
        } else {
            throw new Error('BBModBrushManager2D.untrackPointerAtIndex: Invalid pointer index ' +
                index + '. there is no pointer at that index.');
        }
    };

    /**
     * A method to determin if the brush manager is currently tracking pointers
     * @method hasPointers
     * @return {Boolean}
     */
    BBModBrushManager2D.prototype.hasPointers = function() {
        return this._pointers.length > 0;
    };

    /**
     * A method to determin if the brush manager currently has an undo state.
     * @method hasUndo
     * @return {Boolean}
     */
    BBModBrushManager2D.prototype.hasUndo = function() {
        return this._history.length > 1;
    };

    /**
     * A method to determin if the brush manager currently has an redo state.
     * @method hasRedo
     * @return {Boolean}
     */
    BBModBrushManager2D.prototype.hasRedo = function() {
        return this._purgatory.length > 0;
    };

    /**
     * BBModBrushManager2D's update method. Should be called once per animation frame.
     * @method update
     */
    BBModBrushManager2D.prototype.update = function() {

        if (! this.hasPointers()) {
            throw new Error('BBModBrushManager2D.update: You must add at least one pointer to ' +
                            'the brush manager with BBModBrushManager2D.addPointers(...)');
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
     * BBModBrushManager2D constructor or the optionally, "context" if it was
     * provided as a parameter. Should be called once per animation frame.
     * @method update
     * @param {[CanvasRenderingContext2D]} context An optional drawing context
     * that will be drawn to if it is supplied.
     */
    BBModBrushManager2D.prototype.draw = function(context) {

        if (typeof context === "undefined" ) {
            context = this._parentContext;
        } else if(! (context instanceof CanvasRenderingContext2D)) {
            throw new Error('BBModBrushManager2D.draw: context is not an instance of CanvasRenderingContext2D');
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
    BBModBrushManager2D.prototype.undo = function() {

        if (this._history.length > 1) {
            this._needsUndo = true; 
        }
    };

    /**
     * Undo redo one drawing action if available
     * @method undo
     */
    BBModBrushManager2D.prototype.redo = function() {

        if (this._history.length > 0) {
            this._needsRedo = true;
        }
    };

    /**
     * Notifies brush manager that the canvas passed into the
     * BBModBrushManager2D constructor has been moved or resized. It is
     * important to call this method whenever the positional CSS from the parent
     * canvas is changed so that BBModBrushManager2D's internal canvases may be
     * updated upropriately.
     * @method updateCanvasPosition
     */
    BBModBrushManager2D.prototype.updateCanvasPosition = function() {

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

            throw new Error('BBModBrushManager2D: the HTML5 canvas passed into the BBModBrushManager2D' +
                ' constructor should have a z-index property value that is numeric. Currently the value is "' +
                parentZIndex + '".');

        } else {
            parentZIndex = parseInt(parentZIndex);
            this.secondaryCanvas.style.zIndex = parentZIndex + 1;
        } 
    };

    return BBModBrushManager2D;
});

/**
 * Base 2D brush class extended by BBModImageBrush2D, BBModLineBrush2D, etc...
 * @module BBModBaseBrush2D
 */
define('BBModBaseBrush2D',['BBModBrushManager2D', './BBModColor'],
function(BBModBrushManager2D,     BBModColor){

    /**
     * Base 2D brush class extended by BBModImageBrush2D, BBModLineBrush2D,
     * etc...
     * @class BBModBaseBrush2D
     * @constructor
     * @param {Object} [config] An optional config hash to initialize any of
     * BBModBaseBrush2D's public properties
     * @example <div><code> var baseBrush = new BBModBaseBrush2D({ width: 100,
     * height: 100, color: new BBModColor(255, 0, 0) }); </code></div>
     */
    function BBModBaseBrush2D(config) {

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
         * @property w
         * @type Number
         * @default 50
         */
        this.width    = (config && config.width && typeof config.width === 'number') ? config.width : 50;

        /**
         * The brush's height.
         * @property height
         * @type Number
         * @default 50
         */
        this.height   = (config && config.height && typeof config.height === 'number') ? config.height : 50;

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
         * @type BBModColor
         * @default null
         */
        this.color    = (config && config.color && config.color instanceof BBModColor) ? config.color : null;
        
        /**
         * Wether or not to draw the brush to the screen. Toggle this variable
         * to hide and show the brush.
         * @property hidden
         * @type Boolean
         * @default false
         */
        this.hidden   = (config && config.hidden && typeof hidden === 'boolean') ? config.hidden : false;
        
        /**
         * The type of brush. Defaults to "base" for BBModBaseBrush, "image" for
         * BBModImageBrush, etc... and should be treated as read-only.
         * @property type
         * @type String
         * @default "base"
         */
        this.type    = "base";

        this.manager = (config && config.manager && config.manager instanceof BBModBrushManager2D) ? config.manager : null;
    }

    /**
     * Base update method. Usually called once per animation frame.
     * @method update
     * @param {Object} controllerModule An object with x and y properties and
     * optionally an isDown boolean (used for beginning and ending
     * strokeds/marks).
     */
    BBModBaseBrush2D.prototype.update = function(controllerModule) {

        if (controllerModule !== undefined) {
            
            if (controllerModule.x !== undefined && typeof controllerModule.x === 'number') {
                this.x = controllerModule.x;
            } else {
                throw new Error('BBModBaseBrush.update: controllerModule parameter does not have a valid x parameter');
            }

            if (controllerModule.y !== undefined && typeof controllerModule.y === 'number') {
                this.y = controllerModule.y;
            } else {
                throw new Error('BBModBaseBrush.update: controllerModule parameter does not have a valid y parameter');
            }

        } else {
            throw new Error('BBModBaseBrush.update: missing controllerModule parameter');
        }
    };

    /**
     * Base draw method. Usually called once per animation frame.
     * @method draw 
     */
    BBModBaseBrush2D.prototype.draw = function(context) {

        if (!context) {
            throw new Error('BBModBaseBrush.draw: Invalid context parameter');
        }

        var returnContext = context;

        if(this.manager instanceof BBModBrushManager2D) {
            returnContext = this.manager.secondaryContext;   
        }

        return returnContext;
    };

    /**
     * Multiplies width and height properties by amount.
     * @method scale
     * @param {Number} amount Amount to scale width and height by
     */
    BBModBaseBrush2D.prototype.scale = function(amount) {
        
        if (typeof amount === 'number') {
            
            this.width *= amount;
            this.height *= amount;

        } else {
            throw new Error("BBModBaseBrush2D.scale: scale is not a number type");
        }
    };

    return BBModBaseBrush2D;
});

/**
 * A 2D brush module for drawing images in a stamp-like style.
 * @module BBModImageBrush2D
 * @extends BBModBaseBrush2D
 */
define('BBModImageBrush2D',['./BBModBaseBrush2D', './BBModColor', './BBModMathUtils'], 
function(  BBModBaseBrush2D,     BBModColor,     BBModMathUtils){

    var drawReady = false;
    var initSrcSet = false;

    /**
     * A brush module for drawing images in a stamp-like style.
     * @class BBModImageBrush2D
     * @constructor
     * @extends BBModBaseBrush2D
     * @param {Object} [config] A optional config hash to initialize any of
     * BBModImageBrush2D's public properties.
     * @example <div><code> var imageBrush = new BBModImageBrush2D({ width: 100,
     * height: 100, src: "http://some/image.png" }); </code></div>
     */
    function BBModImageBrush2D(config) {

        BBModBaseBrush2D.call(this, config);

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
         * A private method used by src's getters and setters.
         * @private
         * @property _src
         * @type String
         * @default null
         */
        this._src = null;

         /**
          * An array of all supported variants. For the BBModImageBrush2D class
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
            'circleslas'
        ];

        if (config) {

            if (config.src && config.variant) {
                throw new Error('BBModImageBrush2D: The config.src and config.variant properties are mutually exlusive'+
                                'and cannot both be included in the same config object.');
            }

            if (config.src && typeof config.src === 'string') this.src = config.src;
            if (config.variant && 
                typeof config.variant === 'string' && 
                this.variants.indexOf(config.variant) !== -1) {
                this.variant = config.variant;
            }  
        }   
    }

    BBModImageBrush2D.prototype = Object.create(BBModBaseBrush2D.prototype);
    BBModImageBrush2D.prototype.constructor = BBModImageBrush2D;

    /**
     * The brush's image src. Functionally equivalent to the src property of an
     * Image element. When src is not null no variants are used (i.e. the
     * variant property is set to null).
     * @property src
     * @type String
     * @default null
     */   
    Object.defineProperty(BBModBaseBrush2D.prototype, 'src', {
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
     */
    BBModImageBrush2D.prototype.update = function(controllerModule) {
        
        BBModBaseBrush2D.prototype.update.call(this, controllerModule);

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
    BBModImageBrush2D.prototype.draw = function(context) {
        
        function getColoredSVGVariant() {
        
            var r, g, b, a;
            if (self.color && self.color instanceof BBModColor) {
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
                    case 'star' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M143.169,166.502L100,135.139l-43.169,31.363l16.489-50.746L30.152,84.391h53.359L100,33.644l16.489,50.748h53.358 l-43.168,31.365L143.169,166.502z M100,127.723l31.756,23.072l-12.13-37.332l31.757-23.072H112.13L100,53.06L87.87,90.391H48.618 l31.756,23.072l-12.13,37.332L100,127.723z"/></svg>';
                    case 'wave' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><g><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M163.888,97.971c-5.43-5.354-11.042-10.887-22.235-10.887c-11.195,0-16.806,5.533-22.234,10.887 c-5.101,5.027-9.918,9.777-19.685,9.777c-9.766,0-14.581-4.75-19.684-9.777c-5.427-5.354-11.039-10.887-22.233-10.887 c-11.193,0-16.806,5.533-22.233,10.887c-5.1,5.027-9.919,9.777-19.684,9.777c-0.13,0-0.25-0.01-0.379-0.012v5.169 c0.129,0.002,0.249,0.012,0.379,0.012c11.192,0,16.806-5.536,22.233-10.887c5.101-5.028,9.917-9.781,19.684-9.781 c9.766,0,14.584,4.753,19.685,9.781c5.427,5.351,11.04,10.887,22.232,10.887c11.194,0,16.807-5.536,22.233-10.887 c5.102-5.028,9.919-9.781,19.686-9.781c9.766,0,14.584,4.753,19.688,9.781c5.428,5.351,11.04,10.887,22.234,10.887 c0.312,0,0.602-0.02,0.905-0.028v-5.169c-0.302,0.011-0.594,0.028-0.905,0.028C173.808,107.748,168.987,102.998,163.888,97.971z"/><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M183.574,113.917c-11.601,0-17.361-5.679-22.932-11.169c-4.964-4.892-9.641-9.499-18.99-9.499 c-9.352,0-14.027,4.608-18.977,9.486c-5.581,5.503-11.341,11.182-22.942,11.182c-11.601,0-17.361-5.68-22.932-11.173 c-4.957-4.886-9.632-9.495-18.985-9.495c-9.352,0-14.026,4.608-18.974,9.485c-5.583,5.504-11.343,11.183-22.943,11.183 c-0.087,0-0.17-0.003-0.253-0.007l-1.125-0.02v-7.17l1.379,0.027c9.355,0,14.031-4.609,18.981-9.489 c5.57-5.494,11.33-11.175,22.936-11.175c11.608,0,17.367,5.681,22.936,11.175c4.957,4.884,9.631,9.489,18.981,9.489 c9.354,0,14.03-4.607,18.979-9.487c5.574-5.497,11.334-11.177,22.939-11.177c11.604,0,17.365,5.681,22.938,11.175 c4.95,4.88,9.626,9.489,18.984,9.489c0.209,0,0.408-0.009,0.608-0.018l1.297-0.047v7.176l-1.278,0.041 C183.994,113.908,183.789,113.917,183.574,113.917z M57.816,91.249c10.173,0,15.132,4.889,20.382,10.065 c5.291,5.216,10.754,10.603,21.535,10.603c10.782,0,16.245-5.386,21.527-10.595c5.261-5.186,10.22-10.073,20.392-10.073 c10.17,0,15.129,4.887,20.381,10.06c5.281,5.207,10.729,10.576,21.446,10.608v-3.169c-10.114-0.03-15.06-4.905-20.294-10.065 c-5.285-5.21-10.75-10.599-21.533-10.599c-10.785,0-16.248,5.388-21.531,10.598c-5.254,5.178-10.213,10.066-20.388,10.066 c-10.17,0-15.128-4.885-20.376-10.056c-5.292-5.22-10.753-10.608-21.541-10.608c-10.786,0-16.249,5.388-21.531,10.599 c-5.143,5.069-10.006,9.864-19.765,10.06v3.169c10.37-0.203,15.725-5.481,20.906-10.589C42.687,96.136,47.645,91.249,57.816,91.249 z"/></g><g><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M163.888,76.934c-5.43-5.352-11.042-10.884-22.235-10.884c-11.195,0-16.806,5.532-22.234,10.884 c-5.101,5.031-9.918,9.781-19.685,9.781c-9.766,0-14.581-4.75-19.684-9.781C74.623,71.582,69.011,66.05,57.816,66.05 c-11.193,0-16.806,5.532-22.233,10.884c-5.1,5.031-9.919,9.781-19.684,9.781c-0.13,0-0.25-0.011-0.379-0.012v5.165 c0.129,0.002,0.249,0.012,0.379,0.012c11.192,0,16.806-5.532,22.233-10.883c5.101-5.031,9.917-9.782,19.684-9.782 c9.766,0,14.584,4.751,19.685,9.782c5.427,5.351,11.04,10.883,22.232,10.883c11.194,0,16.807-5.532,22.233-10.883 c5.102-5.031,9.919-9.782,19.686-9.782c9.766,0,14.584,4.751,19.688,9.782c5.428,5.351,11.04,10.883,22.234,10.883 c0.312,0,0.602-0.019,0.905-0.028v-5.165c-0.302,0.011-0.594,0.028-0.905,0.028C173.808,86.715,168.987,81.965,163.888,76.934z"/><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M183.574,92.88c-11.604,0-17.365-5.679-22.937-11.171c-4.953-4.883-9.631-9.494-18.985-9.494 c-9.356,0-14.033,4.612-18.983,9.494c-5.57,5.492-11.329,11.171-22.936,11.171c-11.605,0-17.364-5.679-22.935-11.171 c-4.95-4.882-9.625-9.494-18.982-9.494c-9.356,0-14.032,4.612-18.981,9.494C33.264,87.201,27.503,92.88,15.899,92.88 c-0.087,0-0.17-0.003-0.253-0.007l-1.125-0.02v-7.158l1.379,0.02c9.359,0,14.033-4.611,18.981-9.493 c5.571-5.493,11.331-11.172,22.936-11.172c11.607,0,17.366,5.679,22.936,11.172c4.953,4.883,9.628,9.493,18.981,9.493 c9.358,0,14.033-4.611,18.982-9.493c5.573-5.494,11.333-11.172,22.937-11.172c11.603,0,17.364,5.679,22.936,11.17 c4.95,4.883,9.624,9.495,18.986,9.495c0.209,0,0.408-0.009,0.608-0.017l1.297-0.047v7.169l-1.251,0.042 C184.014,92.871,183.799,92.88,183.574,92.88z M57.816,70.215c10.178,0,15.137,4.892,20.387,10.07 c5.283,5.208,10.746,10.595,21.53,10.595c10.786,0,16.249-5.386,21.531-10.595c5.251-5.179,10.211-10.07,20.388-10.07 c10.175,0,15.136,4.891,20.389,10.069c5.27,5.195,10.717,10.564,21.438,10.596v-3.165c-10.118-0.03-15.062-4.907-20.294-10.069 c-5.285-5.209-10.75-10.596-21.533-10.596s-16.246,5.385-21.529,10.594c-5.252,5.18-10.211,10.071-20.39,10.071 c-10.174,0-15.133-4.89-20.383-10.066C74.065,72.437,68.603,67.05,57.816,67.05c-10.785,0-16.248,5.387-21.531,10.596 c-5.141,5.072-10.002,9.868-19.765,10.063v3.166c10.374-0.203,15.729-5.481,20.91-10.589C42.681,75.106,47.64,70.215,57.816,70.215 z"/></g><g><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M163.888,119.004c-5.43-5.351-11.042-10.884-22.235-10.884c-11.195,0-16.806,5.533-22.234,10.884 c-5.101,5.031-9.918,9.781-19.685,9.781c-9.766,0-14.581-4.75-19.684-9.781c-5.427-5.351-11.039-10.884-22.233-10.884 c-11.193,0-16.806,5.533-22.233,10.884c-5.1,5.031-9.919,9.781-19.684,9.781c-0.13,0-0.25-0.01-0.379-0.012v5.165 c0.129,0.002,0.249,0.012,0.379,0.012c11.192,0,16.806-5.532,22.233-10.883c5.101-5.031,9.917-9.781,19.684-9.781 c9.766,0,14.584,4.75,19.685,9.781c5.427,5.351,11.04,10.883,22.232,10.883c11.194,0,16.807-5.532,22.233-10.883 c5.102-5.031,9.919-9.781,19.686-9.781c9.766,0,14.584,4.75,19.688,9.781c5.428,5.351,11.04,10.883,22.234,10.883 c0.312,0,0.602-0.019,0.905-0.028v-5.165c-0.302,0.011-0.594,0.028-0.905,0.028C173.808,128.785,168.987,124.035,163.888,119.004z" /><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M183.574,134.95c-11.604,0-17.365-5.679-22.937-11.171c-4.952-4.882-9.63-9.493-18.985-9.493 c-9.357,0-14.033,4.611-18.983,9.493c-5.57,5.492-11.329,11.171-22.936,11.171c-11.605,0-17.364-5.679-22.935-11.171 c-4.949-4.882-9.624-9.493-18.982-9.493c-9.357,0-14.032,4.611-18.981,9.493c-5.571,5.492-11.332,11.171-22.936,11.171 c-0.087,0-0.17-0.003-0.253-0.007l-1.125-0.02v-7.166l1.379,0.027c9.359,0,14.033-4.611,18.981-9.493 c5.572-5.493,11.333-11.172,22.936-11.172c11.604,0,17.365,5.679,22.936,11.172c4.953,4.884,9.628,9.493,18.981,9.493 c9.358,0,14.033-4.611,18.982-9.493c5.575-5.495,11.335-11.172,22.937-11.172c11.601,0,17.361,5.677,22.934,11.167 c4.952,4.887,9.626,9.498,18.988,9.498c0.209,0,0.408-0.009,0.608-0.018l1.297-0.047v7.17l-1.251,0.041 C184.014,134.941,183.799,134.95,183.574,134.95z M57.816,112.286c10.179,0,15.137,4.892,20.387,10.069 c5.283,5.209,10.746,10.595,21.53,10.595c10.786,0,16.249-5.386,21.531-10.595c5.251-5.178,10.21-10.069,20.388-10.069 c10.176,0,15.137,4.892,20.39,10.069c5.269,5.193,10.716,10.562,21.438,10.595v-3.165c-10.118-0.03-15.062-4.907-20.294-10.069 c-5.288-5.211-10.752-10.596-21.533-10.596s-16.244,5.384-21.527,10.591c-5.254,5.184-10.213,10.074-20.392,10.074 c-10.174,0-15.133-4.89-20.383-10.066c-5.286-5.212-10.75-10.599-21.534-10.599c-10.783,0-16.247,5.386-21.53,10.595 c-5.142,5.072-10.003,9.869-19.766,10.064v3.165c10.374-0.203,15.729-5.481,20.91-10.589 C42.68,117.178,47.639,112.286,57.816,112.286z"/></g></svg>';
                    case 'heart' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M100.857,149.971l-1.664-1.108c-0.396-0.265-9.854-6.593-21.034-16.174c-15.13-12.966-25.576-25.093-31.049-36.041 c-4.48-8.961-3.554-20.14,2.479-29.903c6.141-9.937,16.242-16.109,26.361-16.109c6.568,0,15.979,2.534,24.906,14.006 c8.923-11.473,18.333-14.006,24.901-14.006c10.118,0,20.219,6.173,26.361,16.111c6.033,9.763,6.961,20.941,2.48,29.902 c-5.474,10.948-15.92,23.075-31.048,36.041c-11.179,9.581-20.635,15.909-21.031,16.173L100.857,149.971z M75.951,56.635 c-8.056,0-16.201,5.083-21.258,13.264c-4.932,7.981-5.761,16.978-2.216,24.066c10.766,21.538,40.951,43.557,48.38,48.758 c7.428-5.201,37.608-27.221,48.376-48.758c3.544-7.087,2.715-16.083-2.218-24.064c-5.057-8.183-13.202-13.266-21.257-13.266 c-8.201,0-15.949,5.119-22.405,14.804l-2.496,3.744l-2.496-3.744C91.903,61.754,84.153,56.635,75.951,56.635z"/></svg>';
                    case 'bolt' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M76.247,183.564l19.897-73.016l-30.646,8.619L124.41,16.836l-18.489,70.369l30.463-7.496L76.247,183.564z M103.289,103.345 l-12.116,44.466l34.996-60.438L98.948,94.07l11.108-42.281l-34.107,59.244L103.289,103.345z"/></svg>';
                    case 'balls' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><g> <g> <circle fill="#FFFFFF" cx="29.57" cy="100" r="6.961"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M29.569,109.461c-5.217,0-9.461-4.244-9.461-9.461c0-5.217,4.244-9.461,9.461-9.461c5.217,0,9.462,4.244,9.462,9.461 C39.031,105.217,34.787,109.461,29.569,109.461z M29.569,95.539c-2.46,0-4.461,2.001-4.461,4.461s2.001,4.461,4.461,4.461 c2.46,0,4.462-2.001,4.462-4.461S32.03,95.539,29.569,95.539z"/> </g> <g> <circle fill="#FFFFFF" cx="40.77" cy="100" r="11.2"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M40.77,113.699c-7.554,0-13.7-6.145-13.7-13.699s6.146-13.7,13.7-13.7s13.7,6.146,13.7,13.7S48.324,113.699,40.77,113.699 z M40.77,91.3c-4.797,0-8.7,3.903-8.7,8.7c0,4.796,3.903,8.699,8.7,8.699s8.7-3.902,8.7-8.699 C49.47,95.203,45.567,91.3,40.77,91.3z"/> </g> <g> <circle fill="#FFFFFF" cx="56.45" cy="100.001" r="15.68"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M56.45,118.18c-10.025,0-18.181-8.154-18.181-18.179c0-10.025,8.156-18.181,18.181-18.181 c10.024,0,18.18,8.156,18.18,18.181C74.63,110.025,66.475,118.18,56.45,118.18z M56.45,86.82c-7.268,0-13.181,5.913-13.181,13.181 c0,7.267,5.913,13.179,13.181,13.179c7.267,0,13.18-5.912,13.18-13.179C69.63,92.733,63.717,86.82,56.45,86.82z"/> </g> <g> <path fill="#FFFFFF" d="M97.411,100.001c0,12.124-9.826,21.95-21.951,21.95s-21.953-9.826-21.953-21.95 c0-12.126,9.828-21.953,21.953-21.953S97.411,87.875,97.411,100.001z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M75.46,124.451c-13.483,0-24.453-10.968-24.453-24.45c0-13.483,10.97-24.453,24.453-24.453 c13.482,0,24.451,10.97,24.451,24.453C99.911,113.483,88.942,124.451,75.46,124.451z M75.46,80.548 c-10.727,0-19.453,8.727-19.453,19.453c0,10.725,8.727,19.45,19.453,19.45c10.726,0,19.451-8.725,19.451-19.45 C94.911,89.275,86.186,80.548,75.46,80.548z"/> </g> <g> <path fill="#FFFFFF" d="M131.52,100.002c0,16.973-13.757,30.73-30.732,30.73c-16.975,0-30.734-13.758-30.734-30.73 c0-16.977,13.76-30.734,30.734-30.734C117.763,69.268,131.52,83.025,131.52,100.002z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M100.787,133.232c-18.326,0-33.234-14.907-33.234-33.23c0-18.326,14.909-33.234,33.234-33.234 c18.324,0,33.232,14.909,33.232,33.234C134.02,118.325,119.111,133.232,100.787,133.232z M100.787,71.768 c-15.568,0-28.234,12.666-28.234,28.234c0,15.566,12.666,28.23,28.234,28.23c15.567,0,28.232-12.664,28.232-28.23 C129.02,84.434,116.354,71.768,100.787,71.768z"/> </g> <g> <path fill="#FFFFFF" d="M177.392,100.002c0,23.762-19.26,43.023-43.025,43.023c-23.765,0-43.028-19.262-43.028-43.023 c0-23.767,19.264-43.027,43.028-43.027C158.132,56.975,177.392,76.235,177.392,100.002z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M134.366,145.525c-25.104,0-45.528-20.422-45.528-45.523c0-25.104,20.424-45.527,45.528-45.527 c25.103,0,45.525,20.423,45.525,45.527C179.892,125.104,159.469,145.525,134.366,145.525z M134.366,59.475 c-22.347,0-40.528,18.181-40.528,40.527c0,22.345,18.182,40.523,40.528,40.523c22.346,0,40.525-18.179,40.525-40.523 C174.892,77.655,156.712,59.475,134.366,59.475z"/> </g></g></svg>';
                    case 'drips' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><g> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" fill-rule="evenodd" clip-rule="evenodd" d="M101.807,72.491c2.018-6.874,5.617-16.757,1.506-23.193 c-3.905-6.113-11.555-2.917-9.19,2.807c0.845,2.044,2.733,4.043,4.164,5.59C102.023,61.739,102.396,67.181,101.807,72.491z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" fill-rule="evenodd" clip-rule="evenodd" d="M102.5,78.583c3.533-7.633,8.01-19.14,16.618-21.642 c8.178-2.376,12.458,6.369,5.941,9.589c-2.327,1.153-5.542,1.453-8.001,1.715C110.631,68.921,106.088,73.441,102.5,78.583z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" fill-rule="evenodd" clip-rule="evenodd" d="M91.772,109.562c-3.189,0-5.788-2.6-5.788-5.787c0-3.188,2.599-5.789,5.788-5.789 c3.187,0,5.787,2.6,5.787,5.789C97.559,106.963,94.959,109.562,91.772,109.562z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" fill-rule="evenodd" clip-rule="evenodd" d="M92.194,131.234c-6.503-19.299-14.249-48.189-34.315-56.477 c-19.065-7.87-31.666,12.05-16.825,21.523c5.301,3.386,12.955,4.963,18.809,6.231C75.167,105.832,84.912,117.914,92.194,131.234z" /> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" fill-rule="evenodd" clip-rule="evenodd" d="M76.101,133.059c-3.35,0-6.083-2.73-6.083-6.082c0-3.35,2.733-6.082,6.083-6.082 s6.083,2.732,6.083,6.082C82.184,130.328,79.451,133.059,76.101,133.059z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" fill-rule="evenodd" clip-rule="evenodd" d="M89.065,158.012c5.576-29.148,11.079-72.364,38.403-88.272 c25.97-15.111,48.07,11.163,28.528,27.756c-6.976,5.93-17.731,9.706-25.92,12.691C108.635,117.994,96.933,137.352,89.065,158.012z" /> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" fill-rule="evenodd" clip-rule="evenodd" d="M87.855,94.271c-7.565,0-13.765-6.177-13.765-13.762 c0-7.574,6.2-13.766,13.765-13.766c7.582,0,13.779,6.192,13.779,13.766C101.635,88.095,95.438,94.271,87.855,94.271z"/></g></svg>';
                    case 'flames' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><g> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M63.483,90.598c-3.254,1.794-8.575,0.489-11.714,3.509c-5.267,5.55-0.616,10.749,2.557,11.73 c1.243,0.247,15.215,4.718,19.764-14.904c3.639-20.603,16.573-21.23,18.261-21.391c9.035-0.595,18.811,12.88,30.622,1.43 c-9.957,14.972-25.383,1.251-32.25,5.278c-6.976,5.473,0.198,14.331,8.895,14.506c8.654-0.223,23.721-21.253,39.99-20.315 c14.516,0.197,26.641,9.619,38.249,3.321c-17.349,13.542-34.842-6.068-46.412,7.426c-7.613,10.392,1.68,16.533,5.605,12.43 c4.882-5.322,5.061-10.038,15.093-13.023c-1.984,0.992-6.08,1.887-8.061,7.266c-7.678,19.46-15.369,10.928-32.023,8.443 c-21.055-1.89-38.226,8.402-34.416,16.959c6.045,10.555,14.871-2.84,17.743-5.967c12.424-13.883,18.651-0.719,28.922-3.318 c-9.886,4.56-10.58-2.643-18.756,0.986c-9.647,4.283-6.109,17.09-24.423,20.043c-12.009,2.284-14.78-4.71-27.778-7.777 c-4.35-1.104-8.429,0.705-8.606,4.795c1.343,10.4,13.821-1.748,21.315,3.486c-9.809-1.088-9.978,6.889-18.995,6.968 c-10.778-0.355-19.255-8.405-22.362-21.401c-2.542-13.35,3.411-25.616,21.315-24.789c27.918,2.146,21.619-8.761,32.04-14.024 C70.507,78.472,74.096,85.54,63.483,90.598"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M47.063,132.568h-0.002c-5.319-0.176-10.201-2.246-14.117-5.986c-3.923-3.746-6.804-9.101-8.33-15.484 c-1.417-7.443-0.151-14.012,3.563-18.5c3.758-4.541,9.958-6.764,17.844-6.4c2.383,0.183,4.598,0.276,6.586,0.276 c13.106,0,15.871-3.9,18.799-8.03c1.586-2.238,3.227-4.552,6.61-6.261l0.099,0.15c-3.255,2.676-4.435,5.528-5.576,8.287 c-1.528,3.692-2.972,7.179-9.017,10.06c-1.384,0.763-3.106,0.966-4.931,1.181c-2.441,0.288-4.967,0.586-6.76,2.311 c-2.521,2.657-2.568,5.06-2.164,6.606c0.65,2.49,2.899,4.419,4.685,4.972c0.053,0.011,0.146,0.033,0.267,0.062 c0.666,0.162,2.224,0.541,4.195,0.541c5.295,0,12.229-2.679,15.188-15.441c1.499-8.489,4.732-14.617,9.61-18.208 c2.545-1.873,5.435-2.963,8.587-3.24l0.143-0.013c0.199-0.013,0.399-0.02,0.601-0.02c2.966,0,5.978,1.389,9.166,2.858 c3.434,1.583,6.983,3.219,10.743,3.219c3.573,0,6.863-1.505,10.059-4.603l0.138,0.115c-3.234,4.863-7.427,7.228-12.817,7.228 c-3.174,0-6.29-0.76-9.305-1.495c-2.51-0.612-4.882-1.19-6.893-1.19c-1.321,0-2.39,0.25-3.265,0.763 c-2.446,1.92-3.312,4.438-2.428,7.084c1.348,4.033,6.196,7.151,11.278,7.253c3.505-0.09,8.1-3.648,13.42-7.768 c7.237-5.604,16.244-12.579,25.506-12.579c0.356,0,0.715,0.011,1.067,0.031c5.645,0.077,10.889,1.535,15.959,2.946 c4.698,1.307,9.136,2.541,13.459,2.541c3.237,0,6.11-0.705,8.783-2.155l0.099,0.151c-4.416,3.447-9.129,5.052-14.832,5.053 c-0.001,0-0.002,0-0.003,0c-3.783,0-7.47-0.704-11.035-1.385c-3.304-0.631-6.424-1.227-9.392-1.227 c-4.689,0-8.229,1.581-11.138,4.974c-3.861,5.271-3.026,8.846-2.184,10.507c0.942,1.858,2.782,3.059,4.688,3.059 c1.154,0,2.181-0.435,2.968-1.258c1.358-1.48,2.345-2.905,3.298-4.282c2.454-3.544,4.574-6.605,11.835-8.765l0.065,0.167 c-0.311,0.155-0.678,0.311-1.067,0.475c-2.106,0.89-5.289,2.234-6.948,6.741c-4.338,10.995-8.667,12.51-12.7,12.51 c-2.685,0-5.699-0.803-9.191-1.734c-2.989-0.797-6.378-1.7-10.23-2.275c-1.669-0.149-3.366-0.226-5.039-0.226 c-6.442,0-12.655,1.104-17.965,3.192c-4.929,1.938-8.672,4.591-10.54,7.467c-1.406,2.167-1.675,4.38-0.775,6.399 c1.493,2.606,3.288,3.932,5.332,3.932c4.098,0,8.351-5.193,10.891-8.297c0.539-0.658,1.004-1.227,1.371-1.625 c3.971-4.438,7.626-6.505,11.502-6.505c2.54,0,4.935,0.884,7.25,1.738c2.355,0.87,4.791,1.769,7.421,1.769 c0.954,0,1.868-0.113,2.793-0.348l0.061,0.17c-2.301,1.061-4.306,1.576-6.132,1.576c-1.697,0-3.04-0.434-4.339-0.854 c-1.256-0.407-2.442-0.79-3.899-0.79c-1.352,0-2.787,0.345-4.387,1.055c-3.8,1.688-5.55,4.723-7.401,7.936 c-2.79,4.84-5.952,10.326-17.044,12.114c-1.597,0.304-3.056,0.452-4.461,0.452c-4.63,0-7.831-1.653-11.536-3.567 c-3.132-1.618-6.681-3.451-11.816-4.663c-0.826-0.209-1.649-0.315-2.448-0.315c-3.541,0-5.915,1.973-6.048,5.026 c0.383,2.949,1.664,4.271,4.153,4.271c1.541,0,3.396-0.494,5.359-1.018c2.28-0.608,4.639-1.236,6.916-1.236 c1.922,0,3.508,0.455,4.849,1.391L66.05,125.6c-0.607-0.066-1.197-0.102-1.756-0.102c-3.988,0-6.122,1.676-8.381,3.449 c-2.244,1.762-4.564,3.583-8.848,3.621H47.063z M44.333,86.338c-7.026,0-12.564,2.204-16.016,6.375 c-3.681,4.447-4.933,10.963-3.526,18.347c1.518,6.346,4.38,11.67,8.278,15.392c3.883,3.709,8.724,5.762,13.996,5.936 c4.221-0.037,6.517-1.84,8.736-3.582c2.184-1.715,4.441-3.486,8.492-3.486c0.452,0,0.925,0.021,1.41,0.065 c-1.244-0.779-2.701-1.159-4.441-1.159c-2.254,0-4.601,0.626-6.87,1.23c-1.975,0.527-3.841,1.024-5.405,1.024 c-2.564,0-3.941-1.412-4.333-4.444c0.135-3.126,2.638-5.215,6.228-5.215c0.813,0,1.652,0.107,2.491,0.32 c5.155,1.217,8.716,3.056,11.856,4.678c3.685,1.904,6.867,3.547,11.453,3.547c1.394,0,2.842-0.146,4.43-0.449 c11.01-1.774,14.148-7.221,16.918-12.025c1.867-3.24,3.632-6.3,7.484-8.011c1.624-0.721,3.083-1.071,4.461-1.071 c1.485,0,2.685,0.389,3.955,0.8c1.285,0.416,2.614,0.847,4.283,0.846c1.583,0,3.307-0.396,5.248-1.205 c-0.648,0.112-1.299,0.169-1.97,0.169c-2.662,0-5.113-0.906-7.484-1.781c-2.3-0.849-4.679-1.727-7.187-1.727 c-3.82,0-7.434,2.048-11.368,6.445c-0.364,0.396-0.828,0.963-1.364,1.618c-2.562,3.128-6.849,8.364-11.031,8.364 c-2.113,0-3.962-1.356-5.493-4.031c-0.93-2.087-0.657-4.359,0.785-6.58c1.889-2.908,5.662-5.584,10.625-7.536 c5.331-2.097,11.566-3.205,18.031-3.205c1.678,0,3.381,0.077,5.061,0.228c3.868,0.577,7.262,1.481,10.256,2.28 c3.479,0.927,6.484,1.728,9.145,1.728c3.969,0,8.233-1.501,12.531-12.394c1.521-4.129,4.294-5.643,6.39-6.562 c-5.791,2.095-7.735,4.903-9.956,8.111c-0.958,1.382-1.947,2.812-3.315,4.303c-0.812,0.849-1.912,1.315-3.1,1.315 c-1.973,0-3.876-1.24-4.849-3.158c-0.861-1.698-1.72-5.346,2.203-10.701c2.951-3.441,6.533-5.042,11.279-5.042 c2.984,0,6.113,0.598,9.426,1.23c3.557,0.679,7.235,1.382,11.001,1.382c0.001,0,0.002,0,0.003,0c5.31,0,9.753-1.402,13.9-4.398 c-2.438,1.15-5.05,1.71-7.95,1.71c-4.349,0-8.797-1.237-13.508-2.548c-5.06-1.407-10.291-2.862-15.916-2.939 c-0.354-0.02-0.709-0.03-1.062-0.03c-9.199,0-17.804,6.662-25.396,12.541c-5.345,4.139-9.962,7.713-13.53,7.805 c-5.158-0.104-10.079-3.275-11.45-7.376c-0.91-2.724-0.023-5.313,2.498-7.291c0.914-0.537,2.012-0.794,3.366-0.794 c2.033,0,4.414,0.581,6.936,1.196c3.004,0.732,6.109,1.49,9.262,1.489c5.138,0,9.03-2.057,12.189-6.456 c-3.038,2.742-6.176,4.078-9.568,4.078c-3.8,0-7.368-1.645-10.819-3.236c-3.169-1.461-6.163-2.841-9.09-2.841 c-0.196,0-0.394,0.006-0.586,0.019l-0.141,0.013c-3.12,0.273-5.979,1.352-8.496,3.205c-4.839,3.563-8.049,9.652-9.541,18.099 c-2.986,12.882-10.004,15.587-15.364,15.587c-0.001,0,0,0,0,0c-1.993,0-3.566-0.383-4.237-0.547 c-0.118-0.029-0.209-0.051-0.269-0.062c-1.887-0.584-4.142-2.521-4.816-5.103c-0.416-1.591-0.369-4.059,2.212-6.779 c1.84-1.771,4.396-2.072,6.867-2.363c1.806-0.213,3.512-0.415,4.868-1.163c5.987-2.854,7.418-6.31,8.932-9.969 c1.074-2.593,2.182-5.27,4.999-7.814c-2.861,1.643-4.361,3.759-5.816,5.812c-2.955,4.168-5.746,8.106-18.946,8.106 c-1.992,0-4.212-0.093-6.597-0.276C45.446,86.351,44.882,86.338,44.333,86.338z"/></g></svg>';
                    case 'grid' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><g> <g> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="104.088" y="132.575" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -67.3253 122.6343)" width="20.564" height="20.023"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="133.034" y="132.249" transform="matrix(0.7071 -0.7072 0.7072 0.7071 -58.8638 142.9646)" width="20.182" height="20.563"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="104.142" y="103.742" transform="matrix(0.707 0.7072 -0.7072 0.707 114.0192 -47.5699)" width="20.566" height="20.179"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="132.899" y="103.764" transform="matrix(-0.7071 0.7071 -0.7071 -0.7071 324.8759 92.9823)" width="20.564" height="20.023"/> </g> <g> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="46.538" y="132.575" transform="matrix(0.7072 -0.7071 0.7071 0.7072 -84.1771 81.931)" width="20.565" height="20.023"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="75.484" y="132.249" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -75.7197 102.257)" width="20.183" height="20.563"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="46.592" y="103.742" transform="matrix(0.707 0.7072 -0.7072 0.707 97.1598 -6.8727)" width="20.566" height="20.181"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="75.349" y="103.763" transform="matrix(-0.7071 0.7071 -0.7071 -0.7071 226.6322 133.6762)" width="20.564" height="20.024"/> </g> <g> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="104.088" y="76.215" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -27.4725 106.1268)" width="20.564" height="20.022"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="133.034" y="75.888" transform="matrix(0.7071 -0.7072 0.7072 0.7071 -19.0079 126.4542)" width="20.182" height="20.563"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="104.142" y="47.382" transform="matrix(0.7071 0.7072 -0.7072 0.7071 74.1607 -64.0803)" width="20.565" height="20.179"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="132.899" y="47.403" transform="matrix(-0.7071 0.7071 -0.7071 -0.7071 285.0229 -3.2313)" width="20.564" height="20.023"/> </g> <g> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="46.538" y="76.215" transform="matrix(0.7072 -0.7071 0.7071 0.7072 -44.327 65.4261)" width="20.565" height="20.022"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="75.484" y="75.888" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -35.8666 85.7492)" width="20.183" height="20.563"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="46.537" y="47.381" transform="matrix(0.7071 0.7072 -0.7072 0.7071 57.2857 -23.3444)" width="20.565" height="20.18"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="75.349" y="47.403" transform="matrix(-0.7071 0.7071 -0.7071 -0.7071 186.7792 37.4626)" width="20.564" height="20.024"/> </g></g></svg>';
                    case 'cube' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><g><polygon fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" points="50.689,71.558 58.907,76.305 108.227,47.858 100.002,43.115    "/><polygon fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" points="67.123,81.049 75.342,85.795 124.66,57.351 116.437,52.606   "/><polygon fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" points="83.558,90.541 91.775,95.286 141.095,66.842 132.87,62.1     "/><polygon fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" points="100.002,156.885 100.003,147.394 50.689,118.91 50.689,128.442   "/><polygon fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" points="100.005,137.905 100.007,128.416 50.686,99.938 50.689,109.433   "/><polygon fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" points="100.008,118.929 100.01,109.438 50.716,80.948 50.72,90.442  "/><polygon fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" points="149.314,71.558 141.095,76.301 141.098,133.181 149.314,128.442  "/><polygon fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" points="132.877,81.044 124.657,85.787 124.662,142.66 132.879,137.922   "/><polygon fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" points="116.439,90.531 108.22,95.273 108.227,152.142 116.444,147.4     "/></g></svg>';
                    case 'circles' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><g> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M62.923,108.923c-0.35,3.989-3.862,6.939-7.851,6.59c-3.989-0.348-6.936-3.864-6.591-7.853 c0.35-3.988,3.863-6.936,7.852-6.588C60.324,101.424,63.273,104.935,62.923,108.923z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M151.409,89.511c1.694,3.628,0.125,7.939-3.506,9.631c-3.623,1.691-7.937,0.121-9.63-3.504 c-1.688-3.628-0.125-7.938,3.504-9.632C145.41,84.314,149.722,85.883,151.409,89.511z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M72.172,126.46c1.693,3.631,0.125,7.94-3.504,9.632c-3.627,1.694-7.938,0.121-9.633-3.504 c-1.691-3.629-0.123-7.938,3.506-9.633C66.17,121.266,70.481,122.83,72.172,126.46z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M139.098,65.406c3.28,2.296,4.077,6.813,1.778,10.093c-2.291,3.276-6.812,4.072-10.091,1.781 c-3.275-2.298-4.078-6.813-1.781-10.093C131.305,63.906,135.82,63.107,139.098,65.406z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M88.95,137.023c3.282,2.299,4.079,6.813,1.781,10.095c-2.293,3.28-6.813,4.073-10.095,1.781 c-3.28-2.298-4.075-6.815-1.779-10.095C81.155,135.525,85.67,134.727,88.95,137.023z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M116.383,50.687c3.988,0.349,6.938,3.862,6.587,7.852c-0.347,3.983-3.864,6.933-7.85,6.587 c-3.985-0.35-6.937-3.86-6.589-7.848C108.883,53.285,112.396,50.335,116.383,50.687z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M108.762,137.783c3.992,0.35,6.939,3.862,6.59,7.851c-0.346,3.987-3.863,6.935-7.852,6.591 c-3.988-0.35-6.936-3.864-6.589-7.854C101.263,140.383,104.773,137.433,108.762,137.783z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M89.351,49.296c3.627-1.692,7.938-0.123,9.63,3.508c1.692,3.621,0.121,7.936-3.503,9.629 c-3.627,1.688-7.938,0.125-9.632-3.503C84.156,55.296,85.722,50.984,89.351,49.296z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M126.299,128.534c3.633-1.693,7.943-0.124,9.633,3.505c1.695,3.626,0.122,7.938-3.505,9.634 c-3.628,1.69-7.938,0.12-9.632-3.508C121.105,134.536,122.671,130.226,126.299,128.534z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M65.247,61.607c2.295-3.277,6.812-4.075,10.092-1.777c3.276,2.291,4.073,6.812,1.781,10.091 c-2.296,3.276-6.812,4.077-10.093,1.784C63.746,69.402,62.947,64.886,65.247,61.607z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M136.863,111.757c2.299-3.282,6.816-4.08,10.094-1.781c3.281,2.294,4.075,6.813,1.781,10.096 c-2.296,3.278-6.814,4.074-10.096,1.778C135.365,119.551,134.566,115.035,136.863,111.757z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M50.527,84.322c0.348-3.987,3.861-6.936,7.851-6.585c3.983,0.346,6.934,3.862,6.587,7.85 c-0.35,3.984-3.861,6.937-7.849,6.589C53.124,91.823,50.174,88.312,50.527,84.322z"/></g><g> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="75.462" cy="83.061" r="4.851"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M129.641,119.463c-0.916,2.519-3.698,3.816-6.217,2.899c-2.515-0.914-3.812-3.699-2.898-6.215 c0.918-2.517,3.697-3.815,6.215-2.901C129.261,114.165,130.559,116.948,129.641,119.463z"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="70.1" cy="97.793" r="4.851"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M135.221,102.23c0.467,2.64-1.295,5.153-3.934,5.618c-2.635,0.466-5.15-1.297-5.619-3.934 c-0.463-2.636,1.295-5.153,3.934-5.618C132.242,97.834,134.758,99.592,135.221,102.23z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M77.6,112.39c0.465,2.642-1.294,5.154-3.934,5.62c-2.638,0.467-5.152-1.297-5.621-3.934 c-0.465-2.641,1.297-5.153,3.935-5.619C74.619,107.992,77.134,109.751,77.6,112.39z"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M131.438,84.516c1.723,2.052,1.455,5.111-0.598,6.832c-2.049,1.723-5.109,1.453-6.832-0.597 c-1.722-2.052-1.456-5.109,0.595-6.832C126.66,82.196,129.717,82.463,131.438,84.516z"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="82.899" cy="125.244" r="4.85"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M119.304,71.065c2.518,0.915,3.815,3.698,2.897,6.218c-0.913,2.514-3.698,3.812-6.215,2.897 c-2.516-0.917-3.816-3.696-2.9-6.215C114.006,71.446,116.787,70.146,119.304,71.065z"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="97.632" cy="130.606" r="4.85"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M102.07,65.484c2.638-0.465,5.153,1.295,5.617,3.935c0.467,2.635-1.295,5.152-3.933,5.619 c-2.637,0.463-5.153-1.295-5.621-3.933C97.672,68.464,99.431,65.948,102.07,65.484z"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="113.072" cy="127.884" r="4.85"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M84.355,69.268c2.052-1.722,5.11-1.455,6.832,0.599c1.722,2.049,1.455,5.109-0.597,6.833 c-2.051,1.72-5.11,1.455-6.832-0.596C82.036,74.046,82.302,70.989,84.355,69.268z"/></g><g> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="97.263" cy="83.369" r="2.775"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M104.455,120.013c-1.39,0.647-3.04,0.048-3.688-1.342c-0.648-1.387-0.046-3.039,1.341-3.688 c1.39-0.646,3.039-0.048,3.688,1.341C106.443,117.716,105.844,119.367,104.455,120.013z"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="89.135" cy="87.159" r="2.775"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="111.41" cy="113.707" r="2.775"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="83.99" cy="94.507" r="2.776"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="116.555" cy="106.36" r="2.775"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="83.207" cy="103.442" r="2.775"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M119.852,96.253c0.648,1.388,0.048,3.039-1.344,3.687c-1.385,0.647-3.037,0.046-3.686-1.343 c-0.646-1.389-0.049-3.038,1.34-3.688C117.555,94.263,119.206,94.861,119.852,96.253z"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="86.998" cy="111.571" r="2.775"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="113.547" cy="89.295" r="2.775"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="94.345" cy="116.716" r="2.775"/> <path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M106.441,81.387c1.525,0.133,2.656,1.478,2.521,3.005c-0.133,1.526-1.479,2.656-3.006,2.523 c-1.525-0.134-2.656-1.479-2.523-3.005C103.57,82.381,104.914,81.252,106.441,81.387z"/></g><g> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="105.747" cy="92.615" r="1.529"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="94.798" cy="108.252" r="1.528"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="101.105" cy="90.924" r="1.528"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="99.441" cy="109.942" r="1.528"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="96.239" cy="91.783" r="1.53"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="104.307" cy="109.085" r="1.528"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="92.453" cy="94.958" r="1.529"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="108.092" cy="105.909" r="1.528"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="90.764" cy="99.601" r="1.529"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="109.782" cy="101.266" r="1.529"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="91.621" cy="104.467" r="1.529"/> <circle fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" cx="108.924" cy="96.4" r="1.528"/></g></svg>';
                    case 'shield' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><g><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M142.824,81.079c-0.005-0.145-0.007-0.291-0.019-0.432c-0.235-4.191-2.952-8.801-6.518-10.924l-29.664-17.67c-1.024-0.611-2.061-0.98-3.089-1.113c-1.143-0.297-2.372-0.455-3.626-0.455c-1.345,0-2.651,0.184-3.859,0.523c-0.891,0.17-1.785,0.515-2.674,1.045l-29.661,17.67c-3.564,2.123-6.287,6.738-6.519,10.934c-0.01,0.139-0.016,0.284-0.018,0.427c-0.002,0.052-0.008,0.101-0.008,0.151v0.065v37.398v0.067c0,0.05,0.006,0.103,0.008,0.153c0.003,0.147,0.008,0.293,0.018,0.432c0.236,4.192,2.957,8.804,6.519,10.926l29.662,17.671c1.028,0.609,2.063,0.979,3.091,1.11c1.143,0.3,2.372,0.456,3.626,0.456c1.344,0,2.649-0.182,3.86-0.521c0.893-0.172,1.784-0.518,2.672-1.047l29.662-17.669c3.566-2.124,6.284-6.739,6.518-10.934c0.012-0.14,0.014-0.284,0.019-0.428c0-0.051,0.005-0.103,0.005-0.149v-0.067V81.301v-0.065C142.829,81.184,142.824,81.131,142.824,81.079z M63.815,118.579V81.421l29.561,17.612l0.027,0.016c0.391,0.236,0.774,0.565,1.133,0.953c-0.367,0.394-0.758,0.729-1.16,0.965L63.815,118.579z M136.188,81.419v37.16l-29.562-17.612l-0.028-0.014c-0.39-0.234-0.772-0.564-1.132-0.951c0.367-0.397,0.759-0.732,1.16-0.969L136.188,81.419z M132.791,75.539c0.044,0.026,0.084,0.053,0.122,0.078c-0.038,0.023-0.076,0.052-0.122,0.077l-29.464,17.562V57.989L132.791,75.539z M96.675,93.263L67.114,75.653c-0.043-0.028-0.084-0.055-0.122-0.081c0.038-0.022,0.079-0.049,0.122-0.074l29.561-17.62V93.263z M67.212,124.461c-0.044-0.026-0.085-0.053-0.125-0.077c0.04-0.026,0.081-0.052,0.125-0.078l29.463-17.563v35.269L67.212,124.461z M103.327,106.739l29.562,17.608c0.044,0.025,0.085,0.052,0.122,0.078c-0.037,0.026-0.078,0.052-0.122,0.076l-29.562,17.62V106.739z"/></g></svg>';
                    case 'locking' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><g><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M109.25,83.803c-4.012,0-7.275,3.266-7.275,7.278c0,1.32,0,1.32,0,1.32c0.537,1.271-0.816,4.129-2.996,6.352c-2.188,2.227-4.984,3.638-6.215,3.137c0,0,0,0-1.275,0c-4.01,0-7.275,3.266-7.275,7.277s3.266,7.278,7.275,7.278c4.014,0,7.279-3.267,7.279-7.278c0-1.327,0-1.327,0-1.327c-0.541-1.277,0.799-4.139,2.984-6.362c2.18-2.221,4.98-3.624,6.217-3.119c0,0,0,0,1.281,0c4.014,0,7.279-3.263,7.279-7.277C116.529,87.068,113.264,83.803,109.25,83.803z"/><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M110.24,48.69c-4.014,0-7.275,3.266-7.275,7.278c0,1.32,0,1.32,0,1.32c0.535,1.267-0.814,4.126-2.998,6.352c-2.186,2.224-4.982,3.634-6.215,3.137c0,0,0,0-1.273,0c-4.014,0-7.277,3.263-7.277,7.273c0,4.016,3.264,7.278,7.277,7.278s7.277-3.263,7.277-7.278c0-1.327,0-1.327,0-1.327c-0.543-1.277,0.801-4.135,2.982-6.358s4.982-3.627,6.223-3.123c0,0,0,0,1.279,0c4.016,0,7.277-3.263,7.277-7.273C117.518,51.956,114.256,48.69,110.24,48.69z"/><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M143.869,82.318c-4.01,0-7.275,3.27-7.275,7.278c0,1.323,0,1.323,0,1.323c0.535,1.268-0.814,4.126-2.998,6.349c-2.186,2.227-4.98,3.638-6.213,3.137c0,0,0,0-1.275,0c-4.012,0-7.275,3.266-7.275,7.277c0,4.016,3.264,7.278,7.275,7.278c4.014,0,7.279-3.263,7.279-7.278c0-1.327,0-1.327,0-1.327c-0.541-1.277,0.801-4.139,2.98-6.362c2.184-2.219,4.982-3.624,6.223-3.119c0,0,0,0,1.279,0c4.014,0,7.279-3.263,7.279-7.277C151.148,85.588,147.883,82.318,143.869,82.318z"/><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M73.889,85.039c-4.012,0-7.275,3.267-7.275,7.278c0,1.32,0,1.32,0,1.32c0.535,1.271-0.812,4.129-2.998,6.352c-2.188,2.228-4.98,3.638-6.213,3.137c0,0,0,0-1.275,0c-4.012,0-7.275,3.267-7.275,7.277c0,4.016,3.264,7.278,7.275,7.278c4.014,0,7.277-3.263,7.277-7.278c0-1.327,0-1.327,0-1.327c-0.541-1.277,0.801-4.139,2.984-6.362c2.182-2.223,4.982-3.623,6.221-3.119c0,0,0,0,1.279,0c4.016,0,7.277-3.263,7.277-7.277C81.166,88.306,77.904,85.039,73.889,85.039z"/><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M107.52,118.671c-4.012,0-7.277,3.266-7.277,7.278c0,1.32,0,1.32,0,1.32c0.537,1.267-0.812,4.125-2.998,6.352c-2.186,2.224-4.98,3.634-6.213,3.137c0,0,0,0-1.271,0c-4.014,0-7.279,3.264-7.279,7.276s3.266,7.275,7.279,7.275c4.01,0,7.275-3.263,7.275-7.275c0-1.33,0-1.33,0-1.33c-0.541-1.276,0.799-4.135,2.984-6.358c2.18-2.223,4.98-3.627,6.219-3.12c0,0,0,0,1.281,0c4.016,0,7.279-3.266,7.279-7.276C114.799,121.937,111.535,118.671,107.52,118.671z"/><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M99.381,91.695c0-4.011-3.264-7.277-7.277-7.277c-1.318,0-5.445-0.812-7.672-2.999c-2.221-2.183-3.135-6.211-3.135-7.485c0-4.011-3.266-7.277-7.277-7.277c-4.016,0-7.277,3.267-7.277,7.277c0,4.013,3.262,7.278,7.277,7.278c1.328,0,5.469,0.799,7.689,2.979c2.219,2.183,3.117,6.222,3.117,7.505c0,4.013,3.266,7.275,7.277,7.275C96.117,98.971,99.381,95.708,99.381,91.695z"/><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M133.752,126.066c0-4.013-3.262-7.278-7.271-7.278c-1.322,0-5.449-0.812-7.676-2.996c-2.225-2.187-3.137-6.214-3.137-7.487c0-4.013-3.266-7.278-7.275-7.278c-4.014,0-7.279,3.266-7.279,7.278c0,4.015,3.266,7.277,7.279,7.277c1.326,0,5.467,0.799,7.686,2.982c2.223,2.181,3.123,6.221,3.123,7.502c0,4.015,3.264,7.276,7.279,7.276C130.49,133.343,133.752,130.081,133.752,126.066z"/><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M97.65,127.056c0-4.012-3.264-7.277-7.277-7.277c-1.32,0-5.449-0.813-7.672-2.996c-2.223-2.187-3.137-6.215-3.137-7.488c0-4.012-3.264-7.278-7.275-7.278c-4.014,0-7.277,3.267-7.277,7.278c0,4.011,3.264,7.278,7.277,7.278c1.328,0,5.467,0.798,7.686,2.981c2.223,2.183,3.121,6.221,3.121,7.502c0,4.012,3.268,7.278,7.277,7.278C94.387,134.334,97.65,131.067,97.65,127.056z"/><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M134.248,90.459c0-4.012-3.264-7.277-7.275-7.277c-1.32,0-5.447-0.815-7.674-2.999c-2.225-2.184-3.135-6.212-3.135-7.485c0-4.012-3.266-7.278-7.277-7.278s-7.277,3.267-7.277,7.278c0,4.011,3.266,7.278,7.277,7.278c1.328,0,5.467,0.798,7.688,2.978c2.223,2.187,3.119,6.223,3.119,7.506c0,4.012,3.266,7.274,7.279,7.274C130.984,97.733,134.248,94.471,134.248,90.459z"/></g></svg>';
                    case 'seal' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><path fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" d="M114.785,171.178L100,137.172l-14.787,34.005l0.322-37.075l-27.333,25.041l15.371-33.735l-35.165,11.765L66.184,112.6 l-36.919-3.562l35.372-11.14L32.361,79.633l36.845,4.206l-22.05-29.817l31.945,18.827L71.07,36.653l21.539,30.179l7.389-36.34 l7.398,36.34l21.529-30.179l-8.021,36.196l31.953-18.832l-22.062,29.821l36.85-4.206L135.37,97.897l35.362,11.14l-36.916,3.562 l27.773,24.572l-35.163-11.765l15.372,33.735l-27.336-25.041L114.785,171.178z M91.655,120.357l-0.186,21.386L100,122.125 l8.529,19.617l-0.186-21.384l15.772,14.448l-8.871-19.468l20.282,6.786l-16.02-14.172l21.291-2.055l-20.396-6.425l18.615-10.534 l-21.254,2.425l12.725-17.198l-18.428,10.861l4.629-20.892l-12.42,17.411l-4.268-20.959L95.74,81.547L83.313,64.136l4.635,20.893 L69.513,74.162l12.721,17.202L60.99,88.939l18.615,10.534l-20.4,6.425l21.288,2.055l-16.02,14.172l20.281-6.786l-8.87,19.468 L91.655,120.357z"/></svg>';
                    case 'circleslash' : return '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><g> <defs> <circle id="SVGID_1_" cx="106" cy="96" r="55"/> </defs> <clipPath id="SVGID_2_"> <use xlink:href="#SVGID_1_"  overflow="visible"/> </clipPath> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="62.944" y="-32.696" transform="matrix(0.7072 0.707 -0.707 0.7072 64.7871 -26.4693)" clip-path="url(#SVGID_2_)" width="2.814" height="195.359"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="69.481" y="-26.157" transform="matrix(0.7068 0.7074 -0.7074 0.7068 71.3731 -29.1772)" clip-path="url(#SVGID_2_)" width="2.814" height="195.357"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="76.018" y="-19.619" transform="matrix(0.7069 0.7073 -0.7073 0.7069 77.9011 -31.8846)" clip-path="url(#SVGID_2_)" width="2.814" height="195.358"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="82.556" y="-13.081" transform="matrix(0.7069 0.7073 -0.7073 0.7069 84.441 -34.5925)" clip-path="url(#SVGID_2_)" width="2.814" height="195.358"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="89.093" y="-6.544" transform="matrix(0.7068 0.7074 -0.7074 0.7068 90.996 -37.2999)" clip-path="url(#SVGID_2_)" width="2.814" height="195.357"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="95.631" y="-0.007" transform="matrix(0.7069 0.7073 -0.7073 0.7069 97.5205 -40.0089)" clip-path="url(#SVGID_2_)" width="2.815" height="195.358"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="102.168" y="6.531" transform="matrix(0.7069 0.7073 -0.7073 0.7069 104.0597 -42.7162)" clip-path="url(#SVGID_2_)" width="2.814" height="195.358"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="108.706" y="13.068" transform="matrix(0.7069 0.7073 -0.7073 0.7069 110.5993 -45.4245)" clip-path="url(#SVGID_2_)" width="2.814" height="195.357"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="115.242" y="19.606" transform="matrix(0.7068 0.7074 -0.7074 0.7068 117.1593 -48.132)" clip-path="url(#SVGID_2_)" width="2.815" height="195.357"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="121.78" y="26.143" transform="matrix(0.7069 0.7073 -0.7073 0.7069 123.6781 -50.8401)" clip-path="url(#SVGID_2_)" width="2.814" height="195.357"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="128.318" y="32.681" transform="matrix(0.7071 0.7071 -0.7071 0.7071 130.1735 -53.5478)" clip-path="url(#SVGID_2_)" width="2.813" height="195.358"/> <rect fill="rgba(' + r + ', ' + g + ', ' + b + ',' + a + ')" x="134.856" y="39.217" transform="matrix(0.7075 0.7067 -0.7067 0.7075 136.5923 -56.2565)" clip-path="url(#SVGID_2_)" width="2.814" height="195.359"/></g></svg>';
            }
        }

        var self = this;

        context = BBModBaseBrush2D.prototype.draw.call(this, context);

        // if the variant is present and is the right variable type
        if (this.variant !== null && 
            typeof this.variant === 'string') {

            // if the variant is new or has changed
            if (this.variant !== this._lastVariant) {

                // if this is an acceptable variant
                if (this.variants.indexOf(this.variant) !== -1) {
                    
                    // create a tmp variant, because this.src setter sets this.variant to null
                    var variant = this.variant;
                    this.src = 'data:image/svg+xml;base64,' + window.btoa(getColoredSVGVariant());
                    this.variant = variant;

                    this._lastVariant = this.variant;  
                
                } else {
                    throw new Error('BBModImageBrush2D draw: ' + this.variant + ' is not a valid variant for BBModImageBrush2D');
                }
            }            
        }

        if (!initSrcSet) {
            console.error('BBModImageBrush2D draw: you are attempting to draw an image brush without first setting its source with the .src property');
        }

        if (!this.hidden && drawReady) {

            context.save();
        
            context.translate(this.x, this.y);
            context.rotate(BBModMathUtils.degToRad(this.rotation));

            // draw to screen
            context.drawImage(this._image, - this.width/2, - this.height/2, this.width, this.height);

            context.restore();
        }
    };

    return BBModImageBrush2D;
});

/**
 * A 2D brush module for drawing contiguous lines in a stamp-like fashion.
 * @module BBModLineBrush2D
 * @extends BBModBaseBrush2D
 */
define('BBModLineBrush2D',['./BBModBaseBrush2D', './BBModColor', "./BBModMathUtils"], 
function(  BBModBaseBrush2D,     BBModColor,     BBModMathUtils){

    var justReset = false;
    var controllerModuleHasIsDown = false;

    /**
     * A 2D brush module for drawing contiguous lines in a stamp-like fashion.
     * What makes BBModLineBrush2D fundamentally different from BBModBaseBrush
     * is that each new drawing instance is influenced by the previous position of
     * the brush (usually to adjust for drawing angle or brush width).
     * @class BBModLineBrush2D
     * @constructor
     * @extends BBModBaseBrush2D
     * @param {Object} [config] A optional config hash to initialize any of
     * BBModLineBrush2D's public properties.
     * @example <div><code> var lineBrush = new BBModLineBrush2D({ width: 100,
     * height: 100, variant: "soft" }); </code></div>
     */
    function BBModLineBrush2D(config) {

        BBModBaseBrush2D.call(this, config);

        /**
         * The brush's previous x position. This property is unique to
         * BBModLineBrush.
         * @property prevX
         * @type Number
         * @default null
         */
        this.prevX = null;

        /**
         * The brush's previous y position. This property is unique to
         * BBModLineBrush.
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
    }

    BBModLineBrush2D.prototype = Object.create(BBModBaseBrush2D.prototype);
    BBModLineBrush2D.prototype.constructor = BBModLineBrush2D;

    /**
     * Update method. Usually called once per animation frame.
     * @method update
     * @param {Object} controllerModule An object with x and y properties and
     * optionally an isDown boolean (used for beginning and ending
     * strokeds/marks). 
     */
    BBModLineBrush2D.prototype.update = function(controllerModule) {
        
        BBModBaseBrush2D.prototype.update.call(this, controllerModule);

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
    BBModLineBrush2D.prototype.draw = function(context) {
        

        context = BBModBaseBrush2D.prototype.draw.call(this, context);

        context.save();

        context.lineJoin = "round";
        context.lineCap = "round";

        if (typeof this.variant !== 'string' ||
            this.variants.indexOf(this.variant) === -1) {
            throw new Error("BBModBaseBrush2D.draw: " + this.variant + " is not a valid variant for BBModImageBrush2D");
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
                    if (this.color && this.color instanceof BBModColor) {
                        r = this.color.r;
                        g = this.color.g;
                        b = this.color.b;
                        alphaFloat = BBModMathUtils.map(this.color.a, 0, 255, 0.0, 1.0);
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

                        context.lineWidth = BBModMathUtils.map(this.weight, 0, 100, this.height / 2.5, this.height * 2.5);
                        context.lineTo(this.x, this.y);
                        context.strokeStyle = "rgba(" + r + ", " + g + ", " + b + ", " + alphaFloat + ")";
                        context.stroke();
                        context.closePath();
                        context.beginPath();
                        context.moveTo(this.x, this.y);

                    } else if(this.variant == 'soft'){
                        
                        var dist = BBModMathUtils.dist(this.prevX, this.prevY, this.x, this.y);
                        var angle = BBModMathUtils.angleBtw(this.prevX, this.prevY, this.x, this.y);
                        for (var i = 0; i < dist; i++) {
                            var x = this.prevX + (Math.sin(angle) * i);
                            var y = this.prevY + (Math.cos(angle) * i);
                            var gradient = context.createRadialGradient(x, y, this.width/6, x, y, this.height/2);
                            gradient.addColorStop(0, "rgba(" + r + ", " + g + ", " + b + ', 0.1)');
                            gradient.addColorStop(1, "rgba(" + r + ", " + g + ", " + b + ', 0)');
                            context.fillStyle = gradient;
                            context.fillRect(x - this.height/2, y - this.height/2, this.height, this.height);
                        }

                    } else if(this.variant == 'lines' || this.variant == 'calligraphy'){

                        if(this.variant == 'lines'){ context.lineWidth = (this.height < 1) ? 1 : this.height * 0.05; }
                        if(this.variant == 'calig'){ context.lineWidth = this.height * 0.2; }

                        context.strokeStyle = "rgb(" + r + ", " + g + ", " + b + ")";
                        context.moveTo(this.prevX, this.prevY);
                        context.lineTo(this.x, this.y);
                        context.stroke();
                        context.moveTo(this.prevX - this.height * 0.2, this.prevY - this.height * 0.2);
                        context.lineTo(this.x - this.height * 0.2, this.y - this.height * 0.2);
                        context.stroke();
                        context.moveTo(this.prevX - this.height * 0.1, this.prevY - this.height * 0.1);
                        context.lineTo(this.x - this.height * 0.1, this.y - this.height * 0.1);
                        context.stroke();
                        context.moveTo(this.prevX + this.height * 0.1, this.prevY + this.height * 0.1);
                        context.lineTo(this.x + this.height * 0.1, this.y + this.height * 0.1);
                        context.stroke();
                        context.moveTo(this.prevX + this.height * 0.2, this.prevY + this.height * 0.2);
                        context.lineTo(this.x + this.height * 0.2, this.y + this.height * 0.2);
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

    return BBModLineBrush2D;
});

define('main',['require','BBModCore','BBModMathUtils','BBModColor','BBModBaseBrush2D','BBModImageBrush2D','BBModLineBrush2D','BBModBrushManager2D','BBModMouseInput','BBModPointer'],function (require) {

  'use strict';

  var BBMod = require('BBModCore');
  
  //utils
  BBMod.MathUtils      = require('BBModMathUtils');
  BBMod.Color          = require('BBModColor');

  // brushes
  BBMod.BaseBrush2D    = require('BBModBaseBrush2D');
  BBMod.ImageBrush2D   = require('BBModImageBrush2D');
  BBMod.LineBrush2D    = require('BBModLineBrush2D');
  BBMod.BrushManager2D = require('BBModBrushManager2D');
  
  // inputs, etc...
  BBMod.MouseInput     = require('BBModMouseInput');
  BBMod.Pointer        = require('BBModPointer');

  return BBMod;

});
    //The modules for your project will be inlined above
    //this snippet. Ask almond to synchronously require the
    //module value for 'main' here and return it as the
    //value to use for the public API for the built file.
    return require('main');
}));