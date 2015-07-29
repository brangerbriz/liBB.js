/**
 * A module for creating color objects and doing color maths
 * @module BB.Color
 */
define(['./BB'],
function(  BB){

    'use strict';
    
    /**
     * A module for creating color objects and doing color maths
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
            this._r = r || 204;     
        }

        // see getter/setter below
        if( typeof g == "undefined" ){
            this._g = 51; 
        }
        else if( typeof g !== 'number' || g<0 || g>255 ){
            throw new Error("BB.Color: green parameter neeeds to be a NUMBER between 0 - 255");
        } else {
            this._g = g || 51;        
        }

        // see getter/setter below
        if( typeof b == "undefined" ){
            this._b = 153; 
        }
        else if( typeof b !== 'number' || b<0 || b>255 ){
            throw new Error("BB.Color: blue parameter neeeds to be a NUMBER between 0 - 255");
        } else {
            this._b = b || 153;        
        }

        // see getter/setter below
        if( typeof a == "undefined" ){
            this._a = 255; 
        }
        else if(  a<0 || a>255 ){
            throw new Error("BB.Color: alpha parameter neeeds to be a NUMBER between 0 - 255");
        } else {
            this._a = a || 255;        
        }

       this.rgb2hsv();

        /**
         * object with properties ( named after different color schemes ) for
         * holding arrays of the color values generated with the
         * <code>createScheme()</code> method. the colors are Objects with r, g,
         * b, a values as well as rgb(string), rgba(string) and hex(string)
         * 
         * @type {Object}
         * @property schemes
         */
        this.schemes = {
            'monochromatic' : [],
            'analogous' : [],
            'complementary' : [],
            'split complementary' : [],
            'triadic' : [],
            'tetradic' : [],
            'random' : []
        };
    };

    /**
     * the red value between 0 - 255
     * @property r
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
     * @property g
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
     * @property b
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
     * @property a
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
     * @property h
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
     * @property s
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
     * @property v
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


    //


    /**
     * sets color value to match another color object's value
     * @method copy
     * @param {BB.Color} color another color object to copy from
     * @example
     * <code class="code prettyprint">
     * &nbsp; var x = new color(0,255,0); <br>
     * &nbsp; var y = new color(100,100,100); <br>
     * &nbsp; y.copy( x ); <br>
     * &nbsp; y.getRGB(); // returns 'rgb(0,255,0)';                          <<<<<<< EDIT <<<<<<<< NO MORE RGB
     * </code>
     */
    BB.Color.prototype.copy = function( color ) { 
        if (! color || !this.isLikeColor( color ) ) {
            throw new Error("BB.Color.copy: color parameter is not an instance of BB.Color");
        }
        this.setRGBA( color.r, color.g, color.b, color.a );
    };

    /**
     * creates a new color object that is a copy of itself
     * @method clone
     * @return {BB.Color} a new color object copied from this one
     * @example
     * <code class="code prettyprint">
     * &nbsp; var x = new color(0,255,0); <br>
     * &nbsp; var y = x.clone(); <br>
     * &nbsp; y.getRGB(); // returns 'rgb(0,255,0)';
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
    };
    
    /**
     * sets the h(hue) s(saturation) v(value) of the color
     * @method setHSVA
     * @param {Number} h sets the hue value from 0 - 359
     * @param {Number} s sets the saturation value from 0 - 100
     * @param {Number} v sets the light/bright value from 0 - 100
     * @param {Number} a sets the alpha value from 0 - 255
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
    };



    //


    /**
     * checks if another color object is equal to itself
     * 
     * @method isEqual
     * @param {BB.Color} color another color object to compare to
     * @param {Boolean} excludeAlpha whether or not to exlude Alpha property
     * @return {Boolean}     true if it's equal, fals if it's not
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

    BB.Color.prototype.isLikeColor = function( obj) { 
       return   typeof obj.r !== "undefined" &&
                typeof obj.g !== "undefined" &&
                typeof obj.b !== "undefined" &&
                typeof obj.a !== "undefined";
    }; 

    BB.Color.prototype.min3 = function( a,b,c ) { 
        return ( a<b )   ?   ( ( a<c ) ? a : c )   :   ( ( b<c ) ? b : c ); 
    }; 
    
    BB.Color.prototype.max3 = function( a,b,c ) { 
        return ( a>b )   ?   ( ( a>c ) ? a : c )   :   ( ( b>c ) ? b : c );
    };


    //


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
        var max = this.max3( self.r, self.g, self.b );
        var dif = max - this.min3( self.r, self.g, self.b );

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
     * @param  {Number} [h] either an instance of BB.Color or a h value between 0 - 359
     * @param  {Number} [s]   a saturation value between 0 - 100
     * @param  {Number} [v]   a brightness/lightness value value between 0 - 100
     * @return {Object}     an object with r, g, b properties
     */
    BB.Color.prototype.hsv2rgb = function( h, s, v ) { 
        var rgb, hsv;
        if( typeof h == "undefined"){

            rgb = this;
            hsv = { h:this.h, s:this.s, v:this.v }; 

        } else {

            rgb = {};
            hsv = ( h instanceof BB.Color ) ? h : { h:h, s:s, v:v };
        }
   
        hsv.h /= 60;
        hsv.s /= 100;
        hsv.v /= 100;

        if(hsv.v===0) hsv.v = 0.1; // hack, bugging out when hsv.v is 0 
        
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
     * changes the color by shifting current hue value by a number of degrees, also chainable ( see example )
     *
     * can also take an additional hue parameter when used as a utility ( see example ), used this way internally by <code>.createScheme</code>
     *
     * @method shift
     * @chainable
     * @param {Number} degrees number of degress to shift current hue by ( think rotating a color wheel )
     * @return {BB.Color} this color
     * @example
     * <code class="code prettyprint">
     * &nbsp; color.shift( 10 ); // shifts by 10 degrees <br>
     * &nbsp; var comp = color.clone().shift( 180 ); // new complementary color obj <br><br>
     * &nbsp; // as a utility ( without changing the color )  <br>
     * &nbsp; color.shift( 180, color.h ); // returns the complementary hue ( in degrees ) 
     * </code>
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
            return this; // for chainging
        } 
        else {  return h; }
    };

    /**
     * changes the color by lightening it by a certain percentage
     *
     * @method tint
     * @param {Number} percentage float between 0 and 1
     */
    BB.Color.prototype.tint = function( percentage, _schemeUse ) { 
        var col = {};
        var tint = percentage;
        col.r = Math.round( this.r+(255-this.r ) * tint );
        col.g = Math.round( this.g+(255-this.g ) * tint );
        col.b = Math.round( this.b+(255-this.b ) * tint );
        col.a = this.a;
        if( typeof _schemeUse !== "undefined") {
            return new BB.Color( col.r, col.g, col.b, col.a );
        }
        else { this.setRGBA( col.r, col.g, col.b, col.a ); }
    };


    /**
     * changes the color by darkening it by a certain percentage
     *
     * @method shade
     * @param {Number} percentage float between 0 and 1
     */
    BB.Color.prototype.shade = function( percentage, _schemeUse ) { 
        var col = {};
        var shade = percentage;
        col.r = Math.round( this.r * shade );
        col.g = Math.round( this.g * shade );
        col.b = Math.round( this.b * shade );
        col.a = this.a;
        if( typeof _schemeUse !== "undefined") {
            return new BB.Color( col.r, col.g, col.b, col.a );
        }
        else { this.setRGBA( col.r, col.g, col.b, col.a ); }
    };



    /**
     * generates a color scheme ( array of additional color values ) from the
     * base color.
     *
     * the colors are stored in an array in the <code>.schemes</code> property (
     * object ) and can be accessed by passing it the key ( name of ) the color
     * scheme you generated like so: <code> .schemes["triadic"] </code>, which
     * will return an array of objects ( with r, g, b, a, rgb[string],
     * rgba[string], hex[string] properties )
     * 
     * @method createScheme
     * 
     * @param  {String} scheme name of the color scheme you want to generate.
     * can be either "monochromatic", "analogous", "complementary", "split
     * complementary", "triadic" or "tetradic"
     * 
     * @param  {Object} optional config object with properties for angle (Number) for hue
     * shift ( for schemes other than "complimentary" or "triadic" which have fixed 
     * angles ), tint (Array of Floats) and shade (Array of Flaots), which
     * are used to create monochromatic colors ( tint for light variations of
     * the base color and shade for dark ) in relation to the base colors of each scheme
     * 
     * @example  <code class="code prettyprint">  
     * &nbsp; color.createScheme("complementary");<br>
     * &nbsp; color.createScheme("analogous",{ <br> 
     * &nbsp;&nbsp;&nbsp;&nbsp; angle: 30,<br> 
     * &nbsp;&nbsp;&nbsp;&nbsp; tint:[ 0.4, 0.8 ], <br>
     * &nbsp;&nbsp;&nbsp;&nbsp; shade:[ 0.3, 0.6 ] <br> 
     * &nbsp; }); <br><br>
     * &nbsp; color.schemes["analogous"][0] // returns first color <br> &nbsp;
     * color.schemes["analogous"][1] // returns second color <br> </code>
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
                case "split complementary": angles = [ 180-config.angle, 180+config.angle];  break;
                case "triadic" : angles = [ 240, 120 ];  break;
                case "tetradic": angles = [ 180, -config.angle, -config.angle+180 ];  break;
            }

            var ones = ["analogous","complementary","split complementary","triadic","tetradic"];
            var twos = ["analogous","split complementary","triadic","tetradic"];
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

        if( scheme == "monochromatic" ){
            rgb = this;
        } else {
            rgb     = { r:this.r, g:this.g, b:this.b };
            hsv     = this.rgb2hsv(     rgb.r, rgb.g, rgb.b     );
            hsv.h   = this.shift(   hsv.h, angle  );
            rgb     = this.hsv2rgb(     hsv.h, hsv.s, hsv.v     );            
        }


        if( typeof config.tint !== "undefined" ){
            config.tint.sort(function(a,b){return b - a;}); // reorder largest to smallest

            for (var i = 0; i < config.tint.length; i++) {
                var col = this.tint( config.tint[i], true );
                this.schemes[scheme].push( col );
            }
        }

        var copy = this.clone();
        this.schemes[scheme].push( copy );
        
        if( typeof config.shade !== "undefined" ){
            config.shade.sort(function(a,b){return b - a;}); // reorder largest to smallest

            for (var j = 0; j < config.shade.length; j++) {
                var col2 = this.shade( config.shade[j], true );
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