/**
 * A static utilitites class for all things math.
 * @module BBModMathUtils
 * @static
 */
define(function(){

    'use strict';

    function BBModMathUtils() {}

    /**
     * Scales value using min and max. This is the inverse of BBModMathUtils.lerp(...).
     * @method norm
     * @static
     * @param  {Number} value The value to be scaled.
     * @param  {Number} min
     * @param  {Number} max
     * @return {Number}       Returns the scaled value.
     */
    BBModMathUtils.norm = function(value, min, max) {

        if (typeof value !== "number") {
            throw new Error("BBModMathUtils.norm: value is not a number type");
        } else if (typeof min !== "number") {
            throw new Error("BBModMathUtils.norm: min is not a number type");
        } else if (typeof max !== "number") {
            throw new Error("BBModMathUtils.norm: max is not a number type");
        }

        return (value - min) / (max - min);
    };

     /**
     * Linear interpolate norm from min and max. This is the inverse of BBModMathUtils.norm(...).
     * @method lerp
     * @static
     * @param  {Number} value
     * @param  {Number} min
     * @param  {Number} max
     * @return {Number}       Returns the lerped norm.
     */
    BBModMathUtils.lerp = function(norm, min, max) {

        if (typeof norm !== "number") {
            throw new Error("BBModMathUtils.lerp: norm is not a number type");
        } else if (typeof min !== "number") {
            throw new Error("BBModMathUtils.lerp: min is not a number type");
        } else if (typeof max !== "number") {
            throw new Error("BBModMathUtils.lerp: max is not a number type");
        }

        return (max - min) * norm + min;
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
    BBModMathUtils.map = function(value, sourceMin, sourceMax, destMin, destMax) {

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
    BBModMathUtils.dist = function(p1x, p1y, p2x, p2y){
        
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
    };
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
    BBModMathUtils.angleBtw = function(p1x, p1y, p2x, p2y){

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
    };
    /**
     * Translate radians into degrees.
     * @method  radToDeg
     * @static
     * @param  {[type]} radians
     * @return {[type]}         Returns radians in degrees.
     */
    BBModMathUtils.radToDeg = function(radians) {

        if (typeof radians !== "number") {
            throw new Error("BBModMathUtils.radToDegree: radians is not a number type");
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
    BBModMathUtils.degToRad = function(degrees) {

        if (typeof degrees !== "number") {
            throw new Error("BBModMathUtils.degToRad: degrees is not a number type");
        }

        return degrees * (Math.PI / 180.0);
    };

    return BBModMathUtils;
});