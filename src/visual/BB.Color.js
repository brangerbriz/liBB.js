/* jshint esversion: 6 */

/**
 * A module for creating color objects, color schemes and doing color maths.
 * @class BB.Color
 * @constructor
 *
 * @param {Number} [r] optional parameter for setting the red value (0-255)
 * @param {Number} [g] optional parameter for setting the green value (0-255)
 * @param {Number} [b] optional parameter for setting the blue value (0-255)
 * @param {Number} [a] optional parameter for setting the alpha value (0-255)
 * @example
 * <pre class="code prettyprint"> var color = new BB.Color(255,0,0); </pre>
 */
class Color {

	constructor( r, g, b, a ){
		this.err = new BB.ValidArg(this); // example

		this.err.checkType(r,["undefined","number"],"r");
		this.err.checkType(g,["undefined","number"],"g");
		this.err.checkType(b,["undefined","number"],"b");
		this.err.checkType(a,["undefined","number"],"a");

		this._r = (typeof r!=="undefined") ? r : 228;
		this._g = (typeof g!=="undefined") ? g : 4;
		this._b = (typeof b!=="undefined") ? b : 119;
		this._a = (typeof a!=="undefined") ? a : 255;

		this.err.checkRange(this._r,0,255,"r");
		this.err.checkRange(this._g,0,255,"g");
		this.err.checkRange(this._b,0,255,"b");
		this.err.checkRange(this._a,0,255,"a");

		this.rgb2hsv();

	}

	/**
	* the red value between 0 - 255
	* @type {Number}
	* @property r (red)
	* @default 228
	*/
	set r( r ){
		this.err.checkRange( r, 0, 255,'r');
		this._r = r;
		this.rgb2hsv();
	}
	get r(){ return this._r; }

	/**
	* the green value between 0 - 255
	* @property g (green)
	* @type Number
	* @default 4
	*/
	set g( g ){
		this.err.checkRange( g, 0, 255,'g');
		this._g = g;
		this.rgb2hsv();
	}
	get g(){ return this._g; }

	/**
	* the blue value between 0 - 255
	* @property b (blue)
	* @type Number
	* @default 119
	*/
	set b( b ){
		this.err.checkRange( b, 0, 255,'b');
		this._b = b;
		this.rgb2hsv();
	}
	get b(){ return this._b; }

	/**
	* the alpha value between 0 - 255
	* @property a (alpha)
	* @type Number
	* @default 255
	*/
	set a( a ){
		this.err.checkRange( a, 0, 255,'a');
		this._a = a;
		this.rgb2hsv();
	}
	get a(){ return this._a; }

	/**
	* the hue value between 0 - 359
	* @property h (hue)
	* @type Number
	* @default 0
	*/
	set h( h ){
		this.err.checkRange( h, 0, 359,'h');
		this._h = h;
		this.hsv2rgb();
	}
	get h(){ return this._h; }

	/**
	* the saturation value between 0 - 100
	* @property s (saturation)
	* @type Number
	* @default 0
	*/
	set s( s ){
		this.err.checkRange( s, 0, 100,'s');
		this._s = s;
		this.hsv2rgb();
	}
	get s(){ return this._s; }

	/**
	* the brightness/lightness value between 0 - 100
	* @property v (value)
	* @type Number
	* @default 0
	*/
	set v( v ){
		this.err.checkRange( v, 0, 100,'v');
		this._v = v;
		this.hsv2rgb();
	}
	get v(){ return this._v; }


	/**
	* the base color's rgb string
	* @property rgb
	* @type String
	* @default "rgb(228,4,119)"
	*/
	set rgb( v ){
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
	get rgb(){ return 'rgb('+this.r+', '+this.g+', '+this.b+')'; }



	/**
	* the base color's rgba string
	* @property rgba
	* @type String
	* @default "rgba(228,4,119,1)"
	*/
	set rgba( v ){
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
	get rgba(){
		return 'rgba('+this.r+', '+this.g+', '+this.b+','+Math.floor((this.a/255)*100)/100+')';
	}

	/**
	* the base color's hex string
	* @property hex
	* @type String
	* @default "#e40477"
	*/
	set hex( v ){
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
					let a;
					if(v.length === 7 ){
						v = v.substr(1,v.length-1);
						a = [ v.substr(0,v.length-4), v.substr(2,v.length-4), v.substr(4,v.length-4)];
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
	get hex(){
		// return "#" +((this.r << 16) | (this.g << 8) | this.b).toString(16);
		let r = this.r.toString(16);
		let g = this.g.toString(16);
		let b = this.b.toString(16);
		r = (r.length==1) ? "0"+r : r;
		g = (g.length==1) ? "0"+g : g;
		b = (b.length==1) ? "0"+b : b;
		return "#"+r+g+b;
	}

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
	setRGBA(r, g, b, a) {

		this.err.checkRange(r,0,255,'r');
		this.err.checkRange(g,0,255,'g');
		this.err.checkRange(b,0,255,'b');
		this.err.checkRange(a,0,255,'a');

		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;

		this.rgb2hsv();
		return this;
	}

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
	setHSVA(h, s, v, a) {

		this.err.checkRange(h,0,359,'h');
		this.err.checkRange(s,0,100,'s');
		this.err.checkRange(v,0,100,'v');
		this.err.checkRange(a,0,255,'a');

		this.h = h;
		this.s = s;
		this.v = v;
		this.a = a;

		this.hsv2rgb();
		return this;
	}

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
	* @return {Object}	an object with h, s, v properties
	*/
	rgb2hsv( rgb, g, b ) {

		var self;
		if( typeof rgb == "undefined"){
			self = this;
		} else {
			self = ( rgb instanceof Color ) ? rgb : { r:rgb, g:g, b:b };
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
	}

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
	* @return {Object}an object with r, g, b properties
	*/
	hsv2rgb( h, s, v ) {
		var rgb, hsv;

		if( typeof h == "undefined"){

			rgb = { r:this.r, g:this.g, b:this.b };
			hsv = { h:this.h, s:this.s, v:this.v };

		} else {

			rgb = {};
			hsv = ( h instanceof Color ) ? h.clone() : { h:h, s:s, v:v };
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

	}

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
	shift( degrees, hue ) {
		this.err.checkRange(degrees,0,359,"degrees");
		this.err.checkType(hue,["number","undefined"],"hue");

		let h;
		if( typeof hue === "undefined" ) h = this.h;
		else  h = hue;
		h += degrees;

		while ( h>=360.0 )  h -= 360.0;
		while ( h<0.0 )	    h += 360.0;

		if( typeof hue === "undefined" ){
			this.h = h;
			return this; // for chaining
		}
		else {  return h; }
	}

	/**
	* changes the color by lightening it by a certain percentage
	*
	* @method tint
	* @param {Number} percentage float between 0 and 1
	* @return {BB.Color} this color
	* @chainable
	*/
	tint( percentage, _schemeUse ) {
		this.err.checkRange(percentage,0,1,"percentage");
		let col = {};
		let tint = percentage;
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
	}


	/**
	* changes the color by darkening it by a certain percentage
	*
	* @method shade
	* @param {Number} percentage float between 0 and 1
	* @return {BB.Color} this color
	* @chainable
	*/
	shade( percentage, _schemeUse ) {
		this.err.checkRange(percentage,0,1,"percentage");
		let col = {};
		let shade = percentage;
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
	}

	// ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~
	// ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~

	/**
	* sets color value to match another color object's value
	* @method copy
	* @param {BB.Color} color another color object to copy from
	* @return {BB.Color} this color
	* @chainable
	* @example
	* <code class="code prettyprint">
	* &nbsp; var x = new BB.Color(0,255,0); <br>
	* &nbsp; var y = new BB.Color(100,100,100); <br>
	* &nbsp; y.copy( x ); <br>
	* &nbsp; y.rgb; // returns 'rgb(0,255,0)';
	* </code>
	*/
	copy( color ) {
		this.err.checkInstanceOf( color, BB.Color, 'color' );
		this.setRGBA( color.r, color.g, color.b, color.a );
		return this;
	}

	/**
	* creates a new color object that is a copy of itself
	* @method clone
	* @return {BB.Color} a new color object copied from this one
	* @example
	* <code class="code prettyprint">
	* &nbsp; var x = new BB.Color(0,255,0); <br>
	* &nbsp; var y = x.clone(); <br>
	* &nbsp; y.rgb; // returns 'rgb(0,255,0)';
	* </code>
	*/
	clone() {
		let child = new Color();
			child.copy( this );
		return child;
	}

	/**
	* checks if another color object is equal to itself
	*
	* @method isEqual
	* @param {BB.Color} color another color object to compare to
	* @param {Boolean} excludeAlpha Whether or not to exlude Alpha property. True by default.
	* @return {Boolean}     true if it's equal, false if it's not
	*/
	isEqual(color, excludeAlpha) {

		this.err.checkInstanceOf( color, BB.Color, 'color');

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
	}

	min3( a,b,c ) {
		return ( a<b )   ?   ( ( a<c ) ? a : c )   :   ( ( b<c ) ? b : c );
	}

	max3( a,b,c ) {
		return ( a>b )   ?   ( ( a>c ) ? a : c )   :   ( ( b>c ) ? b : c );
	}

	// ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~
	// ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~

	/**
	* returns a color scheme ( array of BB.Color objects ) from
	* an input color, color scheme name and optinoal parameters
	*
	* @static
	* @method createScheme
	*
	* @param  {BB.Color} color a BB.Color object from which to generate the color
	* scheme, this is essentially the input color.
	*
	* @param  {String} scheme name of the color scheme you want to generate.
	* can be either "monochromatic", "analogous", "complementary",
	* "splitcomplementary", "triadic", "tetradic" or "random"
	*
	* @param  {Object} [config] object with properties for <b>angle</b> (Number) for hue
	* shift ( for schemes other than "complimentary" or "triadic" which have fixed
	* angles ), <b>tint</b> (Array of Floats) and <b>shade</b> (Array of Floats), which
	* are used to create aditional monochromatic colors ( tint for light variations of
	* the base color and shade for dark ) in relation to the base colors of each scheme
	*
	* the "random" scheme takes an entirely different config object with values for <b>count</b>, <b>hue</b>,
	* <b>saturation</b> and <b>value</b>. when no config is sent it generates entirely random colors.
	* when a <code>{ hue: 200 }</code> is passed than you'd get random shades of blue, etc.
	*
	* if you need a color scheme/theory refersher: <a href="http://www.tigercolor.com/color-lab/color-theory/color-theory-intro.htm" target="_blank"> check this out</a>
	* @example
	* Here's a basic example:<br>
	* <code class="code prettyprint"><br>
	* &nbsp;var clr = new BB.Color();<br>
	* &nbsp;var mono = BB.Color.createScheme( clr, "monochromatic" );<br>
	* &nbsp;// returns [BB.Color, BB.Color, BB.Color, BB.Color, BB.Color]<br>
	* &nbsp;// where each color is another step in a monochromatic color scheme <br>
	* </code><br>
	* The returned Array ( if visualized ) would look like this:<br>
	* <img src="../assets/images/monochromatic.png"><br>
	* Notice that it has 5 colors, this is the default length for the "monochromatic"
	* color scheme. Each scheme has a different default length. ( see this page for a refersher on <a href="http://www.tigercolor.com/color-lab/color-theory/color-theory-intro.htm" target="_blank"> color theory </a> ) Here' what the others
	* would look like:<br>
	* <img src="../assets/images/color-schemes.png"><br>
	* The <code>createScheme()</code> method can also take an additional config parameter, for example:<br>
	* <code class="code prettyprint"><br>
	* &nbsp;var clr = new BB.Color();<br>
	* &nbsp;var ana = BB.Color.createScheme( clr, "analogous",{<br>
	* &nbsp; angle:90<br>
	* &nbsp;});<br>
	* </code><br>
	* the <b>angle</b> parameter changes the anglular distance from the input color, the default
	* angle for analogous schemes is 30 ( left image ), we can pass a custom angle property
	* to the config object ( inthis case 90, right image ). Only analogous, splitcomplementary
	* and tetradic can have custom angles ( the others by definiton have specific angles, for
	* example complimentary colors are always 180 degrees from eachother )<br>
	* <div>
	* <img src="../assets/images/analogous30.png">
	* <img src="../assets/images/analogous90.png">
	*</div><br>
	* <code class="code prettyprint"><br>
	* &nbsp;var clr = new BB.Color();<br>
	* &nbsp;var comp = BB.Color.createScheme( clr, "complementary",{<br>
	* &nbsp; tint: [0.25, 0.5],<br>
	* &nbsp; shade: [0.25, 0.5]<br>
	* &nbsp;});<br>
	* </code><br>
	* the <b>tint</b> property adds a light variations of the scheme color while the
	* <b>shade</b> property adds dark variations. In the example above we've added
	* custom tints ( 0.25 and 0.5 ) and shades ( 0.25 and 0.5 ). The monochromatic
	* scheme contains default tints/shades ( these will be overridden if you pass
	* your own custom values ).
	* <div>
	* <img src="../assets/images/complimentary_default.png">
	* <img src="../assets/images/complimentary_custom.png">
	*</div><br>
	*/
	static createScheme( color, scheme, config ) {

		let schemes = [
			'monochromatic',
			'analogous',
			'complementary',
			'splitcomplementary',
			'triadic',
			'tetradic',
			'random'];

		// ERROR CHECKING ------------------------------------------------------

		let err = new BB.ValidArg(this);
		err.checkInstanceOf(color,BB.Color,'color');

		if( schemes.indexOf(scheme) ==-1 )
			throw new Error(`BB.Color.createScheme: ${scheme} is not a valid scheme name, choose from ${schemes}`);

		err.checkType(config,["object","undefined"],"config");
		if( typeof config === "undefined" ) config = {};


		// LOCAL FUNCTIONS -----------------------------------------------------

		function schemeVarient( color, scheme, config, angle ) {

			let rgb, hsv, self;
			let schemeValues = [];

			if( scheme == "monochromatic" ){
				rgb = {r:color.r, g:color.g, b:color.b };
			} else {
				rgb     = { r:color.r, g:color.g, b:color.b };
				hsv     = color.rgb2hsv( rgb.r, rgb.g, rgb.b );
				hsv.h   = color.shift( hsv.h, angle );
				rgb     = color.hsv2rgb( hsv.h, hsv.s, hsv.v );
			}

			self = new BB.Color(rgb.r, rgb.g, rgb.b );

			if( typeof config.tint !== "undefined" ){
				// reorder largest to smallest
				config.tint.sort(function(a,b){return b - a;});

				for (let i = 0; i < config.tint.length; i++) {
					let col = self.tint( config.tint[i], true );
					schemeValues.push( col );
				}
			}

			let copy = self.clone();
			schemeValues.push( copy );

			if( typeof config.shade !== "undefined" ){
				// reorder largest to smallest
				config.shade.sort(function(a,b){return b - a;});

				for (let j = 0; j < config.shade.length; j++) {
					let col2 = self.shade( config.shade[j], true );
					schemeValues.push( col2 );
				}
			}

			return schemeValues;
		}

		function randomVarients( scheme, config ){
			let schemeValues = [];

			if( typeof config.count === "undefined" ) config.count = 5;

			for (let i = 0; i < config.count; i++) {
				let self = new BB.Color();

				let hue = ( typeof config.hue === "undefined" ) ? Math.floor( Math.random()*360 ) : config.hue;
				let sat = ( typeof config.saturation === "undefined" ) ? Math.floor( Math.random()*100 ) : config.saturation;
				let value = ( typeof config.value === "undefined" ) ? Math.floor( Math.random()*100 ) : config.value;
				let alpha;
				if( typeof config.alpha !== "undefined" ){
					alpha = ( config.alpha == "random" ) ? Math.floor( Math.random() * 255 ) : config.alpha;
				} else { alpha = 255; }

				let clr = self.hsv2rgb( hue, sat, value );
					clr.a = alpha;

				// let col = new BB.Color( clr.r, clr.g, clr.b, clr.a );
				self.setRGBA(clr.r, clr.g, clr.b, clr.a);
				schemeValues.push( self );
				// this.schemes[scheme].push( col );

			}
			return schemeValues;
		}

		// SET DEFAULTS --------------------------------------------------------

		if( typeof config.angle === "undefined" ){
			if(scheme=="tetradic") config.angle = 40;
			else config.angle = 30;
		}

		if( scheme == "monochromatic" ){
			if( typeof config.tint === "undefined" ){ config.tint = [0.4,0.8]; }
			else if( !(config.tint instanceof Array) )
				throw new Error("BB.Color.createScheme: tint should be an Array of floats between 0.0-1.0");

			if( typeof config.shade === "undefined" ) config.shade = [0.3,0.6];
			else if( !(config.shade instanceof Array) )
				throw new Error("BB.Color.createScheme: shade should be an Array of floats between 0.0-1.0");
		}

		if( scheme == "random" )
			if( typeof config.count === "undefined" ){ config.count = 5; }


		// GENERATING THE SCHEME -----------------------------------------------

		let angles;
		switch( scheme ) {
			case "analogous": angles = [ config.angle, 0-config.angle ];  break;
			case "complementary" : angles = [ 180 ];  break;
			case "splitcomplementary": angles = [ 180-config.angle, 180+config.angle];  break;
			case "triadic" : angles = [ 240, 120 ];  break;
			case "tetradic": angles = [ 180, -config.angle, -config.angle+180 ];  break;
		}

		let ones = ["analogous","complementary","splitcomplementary","triadic","tetradic"];
		let twos = ["analogous","splitcomplementary","triadic","tetradic"];
		let threes = ["tetradic"];

		let clrs = [];
		if( scheme == "monochromatic" )
			clrs = clrs.concat( schemeVarient( color, scheme, config ) );
		if( ones.indexOf( scheme ) >= 0 )
			clrs = clrs.concat( schemeVarient( color, scheme, config, angles[0] ) );
		if( twos.indexOf( scheme ) >= 0 )
			clrs = clrs.concat( schemeVarient( color, scheme, config, angles[1] ) );
		if( threes.indexOf( scheme ) >= 0 )
			clrs = clrs.concat( schemeVarient( color, scheme, config, angles[2] ) );

		if( scheme == "random" ) return randomVarients( scheme, config );
		else return clrs;

	}
}

module.exports = Color;





/* ~ * ~ liBB ~ * ~ */
