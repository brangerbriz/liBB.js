/**
 * A static utilitites class for all things math.
 * @module BB.MathUtils
 * @class BB.MathUtils
 * @static
 */
define(['./BB', './BB.Vector2'], 
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

    // P5.js perlin noise stuff
    var perlin = null;
    var PERLIN_YWRAPB = 4;
    var PERLIN_YWRAP = 1<<PERLIN_YWRAPB;
    var PERLIN_ZWRAPB = 8;
    var PERLIN_ZWRAP = 1<<PERLIN_ZWRAPB;
    var PERLIN_SIZE = 4095;

    var perlin_octaves = 4; // default to medium smooth
    var perlin_amp_falloff = 0.5; // 50% reduction/octave

    function scaled_cosine(i) {
      return 0.5*(1.0-Math.cos(i*Math.PI));
    }

    /**
     * Returns the Perlin noise value at specified coordinates. Perlin noise is
     * a random sequence generator producing a more natural ordered, harmonic
     * succession of numbers compared to the standard <b>random()</b> function.
     * This function is taken almost verbatim from P5.js.
     * @method noise
     * @param  {Number} x   x-coordinate in noise space
     * @param  {Number} y   y-coordinate in noise space
     * @param  {Number} z   z-coordinate in noise space
     * @return {Number}     Perlin noise value (between 0 and 1) at specified
     * coordinates
     */
    BB.MathUtils.noise = function(x, y, z) {
        
        y = y || 0;
        z = z || 0;

        if (perlin === null) {
            perlin = new Array(PERLIN_SIZE + 1);
            for (var i = 0; i < PERLIN_SIZE + 1; i++) {
                perlin[i] = Math.random();
            }
        }

        if (x<0) { x=-x; }
        if (y<0) { y=-y; }
        if (z<0) { z=-z; }

        var xi=Math.floor(x), yi=Math.floor(y), zi=Math.floor(z);
        var xf = x - xi;
        var yf = y - yi;
        var zf = z - zi;
        var rxf, ryf;

        var r=0;
        var ampl=0.5;

        var n1,n2,n3;

        for (var o=0; o<perlin_octaves; o++) {

            var of=xi+(yi<<PERLIN_YWRAPB)+(zi<<PERLIN_ZWRAPB);

            rxf = scaled_cosine(xf);
            ryf = scaled_cosine(yf);

            n1  = perlin[of&PERLIN_SIZE];
            n1 += rxf*(perlin[(of+1)&PERLIN_SIZE]-n1);
            n2  = perlin[(of+PERLIN_YWRAP)&PERLIN_SIZE];
            n2 += rxf*(perlin[(of+PERLIN_YWRAP+1)&PERLIN_SIZE]-n2);
            n1 += ryf*(n2-n1);

            of += PERLIN_ZWRAP;
            n2  = perlin[of&PERLIN_SIZE];
            n2 += rxf*(perlin[(of+1)&PERLIN_SIZE]-n2);
            n3  = perlin[(of+PERLIN_YWRAP)&PERLIN_SIZE];
            n3 += rxf*(perlin[(of+PERLIN_YWRAP+1)&PERLIN_SIZE]-n3);
            n2 += ryf*(n3-n2);

            n1 += scaled_cosine(zf)*(n2-n1);

            r += n1*ampl;
            ampl *= perlin_amp_falloff;
            xi<<=1;
            xf*=2;
            yi<<=1;
            yf*=2;
            zi<<=1;
            zf*=2;

            if (xf>=1.0) { xi++; xf--; }
            if (yf>=1.0) { yi++; yf--; }
            if (zf>=1.0) { zi++; zf--; }
      }

      return r;
    };

    return BB.MathUtils;
});