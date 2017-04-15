/* jshint esversion: 6 */

let AudioBase = require('./BB.AudioBase.js');

/**
* A module for creating oscillating tones ( periodic wave forms ) along with music theory utilities
* @class BB.AudioTone
* @constructor
* @extends BB.AudioBase
*
* @param {Object} config A config object to initialize the Tone,
* can contain the following:<br><br>
* <code class="code prettyprint">
* &nbsp;{<br>
* &nbsp;&nbsp;&nbsp; connect: fft, // overide default destination <br>
* &nbsp;&nbsp;&nbsp; gain: 0.5, // master "gain" (expolential multiplier)<br>
* &nbsp;&nbsp;&nbsp; type: "custom", // "sine", "square", "sawtooth", "triangle", "custom"<br>
* &nbsp;&nbsp;&nbsp; wave: [ 0, 1, 0, 0.5, 0, 0.25, 0, 0.125 ] // only for "custom" type<Br>
* &nbsp;}
* </code>
* <br>
* see the <a href="../../examples/editor/?file=audio-waveshaper" target="_blank">waveshaper</a> for an example of how the wave property works. the "wave" property abstracts the WebAudio API's <a href="https://developer.mozilla.org/en-US/docs/Web/API/PeriodicWave" target="_blank">createPeriodicWave</a> method a bit. the Array passed above starts with 0 followed by the fundamental's amplitude value, followed by how ever many subsequent harmonics you choose. Alternatively, you can also pass an object with a "real" and "imag" (imaginary) Float32Array, for example:
* <br><br>
* <code class="code prettyprint">
* &nbsp;{<br>
* &nbsp;&nbsp;&nbsp; type: "custom", <br>
* &nbsp;&nbsp;&nbsp; wave: {<br>
* &nbsp;&nbsp;&nbsp;&nbsp; imag: new Float32Array([0,1,0,0.5,0,0.25,0,0.125]),<br>
* &nbsp;&nbsp;&nbsp;&nbsp; real: new Float32Array(8)<br>
* &nbsp;&nbsp;&nbsp; }<br>
* &nbsp;}
* </code>
* <br>
* @example
* <code class="code prettyprint">
*  &nbsp;BB.Audio.init();<br>
*  <br>
*  &nbsp;var O = new BB.AudioTone({<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;gain: 0.75,<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;type: "square"<br>
*  &nbsp;});<br>
*  <br>
*  &nbsp; O.play( 440 );<br>
*  &nbsp; O.play( 880 );<br>
* </code>
*
* view basic <a href="../../examples/editor/?file=audio-tone" target="_blank">BB.AudioTone</a> example
*/
class AudioTone extends AudioBase {

	constructor(config){
		if(typeof config==="object") super(config);
		else super();

		this.input = {}; // keep track of current polyphonic notes

		// TODO formalize access to this.input[i] this a bit more
		// inorder to use the osclicator as a theromine type thing

		this.err.checkType(config,["undefined","object","number","string"],"config-object");

		// set default frequency -----------------------------------------------
		if(typeof config==="object"){
			this.err.checkType(config.frequency,["undefined","number","string"],"frequency");
			if(typeof config.frequency=="undefined") this._frequency = 440;
			else if(typeof config.frequency=="number") this._frequency = config.frequency;
			else {
				if( this._isNote(config.frequency) )
					this._frequency = BB.Audio.getFreq( config.frequency );
			}

		} else if(typeof config==="string"){
			if( this._isNote(config) ) this._frequency = BB.Audio.getFreq( config );

		} else if(typeof config==="number"){
			this._frequency = config;

		} else {
			this._frequency = 440;
		}

		// set default duration ------------------------------------------------
		if(typeof config==="object"){
			this.err.checkType(config.duration,["undefined","number"],"duration");

			if(typeof config.duration=="undefined") this._duration = 1;
			else if(typeof config.duration=="number") this._duration = config.duration;

			if( this.attack+this.decay+this.release > this.duration )
				throw new Error('BB.AudioTone: your duration can not be less than attack+decay+release');

		} else {
			this._duration = 1;
		}


		// set type && wave table -----------------------------------------------
		this._type = null;
		this._wave = null;
		this.oscTypes = [ "sine", "square", "sawtooth", "triangle", "custom" ];
		if(typeof config==="object"){
			if( typeof config.type !== "undefined"){
				if( this.oscTypes.indexOf(config.type) < 0 ){
					throw new Error('BB.AudioTone: type should be either "sine", "square", "sawtooth", "triangle" or "custom ');
				} else if( config.type === "custom" ){

					if( typeof config.wave !== "undefined" ){
						if(config.wave instanceof Array){

							this._type = config.type;
							this._wave = config.wave;
							var imag = new Float32Array( config.wave );  // sine
							var real = new Float32Array( imag.length );  // cos
							this.wavetable = this.ctx.createPeriodicWave( real, imag );

						} else if(config.wave instanceof Object){

							if(typeof config.wave.real === "undefined" || typeof config.wave.imag === "undefined"){
								throw new Error('BB.AudioTone: wave object should contain a "real" and an "imag" (Float32Array) properties');
							} else if( !(config.wave.real instanceof Float32Array) || !(config.wave.imag instanceof Float32Array) ) {
								throw new Error('BB.AudioTone: real and imag properties should be an instanceof Float32Array');
							} else {
								this._type = config.type;
								this._wave = config.wave;
								this.wavetable = this.ctx.createPeriodicWave( config.wave.real, config.wave.imag );
							}

						} else {
							throw new Error('BB.AudioTone: wave should be instanceof Object or instanceof Array');
						}
					} else {
						throw new Error('BB.AudioTone: additional wave property is required for "custom" type');
					}

				} else { this._type = config.type; }
			} else {
				this._type = "sine";
			}
		} else {
			this._type = "sine";
		}
	}

	/**
	* the duration (default 1)
	* @type {Number}
	* @property duration
	*/
	set duration( value ){
		if( this.attack+this.decay+this.release > value )
			throw new Error('BB.AudioTone: your duration can not be less than attack+decay+release');
		else
			this._duration = value;
	}
	get duration(){
		return this._duration;
	}

	/**
	* the default frequency (default 440)
	* @type {String|Number}
	* @property frequency
	*/
	set frequency( value ){
		this.err.checkType(value,["string","number"],"frequency");
		if( typeof value=="string"){
			if( this._isNote(value) ) this._frequency = BB.Audio.getFreq( value );
		} else {
			this._frequency = value;
		}
	}
	get frequency(){
		return this._frequency;
	}

	/**
	* type of wave, either "sine", "square", "sawtooth", "triangle", "custom"
	* @type {String}
	* @property type
	*/
	set type( str ){
		this.err.checkType(str,"string","type");
		if( this.oscTypes.indexOf(str) < 0 ){
			throw new Error('BB.AudioTone: type should be either "sine", "square", "sawtooth", "triangle" or "custom ');
		} else if( str === "custom" ){
			if(this.wave===null)
			console.warn("BB.AudioTone: you've set a custom type, don't forget to define the wave property");
		}
		this._type = str;
	}
	get type(){
		return this._type;
	}

	/**
	* custom wave Array/Object
	* @type {Object|Array}
	* @property wave
	*/
	set wave( wave ){
		if( typeof wave !== "undefined" ){
			if(wave instanceof Array){

				this._wave = wave;
				this.type = "custom";
				var imag = new Float32Array( wave );  // sine
				var real = new Float32Array( imag.length );  // cos
				this.wavetable = this.ctx.createPeriodicWave( real, imag );

			} else if(wave instanceof Object){

				if(typeof wave.real === "undefined" || typeof wave.imag === "undefined"){
					throw new Error('BB.AudioTone.wave: wave object should contain a "real" and an "imag" (Float32Array) properties');
				} else if( !(wave.real instanceof Float32Array) || !(wave.imag instanceof Float32Array) ) {
					throw new Error('BB.AudioTone.wave: real and imag properties should be an instanceof Float32Array');
				} else {
					this.type = "custom";
					this._wave = wave;
					this.wavetable = this.ctx.createPeriodicWave( wave.real, wave.imag );
				}

			} else {
				throw new Error('BB.AudioTone.wave: wave should be instanceof Object or instanceof Array');
			}
		} else {
			throw new Error('BB.AudioTone.wave: expecting a wave argument ( Array or Object )');
		}
	}

	get wave(){
		return this._wave;
	}

	// ... private methods  .... .... .... .... .... .... .... .... .... .... .... .... .... .... .... .... ....

	_addPolyNote( freq, oscNode, gainNode, sustLvl, holdTime ){
		// TODO get rid of holdTime ( no longer being used )
		// TODO consider how this might work in sampler/noiseOn
		// TODO see todo note in constructor

		this.input[freq] = { osc:oscNode, gain:gainNode, hold:holdTime, lvl:sustLvl };
		// adjust overall gain to account for total number of waves
		let count = 0; for(let k in this.input) count++;
		let polylength = (count===0) ? 1 : count;
		// this.output.gain.setTargetAtTime( this.getGain()/polylength, this.ctx.currentTime, 0.1);
		this.output.gain.setValueAtTime( this.getGain()/polylength, this.ctx.currentTime );
	}

	_removePolyNote( freq ){
		if(typeof this.input[freq]!=="undefined"){
			this.input[freq].gain.disconnect();
			delete this.input[freq];
		}
		/// adjust overall gain to account for total number of waves
		let count = 0; for(let k in this.input) count++;
		let polylength = (count===0) ? 1 : count;
		this.output.gain.setTargetAtTime( this.getGain()/polylength, this.ctx.currentTime, 0.5);
	}

	_isNote( str ){
		let notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
		if( notes.indexOf(str)<0){
			throw new Error("BB.AudioTone: string frequency values must be one of the following: "+notes);
		} else {
			return true;
		}
	}

	_returnSteps( type ){
		// via >> http://www.phy.mtu.edu/~suits/chords.html
		// && >> http://www.cs.cmu.edu/~scottd/chords_and_scales/music.html
		var steps;
			 if(type=="maj")     steps = [4, 3];
		else if(type=="min")     steps = [3, 4];
		else if(type=="dim")     steps = [3, 3];
		else if(type=="7")       steps = [4, 3, 3];
		else if(type=="min7")    steps = [3, 4, 3 ];
		else if(type=="maj7")    steps = [4, 3, 4];
		else if(type=="sus4")    steps = [5, 2];
		else if(type=="7sus4")   steps = [5, 2, 3];
		else if(type=="6")       steps = [4, 3, 2];
		else if(type=="min6")    steps = [3, 4, 2];
		else if(type=="aug")     steps = [4, 4];
		else if(type=="7-5")     steps = [4, 2, 4];
		else if(type=="7+5")     steps = [4, 4, 2];
		else if(type=="min7-5")  steps = [3, 3, 4];
		else if(type=="min/maj7")steps = [3, 4, 4];
		else if(type=="maj7+5")  steps = [4, 4, 3];
		else if(type=="maj7-5")  steps = [4, 2, 5];
		else if(type=="9")       steps = [4, 3, 3, -8];
		else if(type=="min9")    steps = [3, 4, 3, -8];
		else if(type=="maj9")    steps = [4, 3, 4, -9];
		else if(type=="7+9")     steps = [4, 3, 3, -7];
		else if(type=="7-9")     steps = [4, 3, 3, -9];
		else if(type=="7+9-5")   steps = [4, 2, 4, -7];
		else if(type=="6/9")     steps = [4, 3, 2, -7];
		else if(type=="9+5")     steps = [4, 4, 2, -8];
		else if(type=="9-5")     steps = [4, 2, 4, -8];
		else if(type=="min9-5")  steps = [3, 3, 4, -8];
		else if(type=="11")      steps = [4, 3, 3, -8, 3];
		else if(type=="min11")   steps = [3, 4, 3, -8, 3];
		else if(type=="11-9")    steps = [4, 3, 3, -9, 4];
		else if(type=="13")      steps = [4, 3, 3, -8, 3, 4];
		else if(type=="min13")   steps = [3, 4, 3, -8, 3, 4];
		else if(type=="maj13")   steps = [4, 3, 4, -9, 3, 4];
		else if(type=="add9")    steps = [4, 3, -5];
		else if(type=="minadd9") steps = [3, 4, -5];
		else if(type=="sus2")    steps = [2, 5];
		else if(type=="5")       steps = [7];

		return steps;
	}

	// ... make sounds!!!! .... .... .... .... .... .... .... .... .... .... .... .... .... .... .... .... ....

	spit( config ){
		this.err.checkType(config,["number","undefined","object"]);

		let st; // start time
		let freq, dur, attack, decay, sustain, release;
		if( typeof config=="object"){
			this.err.checkType(config.frequency,["number","string","undefined"],"frequency");
			this.err.checkType(config.time,["number","undefined"],"time");
			this.err.checkType(config.duration,["number","undefined"],"duration");
			this.err.checkType(config.attack,["number","undefined"],"attack");
			this.err.checkType(config.decay,["number","undefined"],"decay");
			this.err.checkType(config.sustain,["number","undefined"],"sustain");
			this.err.checkType(config.release,["number","undefined"],"release");

			if(typeof config.frequency=="string"){
				if( this._isNote(config.frequency) )
					freq = BB.Audio.getFreq( config.frequency );
			} else if(typeof config.frequency=="number") {
				freq = config.frequency;
			} else { freq = this.frequency; }

			st = (typeof config.time=="undefined") ? this.ctx.currentTime : config.time;

			dur = (typeof config.duration=="undefined") ? this.duration : config.duration;
			attack = (typeof config.attack=="undefined") ? this.attack : config.attack;
			decay = (typeof config.decay=="undefined") ? this.decay : config.decay;
			sustain = (typeof config.sustain=="undefined") ? this.sustain : config.sustain;
			release = (typeof config.release=="undefined") ? this.release : config.release;
		} else {
			if(typeof config=="number")	st = config;
			else st = this.ctx.currentTime;
			dur = this.duration;
			freq = this.frequency;
			attack = this.attack;
			decay = this.decay;
			sustain = this.sustain;
			release = this.release;
		}

		// custom type / wavetable
		let type, wave;
		if( typeof config == "object" ){
			this.err.checkType(config.type,["string","undefined"],"type");
			if( typeof config.type == "string" ){
				if( this.oscTypes.indexOf(config.type) < 0 ){
					throw new Error('BB.AudioTone: type should be either "sine", "square", "sawtooth", "triangle" or "custom ');
				} else if( config.type === "custom" && typeof config.wave!=="undefined" ){
					this.err.checkInstanceOf(config.wave,[Object,Array],"wave");
				}
			}

			type = (typeof config.type=="undefined") ? this.type : config.type;
			if( type=="custom"){
				if(config.wave instanceof Array){
					var imag = new Float32Array( config.wave );  // sine
					var real = new Float32Array( imag.length );  // cos
					wave = this.ctx.createPeriodicWave( real, imag );
				} else if(config.wave instanceof Object){
					if(typeof wave.real === "undefined" || typeof wave.imag === "undefined"){
						throw new Error('BB.AudioTone.wave: wave object should contain a "real" and an "imag" (Float32Array) properties');
					} else if( !(wave.real instanceof Float32Array) || !(wave.imag instanceof Float32Array) ) {
						throw new Error('BB.AudioTone.wave: real and imag properties should be an instanceof Float32Array');
					} else {
						wave = this.ctx.createPeriodicWave( config.wave.real, config.wave.imag );
					}
				}
			}
		} else {
			type = this.type;
			if( type=="custom") wave = this.wave;
		}

		// make sure duration is long enough
		if( attack+decay+release > dur )
			throw new Error('BB.AudioTone.play: your duration can not be less than attack+decay+release');

		// the throw away nodes
		let gainNode = this.ctx.createGain();
			gainNode.connect( this.output );

		let osc = this.ctx.createOscillator();
			osc.connect( gainNode );
			osc.frequency.value = freq;
			if(type === "custom") osc.setPeriodicWave( wave );
			else osc.type = type;

		// scheduled start time && adsr
		let hold = (dur-(attack+decay+release));
		this._adsr(gainNode, 1.0, st, attack, decay, release, hold, sustain);
		osc.start(st);
	}

	/**
	* starts playing a tone
	*
	* @method noteOn
	* @param {number|string|object} frequency a config object or the frequency value in Hz or a note string (ex: C, C#, A, etc)
	* @param {number} [time] if you want to schedule the note for later ( rather than play immediately ), in seconds ( if less than BB.Audio.now() defaults to now )
	*
	* @example
	* <code class="code prettyprint">
	*  &nbsp;BB.Audio.init();<br>
	*  <br>
	*  &nbsp;var O = new BB.AudioTone({ gain: 0.5 });<br>
	*  <br>
	*  &nbsp;O.noteOn( "A" ); // will stay on, until noteOff(440) is executed<br>
	*  &nbsp;// could also send as Hz vlue...<br>
	*  &nbsp;// ... and optionally tell it to start 5 secs from now <br>
	*  &nbsp;O.noteOn( 440, BB.Audio.now()+5 );
	*  &nbsp;<br>
	*  &nbsp;// or you could pass a config object that looks like this <br>
	*  &nbsp;O.noteOn({<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;frequency:440,//or "A"<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;attack: 0.5,<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;decay: 0.5,<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;sustain: 0.5<br>
	*  &nbsp;});<br>
	* </code>
	*/
	noteOn( freqObj, time ){
		this.err.checkType(freqObj,["number","string","object","undefined"]);
		this.err.checkType(time,["number","undefined"]);

		if(typeof freqObj=="undefined") freqObj = this.frequency; // set default

		let freq, attack, decay, sustain;
		if( typeof freqObj=="object"){
			this.err.checkType(freqObj.frequency,["number","string"]);
			this.err.checkType(freqObj.attack,["number","undefined"]);
			this.err.checkType(freqObj.decay,["number","undefined"]);
			this.err.checkType(freqObj.sustain,["number","undefined"]);
			if(typeof freqObj.frequency=="string"){
				if( this._isNote(freqObj.frequency) )
					freq = BB.Audio.getFreq( freqObj.frequency );
			} else { freq = freqObj.frequency; }
			attack = (typeof freqObj.attack=="undefined") ? this.attack : freqObj.attack;
			decay = (typeof freqObj.decay=="undefined") ? this.decay : freqObj.decay;
			sustain = (typeof freqObj.sustain=="undefined") ? this.sustain : freqObj.sustain;
		} else {
			if(typeof freqObj=="string"){
				if( this._isNote(freqObj) ) freq = BB.Audio.getFreq( freqObj );
			} else if(typeof freqObj=="number") { freq = freqObj; }
			else { freq = this.frequency; }
			attack = this.attack;
			decay = this.decay;
			sustain = this.sustain;
		}

		// don't play if already playing
		if( this.input.hasOwnProperty(freq) ) return false;

		let gainNode = this.ctx.createGain();
			gainNode.connect( this.output );

		let osc = this.ctx.createOscillator();
			osc.connect( gainNode );
			osc.frequency.value = freq;
			if(this.type === "custom") osc.setPeriodicWave( this.wavetable );
			else osc.type = this.type;

		// scheduled start time
		let st;
		if(typeof freqObj=="object"){
			this.err.checkType(freqObj.time,["number","undefined"]);
			st = (typeof freqObj.time !== "undefined") ? freqObj.time : this.ctx.currentTime;
		} else {
			st = (typeof time !== "undefined") ? time : this.ctx.currentTime;
		}

		// fadeIn (if adsr) && start playing
		this._adsrIn( gainNode, 1.0, st, attack, decay, sustain );
		osc.start(st);

		// let delay = st - this.ctx.currentTime;
		// if( delay < 0 ) delay = 0;
		// this._addPolyNote( freq, osc, gainNode, sustain, delay+attack+decay+0.00002 );
		this._addPolyNote( freq, osc, gainNode, sustain );
	}

	/**
	* stops playing a tone
	*
	* @method noteOff
	* @param {number|string|object} frequency a config object or the frequency value in Hz or a note string (ex: C, C#, A, etc)
	* @param {number} [release] the time (in seconds) it takes for the note to fade out ( default 0 )
	* @param {number} [hold] seconds (from now) to delay before turning the note off ( default 0 )
	*
	* @example
	* <code class="code prettyprint">
	*  &nbsp;BB.Audio.init();<br>
	*  <br>
	*  &nbsp;var O = new BB.AudioTone({ gain: 0.5 });<br>
	*  <br>
	*  &nbsp; O.noteOn( 440 ); <br>
	*  &nbsp;// will turn the note off in 3 seconds, with a 1 second fade<br>
	*  &nbsp; O.noteOff( 440, 1, 3 );
	*  </code>
	*/
	noteOff( freqObj ){
		this.err.checkType(freqObj,["number","string","object","undefined"]);

		if(typeof freqObj=="undefined") freqObj = this.frequency; // set default

		let freq, hold, release;
		if( typeof freqObj=="object"){
			this.err.checkType(freqObj.frequency,["string","number"]);
			this.err.checkType(freqObj.release,["undefined","number"]);
			this.err.checkType(freqObj.hold,["undefined","number"]);
			if(typeof freqObj.frequency=="string"){
				if( this._isNote(freqObj.frequency) )
					freq = BB.Audio.getFreq( freqObj.frequency );
			} else { freq = freqObj.frequency; }
			hold = (typeof freqObj.hold=="number") ? freqObj.hold : 0;
			release = (typeof freqObj.release=="number") ? freqObj.release : 0;
		} else {
			if(typeof freqObj=="string"){
				if( this._isNote(freqObj) ) freq = BB.Audio.getFreq( freqObj );
			} else { freq = freqObj; }
			hold = 0;
			release = this.release;
		}


		if(typeof this.input[freq] !== "undefined"){

			let now = this.ctx.currentTime; // fadeOut (if hold||sustain) && stop
			this._adsrOut( this.input[freq].gain, 1.0, now+hold, release, this.input[freq].lvl  );
			this.input[freq].osc.stop( now + hold + release + 0.00005);

			// remove from input when fadeOut is complete
			let rmvInterval = setInterval(()=>{
				if(typeof this.input[freq] !== "undefined"){
					if(this.ctx.currentTime >= now + hold + release + 0.00006 ){
						this._removePolyNote( freq );
						clearInterval( rmvInterval );
					}
				} else {
					clearInterval( rmvInterval );
				}
			},1000/60);
		}
	}

	/**
	 * plays (noteOn and noteOff) a tone
	 * @method play
	 * @param {number|string|object} frequency a config object or the frequency value in Hz or a note string (ex: C, C#, A, etc)
	 * @param {number} [hold] seconds (from start time) to delay before turning the note off ( default 0.5 )
	 * @param {number} [time] if you want to schedule the note for later ( rather than play immediately ), in seconds ( if less than BB.Audio.now() defaults to now )
	 *
	 * @example
	 * <code class="code prettyprint">
	 *  &nbsp;BB.Audio.init();<br>
	 *  <br>
	 *  &nbsp;var O = new BB.AudioTone();<br>
	 *  <br>
	 *  &nbsp; // plays a 440 Hz sine wave for half a second <br>
	 *  &nbsp; O.play("A");<br>
	 *  <br>
	 *  &nbsp; // plays a 444 Hz sine wave for 2 seconds, three seconds from now<br>
	 *  &nbsp; O.play( 444, 2, BB.Audio.now()+3 ); <br>
	 *  <br>
	 *  &nbsp; O.play({<br>
	 *  &nbsp;&nbsp;&nbsp; frequency: "A",//or 440<br>
	 *  &nbsp;&nbsp;&nbsp; attack: 0.5, //half second form onset to max gain <br>
	 *  &nbsp;&nbsp;&nbsp; decay: 0.5, //half second from max gain down to sustain level<br>
	 *  &nbsp;&nbsp;&nbsp; sustain: 0.75, //sustain level 75% of max gain<br>
	 *  &nbsp;&nbsp;&nbsp; hold: 2, //hold sustain level for 2 seconds<br>
	 *  &nbsp;&nbsp;&nbsp; release: 1 //fade out for a second after hold time<br>
	 *  &nbsp; }, BB.Audio.now()+4 ); //play note 4 seconds from now <br>
	 *  &nbsp; // note: when passing a config object, second paramter becomes the time parameter
	 * </code>
	 */
	play( config ){
		this.err.checkType(config,["number","undefined","object"]);

		let st; // start time
		let freq, dur, attack, decay, sustain, release;
		if( typeof config=="object"){
			this.err.checkType(config.frequency,["number","string","undefined"]);
			this.err.checkType(config.time,["number","undefined"]);
			this.err.checkType(config.duration,["number","undefined"]);
			this.err.checkType(config.attack,["number","undefined"]);
			this.err.checkType(config.decay,["number","undefined"]);
			this.err.checkType(config.sustain,["number","undefined"]);
			this.err.checkType(config.release,["number","undefined"]);

			if(typeof config.frequency=="string"){
				if( this._isNote(config.frequency) )
					freq = BB.Audio.getFreq( config.frequency );
			} else if(typeof config.frequency=="number") {
				freq = config.frequency;
			} else { freq = this.frequency; }

			st = (typeof config.time=="undefined") ? this.ctx.currentTime : config.time;

			dur = (typeof config.duration=="undefined") ? this.duration : config.duration;
			attack = (typeof config.attack=="undefined") ? this.attack : config.attack;
			decay = (typeof config.decay=="undefined") ? this.decay : config.decay;
			sustain = (typeof config.sustain=="undefined") ? this.sustain : config.sustain;
			release = (typeof config.release=="undefined") ? this.release : config.release;
		} else {
			if(typeof config=="number")	st = config;
			else st = this.ctx.currentTime;
			dur = this.duration;
			freq = this.frequency;
			attack = this.attack;
			decay = this.decay;
			sustain = this.sustain;
			release = this.release;
		}

		// make sure duration is long enough
		if( attack+decay+release > dur )
			throw new Error('BB.AudioTone.play: your duration can not be less than attack+decay+release');

		let delay = st - this.ctx.currentTime+0.00002;
		if( delay < 0 ) delay = 0.00002;

		this.noteOn({
			frequency	: freq,
			time 		: st,
			attack		: attack,
			decay		: decay,
			sustain		: sustain
		});

		this.noteOff({
			frequency	: freq,
			hold 		: delay+(dur-(attack+decay)),
			release		: release
		});

	}


	/**
	* just like noteOn except it starts playing a chord rather than a single note, and so it's config object takes two additional properties: tuning ( can be "equal" or "just", defautls to "equal" ) and type ( can be maj, min, dim, 7, min7, maj7, sus4, 7sus4, 6, min6, aug, 7-5, 7+5, min7-5, min/maj7, maj7+5, maj7-5, 9, min9, maj9, 7+9, 7-9, 7+9-5, 6/9, 9+5, 9-5, min9-5, 11, min11, 11-9, 13, min13, maj13, add9, minadd9, sus2, or 5) defaults to "maj"
	*
	* @method chordOn
	* @param {number|string|object} frequency a config object or the frequency value in Hz or a note string (ex: C, C#, A, etc)
	* @param {number} [time] if you want to schedule the note for later ( rather than play immediately ), in seconds ( if less than BB.Audio.now() defaults to now )
	*
	* @example
	* <code class="code prettyprint">
	*  &nbsp;BB.Audio.init();<br>
	*  <br>
	*  &nbsp;var O = new BB.AudioTone({ gain: 0.5 });<br>
	*  <br>
	*  &nbsp;// will stay on an A major chord until chordOff("A") is executed<br>
	*  &nbsp;O.chordOn( "A" ); <br>
	*  &nbsp;// could also send as Hz vlue...<br>
	*  &nbsp;// ... and optionally tell it to start 5 secs from now <br>
	*  &nbsp;O.chordOn( 440, BB.Audio.now()+5 );
	*  &nbsp;<br>
	*  &nbsp;// or you could pass a config object that looks like this <br>
	*  &nbsp;O.chordOn({<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;frequency:440,//or "A"<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;attack: 0.5,<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;decay: 0.5,<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;sustain: 0.5,<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;type: "maj9"<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;tuning: "just"<br>
	*  &nbsp;});<br>
	* </code>
	*/
	chordOn( freqObj, time ){
		this.err.checkType(freqObj,["number","string","object","undefined"]);
		this.err.checkType(time,["number","undefined"]);

		if(typeof freqObj=="undefined") freqObj = this.frequency; // set default

		let st; // scheduled start time
		if(typeof freqObj=="object"){
			this.err.checkType(freqObj.time,["number","undefined"]);
			st = (typeof freqObj.time !== "undefined") ? freqObj.time : this.ctx.currentTime;
		} else {
			st = (typeof time !== "undefined") ? time : this.ctx.currentTime;
		}

		let freq, attack, decay, sustain, typ, tun;
		if( typeof freqObj=="object"){
			this.err.checkType(freqObj.frequency,["number","string"]);
			this.err.checkType(freqObj.attack,["number","undefined"]);
			this.err.checkType(freqObj.decay,["number","undefined"]);
			this.err.checkType(freqObj.sustain,["number","undefined"]);
			this.err.checkType(freqObj.type,["string","undefined"]);
			this.err.checkType(freqObj.tuning,["string","undefined"]);
			if(typeof freqObj.frequency=="string"){
				if( this._isNote(freqObj.frequency) )
					freq = BB.Audio.getFreq( freqObj.frequency );
			} else { freq = freqObj.frequency; }
			attack = (typeof freqObj.attack=="undefined") ? this.attack : freqObj.attack;
			decay = (typeof freqObj.decay=="undefined") ? this.decay : freqObj.decay;
			sustain = (typeof freqObj.sustain=="undefined") ? this.sustain : freqObj.sustain;
			typ  = (typeof freqObj.type !== "undefined") ? freqObj.type : "maj";
			tun  = (typeof freqObj.tuning !== "undefined") ? freqObj.tuning : "equal";
		} else {
			if(typeof freqObj=="string"){
				if( this._isNote(freqObj) ) freq = BB.Audio.getFreq( freqObj );
			} else if(typeof freqObj=="number") { freq = freqObj; }
			else { freq = this.frequency; }
			attack = this.attack;
			decay = this.decay;
			sustain = this.sustain;
			typ  = "maj";
			tun  = "equal";
		}

		var steps = this._returnSteps( typ );
		if( typeof steps == "undefined" ){
			throw new Error(`BB.AudioTone.chordOn: not a proper chord type,
				try maj, min, dim, 7, min7, maj7, sus4, 7sus4, 6, min6, aug,
				7-5, 7+5, min7-5, min/maj7, maj7+5, maj7-5, 9, min9, maj9,
				7+9, 7-9, 7+9-5, 6/9, 9+5, 9-5, min9-5, 11, min11, 11-9, 13,
				min13, maj13, add9, minadd9, sus2, or 5`);
		}
		var incSteps = [0];

		for (var s = 1; s < steps.length+1; s++) {
			var inc = 0;
			for (var j = 0; j < s; j++) inc += steps[j];
			incSteps.push( inc );
		}

		for (var i = 0; i < incSteps.length; i++) {
			this.noteOn({
				frequency	: BB.Audio.halfStep(freq, incSteps[i], tun),
				time 		: st,
				attack		: attack,
				decay		: decay,
				sustain		: sustain
			});
		}

    }


	/**
	* just like noteOff except stops a chord which is currently playing, and so it's config object takes two additional properties: tuning ( can be "equal" or "just", defautls to "equal" ) and type ( can be maj, min, dim, 7, min7, maj7, sus4, 7sus4, 6, min6, aug, 7-5, 7+5, min7-5, min/maj7, maj7+5, maj7-5, 9, min9, maj9, 7+9, 7-9, 7+9-5, 6/9, 9+5, 9-5, min9-5, 11, min11, 11-9, 13, min13, maj13, add9, minadd9, sus2, or 5) defaults to "maj"
	*
	* @method chordOff
	* @param {number|string|object} frequency a config object or the frequency value in Hz or a note string (ex: C, C#, A, etc)
	* @param {number} [release] the time (in seconds) it takes for the note to fade out ( default 0 )
	* @param {number} [hold] seconds (from now) to delay before turning the note off ( default 0 )
	*
	* @example
	* <code class="code prettyprint">
	*  &nbsp;BB.Audio.init();<br>
	*  <br>
	*  &nbsp;var O = new BB.AudioTone({ gain: 0.5 });<br>
	*  <br>
	*  &nbsp; O.chordOn( 440 ); <br>
	*  &nbsp;// will turn the chord off in 3 seconds, with a 1 second fade<br>
	*  &nbsp; O.chordOff( 440, 1, 3 );
	*  </code>
	*/
	chordOff( freqObj ){
		this.err.checkType(freqObj,["number","string","object","undefined"]);

		if(typeof freqObj=="undefined") freqObj = this.frequency; // set default

		let freq, hold, release, typ, tun;
		if( typeof freqObj=="object"){
			this.err.checkType(freqObj.frequency,["string","number"]);
			this.err.checkType(freqObj.release,["undefined","number"]);
			this.err.checkType(freqObj.hold,["undefined","number"]);
			this.err.checkType(freqObj.type,["string","undefined"]);
			this.err.checkType(freqObj.tuning,["string","undefined"]);
			if(typeof freqObj.frequency=="string"){
				if( this._isNote(freqObj.frequency) )
					freq = BB.Audio.getFreq( freqObj.frequency );
			} else { freq = freqObj.frequency; }
			hold = (typeof freqObj.hold=="number") ? freqObj.hold : 0;
			release = (typeof freqObj.release=="number") ? freqObj.release : 0;
			typ  = (typeof freqObj.type !== "undefined") ? freqObj.type : "maj";
			tun  = (typeof freqObj.tuning !== "undefined") ? freqObj.tuning : "equal";
		} else {
			if(typeof freqObj=="string"){
				if( this._isNote(freqObj) ) freq = BB.Audio.getFreq( freqObj );
			} else { freq = freqObj; }
			hold = 0;
			release = this.release;
			typ  = "maj";
			tun  = "equal";
		}

		var steps = this._returnSteps( typ );
		if( typeof steps == "undefined" ){
			throw new Error(`BB.AudioTone.chordOn: not a proper chord type,
				try maj, min, dim, 7, min7, maj7, sus4, 7sus4, 6, min6, aug,
				7-5, 7+5, min7-5, min/maj7, maj7+5, maj7-5, 9, min9, maj9,
				7+9, 7-9, 7+9-5, 6/9, 9+5, 9-5, min9-5, 11, min11, 11-9, 13,
				min13, maj13, add9, minadd9, sus2, or 5`);
		}
		var incSteps = [0];

		for (var s = 1; s < steps.length+1; s++) {
			var inc = 0;
			for (var j = 0; j < s; j++) inc += steps[j];
			incSteps.push( inc );
		}

		for (var i = 0; i < incSteps.length; i++) {
			this.noteOff({
				frequency	: BB.Audio.halfStep(freq, incSteps[i], tun),
				hold 		: hold,
				release		: release
			});
		}
	}

	/**
	 * similar to the .play() method except that it plays a chord rather than a single note, and so it's config object takes two additional properties: tuning ( can be "equal" or "just", defautls to "equal" ) and type ( can be maj, min, dim, 7, min7, maj7, sus4, 7sus4, 6, min6, aug, 7-5, 7+5, min7-5, min/maj7, maj7+5, maj7-5, 9, min9, maj9, 7+9, 7-9, 7+9-5, 6/9, 9+5, 9-5, min9-5, 11, min11, 11-9, 13, min13, maj13, add9, minadd9, sus2, or 5) defaults to "maj"
	 * @method playChord
	 * @param {number|string|object} frequency a config object or the frequency value in Hz or a note string (ex: C, C#, A, etc)
	 * @param {number} [hold] seconds (from start time) to delay before turning the note off ( default 0.5 )
	 * @param {number} [time] if you want to schedule the note for later ( rather than play immediately ), in seconds ( if less than BB.Audio.now() defaults to now )
	 *
	 * @example
	 * <code class="code prettyprint">
	 *  &nbsp;BB.Audio.init();<br>
	 *  <br>
	 *  &nbsp;var O = new BB.AudioTone();<br>
	 *  <br>
	 *  &nbsp; // plays an A major chord of equal temperment <br>
	 *  &nbsp; O.playChord("A");<br>
	 *  <br>
	 *  &nbsp; // plays a 444Hz major chord for 2 seconds, three seconds from now<br>
	 *  &nbsp; O.playChord( 444, 2, BB.Audio.now()+3 ); <br>
	 *  <br>
	 *  &nbsp; O.playChord({<br>
	 *  &nbsp;&nbsp;&nbsp; frequency: "A",//or 440<br>
	 *  &nbsp;&nbsp;&nbsp; attack: 0.5, //half second form onset to max gain <br>
	 *  &nbsp;&nbsp;&nbsp; decay: 0.5, //half second from max gain down to sustain level<br>
	 *  &nbsp;&nbsp;&nbsp; sustain: 0.75, //sustain level 75% of max gain<br>
	 *  &nbsp;&nbsp;&nbsp; hold: 2, //hold sustain level for 2 seconds<br>
	 *  &nbsp;&nbsp;&nbsp; release: 1, //fade out for a second after hold time<br>
	 *  &nbsp;&nbsp;&nbsp; type: "min7", //plays a minor seventh chord<br>
	 *  &nbsp;&nbsp;&nbsp; tuning: "just" // derived with just temperment<br>
	 *  &nbsp; }, BB.Audio.now()+4 ); //play note 4 seconds from now <br>
	 *  &nbsp; // note: when passing a config object, second paramter becomes the time parameter
	 * </code>
	 */
	playChord( config ){
		this.err.checkType(config,["number","string","object","undefined"]);

		let st; // start time
		let freq, dur, attack, decay, sustain, release, typ, tun;
		if( typeof config=="object"){
			this.err.checkType(config.frequency,["number","string","undefined"]);
			this.err.checkType(config.time,["number","undefined"]);
			this.err.checkType(config.duration,["number","undefined"]);
			this.err.checkType(config.attack,["number","undefined"]);
			this.err.checkType(config.decay,["number","undefined"]);
			this.err.checkType(config.sustain,["number","undefined"]);
			this.err.checkType(config.release,["number","undefined"]);
			this.err.checkType(config.type,["string","undefined"]);
			this.err.checkType(config.tuning,["string","undefined"]);

			if(typeof config.frequency=="string"){
				if( this._isNote(config.frequency) )
					freq = BB.Audio.getFreq( config.frequency );
			} else if(typeof config.frequency=="number") {
				freq = config.frequency;
			} else { freq = this.frequency; }

			st = (typeof config.time=="undefined") ? this.ctx.currentTime : config.time;

			dur = (typeof config.duration=="undefined") ? this.duration : config.duration;
			attack = (typeof config.attack=="undefined") ? this.attack : config.attack;
			decay = (typeof config.decay=="undefined") ? this.decay : config.decay;
			sustain = (typeof config.sustain=="undefined") ? this.sustain : config.sustain;
			release = (typeof config.release=="undefined") ? this.release : config.release;

			typ  = (typeof config.type !== "undefined") ? config.type : "maj";
			tun  = (typeof config.tuning !== "undefined") ? config.tuning : "equal";
		} else {
			if(typeof config=="number")	st = config;
			else st = this.ctx.currentTime;
			dur = this.duration;
			freq = this.frequency;
			attack = this.attack;
			decay = this.decay;
			sustain = this.sustain;
			release = this.release;
			typ  = "maj";
			tun  = "equal";
		}

		// make sure duration is long enough
		if( attack+decay+release > dur )
			throw new Error('BB.AudioTone.playChord: your duration can not be less than attack+decay+release');


		let delay = st - this.ctx.currentTime+0.00002;
		if( delay < 0 ) delay = 0.00002;

		var steps = this._returnSteps( typ );
		if( typeof steps == "undefined" ){
			throw new Error(`BB.AudioTone.chordOn: not a proper chord type,
				try maj, min, dim, 7, min7, maj7, sus4, 7sus4, 6, min6, aug,
				7-5, 7+5, min7-5, min/maj7, maj7+5, maj7-5, 9, min9, maj9,
				7+9, 7-9, 7+9-5, 6/9, 9+5, 9-5, min9-5, 11, min11, 11-9, 13,
				min13, maj13, add9, minadd9, sus2, or 5`);
		}
		var incSteps = [0];

		for (var s = 1; s < steps.length+1; s++) {
			var inc = 0;
			for (var j = 0; j < s; j++) inc += steps[j];
			incSteps.push( inc );
		}

		for (var i = 0; i < incSteps.length; i++) {
			this.play({
				frequency: BB.Audio.halfStep(freq, incSteps[i], tun),
				time: st,
				attack: attack,
				decay: decay,
				sustain: sustain,
				hold: delay+(dur-(attack+decay)),
				release: release
			});
		}

	}

}

module.exports = AudioTone;
