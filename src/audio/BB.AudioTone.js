/* jshint esversion: 6 */

let AudioBase = require('./BB.AudioBase.js');

/**
* A module for creating oscillating tones ( periodic wave forms ) with some built-in music theory
* @class BB.AudioTone
* @constructor
* @extends BB.AudioBase
*
* @param {Object} config A config object to initialize the Tone,
* can contain the following:<br><br>
* <code class="code prettyprint">
* &nbsp;{<br>
* &nbsp;&nbsp;&nbsp; frequency: 220, // overide default frequency of 440 <br>
* &nbsp;&nbsp;&nbsp; duration: 2, // overide default duration of 1 second <br>
* &nbsp;&nbsp;&nbsp; type: "custom", // "sine", "square", "sawtooth", "triangle", "custom"<br>
* &nbsp;&nbsp;&nbsp; wave: [ 0, 1, 0, 0.5, 0, 0.25, 0, 0.125 ], // only for "custom" type<Br>
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
*  &nbsp;// create a tone object one of 3 ways<br><br>
*  &nbsp;// 1. with default values ( 440Hz sine wave )<br>
*  &nbsp;var tone = new BB.AudioTone();<br><br>
*  &nbsp;// 2. by passing a default frequency<br>
*  &nbsp;var tone = new BB.AudioTone(220);// could also be a note, ex: "B"<br><br>
*  &nbsp;// 3. by passing a config object<br>
*  &nbsp;var tone = new BB.AudioTone({<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;gain: 0.75,<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;type: "square"<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;frequency: 220, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;attack: 0.25 <br>
*  &nbsp;});<br><br>
* </code>
*  <br><br>
* Once you have instantiated a tone object it can be used in a variety of different ways. Below is an overview:
*  <br><br>
*  <code class="code prettyprint">
*  &nbsp;// the simplest is simply playing it back with all the defaults <br>
*  &nbsp;// in this case 220Hz 1 second square wave at 0.75 gain with 0.25 second attack<br>
*  &nbsp; tone.play(); <br>
*  &nbsp;// you could immediately stop that by calling <br>
*  &nbsp; tone.stop(); <br><br>
*  &nbsp;// you could schedule the playback for later, ex 1 second from now<br>
*  &nbsp; tone.play( BB.Audio.now() + 1 ); <br>
*  &nbsp;// and stop it 1 second after that ( ie. 2 seconds from now )<br>
*  &nbsp; tone.stop( BB.Audio.now() + 2 ); <br><br>
*  &nbsp;// or playback with alternative properties by passing a config object<br>
*  &nbsp; tone.play({<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;frequency:"B",//aka 493.883... <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;time:BB.Audio.now()+1, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;duration: 2, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;attack:0.2, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;decay:0.2, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;sustain:1, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;release:0.25 <br>
*  &nbsp; }); <br><br>
*  &nbsp;// you can trigger the playback of a tone forever like this<br>
*  &nbsp; tone.noteOn(880); <br>
*  &nbsp;// you can do the same but schedule it to start later, ex:<br>
*  &nbsp; tone.noteOn(880, BB.Audio.now()+1 ); <br>
*  &nbsp;// or do the same but with custom properties, ex:<br>
*  &nbsp; tone.noteOn({<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;frequency:880,<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;time:BB.Audio.now()+1, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;attack:0.2, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;decay:0.2, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;sustain:1, <br>
*  &nbsp; }); <br><br>
*  &nbsp;// noteOn can be called once per frequency <br>
*  &nbsp;// which means you can play polyphonic tones with a single tone object <br>
*  &nbsp;// there are also chordOn() and chordOff() methods <br>
*  &nbsp; tone.noteOn(220); <br>
*  &nbsp; tone.noteOn(440); <br>
*  &nbsp; tone.noteOn(880); <br><br>
*  &nbsp;// to stop playback on a particular frequency you can do one of the following: <br>
*  &nbsp; tone.noteOff(880); <br>
*  &nbsp;// or...<br>
*  &nbsp; tone.noteOff({<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;frequency:880,<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;hold:1, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;release:0.25 <br>
*  &nbsp; }); <br><br>
*  &nbsp;// because you can play multiple frequencies at the same time (polyphony) <br>
*  &nbsp;// the tone object needs to keep track of which frequencies are being played <br>
*  &nbsp;// it does this in it's tone.input dictionary(object) property<br>
*  &nbsp;// because of this you can't call play or noteOn multiple times on the... <br>
*  &nbsp;// ...same frequency without overriding the previous instance of that same note <br>
*  &nbsp;// instead there's an alternative method which does not keep track of the note <br>
*  &nbsp;// which means it can not be "stopped" but it can be called multiple times <br>
*  &nbsp;// the api is nearly identical to the play method <br>
*  &nbsp; tone.spit(); <br>
*  &nbsp; tone.spit( BB.Audio.now() + 1 ); <br>
*  &nbsp; tone.spit({<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;frequency:"B",//aka 493.883... <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;time:BB.Audio.now()+1, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;duration: 2, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;attack:0.2, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;decay:0.2, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;sustain:1, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;release:0.25 <br>
*  &nbsp; }); <br><br>
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

	/**
	*  because you can play multiple frequencies at the same time (polyphony)
	*  the tone object needs to keep track of which frequencies are being played
	*  it does this in it's tone.input dictionary(object) property
	*  because of this you can't call play or noteOn multiple times on the
	*  same frequency without overriding the previous instance of that same note
	*  instead there's this alternative method which does not keep track of the note
	*  which means it can not be "stopped" but it can be called multiple times
	* @method spit
	* @param {number|object} [config] either a scheduled time or config object
	*
	* @example
	* <code class="code prettyprint">
	*  &nbsp; tone.spit(); <br>
	*  &nbsp// or schedule playback for later by passing a time <br>
	*  &nbsp; tone.spit( BB.Audio.now() + 1 ); <br>
	*  &nbsp// or pass a config object <br>
	*  &nbsp; tone.spit({<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;frequency:"B",//aka 493.883... <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;time:BB.Audio.now()+1, <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;duration: 2, <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;attack:0.2, <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;decay:0.2, <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;sustain:1, <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;release:0.25 <br>
	*  &nbsp; }); <br><br>
	* </code>
	*/
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
		osc.stop(st+attack+decay+release+hold+0.00005);
	}

	/**
	* starts playing a tone forever
	*
	* @method noteOn
	* @param {number|string|object} frequency a config object or the frequency value in Hz or a note string (ex: C, C#, A, etc)
	* @param {number} [time] if you want to schedule the note for later ( rather than play immediately ), in seconds ( if less than BB.Audio.now() defaults to now )
	*
	* @example
	* <code class="code prettyprint">
	*  &nbsp;// you can trigger the playback of a tone forever like this<br>
	*  &nbsp; tone.noteOn(880); <br>
	*  &nbsp;// you can do the same but schedule it to start later, ex:<br>
	*  &nbsp; tone.noteOn(880, BB.Audio.now()+1 ); <br>
	*  &nbsp;// or do the same but with custom properties, ex:<br>
	*  &nbsp; tone.noteOn({<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;frequency:880,<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;time:BB.Audio.now()+1, <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;attack:0.2, <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;decay:0.2, <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;sustain:1, <br>
	*  &nbsp; }); <br><br>
	*  &nbsp;// noteOn can be called once per frequency <br>
	*  &nbsp;// which means you can play polyphonic tones with a single tone object <br>
	*  &nbsp;// see also chordOn() and chordOff() methods <br>
	*  &nbsp; tone.noteOn(220); <br>
	*  &nbsp; tone.noteOn(440); <br>
	*  &nbsp; tone.noteOn(880); <br><br>
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
		this._addPolyNote( freq, osc, gainNode, sustain, true );
	}

	/**
	* stops playing a tone
	*
	* @method noteOff
	* @param {number|string|object} frequency a config object or the frequency value in Hz or a note string (ex: C, C#, A, etc)
	*
	* @example
	* <code class="code prettyprint">
	*  &nbsp;// to stop playback on a particular frequency you started, ex: tone.noteOn(880): <br>
	*  &nbsp; tone.noteOff(880); <br>
	*  &nbsp;// or...<br>
	*  &nbsp; tone.noteOff({<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;frequency:880,<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;hold:1, <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;release:0.25 <br>
	*  &nbsp; }); <br><br>
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
			this._adsrOut( this.input[freq].gain, 1.0, now+hold, release, this.input[freq].sus  );
			this.input[freq].node.stop( now + hold + release + 0.00005);

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
	 * @param {number|object} [config] a config object or a scheduled time to playback
	 *
	 * @example
	 * <code class="code prettyprint">
	 *  &nbsp;// playback using the tone's defaultsk<br>
	 *  &nbsp; tone.play(); <br>
	 *  &nbsp;// you could schedule the playback for later, ex 1 second from now<br>
	 *  &nbsp; tone.play( BB.Audio.now() + 1 ); <br>
	 *  &nbsp;// or playback with alternative properties by passing a config object<br>
	 *  &nbsp; tone.play({<br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;frequency:"B",//aka 493.883... <br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;time:BB.Audio.now()+1, <br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;duration: 2, <br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;attack:0.2, <br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;decay:0.2, <br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;sustain:1, <br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;release:0.25 <br>
	 *  &nbsp; }); <br><br>
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

	// shhh, secret alias for play... incase folks are used to webaudio api .start()
	start(time){ this.play(time); }

	/**
	 * stops the playback of a tone called via play() method
	 * @method stop
	 * @param {number} [time] a scheduled time to stop playback
	 *
	 * @example
	 * <code class="code prettyprint">
	 * &nbsp;// you could immediately stop that by calling <br>
 	 * &nbsp; tone.stop(); <br><br>
 	 * &nbsp;// or stop it at a later time<br>
 	 * &nbsp; tone.stop( BB.Audio.now() + 2 ); <br><br>
	 * </code>
	 */
	stop( time ){
		this.err.checkType(time,["undefined","number"],"time");

		let st; // scheduled time
		if(typeof time=="number") st = time;
		else st = this.ctx.currentTime;

		let freq = this.frequency;

		if(typeof this.input[freq] !== "undefined"){

			this.input[freq].gain.gain.cancelScheduledValues(st);
			this.input[freq].node.stop( st );

			// remove from input when fadeOut is complete
			let rmvInterval = setInterval(()=>{
				if(typeof this.input[freq] !== "undefined"){
					if(this.ctx.currentTime >= st + 0.00006 ){
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
	* just like noteOn except it starts playing a chord rather than a single note, and so it's config object takes two additional properties: tuning ( can be "equal" or "just", defautls to "equal" ) and type ( can be maj, min, dim, 7, min7, maj7, sus4, 7sus4, 6, min6, aug, 7-5, 7+5, min7-5, min/maj7, maj7+5, maj7-5, 9, min9, maj9, 7+9, 7-9, 7+9-5, 6/9, 9+5, 9-5, min9-5, 11, min11, 11-9, 13, min13, maj13, add9, minadd9, sus2, or 5) defaults to "maj"
	*
	* @method chordOn
	* @param {number|string|object} [frequency] a config object or the frequency value in Hz or a note string (ex: C, C#, A, etc)
	* @param {number} [time] if you want to schedule the note for later ( rather than play immediately ), in seconds ( if less than BB.Audio.now() defaults to now )
	*
	* @example
	* <code class="code prettyprint">
	*  &nbsp;// you can trigger the playback of a tone forever like this<br>
	*  &nbsp; tone.chordOn(880); <br>
	*  &nbsp;// you can do the same but schedule it to start later, ex:<br>
	*  &nbsp; tone.chordOn(880, BB.Audio.now()+1 ); <br>
	*  &nbsp;// or do the same but with custom properties, ex:<br>
	*  &nbsp; tone.chordOn({<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;frequency:880,<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;time:BB.Audio.now()+1, <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;attack:0.2, <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;decay:0.2, <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;sustain:1, <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;type: "maj9",<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;tuning: "just"<br>
	*  &nbsp; }); <br><br>
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
	* just like noteOff except stops a chord which is currently playing
	*
	* @method chordOff
	* @param {number|string|object} [frequency] a config object or the frequency value in Hz or a note string (ex: C, C#, A, etc)
	*
	* @example
	* <code class="code prettyprint">
	*  &nbsp;// to stop playback on a particular frequency you started, ex: tone.chordOn(880): <br>
	*  &nbsp; tone.chordOff(880); <br>
	*  &nbsp;// or...<br>
	*  &nbsp; tone.chordOff({<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;frequency:880,<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;hold:1, <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;release:0.25 <br>
	*  &nbsp; }); <br><br>
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
	 * @param {number|object} [config] a config object or a scheduled time to playback
	 *
	 * @example
	 * <code class="code prettyprint">
	 *  &nbsp;// playback using the tone's defaultsk<br>
	 *  &nbsp; tone.playChord(); <br>
	 *  &nbsp;// you could schedule the playback for later, ex 1 second from now<br>
	 *  &nbsp; tone.playChord( BB.Audio.now() + 1 ); <br>
	 *  &nbsp;// or playback with alternative properties by passing a config object<br>
	 *  &nbsp; tone.playChord({<br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;frequency:"B",//aka 493.883... <br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;time:BB.Audio.now()+1, <br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;duration: 2, <br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;attack:0.2, <br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;decay:0.2, <br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;sustain:1, <br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;release:0.25, <br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;type: "min7", //plays a minor seventh chord<br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;tuning: "just" // derived with just temperment<br>
	 *  &nbsp; }); <br><br>
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
