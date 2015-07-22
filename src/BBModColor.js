/**
 * A module for creating color objects and doing color maths
 * @module BBModColor
 */
define(function(){

    'use strict';
    
    /**
     * A module for creating color objects and doing color maths
     * @class BBModColor
     * @constructor
     * @param {Number} [r] optional parameter for setting the red value (0-255)
     * @param {Number} [g] optional parameter for setting the green value (0-255)
     * @param {Number} [b] optional parameter for setting the blue value (0-255)
     * @param {Number} [a] optional parameter for setting the alpha value (0-255)
     * @example 
     * <section><code class="javascript"> 
     * &nbsp; var color = new BBModColor(255,0,0); 
     * </code></section>
     */

    function BBModColor(r, g, b, a) {

        // see getter/setter below
        if( typeof r == "undefined" ){
            this._r = 0; 
        }
        else if( typeof r !== 'number' || r<0 || r>255 ){
            throw new Error("BBModColor: red parameter neeeds to be a NUMBER between 0 - 255");
        } else {
            this._r = r || 0;     
        }

        // see getter/setter below
        if( typeof g == "undefined" ){
            this._g = 0; 
        }
        else if( typeof g !== 'number' || g<0 || g>255 ){
            throw new Error("BBModColor: green parameter neeeds to be a NUMBER between 0 - 255");
        } else {
            this._g = g || 0;        
        }

        // see getter/setter below
        if( typeof b == "undefined" ){
            this._b = 0; 
        }
        else if( typeof b !== 'number' || b<0 || b>255 ){
            throw new Error("BBModColor: blue parameter neeeds to be a NUMBER between 0 - 255");
        } else {
            this._b = b || 0;        
        }

        // see getter/setter below
        if( typeof a == "undefined" ){
            this._a = 255; 
        }
        else if(  a<0 || a>255 ){
            throw new Error("BBModColor: alpha parameter neeeds to be a NUMBER between 0 - 255");
        } else {
            this._a = a || 255;        
        }

       this.rgb2hsv();

        /**
         * object with properties ( named after different color schemes ) for
         * holding arrays of the color values generated with the <code>colorScheme()</code>
         * method
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
     * @default 0
     */   
    Object.defineProperty(BBModColor.prototype, "r", {
        get: function() {
            return this._r;
        },
        set: function(r) {
            if( typeof r !== 'number' || r<0 || r>255 ){
                throw new Error("BBModColor: red parameter neeeds to be a NUMBER between 0 - 255");
            } else {
                this._r = r || 0;    
                this.rgb2hsv(); 
            }
        }
    });

    /**
     * the green value between 0 - 255
     * @property g
     * @type Number
     * @default 0
     */   
    Object.defineProperty(BBModColor.prototype, "g", {
        get: function() {
            return this._g;
        },
        set: function(g) {
            if( typeof g !== 'number' || g<0 || g>255 ){
                throw new Error("BBModColor: green parameter neeeds to be a NUMBER between 0 - 255");
            } else {
                this._g = g || 0;    
                this.rgb2hsv(); 
            }
        }
    });

    /**
     * the blue value between 0 - 255
     * @property b
     * @type Number
     * @default 0
     */   
    Object.defineProperty(BBModColor.prototype, "b", {
        get: function() {
            return this._b;
        },
        set: function(b) {
            if( typeof b !== 'number' || b<0 || b>255 ){
                throw new Error("BBModColor: blue parameter neeeds to be a NUMBER between 0 - 255");
            } else {
                this._b = b || 0;    
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
    Object.defineProperty(BBModColor.prototype, "a", {
        get: function() {
            return this._a;
        },
        set: function(a) {
            if( typeof a !== 'number' || a<0 || a>255 ){
                throw new Error("BBModColor: alpha parameter neeeds to be a NUMBER between 0 - 255");
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
    Object.defineProperty(BBModColor.prototype, "h", {
        get: function() {
            return this._h;
        },
        set: function(h) {
            if( typeof h !== 'number' || h<0 || h>359 ){
                throw new Error("BBModColor: hue parameter neeeds to be a NUMBER between 0 - 359");
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
    Object.defineProperty(BBModColor.prototype, "s", {
        get: function() {
            return this._s;
        },
        set: function(s) {
            if( typeof s !== 'number' || s<0 || s>100 ){
                throw new Error("BBModColor: saturation parameter neeeds to be a NUMBER between 0 - 100");
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
    Object.defineProperty(BBModColor.prototype, "v", {
        get: function() {
            return this._v;
        },
        set: function(v) {
            if( typeof v !== 'number' || v<0 || v>100 ){
                throw new Error("BBModColor: brightness/lightness parameter neeeds to be a NUMBER between 0 - 100");
            } else {
                this._v = v || 0;    
                this.hsv2rgb(); 
            }
        }
    });



    /**
     * sets the rgba value of the color
     * @method setRGBA
     * @param {Number} r sets the red value from 0 - 255 
     * @param {Number} g sets the green value from 0 - 255 
     * @param {Number} b sets the blue value from 0 - 255 
     * @param {Number} a sets the alpha value from 0 - 255 
     */
    BBModColor.prototype.setRGBA = function(r, g, b, a) {


        if( typeof r !== 'number' || r<0 || r>255 ){
            throw new Error("BBModColor: red parameter neeeds to be a NUMBER between 0 - 255");
        } else {
            this.r = r;
        }

        if( typeof g !== 'number' || g<0 || g>255 ){
            throw new Error("BBModColor: green parameter neeeds to be a NUMBER between 0 - 255");
        } else {
            this.g = g;
        }

        if( typeof b !== 'number' || b<0 || b>255 ){
            throw new Error("BBModColor: blue parameter neeeds to be a NUMBER between 0 - 255");
        } else {
            this.b = b;
        }

        if( typeof a !== 'number' || a<0 || a>255 ){
            throw new Error("BBModColor: alpha parameter neeeds to be a NUMBER between 0 - 255");
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
    BBModColor.prototype.setHSVA = function(h, s, v, a) {
        
        if( typeof h !== 'number' || h<0 || h>359 ){
            throw new Error("BBModColor: hue parameter neeeds to be a NUMBER between 0 - 359");
        } else {
            this.h = h;
        }

        if( typeof s !== 'number' || s<0 || s>100 ){
            throw new Error("BBModColor: saturation parameter neeeds to be a NUMBER between 0 - 100");
        } else {
            this.s = s;
        }

        if( typeof v !== 'number' || v<0 || v>100 ){
            throw new Error("BBModColor: value parameter neeeds to be a NUMBER between 0 - 100");
        } else {
            this.v = v;
        }

        if( typeof a !== 'number' || a<0 || a>255 ){
            throw new Error("BBModColor: alpha parameter neeeds to be a NUMBER between 0 - 255");
        } else {
            this.a = a;
        }

        this.hsv2rgb();
    };

    BBModColor.prototype.getRGB = function() { 
        return 'rgb('+this.r+', '+this.g+', '+this.b+')';
    };

    BBModColor.prototype.getRGBA = function() { 
        return 'rgba('+this.r+', '+this.g+', '+this.b+', '+this.a+')';
    };

    BBModColor.prototype.getHex = function() { 
        return "#" +((this.r << 16) | (this.g << 8) | this.b).toString(16);
    };


    BBModColor.prototype.isEqual = function(color, excludeAlpha) {

        if (! color || ! color instanceof BBModColor) {
            throw new Error("BBModColor.isEqual: color parameter is not an instance of BBModColor");
        }

        if (excludeAlpha) {
            return (this.r === color.r &&
                    this.g === color.g &&
                    this.b === color.b)
        } else {
            return (this.r === color.r &&
                    this.g === color.g &&
                    this.b === color.b &&
                    this.a === color.a)
        }
    };

    BBModColor.prototype.min3 = function( a,b,c ) { 
        return ( a<b )   ?   ( ( a<c ) ? a : c )   :   ( ( b<c ) ? b : c ); 
    }; 
    
    BBModColor.prototype.max3 = function( a,b,c ) { 
        return ( a>b )   ?   ( ( a>c ) ? a : c )   :   ( ( b>c ) ? b : c );
    };


    /**
     * converts rgb values into hsv values, you can pass it an instance of
     * BBModColor as a single parameter or pass it three individual parameters (
     * for r, g and b ) and it returns an object with h,s,v properties.
     *
     * if you don't pass it any parameters it takes its own internal values as
     * arguments and updates it's own internal hsv automatically ( that
     * functionality is used internally, for ex. by the getters && setters )
     * 
     * @method rgb2hsv
     * @param  {Number} [rgb] either an instance of BBModColor or a red value
     * between 0 - 255
     * @param  {Number} [g]   a green value between 0 - 255
     * @param  {Number} [b]   a blue value value between 0 - 255
     * @return {Object}     an object with h, s, v properties
     */
    BBModColor.prototype.rgb2hsv = function( rgb, g, b ) { 

        var self;
        if( typeof rgb == "undefined"){
            self = this;
        } else {
            self = ( rgb instanceof BBModColor ) ? rgb : { r:rgb, g:g, b:b };
        }

        var hsv = new Object();
        var max = this.max3( self.r, self.g, self.b );
        var dif = max - this.min3( self.r, self.g, self.b );

        hsv.s = (max==0.0) ? 0 : (100*dif/max);

        if ( hsv.s == 0 ) hsv.h = 0;
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
     * BBModColor as a single parameter or pass it three individual parameters (
     * for h, s and v ) and it returns an object with r,g,b properties.
     *
     * if you don't pass it any parameters it takes its own internal values as
     * arguments and updates it's own internal rgb automatically ( that
     * functionality is used internally, for ex. by the getters && setters )
     *
     * @method hsv2rgb
     * @param  {Number} [hsv] either an instance of BBModColor or a h value between 0 - 359
     * @param  {Number} [s]   a saturation value between 0 - 100
     * @param  {Number} [v]   a brightness/lightness value value between 0 - 100
     * @return {Object}     an object with r, g, b properties
     */
    BBModColor.prototype.hsv2rgb = function( hsv, s, v ) { 

        var hsv, rgb;
        if( typeof hsv == "undefined"){

            rgb = this;
            hsv = { h:this.h, s:this.s, v:this.v };

        } else {

            rgb = new Object();
            hsv = ( hsv instanceof BBModColor ) ? hsv : { h:hsv, s:s, v:v };

        }


        if( typeof hsv == "undefined" && hsv.s == 0 ){

            this._r = this._g = this._b = Math.round( hsv.v * 2.55 );

            return this;

        } else if ( typeof hsv !== "undefined" && hsv.s == 0 ) {

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

    // private function for shifting hue
    // used by color scheme functions 
    BBModColor.prototype._hueShift = function( h,s ) { 
        
        h += s; 
        
        while ( h>=360.0 )  h -= 360.0; 
        while ( h<0.0 )     h += 360.0; 

        return h; 
    };

    // private function for creating scheme variants
    // used by scheme functions 
    BBModColor.prototype._schemeVarient = function( rgb, scheme, config ) { 

        
        if( typeof config.tint !== "undefined" ){

            config.tint.sort(function(a,b){return b - a}); // reorder largest to smallest

            for (var i = 0; i < config.tint.length; i++) {
                var col = new Object();                                                     
                col.r = Math.round( rgb.r+(255-rgb.r ) * config.tint[i] );
                col.g = Math.round( rgb.g+(255-rgb.g ) * config.tint[i] );
                col.b = Math.round( rgb.b+(255-rgb.b ) * config.tint[i] );
                col.a = this.a;

                this.schemes[scheme].push( col );
            };

        }

        this.schemes[scheme].push({ r:rgb.r, g:rgb.g, b:rgb.b, a:this.a });
        
        if( typeof config.shade !== "undefined" ){
            
            config.shade.sort(function(a,b){return b - a}); // reorder largest to smallest

            for (var i = 0; i < config.shade.length; i++) {
                var col = new Object();                                                     
                col.r = Math.round( rgb.r * config.shade[i] );
                col.g = Math.round( rgb.g * config.shade[i] );
                col.b = Math.round( rgb.b * config.shade[i] );
                col.a = this.a;

                this.schemes[scheme].push( col );
            };
        }

        for (var i = 0; i < this.schemes[scheme].length; i++) {
            var self = this.schemes[scheme][i];
                self.hex = "#" +((self.r << 16) | (self.g << 8) | self.b).toString(16);
                self.rgb = 'rgb('+self.r+', '+self.g+', '+self.b+')';
                self.rgba = 'rgba('+self.r+', '+self.g+', '+self.b+', '+self.a+')';
        };
    }

    // config.angle = "30"; config.tint = [ 0.4, 0.8 ]; config.shade = [ 0.3, 0.6 ]

    /**
     * generates a color scheme ( array of additional color values ) from the
     * base color.
     *
     * the colors are stored in an array in the <code>.schemes</code> property (
     * object ) and can be accessed by passing it the key ( name of ) the color
     * scheme you generated like so: <code> .schemes["triadic"] </code>, which
     * will return an array of objects ( with r, g, b, a properties )
     * 
     * @method colorScheme
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
     * <section><code class="javascript"> 
     * &nbsp; color.colorScheme("analogous",{                           <br>
     * &nbsp;&nbsp;&nbsp;&nbsp; angle: 30,                              <br>
     * &nbsp;&nbsp;&nbsp;&nbsp; tint:[ 0.4, 0.8 ],                      <br>
     * &nbsp;&nbsp;&nbsp;&nbsp; shade:[ 0.3, 0.6 ]                      <br>
     * &nbsp; });                                                       <br><br>
     * &nbsp; color.schemes["analogous"][0] // returns first color      <br>
     * &nbsp; color.schemes["analogous"][1] // returns second color     <br>
     *</code></section>
     */
    BBModColor.prototype.colorScheme = function( scheme, config ) { 
        
        if( scheme == "monochromatic" ){ // -----------------------------------------------------------
            if(typeof config !== "object"){
                
                throw new Error("BBModColor.colorScheme: expecting a config object");
            
            } else {                
                this.schemes[scheme] = []; // clear previous colors
                this._schemeVarient( this, scheme, config);
            }
        }

        if( scheme == "analogous" ){ // -----------------------------------------------------------
            if(typeof config !== "object"){
                
                throw new Error("BBModColor.colorScheme: expecting a config object");
            
            } else {

                if( typeof config.angle == "undefined" ){

                    throw new Error("BBModColor.colorScheme: this scheme requires a config object with an angle property");

                }

                this.schemes[scheme] = []; // clear previous colors

                var rgb     = { r:this.r, g:this.g, b:this.b };
                var hsv     = this.rgb2hsv(     rgb.r, rgb.g, rgb.b     );
                    hsv.h   = this._hueShift(   hsv.h, config.angle     );
                    rgb     = this.hsv2rgb(     hsv.h, hsv.s, hsv.v     );

                this._schemeVarient( rgb, scheme, config);

                var rgb     = { r:this.r, g:this.g, b:this.b };
                var hsv     = this.rgb2hsv(     rgb.r, rgb.g, rgb.b     );
                    hsv.h   = this._hueShift(   hsv.h, 0.0-config.angle );
                    rgb     = this.hsv2rgb(     hsv.h, hsv.s, hsv.v     );

                this._schemeVarient( rgb, scheme, config);
            }
        }


        if( scheme == "complementary" ){ // -----------------------------------------------------------
            if(typeof config !== "object"){
                
                throw new Error("BBModColor.colorScheme: expecting a config object");
            
            } else {

                this.schemes[scheme] = []; // clear previous colors

                var rgb     = { r:this.r, g:this.g, b:this.b };
                var hsv     = this.rgb2hsv(     rgb.r, rgb.g, rgb.b     );
                    hsv.h   = this._hueShift(   hsv.h, 180  );
                    rgb     = this.hsv2rgb(     hsv.h, hsv.s, hsv.v     );

                this._schemeVarient( rgb, scheme, config);
            }
        }


        if( scheme == "split complementary" ){ // -----------------------------------------------------------
            if(typeof config !== "object"){
                
                throw new Error("BBModColor.colorScheme: expecting a config object");
            
            } else {

                if( typeof config.angle == "undefined" ){

                    throw new Error("BBModColor.colorScheme: this scheme requires a config object with an angle property");
                }

                this.schemes[scheme] = []; // clear previous colors

                var rgb     = { r:this.r, g:this.g, b:this.b };
                var hsv     = this.rgb2hsv(     rgb.r, rgb.g, rgb.b     );
                    hsv.h   = this._hueShift(   hsv.h, 180.0-config.angle);
                    rgb     = this.hsv2rgb(     hsv.h, hsv.s, hsv.v     );

                this._schemeVarient( rgb, scheme, config);

                var rgb     = { r:this.r, g:this.g, b:this.b };
                var hsv     = this.rgb2hsv(     rgb.r, rgb.g, rgb.b     );
                    hsv.h   = this._hueShift(   hsv.h, 180.0+config.angle);
                    rgb     = this.hsv2rgb(     hsv.h, hsv.s, hsv.v     );

                this._schemeVarient( rgb, scheme, config);
            }
        }

        if( scheme == "triadic" ){ // -----------------------------------------------------------
            if(typeof config !== "object"){
                
                throw new Error("BBModColor.colorScheme: expecting a config object");
            
            } else {

                this.schemes[scheme] = []; // clear previous colors

                var rgb     = { r:this.r, g:this.g, b:this.b };
                var hsv     = this.rgb2hsv(     rgb.r, rgb.g, rgb.b     );
                    hsv.h   = this._hueShift(   hsv.h, 240  );
                    rgb     = this.hsv2rgb(     hsv.h, hsv.s, hsv.v     );

                this._schemeVarient( rgb, scheme, config);

                var rgb     = { r:this.r, g:this.g, b:this.b };
                var hsv     = this.rgb2hsv(     rgb.r, rgb.g, rgb.b     );
                    hsv.h   = this._hueShift(   hsv.h, 120  );
                    rgb     = this.hsv2rgb(     hsv.h, hsv.s, hsv.v     );

                this._schemeVarient( rgb, scheme, config);
            }
        }

        if( scheme == "tetradic" ){ // -----------------------------------------------------------
            if(typeof config !== "object"){
                
                throw new Error("BBModColor.colorScheme: expecting a config object");
            
            } else {

                if( typeof config.angle == "undefined" ){

                    throw new Error("BBModColor.colorScheme: this scheme requires a config object with an angle property");
                }

                this.schemes[scheme] = []; // clear previous colors

                var rgb     = { r:this.r, g:this.g, b:this.b };
                var hsv     = this.rgb2hsv(     rgb.r, rgb.g, rgb.b     );
                    hsv.h   = this._hueShift(   hsv.h, 180  );
                    rgb     = this.hsv2rgb(     hsv.h, hsv.s, hsv.v     );

                this._schemeVarient( rgb, scheme, config);

                var rgb     = { r:this.r, g:this.g, b:this.b };
                var hsv     = this.rgb2hsv(     rgb.r, rgb.g, rgb.b     );
                    hsv.h   = this._hueShift(   hsv.h, -config.angle    );
                    rgb     = this.hsv2rgb(     hsv.h, hsv.s, hsv.v     );

                this._schemeVarient( rgb, scheme, config);
                
                var rgb     = { r:this.r, g:this.g, b:this.b };
                var hsv     = this.rgb2hsv(     rgb.r, rgb.g, rgb.b     );
                    hsv.h   = this._hueShift(   hsv.h, -config.angle+180.0  );
                    rgb     = this.hsv2rgb(     hsv.h, hsv.s, hsv.v     );

                this._schemeVarient( rgb, scheme, config);                  
            }
        }           

    };

    return BBModColor;
});