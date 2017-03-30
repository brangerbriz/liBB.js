/* jshint esversion: 6 */

/**
*  A utility module with more Maths not found in the built in JS Math object
* @class BB.Maths
*/
class Maths {

	static _merrchk(a){
		if( typeof a !== "number" ){
			var pre = ( typeof window.BB !== "undefined") ? "BB." : "";
			var msg = pre +"Maths."+ func + ": was expecting a number but got a "+(typeof a);
			throw new Error(msg);
		}
	}

	static _mErr( func, args ){
		if( args instanceof Array )
			for (var i = 0; i < args.length; i++) this._merrchk( args[i] );
		else this._merrchk( args );
	}

	/**
	* Scales value using min and max. This is the inverse of BB.Maths.lerp(...).
	* @method norm
	* @static
	* @param  {Number} value The value to be scaled.
	* @param  {Number} min
	* @param  {Number} max
	* @return {Number}       Returns the scaled value.
	* @example
	* <code class="code prettyprint">
	* &nbsp;BB.Maths.norm(5,0,20); // 0.25
	* </code>
	 */
	static norm(value, min, max) {
		this._mErr("norm",[value,min,max]);
		return (value - min) / (max - min);
	}

	/**
	* Linear interpolate norm from min and max. This is the inverse of BB.Maths.norm(...).
	* @method lerp
	* @static
	* @param  {Number} value
	* @param  {Number} min
	* @param  {Number} max
	* @return {Number}       Returns the lerped norm.
	* @example
	* <code class="code prettyprint">
	* &nbsp;BB.Maths.lerp(0.25,0,20); // 5
	* </code>
	*/
	static lerp(norm, min, max) {
		this._mErr("lerp",[norm, min, max]);
		return (max - min) * norm + min;
	}


	/**
	* Constrains value using min and max as the upper and lower bounds.
	* @method clamp
	* @static
	* @param  {Number} value The value to be clamped.
	* @param  {Number} min   The lower limit to clamp value by.
	* @param  {Number} max   The upper limit to clamp value by.
	* @return {Number}       The clamped value.
	* @example
	* <code class="code prettyprint">
	* &nbsp;BB.Maths.clamp(25,0,10); // 10
	* &nbsp;BB.Maths.clamp(25,50,100); // 50
	* </code>
	*/
	static clamp(value, min, max) {
		this._mErr("clamp",[value, min, max]);
		return Math.max(min, Math.min(max, value));
	}

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
	* @example
	* <code class="code prettyprint">
	* &nbsp;BB.Maths.map( 25, 0,100, 200,300 ); // 225
	* </code>
	*/
	static map(value, sourceMin, sourceMax, destMin, destMax) {
		this._mErr("map",[value, sourceMin, sourceMax, destMin, destMax]);
		return this.lerp(this.norm(value, sourceMin, sourceMax), destMin, destMax);
	}

	/**
	* Get the distance between two points.
	* @method  dist
	* @static
	* @param  {Number} p1x The x value of the first point.
	* @param  {Number} p1y The y value of the first point.
	* @param  {Number} p2x The x value of the second point.
	* @param  {Number} p2y The y value of the second point.
	* @return {Number} Returns the distance between (p1x, p1y) and (p2x, p2y).
	* @example
	* <code class="code prettyprint">
	* &nbsp;BB.Maths.dist( 0,0, 10,10 ); // 14.142...
	* </code>
	*/
	static dist(p1x, p1y, p2x, p2y){
		this._mErr("dist",[p1x, p1y, p2x, p2y]);
		return Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2));
	}

	/**
	* Get the angle between two points in radians. For degrees process this
	* return value through BB.Maths.radToDegree(...).
	* @method angleBtwn
	* @static
	* @param  {Number} p1x The x value of the first point.
	* @param  {Number} p1y The y value of the first point.
	* @param  {Number} p2x The x value of the second point.
	* @param  {Number} p2y The y value of the second point.
	* @return {Number} Returns the angle between (p1x, p1y) and (p2x, p2y) in
	* radians.
	* @example
	* <code class="code prettyprint">
	* &nbsp;BB.Maths.angleBtw( 0,0, 10,10 ); // 0.78...
	* </code>
	 */
	static angleBtw(p1x, p1y, p2x, p2y){
		this._mErr("angleBtw",[p1x, p1y, p2x, p2y]);
		return Math.atan2( p2x - p1x, p2y - p1y );
	}

	/**
	* Translate radians into degrees.
	* @method  radToDeg
	* @static
	* @param  {[type]} radians
	* @return {[type]}         Returns radians in degrees.
	* @example
	* <code class="code prettyprint">
	* &nbsp;BB.Maths.radToDeg( 3.14158 ); // 179.98...
	* </code>
	*/
	static radToDeg(radians) {
		this._mErr('radToDeg',radians);
		return radians * (180.0 / Math.PI);
	}

	/**
	* Translate degrees into radians.
	* @method  degToRad
	* @static
	* @param  {[type]} degrees
	* @return {[type]}         Returns degrees in radians.
	* @example
	* <code class="code prettyprint">
	* &nbsp;BB.Maths.degToRad( 179.99928 ); // 3.14158...
	* </code>
	*/
	static degToRad(degrees) {
		this._mErr("degToRad",degrees);
		return degrees * (Math.PI / 180.0);
	}

	/**
	* Translate from cartesian to polar coordinates.
	* @method cartesianToPolar
	* @static
	* @param  {Number} x The x coordinate.
	* @param  {Number} y The y coordinate.
	* @return {Object}  an object with the a property for "distance" and two properties for the angle expressed in "radians" and "degrees"
	* @example
	* <code class="code prettyprint">
	* &nbsp;BB.Maths.cartesianToPolar(10,20);<br>
	* &nbsp;// returns {<br>
	* &nbsp;//&nbsp;&nbsp;&nbsp; distance: 22.360679774997898,<br>
	* &nbsp;//&nbsp;&nbsp;&nbsp; radians: 1.1071487177940904,<br>
	* &nbsp;//&nbsp;&nbsp;&nbsp; degrees: 63.43494882292201<br>
	* &nbsp;// } <br>
	* </code>
	*/
	static cartesianToPolar(x, y) {
		this._mErr("cartesianToPolar",[x, y]);
		var distance = Math.sqrt(x*x + y*y);
		var radians = Math.atan2(y,x);
		var degrees = radians * (180/Math.PI);
		return { distance:distance, radians:radians, degrees:degrees };
	}

	/**
	* Translate from polar coordinates to cartesian coordinates.
	* @method polarToCartesian
	* @static
	* @param  {Number} distance  The straight line length ( ie. radius ) from the origin.
	* @param  {Number} angle in radians ( DO NOT USE )
	* positive x axis.
	* @return {Object} an object with x and y properties
	* @example
	* <code class="code prettyprint">
	* &nbsp;BB.Maths.polarToCartesian(22.361,1.107);<br>
	* &nbsp;// returns {<br>
	* &nbsp;//&nbsp;&nbsp;&nbsp; x: 10.000000000000004,<br>
	* &nbsp;//&nbsp;&nbsp;&nbsp; y: 20<br>
	* &nbsp;// } <br>
	* </code>
	*/
	static polarToCartesian(distance, angle) {
		this._mErr("polarToCartesian",[distance, angle]);
		var x = distance * Math.cos(angle);
		var y = distance * Math.sin(angle);
		return { x:x, y:y };
	}

	/**
	* return a random int between a min and a max
	* @method randomInt
	* @static
	* @param  {Number} min minimum value ( default to 0 if only one argument is passed )
	* @param  {Number} max maximum value
	* @return {Number}  random integer
	*/
	static randomInt( min, max) {
		if( typeof max == 'undefined' ){ max = min; min = 0; }
		this._mErr("randomInt",[min,max]);
		return Math.floor(min + Math.random() * (max - min + 1));
	}

	/**
	* return a random float between a min and a max
	* @method randomFloat
	* @static
	* @param  {Number} min minimum value ( default to 0 if only one argument is passed )
	* @param  {Number} max maximum value
	* @return {Number}  random float
	*/
	static randomFloat( min, max ) {
		if( typeof max == 'undefined' ){ max = min; min = 0; }
		this._mErr("randomInt",[min,max]);
		return min + Math.random() * (max - min);
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
	* @example
	* <code class="code prettyprint">
	* &nbsp;var canvas = document.createElement('canvas');<br>
	* &nbsp;canvas.width = 200;<br>
	* &nbsp;canvas.height = 200;<br>
	* &nbsp;var ctx = canvas.getContext('2d');<br>
	* &nbsp;document.body.appendChild(canvas);<br>
	* &nbsp;<br>
	* &nbsp;for (var x = 0; x < canvas.width; x++) {<br>
	* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;for (var y = 0; y < canvas.height; y++) {<br>
	* &nbsp;<br>
	* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;var r = Math.random(); // REGULAR RANDOM<br>
	* &nbsp;<br>
	* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;var c = r * 255;<br>
	* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ctx.fillStyle = "rgba("+c+","+c+","+c+",255)";<br>
	* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ctx.fillRect(x,y, 1, 1 );<br>
	* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}<br>
	* &nbsp;}<br>
	* &nbsp;<br>
	* </code>
	* <br>
	* <img src="../assets/images/random.png">
	* <br><br>
	* <code class="code prettyprint">
	* &nbsp;var s = 0.1; // scale back x,y values for noise<br>
	* &nbsp;for (var x = 0; x < canvas.width; x++) {<br>
	* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;for (var y = 0; y < canvas.height; y++) {<br>
	* &nbsp;<br>
	* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;var r = BB.Maths.noise(x*s,y*s); // PERLIN NOISE<br>
	* &nbsp;<br>
	* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;var c = r * 255;<br>
	* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ctx.fillStyle = "rgba("+c+","+c+","+c+",255)";<br>
	* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ctx.fillRect(x,y, 1, 1 );<br>
	* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}<br>
	}
	* </code>
	* <br>
	* <img src="../assets/images/noise.png">
	*/
	static noise(x, y, z) {

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

		y = (typeof y!=="undefined") ? y : 0;
		z = (typeof z!=="undefined") ? z : 0;

		this._mErr("noise",[x,y,z]);

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
	}

}

if( typeof module !== "undefined") module.exports = Maths;
