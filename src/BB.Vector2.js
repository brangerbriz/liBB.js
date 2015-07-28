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

define(['./BB'],
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