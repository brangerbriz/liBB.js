
/**
 * A base audio module class, extended by BB.AudioNoise, BB.AudioSampler, BB.AudioFX, etc.
 * @module BB.AudioBase
 */
define(['./BB', './BB.Audio', './BB.Detect' ],
function(  BB,        Audio,        Detect ){

	'use strict';

 	/**
     * A base audio module class, extended by BB.AudioNoise, BB.AudioSampler, BB.AudioFX, etc.
     * @class BB.AudioBase
     * @constructor
     * 
     * @example  
     * in the example below instantiating the BB.AudioBase creates a <a href="https://developer.mozilla.org/en-US/docs/Web/API/GainNode" target="_blank">GainNode</a> ( essentially the modules's output ) connected to the default BB.Audio.context ( ie. AudioDestination )
     * <br> <img src="../assets/images/audiosampler1.png"/>
     * <br>
     * <code class="code prettyprint">  
     *  &nbsp;BB.Audio.init();<br>
     *  <br>
     *  &nbsp;var node = new BB.AudioBase();<br>
     *  <br>
     *  &nbsp;// or optional config property<br>
     *  &nbsp;var node = new BB.AudioBase({<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;context: BB.Audio.context[2],<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;connect: fft,<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;volume: 0.5<br>
     *  });<br>
     *  <br>
     * </code>
     */
	
	BB.AudioBase = function( config ) {

		if(typeof config === "undefined") config = {};

		/**
		* the Audio Context this derived from
		* @property ctx
		* @type AudioContext
		* @default BB.Audio.context
		*/  
		if( typeof BB.Audio.context === "undefined" )
			throw new Error('BB Audio Modules require that you first create an AudioContext: BB.Audio.init()');

		if( BB.Audio.context instanceof Array ){
			if( typeof config === "undefined" || typeof config.context === "undefined" )
				throw new Error('BB.AudioBase: BB.Audio.context is an Array, specify which { context:BB.Audio.context[?] }');
			else 
				this.ctx = config.context;		
		} else {
			this.ctx = BB.Audio.context;
		}	
		 
		/**
		* the "output" gain node ( use .volume, .setGain() to interface with this )
		* @property gain
		* @type GainNode
		* @private
		*/ 
		this.gain       = this.ctx.createGain();    
		// default destination is context destination
		// unless otherwise specified in { connect:AudioNode }
		if( typeof config.connect !== 'undefined' ){
			if( config.connect instanceof BB.AudioAnalyser )
				this.gain.connect( config.connect.node );
			else if( config.connect instanceof BB.AudioFX  ) 
				this.gain.connect( config.connect.input );
			else if( config.connect instanceof BB.AudioBase )
				this.gain.connect( config.connect.gain );
			else if( config.connect instanceof AudioDestinationNode || config.connect instanceof AudioNode ) 
				this.gain.connect( config.connect );
			else 
				throw new Error('BB.AudioBase: connect property expecting an AudioNode');
		
		} else {
			this.gain.connect( this.ctx.destination );
		}

		this._volume = (typeof config.volume !== "undefined") ? config.volume : 1; // MASTER NOISE VOLUME ESSENTIALY 
		this.gain.gain.value = this._volume;
		this.gain.gain.name = "master";

	};


	/**
	* the master volume (of output gain node)
	* @property volume
	* @type Number
	* @default 1
	*/   
	Object.defineProperty(BB.AudioBase.prototype, "volume", {
		get: function() {
			return this._volume;
		},
		set: function(v) {
			if( typeof v !== 'number'){
				throw new Error("BB.AudioBase.volume: expecing a number");
			} else {
				this.setGain( v );
			}
		}
	});


	/**
	* connects the Noise to a particular AudioNode or AudioDestinationNode
	* @method connect
	* @param  {AudioNode} destination the AudioNode or AudioDestinationNode to connect to
	* @param  {Number} output      which output of the the Noise do you want to connect to the destination
	* @param  {Number} input       which input of the destination you want to connect the Noise to
	* @example  
	* <code class="code prettyprint">  
	*  &nbsp;BB.Audio.init();<br>
	*  <br>
	*  &nbsp;var node = new BB.AudioBase({<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;volume: 0.75,<br>
	*  &nbsp;});<br>
	*  <br>
	*  &nbsp; node.connect( exampleNode );<br>
	*  &nbsp; // connected to both default BB.Audio.context && exampleNode<br>
	*  &nbsp; // so if exampleNode is also connected to BB.Audio.context by default,<br>
	*  &nbsp; // ...then you've got node connected to BB.Audio.context twice<br>
	* </code>
	* <br>
	* ...which looks like this ( where the first Gain is the Noise and the second is the exampleNode )<br>
	* <img src="../assets/images/audiosampler3.png">
	*/
	BB.AudioBase.prototype.connect = function( destination, output, input ){

		if( destination instanceof BB.AudioAnalyser) 
			destination = destination.node;
		else if( destination instanceof BB.AudioFX  )
			destination = destination.input;
		else if( destination instanceof BB.AudioBase )
			destination = destination.gain;

		if( !(destination instanceof AudioDestinationNode || destination instanceof AudioNode) )
			throw new Error('BB.AudioBase.connect: destination should be an instanceof AudioDestinationNode or AudioNode');
		if( typeof output !== "undefined" && typeof output !== "number" )
			throw new Error('BB.AudioBase.connect: output should be a number');
		if( typeof intput !== "undefined" && typeof input !== "number" )
			throw new Error('BB.AudioBase.connect: input should be a number');

		if( typeof intput !== "undefined" ) this.gain.connect( destination, output, input );
		else if( typeof output !== "undefined" ) this.gain.connect( destination, output );
		else this.gain.connect( destination );
	};

	/**
	* diconnects the Noise from the node it's connected to
	* @method disconnect
	* @param  {AudioNode} destination what it's connected to
	* @param  {Number} output      the particular output number
	* @param  {Number} input       the particular input number
	* <code class="code prettyprint">  
	*  &nbsp;BB.Audio.init();<br>
	*  <br>
	*  &nbsp;var node = new BB.AudioBase({<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;volume: 0.75,<br>
	*  &nbsp;});<br>
	*  <br>
	*  &nbsp;node.disconnect(); // disconnected from default BB.Audio.context<br>
	*  &nbsp;node.connect( exampleNode ); // connected to exampleNode only<br>
	* </code>
	* <br>
	* ...which looks like this ( where the first Gain is the node and the second is the exampleNode )<br>
	* <img src="../assets/images/audiosampler4.png">
	*/
	BB.AudioBase.prototype.disconnect = function(destination, output, input ){

		if( destination instanceof BB.AudioAnalyser ) 
			destination = destination.node;
		else if( destination instanceof BB.AudioFX  )
			destination = destination.input;
		else if( destination instanceof BB.AudioBase )
			destination = destination.gain;

		if( typeof destination !== "undefined" &&
			!(destination instanceof AudioDestinationNode || destination instanceof AudioNode) )
				throw new Error('BB.AudioBase.disconnect: destination should be an instanceof AudioDestinationNode or AudioNode');
		if( typeof output !== "undefined" && typeof output !== "number" )
			throw new Error('BB.AudioBase.disconnect: output should be a number');
		if( typeof input !== "undefined" && typeof input !== "number" )
			throw new Error('BB.AudioBase.disconnect: input should be a number');

		if( typeof input !== "undefined" ) this.gain.disconnect( destination, output, input );
		else if( typeof output !== "undefined" ) this.gain.disconnect( destination, output );
		else if( typeof destination !== "undefined" ) this.gain.disconnect( destination );
		else  this.gain.disconnect();
	};


	/**
	* sets the gain level of the node ( in a sense, master volume control )
	* @method setGain
	* @param {Number} num a float value, 1 being the default volume, below 1 decreses the volume, above one pushes the gain
	* @param {Number} ramp value in seconds for how quickly/slowly to ramp to the new value (num) specified
	*
	* @example  
	* <code class="code prettyprint">  
	*  &nbsp;BB.Audio.init();<br>
	*  <br>
	*  &nbsp;var node = new BB.AudioBase({<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;volume: 0.75<br>
	*  &nbsp;});<br>
	*  <br>
	*  &nbsp; node.setGain( 0.25, 2 ); // lower's volume from 0.75 to 0.25 in 2 seconds <br>
	*  // if no ramp value is needed, you could alternatively do<br>
	*  &nbsp; node.volume = 0.5; // immediately jumps from 0.25 to 0.5 <br>
	* </code>
	*/
	BB.AudioBase.prototype.setGain = function( num, gradually ){
		if( typeof num !== "number" )
			throw new Error('BB.AudioBase.setGain: first argument expecting a number');
		
		this._volume = num;

		if(typeof gradually !== "undefined"){
			if( typeof num !== "number" )
				throw new Error('BB.AudioBase.setGain: second argument expecting a number');
			else
				this._globalGainUpdate( gradually );
		}
		else { this._globalGainUpdate(0); }
	};

	BB.AudioBase.prototype._sec2tc = function( sec ){
		return ( sec * 2 ) / 10;
	};

	BB.AudioBase.prototype._globalGainUpdate = function( gradually ){
		if(typeof gradually === "undefined") gradually = 0;    

		if(BB.Detect.browserInfo.name=="Firefox"){
			this.gain.gain.setTargetAtTimePoly( this._volume, 0, gradually);
		} else {
			this.gain.gain.setTargetAtTime( this._volume, 0, this._sec2tc(gradually));
		}    
	};

	// ... polyfills .... .... .... .... .... .... .... .... .... .... .... .... .... .... .... .... ....

	if(BB.Detect.browserInfo.name=="Firefox"){   
		// !!! *** !!! *** !!! *** !!! *** !!! *** !!! *** !!! 
		// !!!  THIS POLY FILL IS STILL UNDERCONSTRUCTION  !!!
		// !!! *** !!! *** !!! *** !!! *** !!! *** !!! *** !!! 
		// 
		AudioParam.prototype.setTargetAtTimePoly = function( target, startTime, seconds ){

		    // this.value = target;

		    var polyTimeout = null;
		    var polyInterval = null;
		    startTime = startTime * 1000;
		    var self = this;
		    
		    // if(typeof polyTimeout !== "undefined"){ clearTimeout( polyTimeout ); polyTimeout = undefined; }  
		    
		    polyTimeout = setTimeout(function(){
		        
		        
		        if(seconds===0){     
		            self.value = target;
		            // console.log(self.name,'jump to '+target+", now "+self.value)             
		        } else {
		            // if(typeof polyInterval !== "undefined"){ clearInterval( polyInterval ); polyInterval = undefined; }  

		            var delta =  target - self.value;
		            var inc = delta / (seconds*60);
		            var dir = (delta>=0) ? "up" : "down";
		            
		            polyInterval = setInterval(function(){                      
		                
		                self.value += inc*2; // why 2? well b/c for some f'n reason it goes too slow otherwise

		                if(dir=="up"){
		                    if( self.value >= target){clearInterval( polyInterval ); }
		                } else {
		                    if( self.value <= target){clearInterval( polyInterval ); }
		                }
		                
		            }, 1000/60 );
		        }

		    }, startTime );
		};

	}

	return BB.AudioBase;
});