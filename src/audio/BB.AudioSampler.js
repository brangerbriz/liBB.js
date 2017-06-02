/* jshint esversion: 6 */

let AudioBase = require('./BB.AudioBase.js');

/**
* A module for creating an audio sampler, an object that can load, sample and play back sound files
* @class BB.AudioSampler
* @constructor
* @extends BB.AudioBase
* @param {Object|Array|String} config either a config object, array of paths or single path as a string
* @param {Function} [callback] a function which gets called once all the samples have been decoded into audio buffers (ie. when they've been loaded)
* @example
* there are a a few different ways to use the constructor, the first paramter can be either a path to a file as a string, an array of paths or a config object ( see <a href="BB.AudioBase.html">BB.AudioBase</a> ) with a required path property ( which can be either a path as a string or array of paths)
* <code class="code prettyprint"><br>
* &nbsp;BB.Audio.init();<br><br>
* &nbsp;// simplest way <br>
* &nbsp;var sound = new BB.AudioSampler('audios/meow.wav'); <br><br>
* &nbsp;// load multiple samples <br>
* &nbsp;var sound = new BB.AudioSampler([<br>
* &nbsp;&nbsp;&nbsp;&nbsp;'audios/meow.wav',<br>
* &nbsp;&nbsp;&nbsp;&nbsp;'audios/chuckle.wav'<br>
* &nbsp;]); <br><br>
* &nbsp;// or with a config object <br>
* &nbsp;var sound = new BB.AudioSampler({<br>
* &nbsp;&nbsp;&nbsp;&nbsp;path:'audios/meow.wav',// could also be an array <br>
* &nbsp;&nbsp;&nbsp;&nbsp;offset:0.5,// optionally set default offset <br>
* &nbsp;&nbsp;&nbsp;&nbsp;duration:1// optionally set default duration <br>
* &nbsp;&nbsp;&nbsp;&nbsp;// as well as all the AudioBase class properties<Br>
* &nbsp;&nbsp;&nbsp;&nbsp;connect: fft, // overide default destination <br>
* &nbsp;&nbsp;&nbsp;&nbsp;gain: 0.5, // master "gain" (expolential multiplier)<br>
* &nbsp;&nbsp;&nbsp;&nbsp;attack: 0.25,// attack fade-in in seconds<br>
* &nbsp;&nbsp;&nbsp;&nbsp;decay: 0.25, // decay fade-down to sustain level in seconds <br>
* &nbsp;&nbsp;&nbsp;&nbsp;sustain: 0.75,// sustain level scalar value<br>
* &nbsp;&nbsp;&nbsp;&nbsp;release: 0.25 // release fade-out in seconds<br>
* &nbsp;}); <br>
* </code><br><br>
* the second paramter is an optional callback which fires once all the files have been loaded into this.buffers
* <br><br>
* <code class="code prettyprint"><br>
* &nbsp;// can be passed regardless of which method above you choose <br>
* &nbsp;// here's an example with the simplest method <br>
* &nbsp;var sound = new BB.AudioSampler('audios/meow.wav',function(){ <br>
* &nbsp;&nbsp;&nbsp;&nbsp;// do something after files are loaded, ex: <br>
* &nbsp;&nbsp;&nbsp;&nbsp;sound.play();<br>
* &nbsp;});<br>
* </code>
* <br><br>
* assuming your buffer is loaded, here's a few ways to use this module
* <br><br>
* <code class="code prettyprint"><br>
*  &nbsp;// the simplest is  <br>
*  &nbsp; sound.play(); <br>
*  &nbsp;// you could immediately stop that by calling <br>
*  &nbsp; sound.stop(); <br><br>
*  &nbsp;// you could schedule the playback for later, ex 1 second from now<br>
*  &nbsp; sound.play( BB.Audio.now() + 1 ); <br>
*  &nbsp;// and stop it 1 second after that ( ie. 2 seconds from now )<br>
*  &nbsp; sound.stop( BB.Audio.now() + 2 ); <br><br>
*  &nbsp;// or playback with alternative properties by passing a config object<br>
*  &nbsp; sound.play({<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;buffer:"other",<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;offset:0.25,<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;duration:0.5,<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;time:BB.Audio.now()+1, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;attack:0.2, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;decay:0.2, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;sustain:1, <br>
*  &nbsp;&nbsp;&nbsp;&nbsp;release:0.25 <br>
*  &nbsp; }); <br><br>
*  &nbsp;// you can trigger the playback of a sound to loop forever like this<br>
*  &nbsp; sound.noteOn();<br>
*  &nbsp;// or playback with a detune of 100 cents or one semitone<br>
*  &nbsp; sound.noteOn(100); <br>
*  &nbsp;// you can do the same but schedule it to start later, ex:<br>
*  &nbsp; sound.noteOn(100, BB.Audio.now()+1 ); <br>
*  &nbsp;// or do the same but with custom properties, ex:<br>
*  &nbsp; sound.noteOn({<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;detune:100,<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;offset:0.25,<br>
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
*/
class AudioSampler extends AudioBase {

	constructor( config, callback ){
		if(typeof config==="object") super(config);
		else super();

		this.input = {}; // keep track of current polyphonic notes
		this._detuneRef = 0; // reference for stop method

		this.support = BB.Check.audioSupport();

		this.err = new BB.ValidArg(this);
		this.err.checkType(callback,["undefined","function"]);
		if( typeof callback==="function" ) this.onload = callback;

		/**
		 * collection of sample buffers, each buffers key is derived from the filename
		 * @type {Object}
		 * @property buffers
		 */
		this.buffers	= {};
		this._firstBuff = undefined;

		/**
		 * whether or not the file(s) have loaded
		 * @type {Boolean}
		 * @property loaded
		 */
		this.loaded		= false;
		this.loadingCnt = 0;
		this.loadingLen = 0;

		// set optional params
		if( !(config instanceof Array) && typeof config=="object" ){
			this.err.checkType(config.detune,["undefined","number"],"config.detune");
			this.err.checkType(config.playbackRate,["undefined","number"],"config.playbackRate");
			this.err.checkType(config.offset,["undefined","number"],"config.offset");
			this.err.checkType(config.duration,["undefined","number"],"config.duration");
			this._detune = (typeof config.detune!=="undefined") ? config.detune : 0;
			this._playbackRate = (typeof config.playbackRate!=="undefined") ? config.playbackRate : 1;
			this._offset = (typeof config.offset!=="undefined") ? config.offset : 0;
			this._duration = (typeof config.duration!=="undefined") ? config.duration : undefined;
		} else {
			this._detune = 0;
			this._playbackRate = 1;
			this._offset = 0;
			this._duration = undefined;
		}

		if(typeof config === "string" || config instanceof Array ) {
			this.load(config);
		} else if( typeof config === "object" ){
			if(typeof config.path !== "undefined"){
				if(typeof config.path==="string" || config.path instanceof Array )
					this.load(config.path);
				else throw new Error("BB.AudioSampler: path property must be a string or an array of strings");
			} else {
				throw new Error("BB.AudioSampler: when passing a config object, one of the properties must be path");
			}
		} else {
			throw new Error("BB.AudioSampler: expecting either a path, array of paths or config object including path property");
		}
	}

	// getters / setters -------------------------------------------------------
	// -------------------------------------------------------------------------

	/**
	 * how many seconds into the sample should it playback from (default 0)
	 * @type {Number}
	 * @property offset
	 */
	set offset( n ){
		this.err.checkType(n,"number","offset");
		this._offset = n;
	}
	get offset(){
		return this._offset;
	}

	/**
	* how long should a sample playback for (default duration of buffer)
	* @type {Number}
	* @property duration
	*/
	set duration( n ){
		this.err.checkType(n,"number","duration");
		this._duration = n;
	}
	get duration(){
		return this._duration;
	}

	_toFloat( num ){
		if( num.toString().indexOf('.')==-1){
			return num + 0.00000000000001;
		} else {
			return num;
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

	// loading buffers ---------------------------------------------------------
	// -------------------------------------------------------------------------

	_load( path ){
		this.loadingLen++;

		let fname = path.split("/");
			fname = fname[fname.length-1].split(".");
		let ext   = fname[1];
			fname = fname[0];

		if( typeof this._firstBuff=="undefined" ) this._firstBuff = fname;

		if( !this.support[ext] )
			throw new Error('BB.AudioSampler: this platform doesn\'t support '+ext);
		else if( this.support[ext] == 'no' )
			throw new Error('BB.AudioSampler: this platform doesn\'t support '+ext);

		BB.Audio.loadBuffers( path ,( buffer )=>{
			//set default duration if one was set in constructor
			if(typeof this._duration=="undefined" && fname==this._firstBuff)
				this._duration = buffer.duration;
			// add buffer to buffers property
			this.buffers[fname] = buffer;
			this.loadingCnt++; // handle loading status
			if( this.loadingCnt == this.loadingLen ){
				this.loaded = true;
				this.loadingLen = 0;
				this.loadingCnt = 0;
				if(typeof this.onload=="function") this.onload();
			}
		});
	}
	/**
	* decodes audio and loads buffer into the buffers object
	* @method load
	* @param {String|Array} path a file path or array of paths
	* @param {Function} [callback] fires when all samples are loaded
	* @example
	* <code class="code prettyprint"><br>
	* &nbsp;// load initial sample<br>
	* &nbsp;var samp = new BB.AudioSampler('audios/meow.wav');<br><br>
	* &nbsp;// ...later we load an additional sample<br>
	* &nbsp;samp.load('audios/chuckle.wav',function(){<br>
	* &nbsp;&nbsp;&nbsp;&nbsp;console.log( meow.buffers );<br>
	* &nbsp;&nbsp;&nbsp;&nbsp;// logs { meow:AudioBuffer, chuckle:AudioBuffer }<br>
	* &nbsp;});<br>
	* </code>
	*/
	load( path, callback ){
		// reset load status
		this.loaded = false;

		// reset callback
		this.err.checkType(callback,["undefined","function"],"callback");
		if(typeof callback == "function" ) this.onload = callback;

		if( path instanceof Array ){
			path.forEach((p)=>this._load(p));
		} else if( typeof path == "string" ){
			this._load(path);
		} else {
			throw new Error("BB.AudioSampler.load: expecting a path(string) or array of paths");
		}
	}

	_listBuffs(){ return Object.keys(this.buffers); }


	// playback ----------------------------------------------------------------
	// -------------------------------------------------------------------------

	/**
	*  because you can play multiple instances of the same (detuned) sound at the same time (polyphony)
	*  the sampler object needs to keep track of which detuned values are being played
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
	*  &nbsp; sound.spit({// all are optional<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;buffer:"dialtone",<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;detune:100,<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;sampleRate:2,<br>
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

		let st; // start time
		let detune, dur, off, buff;
		let attack, decay, sustain, release; // ADSR setup
		if( typeof config=="object"){
			this.err.checkType(config.time,["number","undefined"],"time");
			this.err.checkType(config.attack,["number","undefined"],"attack");
			this.err.checkType(config.decay,["number","undefined"],"decay");
			this.err.checkType(config.sustain,["number","undefined"],"sustain");
			this.err.checkType(config.release,["number","undefined"],"release");
			this.err.checkType(config.detune,["number","undefined"],"detune");
			this.err.checkType(config.buffer,["string","undefined"],"buffer");
			this.err.checkType(config.duration,["number","undefined"],"duration");
			this.err.checkType(config.offset,["number","undefined"],"offset");

			st = (typeof config.time=="undefined") ? this.ctx.currentTime : config.time;

			if(typeof config.detune =="number") detune = config.detune;
			else detune = this._detune;

			attack = (typeof config.attack=="undefined") ? this.attack : config.attack;
			decay = (typeof config.decay=="undefined") ? this.decay : config.decay;
			sustain = (typeof config.sustain=="undefined") ? this.sustain : config.sustain;
			release = (typeof config.release=="undefined") ? this.release : config.release;

			if(typeof config.buffer=="string"){
				if(typeof this.buffers[config.buffer]=="undefined" )
					throw new Error(`BB.AudioSampler.spit: ${config.buffer} is not one of your buffers, try ${this._listBuffs()}`);
				buff = this.buffers[config.buffer];
			} else {
				buff = this.buffers[this._firstBuff];
			}

			dur = (typeof config.duration=="undefined") ? this.duration : config.duration;
			off = (typeof config.offset=="undefined") ? this.offset : config.offset;
		} else {
			if(typeof config=="number")	st = config;
			else st = this.ctx.currentTime;
			detune = this._detune;
			attack = this.attack;
			decay = this.decay;
			sustain = this.sustain;
			release = this.release;
			buff = this.buffers[this._firstBuff];
			dur = this.duration;
			off = this.offset;
		}

		// make sure duration is long enough
		if( attack+decay+release > dur )
			throw new Error('BB.AudioSampler.spit: your duration can not be less than attack+decay+release');

		// the throw away nodes
		let gainNode = this.ctx.createGain();
			gainNode.connect( this.output );

		let node = this.ctx.createBufferSource();
			node.buffer = buff;
			if(detune!==0) node.detune.setValueAtTime(detune,st);
			if( this._playbackRate!==1) node.playbackRate.setValueAtTime(this._playbackRate,st);
			node.connect( gainNode );

		// scheduled start time && adsr
		let hold = (dur-(attack+decay));

		this._adsrIn( gainNode, 1.0, st, attack, decay, sustain );
		this._adsrOut( gainNode, 1.0, st+hold, release, sustain );

		node.start(st, off, dur);

		return node;
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

		let buff, off, dur;
		let detune = this._detune;
		let attack, decay, sustain, time;
		if( typeof config=="object"){
			this.err.checkType(config.time,["number","undefined"],"time");
			this.err.checkType(config.attack,["number","undefined"],"attack");
			this.err.checkType(config.decay,["number","undefined"],"decay");
			this.err.checkType(config.sustain,["number","undefined"],"sustain");
			this.err.checkType(config.detune,["number","undefined"],"detune");
			this.err.checkType(config.buffer,["string","undefined"],"buffer");
			this.err.checkType(config.duration,["number","undefined"],"duration");
			this.err.checkType(config.offset,["number","undefined"],"offset");

			attack = (typeof config.attack=="undefined") ? this.attack : config.attack;
			decay = (typeof config.decay=="undefined") ? this.decay : config.decay;
			sustain = (typeof config.sustain=="undefined") ? this.sustain : config.sustain;
			time = (typeof config.time=="undefined") ? this.ctx.currentTime : config.time;

			if(typeof config.detune =="number") detune = config.detune;
			else detune = this._detune;

			if(typeof config.buffer=="string"){
				if(typeof this.buffers[config.buffer]=="undefined" )
					throw new Error(`BB.AudioSampler.noteOn: ${config.buffer} is not one of your buffers, try ${this._listBuffs()}`);
				buff = this.buffers[config.buffer];
			} else {
				buff = this.buffers[this._firstBuff];
			}

			// this._duration = buff.duration;
			dur = (typeof config.duration=="undefined") ? this.duration : config.duration;
			off = (typeof config.offset=="undefined") ? this.offset : config.offset;

		} else if(typeof config=="number") {
			detune = config;
			time = (typeof scheduleTime=="undefined") ? this.ctx.currentTime : scheduleTime;
			attack = this.attack; decay = this.decay; sustain = this.sustain;
			buff = this.buffers[this._firstBuff];
			dur = this.duration; off = this.offset;
		} else {
			time = (typeof scheduleTime=="undefined") ? this.ctx.currentTime : scheduleTime;
			attack = this.attack; decay = this.decay; sustain = this.sustain;
			buff = this.buffers[this._firstBuff];
			dur = this.duration; off = this.offset;
		}


		// don't play if already playing
		if( this.input.hasOwnProperty(detune) ) return false;


		// the throw away nodes
		let gainNode = this.ctx.createGain();
			gainNode.connect( this.output );
		let node = this.ctx.createBufferSource();
			node.buffer = buff;
			if(detune!==0) node.detune.setValueAtTime(detune,time);
			if( this._playbackRate!==1) node.playbackRate.setValueAtTime(this._playbackRate,time);
			node.loop = true;
			node.loopStart = off;
			node.loopEnd = off + dur;
			node.connect( gainNode );

		// fadeIn (if adsr) && start playing
		this._adsrIn( gainNode, 1.0, time, attack, decay, sustain );
		node.start(time,off);

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
			else detune = this._detune;
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
	 * &nbsp;// note that the buffer must be loaded before playing the sample <br>
	 * &nbsp;// ...you're going to want to do something like this <br>
	 * &nbsp;var sound = new BB.AudioSampler('audios/dialtone.wav',function(){<br>
	 * &nbsp;&nbsp;&nbsp;sound.play();<br>
	 * &nbsp;});<br><br>
	 * &nbsp;// ...or maybe something like this <br>
	 * &nbsp;var sound = new BB.AudioSampler('audios/dialtone.wav');<br>
	 * &nbsp;// ...then call something like this later <br>
	 * &nbsp;if(sound.loaded) sound.play(); <br>
	 * &nbsp;<br><br>
	 * &nbsp;// assuming buffer is loaded here are some ways to use .play()<br><br>
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


		let st; // start time
		let buff, dur, off;
		let detune, attack, decay, sustain, release;
		if( typeof config=="object"){
			this.err.checkType(config.detune,["number","undefined"],"detune");
			this.err.checkType(config.time,["number","undefined"],"time");
			this.err.checkType(config.attack,["number","undefined"],"time");
			this.err.checkType(config.decay,["number","undefined"],"decay");
			this.err.checkType(config.sustain,["number","undefined"],"sustain");
			this.err.checkType(config.release,["number","undefined"],"release");
			this.err.checkType(config.buffer,["string","undefined"],"buffer");
			this.err.checkType(config.duration,["number","undefined"],"duration");
			this.err.checkType(config.offset,["number","undefined"],"offset");

			st = (typeof config.time=="undefined") ? this.ctx.currentTime : config.time;

			attack = (typeof config.attack=="undefined") ? this.attack : config.attack;
			decay = (typeof config.decay=="undefined") ? this.decay : config.decay;
			sustain = (typeof config.sustain=="undefined") ? this.sustain : config.sustain;
			release = (typeof config.release=="undefined") ? this.release : config.release;

			if(typeof config.detune =="number") detune = config.detune;
			else detune = this._detune;

			if(typeof config.buffer=="string"){
				if(typeof this.buffers[config.buffer]=="undefined" )
					throw new Error(`BB.AudioSampler.play: ${config.buffer} is not one of your buffers, try ${this._listBuffs()}`);
				buff = config.buffer;
			} else {
				buff = this._firstBuff;
			}

			// this._duration = this.buffers[buff].duration;
			dur = (typeof config.duration=="undefined") ? this.duration : config.duration;
			off = (typeof config.offset=="undefined") ? this.offset : config.offset;

		} else {
			if(typeof config=="number")	st = config;
			else st = this.ctx.currentTime;
			detune = 0;
			attack = this.attack;
			decay = this.decay;
			sustain = this.sustain;
			release = this.release;
			dur = this.duration;
			off = this.offset;
			buff = this._firstBuff;
		}

		this._detuneRef = detune; // reference for stop

		// make sure duration is long enough
		if( attack+decay+release > dur )
			throw new Error('BB.AudioNoise.play: your duration can not be less than attack+decay+release');

		let delay = st - this.ctx.currentTime+0.00002;
		if( delay < 0 ) delay = 0.00002;

		this.noteOn({
			buffer 		: buff,
			detune		: detune,
			offset 		: off,
			duration 	: dur,
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

		let detune = this._detuneRef;

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

module.exports = AudioSampler;





/* ~ * ~ liBB ~ * ~ */
