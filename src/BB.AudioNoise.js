
/**
 * A module for creating differnt kinds of noise ( defined as any nonconventional and/or mathematically calculated sound buffer ) 
 * @module BB.AudioNoise
 * @extends BB.AudioBase
 */
define(['./BB', './BB.AudioBase' ],
function(  BB,        AudioBase ){

	'use strict';

 	/**
     * A module for creating differnt kinds of noise ( defined as any nonconventional and/or mathematically calculated sound buffer ) 
     * @class BB.AudioNoise
     * @constructor
     * @extends BB.AudioBase
     * 
     * @param {Object} config this can either be a string (type of noise "white","pink","brown","perlin" ), or a custom function ( see example further down ) or a config object to initialize the Noise
     * can contain the following:<br><br>
     * <code class="code prettyprint">
     * &nbsp;{<br>
     * &nbsp;&nbsp;&nbsp; context: BB.Audio.context[2], // choose specific context <br>
     * &nbsp;&nbsp;&nbsp; connect: fft.node, // overide default destination <br>
     * &nbsp;&nbsp;&nbsp; volume: 0.5, // technically master "gain" (expolential multiplier)<br>
     * &nbsp;&nbsp;&nbsp; duraton: 2, // in seconds (corresponds to length of buffer)<br>
     * &nbsp;&nbsp;&nbsp; channels: 1, // channels in buffer <br>
     * &nbsp;&nbsp;&nbsp; type: "pink", // "white","pink","brown","perlin" or custom function<br>
     * &nbsp;}
     * </code>
     * <br>
     * <br> 
     * @example  
     * in the example below instantiating the BB.AudioNoise creates a <a href="https://developer.mozilla.org/en-US/docs/Web/API/GainNode" target="_blank">GainNode</a> ( essentially the Noise's output ) connected to the default BB.Audio.context ( ie. AudioDestination )
     * <br> <img src="../assets/images/audiosampler1.png"/>
     * <br> everytime noise is played, for example: <code> white.makeNoise()</code>, a corresponding <a href="https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode" target="_blank">SourceNode</a> with the appropriate sound buffer (the initialized noise data) is created and connected to the Noise's master GainNode
     * <br>
     * <code class="code prettyprint">  
     *  &nbsp;BB.Audio.init();<br>
     *  <br>
     *  &nbsp;var white = new BB.AudioNoise('white');<br>
     *  <br>
     *  &nbsp;white.makeNoise();// plays noise <br>
     *  &nbsp;var now = BB.Audio.context.currentTime; <br>
     *  &nbsp;white.makeNoise( 8, 0.5, now+3 ); // plays noise for 8 seconds, at half volume, 3 seconds from now <br><br>
     *
     * &nbsp;// example with config object<br>
     * &nbsp;var brown = new BB.AudioNoise({<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;volume: 0.75,<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;type: "brown"<br>
     * &nbsp;});<br><br>
     *
     * &nbsp;// example with custom function type<br>
     * &nbsp;var noisey = new BB.AudioNoise(function(){<br>
	 * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;var frameCount = this.ctx.sampleRate \* this.duration;<br>
	 * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;for (var ch = 0; ch < this.channels; ch++) {<br>
	 * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;var data = this.buffer.getChannelData( ch );<br>
	 * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;for (var i = 0; i < frameCount; i++) {<br>
	 * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;data[i] = Math.random() * 2 - 1;<br>
	 * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;};<br>
	 * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;};<br>
     * &nbsp;});<br>
     * </code>
     *
     * view basic <a href="../../examples/editor/?file=audio-noise" target="_blank">BB.AudioNoise</a> example
     */
	
	BB.AudioNoise = function( config ) {

		BB.AudioBase.call(this, config);

		var types = ["white","pink","brown","perlin"];

		if(typeof config === "undefined"){ config = {}; }
		else if(typeof config === "function" || typeof config === "string" && types.indexOf( config) >= 0 ){
			var t = config;
			config = { type:t };
		} else if(typeof config === "string" && types.indexOf( config) < 0 ){
			throw new Error('BB.AudioNoise: type should be either "white","pink","brown","perlin" or be a custom function');
		}	

		

		this._type 		= (typeof config.type !== "undefined") ? config.type : "white";
		if(typeof this._type==="string" && types.indexOf( this._type ) < 0 ) 
			throw new Error('BB.AudioNoise: type should be either "white","pink","brown","perlin" or be a custom function');
		else if( typeof this._type !== "string" && typeof this._type !== "function" )
			throw new Error('BB.AudioNoise: type should be either "white","pink","brown","perlin" or be a custom function');
		else if( typeof this._type === "function" ){
			this._typecallback = config.type;
			this._type = "custom";
		}

		/**
		* buffer length in seconds
		* @property duration
		* @type Number
		* @default 1
		*/   
		this.duration 	= (typeof config.duration !== "undefined") ? config.duration : 1; // seconds
		/**
		* number of channels
		* @property channels
		* @type Number
		* @default 2
		*/  
		this.channels 	= (typeof config.channels !== "undefined") ? config.channels : 2; // stereo

		/**
		* the source node
		* @property node
		* @type AudioNode
		*/ 	
		this.node = null; 

		/**
		* the buffer object
		* @property buffer
		* @type AudioBuffer
		*/ 		
		this.buffer = null;

		this.isPlaying = false;
		this._isOn = false;
		
		this._durTimeout = null; // time out for makeNoise

		this._initBuffer();

	};

 	BB.AudioNoise.prototype = Object.create(BB.AudioBase.prototype);
    BB.AudioNoise.prototype.constructor = BB.AudioNoise;


	/**
	* "white","pink","brown" or "custom"
	* @property type
	* @type String
	* @default "white"
	*/   
	Object.defineProperty(BB.AudioNoise.prototype, "type", {
		get: function() {
			return this._type;
		},
		set: function(v) {

			var types = ["white","pink","brown","perlin"];
			
			if(typeof v==="string" && types.indexOf( v ) < 0 ) 
				throw new Error('BB.AudioNoise: type should be either "white","pink","brown","perlin" or be a custom function');
			else if( typeof v !== "string" && typeof v !== "function" )
				throw new Error('BB.AudioNoise: type should be either "white","pink","brown","perlin" or be a custom function');

			if( typeof v === "string" ){
				this._type = v;
				if(this._isOn===true){
					this.noiseOff();
					this._initBuffer();
					this.noiseOn();
				} else {
					this._initBuffer();
				}
			}
			else if( typeof v === "function" ){
				this._type = "custom";
				this._typecallback = v;
				if(this._isOn===true){
					this.noiseOff();
					this._initBuffer();
					this.noiseOn();
				} else {
					this._initBuffer();
				}

			} else {
				throw new Error('BB.AudioNoise: type should be either "white","pink","brown","perlin" or be a custom function');
			}
		}
	});

	// ---------------

	BB.AudioNoise.prototype._initBuffer = function(){
		
		var frameCount = this.ctx.sampleRate * this.duration;
		this.buffer = this.ctx.createBuffer( this.channels, frameCount, this.ctx.sampleRate );

		// noise maths via: http://noisehack.com/generate-noise-web-audio-api/
		var ch, data, i, white;

		if( this._type == "white" ){
			// generate white noise buffer
			for (ch = 0; ch < this.channels; ch++) {
				data = this.buffer.getChannelData( ch );
				for (i = 0; i < frameCount; i++) {
					data[i] = Math.random() * 2 - 1;
				}
			}
		}

		else if ( this._type == "pink" ){
			// generate pink noise buffer
			for (ch = 0; ch < this.channels; ch++) {
				var b0, b1, b2, b3, b4, b5, b6; 
				b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
				data = this.buffer.getChannelData( ch );
				for (i = 0; i < frameCount; i++) {
					white = Math.random() * 2 - 1;
					b0 = 0.99886 * b0 + white * 0.0555179;
					b1 = 0.99332 * b1 + white * 0.0750759;
					b2 = 0.96900 * b2 + white * 0.1538520;
					b3 = 0.86650 * b3 + white * 0.3104856;
					b4 = 0.55000 * b4 + white * 0.5329522;
					b5 = -0.7616 * b5 - white * 0.0168980;
					data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
					data[i] *= 0.11; // (roughly) compensate for gain
					b6 = white * 0.115926;
				}
			}
		}

		else if ( this._type == "brown" ){
			// generate pink brownian ( aka. brown or red ) buffer
			for (ch = 0; ch < this.channels; ch++) {
				data = this.buffer.getChannelData( ch );
				var lastOut = 0.0;
				for (i = 0; i < frameCount; i++) {
					white = Math.random() * 2 - 1;
					data[i] = (lastOut + (0.02 * white)) / 1.02;
					lastOut = data[i];
					data[i] *= 3.5; // (roughly) compensate for gain
				}
			}
		}

		else if ( this._type == "perlin" ){
			// generate perlin noise buffer...
			// ... right now just sounds like short white noise buffer on loop
			// ... need to make this more interesting?
			for (ch = 0; ch < this.channels; ch++) {
				data = this.buffer.getChannelData( ch );
				for (i = 0; i < frameCount; i++) {
					data[i] = BB.MathUtils.noise(i) * 2 - 1;
				}
			}
		}

		else if( this._type == "custom" ){
			this._typecallback();
			
			//  ---- FOR EXMPLE  ----

			// function(){
			// 	var frameCount = this.ctx.sampleRate * this.duration;
			// 	for (var ch = 0; ch < this.channels; ch++) {
			// 		var data = this.buffer.getChannelData( ch );
			// 		for (var i = 0; i < frameCount; i++) {
			// 			data[i] = Math.random() * 2 - 1;
			// 		};
			// 	};
			// }
		}

	};


	// ---------------

	/**
	* plays noise for a specified period of time
	* @method makeNoise
	* @param {Number} [duration] how long to play the noise (in seconds)
	* @param {Number} [velocity] how loud (scalar value applied to master volume)
	* @param {Number} [schedule] when to play it
	*
	* @example  
	* <code class="code prettyprint">  
	*  &nbsp;BB.Audio.init();<br>
	*  <br>
	*  &nbsp;var whitenoise = new BB.AudioNoise({<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;type: "white",<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;volume: 0.75<br>
	*  &nbsp;});<br>
	*  <br>
	*  &nbsp;// plays for a quarter second, at twice the initial 0.75 volume ( ie. 1.5 ) <br>
	*  &nbsp;whitenoise.makeNoise( 0.25, 2 ); <br><br>
	*  &nbsp;// plays for 1 second at the original volume (0.75), will start playing 5 seconds from now<br>
	*  &nbsp;var now = BB.Audio.context.currentTime; <br>
	*  &nbsp;whitenoise.makeNoise( 1, 1, now+5 ); 
	* </code>
	*/
	BB.AudioNoise.prototype.makeNoise = function( duration, velocity, schedule ){

		var dur = (typeof duration!=="undefined") ? duration : this.duration;
		
		var initvol;
		if(typeof velocity !== "undefined") {
			initvol = this.volume;
			this.volume = velocity;
		}

		this.noiseOn( schedule, true );

		if( this._durTimeout !== "undefined" ) clearTimeout( this._durTimeout );
		var self = this;
		this._durTimeout = setTimeout(function(){
			self.noiseOff( true );
			if(typeof velocity !== "undefined") self.volume = initvol;
		}, dur*1000 );
	};

	/**
	* starts playing the noise
	* @method noiseOn
	* @param {Number} [schedule] when to play
	*
	* @example  
	* <code class="code prettyprint">  
	*  &nbsp;BB.Audio.init();<br>
	*  <br>
	*  &nbsp;var whitenoise = new BB.AudioNoise(); // default white noise<br>
	*  <br>
	*  &nbsp;whitenoise.noiseOn();
	* </code>
	*/
	BB.AudioNoise.prototype.noiseOn = function( schedule, fromMakeNoise ){

		if( this.isPlaying === true ) throw new Error('BB.AudioNoise.noiseOn: is already on');

		if(typeof schedule === "undefined") schedule = 0;

		this.node = this.ctx.createBufferSource();
		this.node.buffer = this.buffer;
		this.node.loop = true;
		this.node.connect( this.gain );
		this.node.start(schedule); 

		if(typeof fromMakeNoise==="undefined" || fromMakeNoise===false) this._isOn = true;
		this.isPlaying = true;
	};

	/**
	* stops playing the noise
	* @method noiseOff
	*
	* @example  
	* <code class="code prettyprint">  
	*  &nbsp;BB.Audio.init();<br>
	*  <br>
	*  &nbsp;var whitenoise = new BB.AudioNoise(); // default white noise<br>
	*  <br>
	*  &nbsp;whitenoise.noiseOn();<br>
	*  &nbsp;whitenoise.noiseOff();
	* </code>
	*/
	BB.AudioNoise.prototype.noiseOff = function( fromMakeNoise ){
		if( this.isPlaying === false ) throw new Error('BB.AudioNoise.noiseOn: is already off');
		this.node.stop();
		this.isPlaying = false;
		if(typeof fromMakeNoise==="undefined" || fromMakeNoise===false) this._isOn = false;
	};

	return BB.AudioNoise;
});