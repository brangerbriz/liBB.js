/**
 * a base module for creating more complicated audio effects (as AFX addons) in the style of <a href="BB.AudioFX.html" target="_blank">BB.AudioFX</a>
 * @module BB.AFX
 * @extends BB.AudioBase
 */
define(['./BB', './BB.AudioBase'],
function(  BB,        AudioBase) {

    'use strict';
    
    /**
     * a base module for creating more complicated audio effects (as AFX addons) in the style of <a href="BB.AudioFX.html" target="_blank">BB.AudioFX</a>
     * @class BB.AFX
     * @constructor
     * @extends BB.AudioBase
     * 
     * @param {Object} config A config object to initialize the effect
     *
     * @example
     * here is an example of a basic addon audio effect, we'll call it <i>AFXname.js</i><br>
     * ( in this case nothing really, just a simple delay ), extended from BB.AFX
     * <br><br>
     * <code class="code prettyprint">  
     *  &nbsp;function AFXname( config ){<br>
     *  <br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;BB.AFX.call(this, config);<br>
     *  <br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;// this.node must be some kind of AudioNode<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;// likely something like ConvolverNode, DelayNode, etc. ( or combo )<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;this.node = this.ctx.createDelay();<br>
     *  <br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;// initialze the input >> dry/wet >> output ( see BB.AFX._init() )<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;// must be called after this.node is declared<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;this._init(); <br>
     *  &nbsp;}<br>
     *  <br>
     *  &nbsp;AFXname.prototype = Object.create(BB.AFX.prototype);<br>
     *  &nbsp;AFXname.prototype.constructor = AFXname;
     * </code>
     * <br><br>
     * by extending from BB.AFX, our AFXname has an input && an output, as well as the delay node ( this.node above ) automatically connected to a "wet" channel ( which is inversely proportional to the "dry" channel )<br>
     * <img src="../assets/images/afxloop.png">
     * <br><br>
     * view the advanced <a href="../../examples/editor/?file=audio-fx-addons&type=advanced" target="_blank">BB.AFX addons</a> example
     */
    
    BB.AFX = function( config ) {
        
        BB.AudioBase.call(this, config);
        
        // config obj
        if(typeof config !== "undefined" && typeof config !== "object" ){
            throw new Error('BB.AFX: first parameter should be a config object');
        } else if( typeof config === "undefined" ) config = {};

        this.node = null; // MUST BE DEFINED IN THE ADDON

    };

    BB.AFX.prototype = Object.create(BB.AudioBase.prototype);
    BB.AFX.prototype.constructor = BB.AFX;

    BB.AFX.prototype._init = function(){
        // ................... FX loop ..............................
        //  must be executed in the addon's constructor ( after defining this.node )
        //  for bypassing fx // dry + wet channels
        
        this.input = this.ctx.createGain();  // input  :: receives connection
                                             // output :: this.gain ( form AudioBase );
        
        this._wet = new BB.AudioBase({ connect: this.gain });
        this._dry = new BB.AudioBase({ connect: this.gain });
        this._dry.volume = 0;

        // input > dry > output 
        this.input.connect( this._dry.gain ); 
        
        // input > fx > wet > output
        this.input.connect( this.node ); 
        this.node.connect( this._wet.gain );
    };

   
    /**
     * the dry channel gain/volume
     * @property dry 
     * @type Number
     * @default 0
     */   
    Object.defineProperty(BB.AFX.prototype, "dry", {
        get: function() {
            return this._dry.volume;
        },
        set: function(v) {
            if( typeof v !== 'number'){
                throw new Error("BB.AFX.dry: expecing a number");
            } else {
                this._dry.setGain( v );
                var diff = 1 - v;
                this._wet.setGain( diff );
            }
        }
    }); 

    /**
     * the wet channel gain/volume
     * @property wet 
     * @type Number
     * @default 1
     */   
    Object.defineProperty(BB.AFX.prototype, "wet", {
        get: function() {
            return this._wet.volume;
        },
        set: function(v) {
            if( typeof v !== 'number'){
                throw new Error("BB.AFX.wet: expecing a number");
            } else {
                this._wet.setGain( v );
                var diff = 1 - v;
                this._dry.setGain( diff );
            }
        }
    }); 

    /**
     * set's the dry gain ( && adjust the wet gain accordingly, so that they total to 1 )
     * @method setDryGain
     * @param {Number} num a float value, 1 being the default volume, below 1 decreses the volume, above one pushes the gain
     * @param {Number} ramp value in seconds for how quickly/slowly to ramp to the new value (num) specified
     *
     * @example  
     * <code class="code prettyprint">  
     *  &nbsp;BB.Audio.init();<br>
     *  <br>
     *  &nbsp;var fx = new BB.AFX('filter');<br>
     *  &nbsp;var noise = new BB.AudioNoise({<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;connect: fx<br>
     *  &nbsp;});<br>
     *  <br>
     *  &nbsp; fx.setDryGain( 0.75, 2 ); // raises dry level from 0 - 0.75 over 2 seconds (wet level drops to 0.25)<br>
     *  // if no ramp value is needed, you could alternatively do<br>
     *  &nbsp; fx.dry.volume = 0.75; // immediately jumps to 0.75 (and wet to 0.25) <br>
     * </code>
     */
    BB.AFX.prototype.setDryGain = function( num, gradually ) {
        if( typeof num !== "number" )
            throw new Error('BB.AFX.setDryGain: first argument expecting a number');
        
        this._dry._volume = num;
        var diff = 1 - num;
        this._wet._volume = diff;

        if(typeof gradually !== "undefined"){
            if( typeof num !== "number" )
                throw new Error('BB.AFX.setDryGain: second argument expecting a number');
            else {
                this._dry._globalGainUpdate( gradually );
                this._wet._globalGainUpdate( gradually );
            }
        }
        else { this._dry._globalGainUpdate(0); this._wet._globalGainUpdate(0); }
    };

    /**
     * set's the wet gain ( && adjust the dry gain accordingly, so that they total to 1 )
     * @method setWetGain
     * @param {Number} num a float value, 1 being the default volume, below 1 decreses the volume, above one pushes the gain
     * @param {Number} ramp value in seconds for how quickly/slowly to ramp to the new value (num) specified
     *
     * @example  
     * <code class="code prettyprint">  
     *  &nbsp;BB.Audio.init();<br>
     *  <br>
     *  &nbsp;var fx = new BB.AFX('filter');<br>
     *  &nbsp;var noise = new BB.AudioNoise({<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;connect: fx<br>
     *  &nbsp;});<br>
     *  <br>
     *  &nbsp; fx.setWetGain( 0.15, 2 ); // drops wet level from 1 - 0.15 over 2 seconds (dry level rises to 0.85)<br>
     *  // if no ramp value is needed, you could alternatively do<br>
     *  &nbsp; fx.wet.volume = 0.15; // immediately jumps to 0.15 (and dry to 0.85) <br>
     * </code>
     */
    BB.AFX.prototype.setWetGain = function( num, gradually ) {
        if( typeof num !== "number" )
            throw new Error('BB.AFX.setWetGain: first argument expecting a number');
        
        this._wet._volume = num;
        var diff = 1 - num;
        this._dry._volume = diff;

        if(typeof gradually !== "undefined"){
            if( typeof num !== "number" )
                throw new Error('BB.AFX.setWetGain: second argument expecting a number');
            else {
                this._wet._globalGainUpdate( gradually );
                this._dry._globalGainUpdate( gradually );
            }
        }
        else { this._wet._globalGainUpdate(0); this._dry._globalGainUpdate(0); }
    };

    return BB.AFX;
});