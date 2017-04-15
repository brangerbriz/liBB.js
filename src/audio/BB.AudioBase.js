/* jshint esversion: 6 */

/**
* A base audio module class, extended by BB.AudioNoise, BB.AudioSampler, BB.AudioFX, etc.
* @class BB.AudioBase
* @constructor
*
* @example
* in the example below instantiating the BB.AudioBase creates a <a href="https://developer.mozilla.org/en-US/docs/Web/API/GainNode" target="_blank">GainNode</a> ( the modules's output ) connected to the default BB.Audio.context ( ie. AudioDestination )
* <br><br>
* <code class="code prettyprint">
*  &nbsp;BB.Audio.init();<br>
*  <br>
*  &nbsp;var node = new BB.AudioBase();<br>
*  <br>
*  &nbsp;// or optional config property<br>
*  &nbsp;var node = new BB.AudioBase({<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;connect: fft,<br>
*  &nbsp;&nbsp;&nbsp;&nbsp;gain: 0.5<br>
*  &nbsp;});<br>
*  <br>
* </code>
*/
class AudioBase {

	constructor( config ){

		this.err = new BB.ValidArg(this);
		this.err.checkType(config,["undefined","object"]);


		let ac = window.AudioContext||window.webkitAudioContext;
		if( !(BB.Audio.context instanceof ac) )
			throw new Error("BB.Audio: you must run BB.Audio.init() before using any other Audio Modules");
		// internal alias for BB.Audio.context
		this.ctx = BB.Audio.context;

		/**
		* the "input" node ( defined when extended )
		* @property input
		* @type undefined
		*/
		this.input = null; 	// some AudioNode, Osc, Src, Etc.
							// assigned by whoever extends this class


		if( typeof config === "object" ){
			/**
			* the attack time in seconds (default 0)
			* @property attack
			* @type Number
			*/
			this.err.checkType(config.attack,["undefined","number"],"attack");
			this.attack = (typeof config.attack=="undefined") ? 0 : config.attack;

			/**
			* the decay time in seconds (default 0)
			* @property decay
			* @type Number
			*/
			this.err.checkType(config.decay,["undefined","number"],"decay");
			this.decay = (typeof config.decay=="undefined") ? 0 : config.decay;

			/**
			* the sustain scalar value (default 1)
			* @property sustain
			* @type Number
			*/
			this.err.checkType(config.sustain,["undefined","number"],"sustain");
			this.sustain = (typeof config.sustain=="undefined") ? 0 : config.sustain;

			/**
			* the release time in seconds (default 0)
			* @property release
			* @type Number
			*/
			this.err.checkType(config.release,["undefined","number"],"release");
			this.release = (typeof config.release=="undefined") ? 0 : config.release;
		} else {
			this.attack = 0;
			this.decay = 0;
			this.sustain = 1;
			this.release = 0;
		}



		this._gainLvl = 1;
		/**
		* the "output" node
		* @property output
		* @type GainNode
		*/
		this.output = this.ctx.createGain();
		// default destination is BB.Audio.destination
		// unless otherwise specified in { connect:AudioNode|BB.AudioModule }
		if( typeof config!=="undefined" && typeof config.connect !== 'undefined' ){
			if( config.connect instanceof BB.AudioBase )
				this.output.connect( config.connect.input );
			else if( config.connect instanceof AudioNode )
				this.output.connect( config.connect );
			else
				throw new Error('BB.AudioBase: config\'s connect property should be an isntanceof BB.AudioModule or WebAudio API AudioNode');
		} else {
			this.output.connect( BB.Audio.destination );
		}

		if( typeof config!=="undefined" && typeof config.gain !== 'undefined' ){
			this.output.gain.setValueAtTime(config.gain, 0);
			this._gainLvl = config.gain;
		}

	}

	/**
	* connect this BB.AudioModule to another BB.AudioModule, not exactly the same as the WebAudio API's AudioNode <a href="https://developer.mozilla.org/en-US/docs/Web/API/AudioNode/connect" target="_blank">connect</a> method, for access to that use node.output.connect()
	* @method connect
	* @param target another BB Audio Module you want to connect this one too
	* @example
	* <code class="code prettyprint">
	*  &nbsp;BB.Audio.init();<br>
	*  <br>
	*  &nbsp;var node = new BB.AudioBase({<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;volume: 0.75,<br>
	*  &nbsp;});<br>
	*  <br>
	*  &nbsp;node.connect( exampleNode );<br>
	*  &nbsp;// connected to both default BB.Audio.context && exampleNode<br>
	*  &nbsp;// so if exampleNode is also connected to BB.Audio.context by default,<br>
	*  &nbsp;// ...then you've got node connected to BB.Audio.context twice<br>
	*  &nbsp;// consider using .disconnect() before .connect() <br>
	* </code>
	* <br>
	*/
	connect( target, nope ){
		if( typeof nope !== "undefined" )
			console.warn(`looks like you're trying to maybe use BB.Audio's connect() like WebAudio's connect(),
				to do this use node.output.connect() instead`);
		else {
			if( target instanceof AudioDestinationNode ){
				this.output.connect( target );
			} else if( target instanceof BB.AudioBase ){
				if( target.input === null )
					throw new Error("BB.AudioBase.connect: was passed a BB.Audio module that has a null input");
				else this.output.connect( target.input );
			} else {
				throw new Error("BB.AudioBase.connect: expects either a BB.Audio module or AudioDestinationNode");
			}
		}
	}

	/**
	* disconnect this BB.AudioModule from another BB.AudioModule, not exactly the same as the WebAudio API's AudioNode <a href="https://developer.mozilla.org/en-US/docs/Web/API/AudioNode/disconnect" target="_blank">disconnect</a> method, for access to that use node.output.disconnect()
	* @method disconnect
	* @example
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
	*/
	disconnect( nope ){
		if( typeof nope !== "undefined" )
			console.warn(`looks like you're trying to maybe use BB.Audio's disconnect() like WebAudio's disconnect(),
				to do this use node.output.disconnect() instead`);
		else {
			this.output.disconnect();
		}
	}

	// ------------------------------- poly Utils ------------------------------
	// for keeping track of polyphonic notes
	// -------------------------------------------------------------------------

	_addPolyNote( idVal, inputNode, gainNode, sustLvl, gainAdjust ){
		if( this.input === null ) this.input = {};

		this.input[idVal] = { node:inputNode, gain:gainNode, sus:sustLvl };

		// adjust overall gain to account for total number of waves
		if( gainAdjust ){
			let count = 0; for(let k in this.input) count++;
			let polylength = (count===0) ? 1 : count;
			// this.output.gain.setTargetAtTime( this.getGain()/polylength, this.ctx.currentTime, 0.1);
			this.output.gain.setValueAtTime( this.getGain()/polylength, this.ctx.currentTime );
		}
	}

	_removePolyNote( idVal, gainAdjust ){
		if(typeof this.input[idVal]!=="undefined"){
			this.input[idVal].gain.disconnect();
			delete this.input[idVal];
		}
		if( gainAdjust ){
			/// adjust overall gain to account for total number of waves
			let count = 0; for(let k in this.input) count++;
			let polylength = (count===0) ? 1 : count;
			this.output.gain.setTargetAtTime( this.getGain()/polylength, this.ctx.currentTime, 0.5);
		}
	}

	// ------------------------------- ADSR Utils ------------------------------
	// a = attack, d = decay, s = sustain (scalar), r = release
	// t = scheduledTime
	// lvl = the output's gain level ( ie. default/max level )
	// -------------------------------------------------------------------------

	_adsrIn( output, lvl, t, a, d, s ){
		output.gain.linearRampToValueAtTime(0.0001, t );
		output.gain.linearRampToValueAtTime(lvl, 	t + a + 0.00001);
		output.gain.linearRampToValueAtTime(lvl*s, 	t + a + d + 0.00002);
	}

	_adsrOut( output, lvl, h, r, s ){
		output.gain.cancelScheduledValues(h+0.00002);
		// where hold ~ now + prevAttack + prevDecay + anyExtraHold
		output.gain.linearRampToValueAtTime(lvl*s,  h + 0.00003);
		output.gain.linearRampToValueAtTime(0.0001, h + r + 0.00004);
	}

	_adsr(output, lvl, t, a, d, r, h, s){
		output.gain.linearRampToValueAtTime(0.0001, t );
		output.gain.linearRampToValueAtTime(lvl, 	t + a + 0.00001);
		output.gain.linearRampToValueAtTime(lvl*s, 	t + a + d + 0.00002);
		output.gain.linearRampToValueAtTime(lvl*s, 	t + a + d + h + 0.00003);
		output.gain.linearRampToValueAtTime(0.0001, t + a + d + h + r + 0.00004);
	}



	/**
	* returns the current gain target, this could be the current gain level or the last scheduled gain target
	* @method getGain
	* @example
	* <code class="code prettyprint">
	* &nbsp;// set's gain to half <br>
	* &nbsp;node.setGain(0.5);<br>
	* &nbsp;// returns 0.5 <br>
	* &nbsp;node.getGain();
	* </code>
	* <br>
	*/
	getGain(){
		return this._gainLvl;
	}

	/**
	* changes the gain level to the desired value, takes an optional time
	* @method setGain
	* @param {number} value number to scale gain by
	* @param {number} [time] when to start/schedule the change ( defaults to right now )
	* @param {number} [decay] exponatial decay rate, the larger the number the slower it will decay
	* @example
	* <code class="code prettyprint">
	* &nbsp;// kills the volume immediately<br>
	* &nbsp;node.setGain(0);<br>
	* &nbsp;// sets gain to half, 2 seconds from current time, with a slight decay<br>
	* &nbsp;node.setGain(0.5, BB.Audio.getTime()+2, 0.5 );
	* </code>
	* <br>
	*/
	setGain( value, time, decay ){
		this.err.checkType(value,'number','value');
		this.err.checkType(time,['number','undefined'],'time');
		this.err.checkType(decay,['number','undefined'],'decay');

		if( typeof time ==="undefined") time = 0;

		if( typeof decay!=="undefined"){
			this.output.gain.setTargetAtTime( value, time, decay );
		} else {
			this.output.gain.setValueAtTime( value, time );
		}
		this._gainLvl = value;
	}

	/**
	* sort of like "riding" the volume slider up/down on a mixer, takes an array of gain value and fades between them
	* @method rideGain
	* @param {number} waveTable an array of gain values
	* @param {number} [time] when to start/schedule the change ( defaults to right now )
	* @param {number} [duration] the total time it should take to go from the first to the last value in the waveTable ( defaults to 1 second )
	* @example
	* <code class="code prettyprint">
	* &nbsp;// starts at full volume, then cuts to half volume, the back to full...<br>
	* &nbsp;// ...then down to a quarter, then back up to full...<br>
	* &nbsp;// ...does this over the course of 5 seconds <br>
	* &nbsp;node.rideGain( [1.0,0.5,1.0,0.25,1.0], 0, 5 );
	* </code>
	* <br>
	*/
	rideGain( waveTable, time, duration ){
		this.err.checkInstanceOf(waveTable,Array);
		this.err.checkType(time,["undefined","number"]);
		this.err.checkType(duration,["undefined","number"]);
		// convert wave table array to Float32Array
		var waveArray = new Float32Array(waveTable.length);
		waveTable.forEach((val,i)=>{
			waveArray[i] = val;
		});
		let start = (typeof time=="undefined") ? 0 : time;
		let dur = (typeof duration=="undefined") ? 1 : duration;
		gain.gain.setValueCurveAtTime( waveArray, start, dur );
		this._gainLvl = waveTable[waveTable.length-1];
	}

	/**
	* kills any previously scheduled gain changes
	* @method resetGain
	* @example
	* <code class="code prettyprint">
	* &nbsp;// starts to ride the gain over the course of 5 seconds...<br>
	* &nbsp;node.rideGain( [1.0,0.5,1.0,0.25,1.0], 0, 5 );<br>
	* &nbsp;// ...but then cancels that and resets to 1<br>
	* &nbsp;node.resetGain();
	* </code>
	* <br>
	*/
	resetGain(){
		this.output.gain.cancelScheduledValues(0); // kill all scheduled gain changes
		this.setGain( 1, 0 );
	}


}

module.exports = AudioBase;





/* ~ * ~ liBB ~ * ~ */
