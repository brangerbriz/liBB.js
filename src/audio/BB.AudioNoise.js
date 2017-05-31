/* jshint esversion: 6 */

let AudioBase = require('./BB.AudioBase.js');


/**
* A module for creating sounds from scratch, with maths, ie. differnt kinds of noise ( defined as any nonconventional and/or mathematically calculated sound buffer )
* @class BB.AudioNoise
* @constructor
* @extends BB.AudioBase
*
* @param {Object} [config] A config object to initialize the sound,
* can contain the following:<br><br>
* <code class="code prettyprint">
* &nbsp;// note that "type" can be also be a custom function, see example below<br><br>
* &nbsp;{<br>
* &nbsp;&nbsp;&nbsp; type: "white", // default, also "pink","brown","perlin" <br>
* &nbsp;&nbsp;&nbsp; duration: 1, // default <br>
* &nbsp;&nbsp;&nbsp; channels: 2, // default <Br>
* &nbsp;&nbsp;&nbsp; // as well as all the AudioBase class properties<Br>
* &nbsp;&nbsp;&nbsp; connect: fft, // overide default destination <br>
* &nbsp;&nbsp;&nbsp; gain: 0.5, // master "gain" (expolential multiplier)<br>
* &nbsp;&nbsp;&nbsp; attack: 0.25,// attack fade-in in seconds<br>
* &nbsp;&nbsp;&nbsp; decay: 0.25, // decay fade-down to sustain level in seconds <br>
* &nbsp;&nbsp;&nbsp; sustain: 0.75,// sustain level scalar value<br>
* &nbsp;&nbsp;&nbsp; release: 0.25 // release fade-out in seconds<br>
* &nbsp;}
* </code>
* <br>
* @example
* <code class="code prettyprint">
*  &nbsp;BB.Audio.init();<br>
*  <br>
*  &nbsp;// create a sound object one of 3 ways<br><br>
*  &nbsp;// 1. with default values ( 1 second of white noise )<br>
*  &nbsp;var sound = new BB.AudioNoise();<br><br>
*  &nbsp;// 2. by passing an alternative type<br>
*  &nbsp;var sound = new BB.AudioNoise("pink");<br><br>
*  &nbsp;// this could also be a custom function, for ex:<br>
*  &nbsp;function randomNoise(){<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;let frameCount = this.ctx.sampleRate * this.duration;<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;for (var ch = 0; ch < this.channels; ch++) {<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;var data = this.buffer.getChannelData( ch );<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;for (var i = 0; i < frameCount; i++) {<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;data[i] = Math.random() * 2 - 1;<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;};<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;};<br>
*  &nbsp;}<br>
*  &nbsp;var sound = new BB.AudioNoise(randomNoise);<br><br>
*  &nbsp;function sineWave(){<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;let frameCount = this.ctx.sampleRate * this.duration;<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;for (var ch = 0; ch < this.channels; ch++) {<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;var data = this.buffer.getChannelData( ch );<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;for (var i = 0; i < frameCount; i++) {<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;data[i] = Math.sin(i/10);<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;};<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;};<br>
*  &nbsp;}<br>
*  &nbsp;var sound = new BB.AudioNoise(sineWave);<br><br>
*  <br>
*  &nbsp;// 3. by passing a config object<br>
*  &nbsp;var sound = new BB.AudioNoise({<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;type: "pink",<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;duration: 2,<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;gain: 0.75,<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;attack: 0.25 <br>
*  &nbsp;});<br><br>
* </code>
*  <br><br>
* Once you have instantiated a sound object it can be used in a variety of different ways. Below is an overview:
*  <br><br>
*  <code class="code prettyprint">
*  &nbsp;// the simplest is simply playing it back with all the defaults <br>
*  &nbsp;// in this case one second of white noise will playback<br>
*  &nbsp; sound.play(); <br>
*  &nbsp;// you could immediately stop that by calling <br>
*  &nbsp; sound.stop(); <br><br>
*  &nbsp;// you could schedule the playback for later, ex 1 second from now<br>
*  &nbsp; sound.play( BB.Audio.now() + 1 ); <br>
*  &nbsp;// and stop it 1 second after that ( ie. 2 seconds from now )<br>
*  &nbsp; sound.stop( BB.Audio.now() + 2 ); <br><br>
*  &nbsp;// or playback with alternative properties by passing a config object<br>
*  &nbsp; sound.play({<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;type:"pink",<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;time:BB.Audio.now()+1, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;attack:0.2, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;decay:0.2, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;sustain:1, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;release:0.25 <br>
*  &nbsp; }); <br><br>
*  &nbsp;// you can trigger the playback of a sound forever like this<br>
*  &nbsp; sound.noteOn(100);// detune by 100 cents or one semitone <br>
*  &nbsp;// you can do the same but schedule it to start later, ex:<br>
*  &nbsp; sound.noteOn(100, BB.Audio.now()+1 ); <br>
*  &nbsp;// or do the same but with custom properties, ex:<br>
*  &nbsp; sound.noteOn({<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;detune:100,<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;time:BB.Audio.now()+1, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;attack:0.2, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;decay:0.2, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;sustain:1, <br>
*  &nbsp; }); <br><br>
*  &nbsp;// noteOn can be called once per detuned value <br>
*  &nbsp;// which means you can play polyphonic sounds with a single sound object <br>
*  &nbsp; sound.noteOn(100); <br>
*  &nbsp; sound.noteOn(200); <br>
*  &nbsp; sound.noteOn(300); <br><br>
*  &nbsp;// to stop playback on a particular frequency you can do one of the following: <br>
*  &nbsp; sound.noteOff(100); <br>
*  &nbsp;// or...<br>
*  &nbsp; sound.noteOff({<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;detune:100,<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;hold:1, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;release:0.25 <br>
*  &nbsp; }); <br><br>
*  &nbsp;// because you can play multiple detuned versions at the same time (polyphony) <br>
*  &nbsp;// the sound object needs to keep track of which frequencies are being played <br>
*  &nbsp;// it does this in it's sound.input dictionary(object) property<br>
*  &nbsp;// because of this you can't call play or noteOn multiple times on the... <br>
*  &nbsp;// ...same detuned value without overriding the previous instance of that same value <br>
*  &nbsp;// instead there's an alternative method which does not keep track of the sound <br>
*  &nbsp;// which means it can not be "stopped" but it can be called multiple times <br>
*  &nbsp;// the api is nearly identical to the play method <br>
*  &nbsp; sound.spit(); <br>
*  &nbsp; sound.spit( BB.Audio.now() + 1 ); <br>
*  &nbsp; sound.spit({<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;detune:100, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;time:BB.Audio.now()+1, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;attack:0.2, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;decay:0.2, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;sustain:1, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;release:0.25 <br>
*  &nbsp; }); <br><br>
* </code>
*
*/
class AudioNoise extends AudioBase {

	constructor( config ){
		if(typeof config==="object") super(config);
		else super();

		this.input = {}; // keep track of current polyphonic notes

		this.types = ["white","pink","brown","perlin"];

		this.err = new BB.ValidArg(this);
		this.err.checkType(config,["undefined","function","string","object"]);

		let dur, ch, ty; // set duration of noise --- numer of channels --- type of noise
		if( typeof config == "undefined" ){

			dur = 1; ch = 2; ty = "white";

		} else if(typeof config == "function"){

			dur = 1; ch = 2; ty = config;

		} else if(typeof config =="string"){

			dur = 1; ch = 2;
			if( this.types.indexOf(config) < 0 )
				throw new Error('BB.AudioNoise: type should be either "white","pink","brown","perlin" or be a custom function');
			else ty = config;

		} else if(typeof config =="object"){

			this.err.checkType(config.duration,["undefined","number"],"duration");
			dur = (typeof config.duration !=="undefined") ? config.duration : 1;

			this.err.checkType(config.channels,["undefined","number"],"channels");
			ch = (typeof config.channels !=="undefined") ? config.channels : 2;

			this.err.checkType(config.type,["undefined","string","function"],"type");
			if( typeof config.type == "string"){
				if( this.types.indexOf(config.type) < 0 )
					throw new Error('BB.AudioNoise: type should be either "white","pink","brown","perlin" or be a custom function');
				else ty = config.type;
			} else if(typeof config.type == "function" ){
				ty = config.type;
			} else if(typeof config.type == "undefined"){
				ty = "white"; // default
			}
		}

		this._detune = 0; // last played ( .play() ) detune value ( so stop can target it )
		this._playbackRate = 1;

		/**
		* buffer length in seconds
		* @property duration
		* @type Number
		* @default 1
		*/
		if( this.attack+this.decay+this.release > dur )
			throw new Error('BB.AudioNoise: your duration can not be less than attack+decay+release');
		else this._duration = dur;

		/**
		* number of channels
		* @property channels
		* @type Number
		* @default 2
		*/
		this.channels 	= ch; // stereo
		/**
		* "white","pink","brown", "perlin" or custom function
		* @property type
		* @type String|Function
		* @default "white"
		*/
		this._type = ty; // see type getter/setter below

		/**
		* the buffer object
		* @property buffer
		* @type AudioBuffer
		*/
		this.buffer = null;

		/**
		* whether or not the buffer is playing ( ie. if noteOn is on, is not effected by calls to .play() )
		* @property playing
		* @type Boolean
		*/

		this._initBuffer();
	}


	// -------------- getter/setter for this._type
	set type( t ){
		this.err.checkType(t,["string","function"],"type");
		if( typeof t === "string" ){
			if( this.types.indexOf(t) < 0 )
				throw new Error('BB.AudioNoise: type should be either "white","pink","brown","perlin" or be a custom function');
			else this._type = t;
		} else if( typeof t === "function" ){
			this._type = t;
		}

		this._initBuffer();
	}
	get type(){
		return this._type;
	}

	// -------------- getter/setter for this._duration
	set duration( value ){
		if( this.attack+this.decay+this.release > value )
			throw new Error('BB.AudioNoise: your duration can not be less than attack+decay+release');
		else
			this._duration = value;

		this._initBuffer();
	}
	get duration(){
		return this._duration;
	}

	// ------------------------------ create the noise buffer ------------------
	// -------------------------------------------------------------------------

	_initBuffer(){
		let frameCount = this.ctx.sampleRate * this.duration;
		this.buffer = this.ctx.createBuffer( this.channels, frameCount, this.ctx.sampleRate );

		// noise maths via: http://noisehack.com/generate-noise-web-audio-api/
		let ch, data, i, white;

		if( typeof this.type == "function"){
			this.type();
			//  ---- FOR EXMPLE  ----
			// function(){
			// 	let frameCount = this.ctx.sampleRate * this.duration;
			// 	for (var ch = 0; ch < this.channels; ch++) {
			// 		var data = this.buffer.getChannelData( ch );
			// 		for (var i = 0; i < frameCount; i++) {
			// 			data[i] = Math.random() * 2 - 1;
			// 		};
			// 	};
			// }
		}

		else if( this.type == "white" ){
			// generate white noise buffer
			for (ch = 0; ch < this.channels; ch++) {
				data = this.buffer.getChannelData( ch );
				for (i = 0; i < frameCount; i++) {
					data[i] = Math.random() * 2 - 1;
				}
			}
		}

		else if ( this.type == "pink" ){
			// generate pink noise buffer
			for (ch = 0; ch < this.channels; ch++) {
				let b0, b1, b2, b3, b4, b5, b6;
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

		else if ( this.type == "brown" ){
			// generate pink brownian ( aka. brown or red ) buffer
			for (ch = 0; ch < this.channels; ch++) {
				data = this.buffer.getChannelData( ch );
				let lastOut = 0.0;
				for (i = 0; i < frameCount; i++) {
					white = Math.random() * 2 - 1;
					data[i] = (lastOut + (0.02 * white)) / 1.02;
					lastOut = data[i];
					data[i] *= 3.5; // (roughly) compensate for gain
				}
			}
		}

		else if ( this.type == "perlin" ){
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


	}

	// sampleRate && Detue -----------------------------------------------------
	// -------------------------------------------------------------------------

	/**
	* detunes the playback ( see <a href="https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/detune" target="_blank">MDN's detune documentation</a> )
	* @method setDetune
	* @param {Number} cents a config object or a number for the new detuning value
	* @param {Number} [time] linear ramp time before reaching the target cents
	* @example
	* <code class="code prettyprint"><br>
	* &nbsp; // say for example you are playing the sound forever by:<br>
	* &nbsp; sound.noteOn();<br>
	* &nbsp; // you can immediately detune it by a certain number of cents<br>
	* &nbsp; // (100 cents = 1 semitone )<br>
	* &nbsp; sound.setDetune(100);<br><br>
	* &nbsp; // or detune it over a period of time <br>
	* &nbsp; // here we detune our sound over the next two seconds<br>
	* &nbsp; sound.setDetune( 100, BB.Audio.now()+2 );<br><br>
	* &nbsp; // if you have multiple sounds playing already detuned like this<br>
	* &nbsp; sound.noteOn(100);<br>
	* &nbsp; sound.noteOn(200);<br>
	* &nbsp; sound.noteOn(300);<br>
	* &nbsp; // you can target a specific instance of the sound, <br>
	* &nbsp; // by passing in a config object with an index property <br>
	* &nbsp; // where index is the initial tuning value from the noteOn call <br>
	* &nbsp; sound.setDetune({<br>
	* &nbsp;&nbsp;&nbsp;&nbsp;index:300,<br>
	* &nbsp;&nbsp;&nbsp;&nbsp;cents:1000,<br>
	* &nbsp;&nbsp;&nbsp;&nbsp;time: BB.Audio.now()+2 <br>
	* &nbsp; });<br>
	* &nbsp; // the example above will detune the 3rd instance of sound <br>
	* &nbsp; // which was called by noteOn(300) and thus is currently detuned to 300 <br>
	* &nbsp; // and will gradually change it's tuning to 1000 over the next 2 seconds <br>
	* &nbsp; // at this point it's tuned to 1000 cents from the original buffer <br>
	* &nbsp; // but it's index is still "300"<br>
	* </code>
	*/
	setDetune( cents, scheduleTime ){
		this.err.checkType(cents,["number","object"]);
		if( typeof cents == "object" ){
			this.err.checkType(cents.cents,["number"],"cents");
			this.err.checkType(cents.time,["number","undefined"],"time");
			this.err.checkType(cents.index,["number","undefined"],"index");

			let c = (typeof cents.cents=="undefined") ? 0 : cents.cents;
			let t = (typeof cents.time=="undefined") ? this.ctx.currentTime : cents.time;
			let i = (typeof cents.index=="undefined") ? 0 : cents.index;

			if( typeof this.input[i] !== "undefined" ){
				this.input[i].detuned = c;
				this.input[i].node.detune.linearRampToValueAtTime( c, t );
			}

		} else {
			this.err.checkType(scheduleTime,["number","undefined"],"scheduleTime");
			let c = cents;
			let t = (typeof scheduleTime=="undefined") ? this.ctx.currentTime : scheduleTime;
			if( typeof this.input[0] !== "undefined" ){
				this.input[0].detuned = c;
				this.input[0].node.detune.linearRampToValueAtTime( c, t );
			}
		}
	}

	/**
	* get the current detune value ( see <a href="https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/detune" target="_blank">MDN's detune documentation</a> )
	* @method getDetune
	* @param {Number} [index] index of particular instance of the sound that is playing
	* @example
	* <code class="code prettyprint"><br>
	* &nbsp; // say for example you are playing the sound forever by:<br>
	* &nbsp; sound.noteOn();<br>
	* &nbsp; // and you changed it's tuning like so<br>
	* &nbsp; // (100 cents = 1 semitone )<br>
	* &nbsp; sound.setDetune(100);<br>
	* &nbsp; // you can confirm it changed by calling<br>
	* &nbsp; sound.getDetune(); // returns 100<br><br>
	* &nbsp; // say you have multiple instances playing<br>
	* &nbsp; sound.noteOn(100);<br>
	* &nbsp; sound.noteOn(200);<br>
	* &nbsp; sound.noteOn(300);<br>
	* &nbsp; // and you changed the third one like so<br>
	* &nbsp; sound.setDetune({<br>
	* &nbsp;&nbsp;&nbsp;&nbsp;index:300,<br>
	* &nbsp;&nbsp;&nbsp;&nbsp;cents:1000<br>
	* &nbsp; });<br>
	* &nbsp; // you can confirm it by calling <br>
	* &nbsp; sound.getDetune(300); // returns 1000<br><br>
	* </code>
	*/
	getDetune(index){
		this.err.checkType(index,["number","undefined"],"index");
		let i = (typeof index=="undefined") ? 0 : index;
		if( typeof this.input[i] == "undefined" )
			return false;
		else if( typeof this.input[i].detuned == "undefined" )
			return i;
		else
			return this.input[i].detuned;
	}

	/**
	* changes the playbackRate ( see <a href="https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/playbackRate" target="_blank">MDN's playbackRate documentation</a> )
	* @method setPlaybackRate
	* @param {Number} rate a config object or a number for the new sampleRate value
	* @param {Number} [time] linear ramp time before reaching the target sampleRate
	* @example
	* <code class="code prettyprint"><br>
	* &nbsp; // say for example you are playing the sound forever by:<br>
	* &nbsp; sound.noteOn();<br>
	* &nbsp; // you can immediately change the playback rate like this:<br>
	* &nbsp; sound.setPlaybackRate(2); // playback now twice the speed<br><br>
	* &nbsp; // or change it over a period of time <br>
	* &nbsp; // here we speed up our rate over the next two seconds<br>
	* &nbsp; sound.setPlaybackRate( 3, BB.Audio.now()+2 );<br><br>
	* &nbsp; // if you have multiple sounds playing like this<br>
	* &nbsp; sound.noteOn(100);<br>
	* &nbsp; sound.noteOn(200);<br>
	* &nbsp; sound.noteOn(300);<br>
	* &nbsp; // you can target a specific instance of the sound, <br>
	* &nbsp; // by passing in a config object with an index property <br>
	* &nbsp; // where index is the initial tuning value from the noteOn call <br>
	* &nbsp; sound.setPlaybackRate({<br>
	* &nbsp;&nbsp;&nbsp;&nbsp;index:300,<br>
	* &nbsp;&nbsp;&nbsp;&nbsp;rate:4,<br>
	* &nbsp;&nbsp;&nbsp;&nbsp;time: BB.Audio.now()+2 <br>
	* &nbsp; });<br>
	* </code>
	*/
	setPlaybackRate( rate, scheduleTime ){
		this.err.checkType(rate,["number","object"]);
		if( typeof rate == "object" ){
			this.err.checkType(rate.rate,["number"],"rate");
			this.err.checkType(rate.time,["number","undefined"],"time");
			this.err.checkType(rate.index,["number","undefined"],"index");

			let r = (typeof rate.rate=="undefined") ? 0 : rate.rate;
			let t = (typeof rate.time=="undefined") ? this.ctx.currentTime : rate.time;
			let i = (typeof rate.index=="undefined") ? 0 : rate.index;

			if( typeof this.input[i] !== "undefined" ){
				this.input[i].rate = r;
				this.input[i].node.playbackRate.linearRampToValueAtTime( r, t );
			}

		} else {
			this.err.checkType(scheduleTime,["number","undefined"],"scheduleTime");
			let r = rate;
			let t = (typeof scheduleTime=="undefined") ? this.ctx.currentTime : scheduleTime;
			if( typeof this.input[0] !== "undefined" ){
				this.input[0].rate = r;
				this.input[0].node.playbackRate.linearRampToValueAtTime( r, t );
			}
		}
	}

	/**
	* get the current playbackRate ( see <a href="https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/playbackRate" target="_blank">MDN's playbackRate documentation</a> )
	* @method getPlaybackRate
	* @param {Number} [index] index of particular instance of the sound that is playing
	* @example
	* <code class="code prettyprint"><br>
	* &nbsp; // say for example you are playing the sound forever by:<br>
	* &nbsp; sound.noteOn();<br>
	* &nbsp; // and you changed it's rate like so<br>
	* &nbsp; sound.setPlaybackRate(2);<br>
	* &nbsp; // you can confirm it changed by calling<br>
	* &nbsp; sound.getPlaybackRate(); // returns 2<br><br>
	* &nbsp; // say you have multiple instances playing<br>
	* &nbsp; sound.noteOn(100);<br>
	* &nbsp; sound.noteOn(200);<br>
	* &nbsp; sound.noteOn(300);<br>
	* &nbsp; // and you changed the third one like so<br>
	* &nbsp; sound.setPlaybackRate({<br>
	* &nbsp;&nbsp;&nbsp;&nbsp;index:300,<br>
	* &nbsp;&nbsp;&nbsp;&nbsp;rate:2<br>
	* &nbsp; });<br>
	* &nbsp; // you can confirm it by calling <br>
	* &nbsp; sound.getPlaybackRate(300); // returns 2<br><br>
	* </code>
	*/
	getPlaybackRate(index){
		this.err.checkType(index,["number","undefined"],"index");
		let i = (typeof index=="undefined") ? 0 : index;
		if( typeof this.input[i] == "undefined" )
			return false;
		else if( typeof this.input[i].rate == "undefined" )
			return 1;
		else
			return this.input[i].rate;
	}



	// ------------------------------------------- make sounds -----------------
	// -------------------------------------------------------------------------

	/**
	*  because you can play multiple instances of the same (detuned) sound at the same time (polyphony)
	*  the tone object needs to keep track of which detuned values are being played
	*  it does this in it's sound.input dictionary(object) property
	*  because of this you can't call play or noteOn multiple times on the
	*  same detuned value without overriding the previous instance of that same sound/value
	*  instead there's this alternative method which does not keep track of the sound
	*  which means it can not be "stopped" but it can be called multiple times
	* @method spit
	* @param {number|object} [config] either a scheduled time or config object
	*
	* @example
	* <code class="code prettyprint">
	*  &nbsp; sound.spit(); <br>
	*  &nbsp// or schedule playback for later by passing a time <br>
	*  &nbsp; sound.spit( BB.Audio.now() + 1 ); <br>
	*  &nbsp// or pass a config object <br>
	*  &nbsp; sound.spit({<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;detune:100,<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;time:BB.Audio.now()+1, <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;attack:0.2, <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;decay:0.2, <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;sustain:1, <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;release:0.25 <br>
	*  &nbsp; }); <br><br>
	* </code>
	*/
	spit( config ){
		this.err.checkType(config,["number","undefined","object"]);

		if( typeof config=="object"){ // warn if trying to pass custom duration/channels/type
			let emsg = "BB.AudioNoise.split: you can't pass a custom ";
			if(typeof config.duration!=="undefined")
				console.warn(emsg+"duration to this method, uses the object's duration value");
			if(typeof config.channels!=="undefined")
				console.warn(emsg+"channels to this method, uses the object's channels value");
			if(typeof config.type!=="undefined")
				console.warn(emsg+"type to this method, uses the object's type value");
		}

		let st; // start time
		let dur = this.duration;
		let detune, attack, decay, sustain, release; // ADSR setup
		if( typeof config=="object"){
			this.err.checkType(config.time,["number","undefined"],"time");
			this.err.checkType(config.attack,["number","undefined"],"attack");
			this.err.checkType(config.decay,["number","undefined"],"decay");
			this.err.checkType(config.sustain,["number","undefined"],"sustain");
			this.err.checkType(config.release,["number","undefined"],"release");
			this.err.checkType(config.detune,["number","undefined"],"detune");

			st = (typeof config.time=="undefined") ? this.ctx.currentTime : config.time;

			if(typeof config.detune =="number") detune = config.detune;
			else detune = 0;

			attack = (typeof config.attack=="undefined") ? this.attack : config.attack;
			decay = (typeof config.decay=="undefined") ? this.decay : config.decay;
			sustain = (typeof config.sustain=="undefined") ? this.sustain : config.sustain;
			release = (typeof config.release=="undefined") ? this.release : config.release;
		} else {
			if(typeof config=="number")	st = config;
			else st = this.ctx.currentTime;
			detune = 0;
			attack = this.attack;
			decay = this.decay;
			sustain = this.sustain;
			release = this.release;
		}

		// make sure duration is long enough
		if( attack+decay+release > dur )
			throw new Error('BB.AudioNoise.play: your duration can not be less than attack+decay+release');

		// the throw away nodes
		let gainNode = this.ctx.createGain();
			gainNode.connect( this.output );

		let node = this.ctx.createBufferSource();
			node.buffer = this.buffer;
			if(detune!==0) node.detune.setValueAtTime(detune,st);
			if( this._playbackRate!==1) node.playbackRate.setValueAtTime(this._playbackRate,st);
			node.connect( gainNode );

		// scheduled start time && adsr
		let hold = (dur-(attack+decay));
		// this._adsr(gainNode, 1.0, st, attack, decay, release, hold, sustain);

		this._adsrIn( gainNode, 1.0, st, attack, decay, sustain );
		this._adsrOut( gainNode, 1.0, st+hold, release, sustain );

		node.start(st);

	}


	/**
	* starts playing the sound/noise forever
	*
	* @method noteOn
	* @param {number|object} [detune] a config object or positive/negative detune value in cents (100 cents = 1 semitone)
	* @param {number} [time] if you want to schedule the note for later ( rather than play immediately ), in seconds ( if less than BB.Audio.now() defaults to now )
	*
	* @example
	* <code class="code prettyprint">
	*  &nbsp;// you can trigger the playback of the sound forever like this<br>
	*  &nbsp; sound.noteOn(); <br>
	*  &nbsp;// or pass an optional detune value ( 0 is the default, ie no detuning )<br>
	*  &nbsp; sound.noteOn(100); <br>
	*  &nbsp;// you can do the same but schedule it to start later, ex:<br>
	*  &nbsp; sound.noteOn(100, BB.Audio.now()+1 ); <br>
	*  &nbsp;// or do the same but with custom properties, ex:<br>
	*  &nbsp; sound.noteOn({<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;detune:100,<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;time:BB.Audio.now()+1, <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;attack:0.2, <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;decay:0.2, <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;sustain:1, <br>
	*  &nbsp; }); <br><br>
	* </code>
	*/
	noteOn( config, scheduleTime ){
		this.err.checkType(config,["number","object","undefined"]); // TODO consider note string? auto-analyze + detune?
		this.err.checkType(scheduleTime,["number","undefined"]);

		let detune = 0;
		let attack, decay, sustain, time;
		if( typeof config=="object"){
			this.err.checkType(config.time,["number","undefined"],"time");
			this.err.checkType(config.attack,["number","undefined"],"attack");
			this.err.checkType(config.decay,["number","undefined"],"decay");
			this.err.checkType(config.sustain,["number","undefined"],"sustain");
			this.err.checkType(config.detune,["number","undefined"],"detune");
			attack = (typeof config.attack=="undefined") ? this.attack : config.attack;
			decay = (typeof config.decay=="undefined") ? this.decay : config.decay;
			sustain = (typeof config.sustain=="undefined") ? this.sustain : config.sustain;
			time = (typeof config.time=="undefined") ? this.ctx.currentTime : config.time;
			detune = (typeof config.detune=="undefined") ? this.ctx.currentTime : config.detune;
		} else if(typeof config=="number") {
			detune = config;
			time = (typeof scheduleTime=="undefined") ? this.ctx.currentTime : scheduleTime;
			attack = this.attack; decay = this.decay; sustain = this.sustain;
		} else {
			time = (typeof scheduleTime=="undefined") ? this.ctx.currentTime : scheduleTime;
			attack = this.attack; decay = this.decay; sustain = this.sustain;
		}


		// don't play if already playing
		if( this.input.hasOwnProperty(detune) ) return false;

		// the throw away nodes
		let gainNode = this.ctx.createGain();
			gainNode.connect( this.output );
		let node = this.ctx.createBufferSource();
			node.buffer = this.buffer;
			if(detune!==0) node.detune.setValueAtTime(detune,time);
			if( this._playbackRate!==1) node.playbackRate.setValueAtTime(this._playbackRate,time);
			node.loop = true;
			node.connect( gainNode );

		// fadeIn (if adsr) && start playing
		this._adsrIn( gainNode, 1.0, time, attack, decay, sustain );
		node.start(time);

		// add to inputs collection
		this._addPolyNote( detune, node, gainNode, sustain );

	}

	/**
	* stops playing the sound/value
	*
	* @method noteOff
	* @param {number|object} [detune] a config object or the detune value in cents ( 100 cents = 1 semitone )
	*
	* @example
	* <code class="code prettyprint">
	*  &nbsp;// to stop playback<br>
	*  &nbsp; sound.noteOff(); <br>
	*  &nbsp;// to stop playback on a particular detuned value you started, ex: sound.noteOn(100): <br>
	*  &nbsp; sound.noteOff(100); <br>
	*  &nbsp;// or...<br>
	*  &nbsp; sound.noteOff({<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;detune:100,<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;hold:1, <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;release:0.25 <br>
	*  &nbsp; }); <br><br>
	*  </code>
	*/
	noteOff( config ){
		this.err.checkType(config,["number","object","undefined"]);

		let detune, hold, release;
		if( typeof config=="object"){
			this.err.checkType(config.release,["undefined","number"],"release");
			this.err.checkType(config.hold,["undefined","number"],"hold");
			this.err.checkType(config.detune,["undefined","number"],"detune");
			hold = (typeof config.hold=="number") ? config.hold : 0;
			release = (typeof config.release=="number") ? config.release : 0;
			detune = (typeof config.detune=="number") ? config.detune : 0;
		} else {
			if(typeof config=="number") detune = config;
			else detune = 0;
			hold = 0;
			release = this.release;
		}

		// shut it off ....
		if(typeof this.input[detune] !== "undefined"){

			let now = this.ctx.currentTime; // fadeOut (if hold||sustain) && stop
			this._adsrOut( this.input[detune].gain, 1.0, now+hold, release, this.input[detune].sus  );
			if( BB.Check.browserInfo().name == "Safari"){
				// see >> https://github.com/brangerbriz/liBB.js/issues/46
			} else this.input[detune].node.stop( now + hold + release + 0.00005);

			// remove from input when fadeOut is complete
			let rmvInterval = setInterval(()=>{
				if(typeof this.input[detune] !== "undefined"){
					if(this.ctx.currentTime >= now + hold + release + 0.00006 ){
						this._removePolyNote( detune );
						clearInterval( rmvInterval );
					}
				} else {
					clearInterval( rmvInterval );
				}
			},1000/60);
		}

	}

	/**
	 * playback the buffer once
	 * @method play
	 * @param {number|object} [config] a config object or a scheduled time to playback
	 *
	 * @example
	 * <code class="code prettyprint">
	 *  &nbsp;// playback using the sound's defaultsk<br>
	 *  &nbsp; sound.play(); <br>
	 *  &nbsp;// you could schedule the playback for later, ex 1 second from now<br>
	 *  &nbsp; sound.play( BB.Audio.now() + 1 ); <br>
	 *  &nbsp;// or playback with alternative properties by passing a config object<br>
	 *  &nbsp; sound.play({<br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;deutne:100, <br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;time:BB.Audio.now()+1, <br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;attack:0.2, <br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;decay:0.2, <br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;sustain:1, <br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;release:0.25 <br>
	 *  &nbsp; }); <br><br>
	 * </code>
	 */
	play( config ){
		this.err.checkType(config,["number","undefined","object"]);

		if( typeof config=="object"){ // warn if trying to pass custom duration/channels/type
			let emsg = "BB.AudioNoise.play: you can't pass a custom ";
			if(typeof config.duration!=="undefined")
				console.warn(emsg+"duration to this method, uses the object's duration value");
			if(typeof config.channels!=="undefined")
				console.warn(emsg+"channels to this method, uses the object's channels value");
			if(typeof config.type!=="undefined")
				console.warn(emsg+"type to this method, uses the object's type value");
		}

		let st; // start time
		let dur = this.duration;
		let detune, attack, decay, sustain, release;
		if( typeof config=="object"){
			this.err.checkType(config.detune,["number","undefined"],"detune");
			this.err.checkType(config.time,["number","undefined"],"time");
			this.err.checkType(config.duration,["number","undefined"],"duration");
			this.err.checkType(config.attack,["number","undefined"],"time");
			this.err.checkType(config.decay,["number","undefined"],"decay");
			this.err.checkType(config.sustain,["number","undefined"],"sustain");
			this.err.checkType(config.release,["number","undefined"],"release");

			if(typeof config.detune =="number") detune = config.detune;
			else detune = 0;

			st = (typeof config.time=="undefined") ? this.ctx.currentTime : config.time;

			attack = (typeof config.attack=="undefined") ? this.attack : config.attack;
			decay = (typeof config.decay=="undefined") ? this.decay : config.decay;
			sustain = (typeof config.sustain=="undefined") ? this.sustain : config.sustain;
			release = (typeof config.release=="undefined") ? this.release : config.release;
		} else {
			if(typeof config=="number")	st = config;
			else st = this.ctx.currentTime;
			detune = 0;
			attack = this.attack;
			decay = this.decay;
			sustain = this.sustain;
			release = this.release;
		}

		this._detune = detune; // reference for stop

		// make sure duration is long enough
		if( attack+decay+release > dur )
			throw new Error('BB.AudioNoise.play: your duration can not be less than attack+decay+release');

		let delay = st - this.ctx.currentTime+0.00002;
		if( delay < 0 ) delay = 0.00002;

		this.noteOn({
			detune		: detune,
			time 		: st,
			attack		: attack,
			decay		: decay,
			sustain		: sustain
		});

		this.noteOff({
			detune		: detune,
			hold 		: delay+(dur-(attack+decay)),
			release		: release
		});

	}

	// shhh, secret alias for play... incase folks are used to webaudio api .start()
	start(time){ this.play(time); }

	/**
	 * stops the playback of a sound called via play() method
	 * @method stop
	 * @param {number} [time] a scheduled time to stop playback
	 *
	 * @example
	 * <code class="code prettyprint">
	 * &nbsp;// stop immediately <br>
 	 * &nbsp; sound.stop(); <br><br>
 	 * &nbsp;// or stop it at a later time<br>
 	 * &nbsp; sound.stop( BB.Audio.now() + 2 ); <br><br>
	 * </code>
	 */
	stop( time ){
		this.err.checkType(time,["undefined","number"],"time");

		let st; // scheduled time
		if(typeof time=="number") st = time;
		else st = this.ctx.currentTime;

		let detune = this._detune;

		if(typeof this.input[detune] !== "undefined"){

			this.input[detune].gain.gain.cancelScheduledValues(st);
			if( BB.Check.browserInfo().name == "Safari"){
				// see >> https://github.com/brangerbriz/liBB.js/issues/46
			} else this.input[detune].node.stop( st );


			// remove from input when fadeOut is complete
			let rmvInterval = setInterval(()=>{
				if(typeof this.input[detune] !== "undefined"){
					if(this.ctx.currentTime >= st + 0.00006 ){
						this._removePolyNote( detune );
						clearInterval( rmvInterval );
					}
				} else {
					clearInterval( rmvInterval );
				}
			},1000/60);
		}

	}
}

module.exports = AudioNoise;
