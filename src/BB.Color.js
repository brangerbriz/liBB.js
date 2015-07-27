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
            'tetradic' : []
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
                this._r = r || 204;    
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
                this._g = g || 51;    
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
                this._b = b || 153;    
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
                this._a = a || 0;    
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
                this._h = h || 0;    
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
                this._s = s || 0;    
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
                this._v = v || 0;    
                this.hsv2rgb(); 
            }
        }
    });


    /**
     * returns rgb string for color
     * @method getRGB
     * @return {String} for example <code>'rgb(255,0,0)'</code>
     */
    BB.Color.prototype.getRGB = function() { 
        return 'rgb('+this.r+', '+this.g+', '+this.b+')';
    };

    /**
     * returns rgba string for color
     * @method getRGBA
     * @return {String} for example <code>'rgba(255,0,0,255)'</code>
     */
    BB.Color.prototype.getRGBA = function() { 
        return 'rgba('+this.r+', '+this.g+', '+this.b+', '+this.a+')';
    };

    /**
     * returns hex string for color
     * @method getHex
     * @return {String} for example <code>'#ff0000'</code>
     */
    BB.Color.prototype.getHex = function() { 
        return "#" +((this.r << 16) | (this.g << 8) | this.b).toString(16);
    };



    //


    /**
     * sets color value to match another color object's value
     * @method copy
     * @param {BB.Color} color another color object to copy from
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
     * @param  {Number} [hsv] either an instance of BB.Color or a h value between 0 - 359
     * @param  {Number} [s]   a saturation value between 0 - 100
     * @param  {Number} [v]   a brightness/lightness value value between 0 - 100
     * @return {Object}     an object with r, g, b properties
     */
    BB.Color.prototype.hsv2rgb = function( hsv, s, v ) { 

        var rgb;
        if( typeof hsv == "undefined"){

            rgb = this;
            hsv = { h:this.h, s:this.s, v:this.v };

        } else {

            rgb = {};
            hsv = ( hsv instanceof BB.Color ) ? hsv : { h:hsv, s:s, v:v };

        }


        if( typeof hsv == "undefined" && hsv.s === 0 ){

            this._r = this._g = this._b = Math.round( hsv.v * 2.55 );

            return this;

        } else if ( typeof hsv !== "undefined" && hsv.s === 0 ) {

            rgb.r = rgb.g = rgb.b = Math.round( hsv.v * 2.55 );

            return rgb;

        } else {

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

            if( typeof hsv == "undefined"){

                this._r = rgb.r;         
                this._g = rgb.g;  
                this._b = rgb.b;    

            } 
            
            return rgb;
        }
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
        if( typeof _schemeUse !== "undefined") return col;
        else this.setRGBA( col.r, col.g, col.b, col.a );
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
        if( typeof _schemeUse !== "undefined") return col;
        else this.setRGBA( col.r, col.g, col.b, col.a );
    };



    /**
     * generates a color scheme ( array of additional color values ) from the
     * base color.
     *
     * the colors are stored in an array in the <code>.schemes</code> property (
     * object ) and can be accessed by passing it the key ( name of ) the color
     * scheme you generated like so: <code> .schemes["triadic"] </code>, which
     * will return an array of objects ( with r, g, b, a properties )
     * 
     * @method createScheme
     * 
     * @param  {String} scheme name of the color scheme you want to generate.
     * can be either "monochromatic", "analogous", "complementary", "split
     * complementary", "triadic" or "tetradic"
     * 
     * @param  {Object} config object with properties for angle (Number) for hue
     * shift ( this is required by all schemes except for "complimentary" and
     * "triadaic", which by definition have hardcoded angles of 180 and 240/120
     * respectively ), tint (Array of Floats) and shade (Array of Flaots), which
     * are used to create monochromatic colors ( tint for light variations of
     * the base color and shade for dark ), these are required when creating
     * "monochromatic" scheme ( which is essentially just a set of tint/shade
     * variations from the base color ) and optional for the other schemes (
     * used if you want monochromatic varients calculated of the colors produced
     * by that particular scheme )
     * 
     * @example 
     * <code class="code prettyprint"> 
     * &nbsp; color.createScheme("analogous",{                          <br>        
     * &nbsp;&nbsp;&nbsp;&nbsp; angle: 30,                             <br> 
     * &nbsp;&nbsp;&nbsp;&nbsp; tint:[ 0.4, 0.8 ],                     <br> 
     * &nbsp;&nbsp;&nbsp;&nbsp; shade:[ 0.3, 0.6 ]                     <br> 
     *&nbsp; });                                                       <br><br>
     * &nbsp; color.schemes["analogous"][0] // returns first color     <br> 
     * &nbsp; color.schemes["analogous"][1] // returns second color    <br> 
     * </code>
     */
    BB.Color.prototype.createScheme = function( scheme, config ) { 

        if( !(scheme in this.schemes) ) {
            throw new Error("BB.Color.createScheme: '"+scheme+"' is not a valid scheme name, choose from: "+Object.keys(this.schemes) );
        }

        // var errorMsg;
        // switch( scheme ) {
        //     case "monochromatic": errorMsg = '"monochromatic" requires a second parameter: a config object with tint Array and/or shade Array'; break;
        //     case "analogous": errorMsg = "this scheme requires a config object with an angle property"; break;
        //     case "complementary" : errorMsg=false; break;
        //     case "split complementary": errorMsg = "this scheme requires a config object with an angle property"; break;
        //     case "triadic" : errorMsg=false; break;
        //     case "tetradic": errorMsg = "this scheme requires a config object with an angle property"; break;
        // }

        // if(typeof config !== "object" && errorMsg){ 
        if( typeof config === "object" || typeof config === "undefined"  ){ 
            
            // throw new Error("BB.Color.createScheme: "+errorMsg );
            
            if( typeof config === "undefined" ) config = {};
            
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
        
        }

        if( typeof config !== "object" ) {

            throw new Error("BB.Color.createScheme: config parameter should be an Object" );

        } else {

            // if(typeof config !== "object"){
            //     config = {}; // bug fix, schemes that don't require config erroring w/out some kinda object
            // }

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

            if( scheme == "monochromatic" )     this._schemeVarient( scheme, config );
            if( ones.indexOf( scheme ) >= 0 )    this._schemeVarient( scheme, config, angles[0] );
            if( twos.indexOf( scheme ) >= 0 )    this._schemeVarient( scheme, config, angles[1] );
            if( threes.indexOf( scheme ) >= 0 )  this._schemeVarient( scheme, config, angles[2] );
                         
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

        this.schemes[scheme].push({ r:rgb.r, g:rgb.g, b:rgb.b, a:this.a });
        
        if( typeof config.shade !== "undefined" ){
            config.shade.sort(function(a,b){return b - a;}); // reorder largest to smallest

            for (var j = 0; j < config.shade.length; j++) {
                var col2 = this.shade( config.shade[j], true );
                this.schemes[scheme].push( col2 );
            }
        }

        for (var ii = 0; ii < this.schemes[scheme].length; ii++) {
            var self = this.schemes[scheme][ii];
                self.hex = "#" +((self.r << 16) | (self.g << 8) | self.b).toString(16);
                self.rgb = 'rgb('+self.r+', '+self.g+', '+self.b+')';
                self.rgba = 'rgba('+self.r+', '+self.g+', '+self.b+', '+self.a+')';
        }
    };

    return BB.Color;
});