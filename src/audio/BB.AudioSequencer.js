/* jshint esversion: 6 */
/**
* A module for scheduling sounds in an interactive 4/4 musical sort of way
* @class BB.AudioSequencer
* @constructor
*
* @param {Object} config A config object to initialize the Sequencer, use keys "whole", "half", "quarter", "sixth", "eighth" and "sixteenth" to schedule events at those times in a measure
* additional (optional) config parameters include:
* <code class="code prettyprint">
* &nbsp;{<br>
* &nbsp;&nbsp;&nbsp; tempo: 150, // 150 beats per minute <br>
* &nbsp;&nbsp;&nbsp; bars: 2, // number of bars in a sequence <br>
* &nbsp;&nbsp;&nbsp; multitrack: false, // play only one sample at a given beat <br>
* &nbsp;&nbsp;&nbsp; noteResolution: 1, // play only 8th notes (see below)<br>
* &nbsp;&nbsp;&nbsp; scheduleAheadTime: 0.2 // schedule 200ms ahead (see below)<br>
* &nbsp;}
* </code>
*
* @example
* The Web Audio API exposes access to the audio subsystem’s hardware clock
* ( the “audio clock” via .currentTime ). This is used for precisely
* scheduling parameters and events, much more precise than the JavaScript
* clock ( ie. Date.now(), setTimeout() ). However, once scheduled audio
* parameters and events can not be modified ( ex. you can’t change the
* tempo or pitch when something has already been scheduled... even if it hasn't started playing ). the
* BB.AudioSequencer is a collaboration between the audio clock and
* JavaScript clock based on Chris Wilson’s article, <a href="http://www.html5rocks.com/en/tutorials/audio/scheduling/" target="_blank">A Tale of Two Clocks - Scheduling Web Audio with Precision</a>
* which solves this problem.
* <br><br>
* the BB.AudioSequencer only handles scheduling ( it doesn't create any AudioNodes ), but it does require a <a href="BB.Audio.html" target="_blank">BB.Audio.context</a> because it uses the context.currentTime to property schedule events<br>
* <code class="code prettyprint">
* &nbsp;BB.Audio.init();<br>
* <br>
* &nbsp;var kick = new BB.AudioSampler('kick.wav');<br>
* &nbsp;var snare = new BB.AudioSampler('snare.wav');<br>
* &nbsp;var hat = new BB.AudioSampler('hat.wav');<br>
* <br>
* &nbsp;// create AudioSequencer ( with optional parameters ) <br>
* &nbsp;// note the use of .spit() instead of .play()<br>
* &nbsp;// because spit can be called even if it's already playing<br>
* &nbsp;// see the documentation for the AudioSampler module for more info<br>
* &nbsp;var track = new BB.AudioSequencer({<br>
* &nbsp;&nbsp;&nbsp;tempo: 140, // in bpm <br>
* &nbsp;&nbsp;&nbsp;bars: 2, // repeat a 2 bar loop ( bar 0, bar 1 ) <br><br>
* &nbsp;&nbsp;&nbsp;whole: function( time ){ <br>
* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// play a kick at the beginning (whole note) of every first bar<br>
* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if(track.currentBar==0) kick.spit(time);<br>
* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;else {<br>
* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// double kick on every 2nd bar<br>
* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;kick.spit(time); kick.spit(time+0.25);<br>
* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}<br>
* &nbsp;&nbsp;&nbsp;},<br>
* &nbsp;&nbsp;&nbsp;quarter: function( time ){ <br>
* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// play snare on every 4th note (quarter note) of every bar<br>
* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;snare.spit( time );<br>
* &nbsp;&nbsp;&nbsp;},<br>
* &nbsp;&nbsp;&nbsp;sixteenth: function( time ){<br>
* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// play hat every sixteenth note (ie. every note) on every bar<br>
* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;hat.spit( time );<br>
* &nbsp;&nbsp;&nbsp;}<br>
* &nbsp;});<br>
* <br>
* &nbsp;// assuming these are DOM elements that exist<br>
* &nbsp;playButton.addEventListener("click",()=>{<br>
* &nbsp;&nbsp;&nbsp;&nbsp;track.play();<br>
* &nbsp;});<br>
* &nbsp;pauseButton.addEventListener("click",()=>{<br>
* &nbsp;&nbsp;&nbsp;&nbsp;track.pause();<br>
* &nbsp;});<br>
* &nbsp;stopButton.addEventListener("click",()=>{<br>
* &nbsp;&nbsp;&nbsp;&nbsp;track.stop();<br>
* &nbsp;});<br>
* &nbsp;<br>
* &nbsp;// you need to set up some kind of loop to call update in<br>
* &nbsp;// this could be an animation loop on the page<br>
* &nbsp;function loop(){<br>
* &nbsp;&nbsp;&nbsp;&nbsp;requestAnimationFrame(loop);<br>
* &nbsp;&nbsp;&nbsp;&nbsp;// if track.playing is true <br>
* &nbsp;&nbsp;&nbsp;&nbsp;// ie. if track.play() has been called<br>
* &nbsp;&nbsp;&nbsp;&nbsp;// then update will make sure sounds are being...<br>
* &nbsp;&nbsp;&nbsp;&nbsp;// ...scheduled appropriately <br>
* &nbsp;&nbsp;&nbsp;&nbsp;track.update(); <br>
* &nbsp;}<br>
* &nbsp;loop();<br>
* </code>
*/
class AudioSequencer {
	constructor( config ){
		this.err = new BB.ValidArg(this);
		this.err.checkType(config,"object","config");

		this.ctx = BB.Audio.context;

		/**
		 * tempo in beats per minute
		 * @type {Number}
		 * @property tempo
		 * @default 120
		 */
		this.tempo 				= ( typeof config.tempo !== 'undefined' ) ? config.tempo : 120;

		/**
		 * how many measures per sequence
		 * @type {Number}
		 * @property bars
		 * @default 1
		 */
		this.bars 				= ( typeof config.bars !== 'undefined' ) ? config.bars : 1;

		/**
		 * current measure being played
		 * @type {Number}
		 * @property currentBar
		 */
		this.currentBar 		= 0;
		/**
		 * whether or not sequencer is playing
		 * @type {Boolean}
		 * @property playing
		 * @default false
		 */
		this.playing 			= false;

		/**
		 * returns the current note
		 * @type {Number}
		 * @property current16thNote
		 */
		this.note = -1; // ie. current16thNote - 1
		// What note is currently last scheduled?
		this.current16thNote	= 0;

		/**
		 * how far ahead to schedule the audio (seconds), adjust for sweet spot ( smaller the better/tighter, but the buggier/more demanding)
		 * @type {Number}
		 * @property scheduleAheadTime
		 * @default 0.1
		 */
		this.scheduleAheadTime 	= ( typeof config.scheduleAheadTime !== 'undefined' ) ? config.scheduleAheadTime : 0.1;
		this.nextNoteTime		= 0.0;		// when the next note is due ( in the AudioContext timeline )
		/**
		 * 0: play all 16th notes, 1: play only 8th notes, 2: play only quarter notes
		 * @type {Number}
		 * @property noteResolution
		 * @default 0
		 */
		this.noteResolution 	= ( typeof config.noteResolution !== 'undefined' ) ? config.noteResolution : 0;		// 0 == 16th, 1 == 8th, 2 == quarter note

		// this can probably just be defined by the user...
		// this.noteLength 		= 0.25;		// length of sample/note (seconds)

		/**
		 * whether or not to play more than one sample at a given beat
		 * @type {Boolean}
		 * @property multitrack
		 * @default true
		 */
		this.multitrack			= ( typeof config.multitrack !== 'undefined' ) ? config.multitrack : true;

		this.err.checkType(config.whole,["undefined","function"],"whole");
		this.whole = (typeof config.whole==="function") ? config.whole : undefined;

		this.err.checkType(config.half,["undefined","function"],"half");
		this.half = (typeof config.half==="function") ? config.half : undefined;

		this.err.checkType(config.quarter,["undefined","function"],"quarter");
		this.quarter = (typeof config.quarter==="function") ? config.quarter : undefined;

		this.err.checkType(config.sixth,["undefined","function"],"sixth");
		this.sixth = (typeof config.sixth==="function") ? config.sixth : undefined;

		this.err.checkType(config.eighth,["undefined","function"],"whole");
		this.eighth = (typeof config.eighth==="function") ? config.eighth : undefined;

		this.err.checkType(config.sixteenth,["undefined","function"],"eighth");
		this.sixteenth = (typeof config.sixteenth==="function") ? config.sixteenth : undefined;

	}


	/**
	* starts playing sequencer
	* @method play
	* @example
	* <code class="code prettyprint">
	* &nbsp;track.play();<br>
	* </code>
	*/
	play(){
		if( !this.playing ){
			this.playing = true;
			this.nextNoteTime = this.ctx.currentTime;
			this.update(); // kick off scheduling
		}
	}
	/**
	* puases sequencer ( will pick back up where it left off when .play() is called again )
	* @method pause
	* @example
	* <code class="code prettyprint">
	* &nbsp;track.pause();<br>
	* </code>
	*/
	pause(){ this.playing = false; }
	/**
	* sopts playing sequencer, resents back to start of the first bar
	* @method stop
	* @example
	* <code class="code prettyprint">
	* &nbsp;track.stop();<br>
	* </code>
	*/
	stop(){
		this.playing = false;
		this.current16thNote = 0;
	}

	/**
	* advances to the next note ( when it's time )
	* @method update
	*
	* @example
	* <code class="code prettyprint">
	* &nbsp;// should be called in update loop<br>
	* &nbsp;track.update();
	* </code>
	*/
	update(){
		/*
			"This function just gets the current audio hardware time, and compares it against
			the time for the next note in the sequence - most of the time in this precise scenario
			this will do nothing (as there are no metronome “notes” waiting to be scheduled, but when
			it succeeds it will schedule that note using the Web Audio API, and advance to the next note."
			--http://www.html5rocks.com/en/tutorials/audio/scheduling/
		*/
		if( this.playing ){
			while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime ) {
				this.scheduleNote( this.current16thNote, this.nextNoteTime );
				this.nextNote();
			}
		} else {
			// update won't run if track isn't supposed to be "playing"
		}
	}
	/**
	* schedules appropriate note based on noteResolution && beatNumber ( ie current16thNote )
	* @method scheduleNote
	* @protected
	*/
	scheduleNote(beatNumber, time){
		if ( (this.noteResolution==1) && (beatNumber%2) ) return;	// don't play non-8th 16th notes
		if ( (this.noteResolution==2) && (beatNumber%4) ) return;	// don't play non-quarter 8th notes

		if(this.multitrack){
			if (beatNumber === 0 && typeof this.whole!=="undefined") this.whole( time ); // beat 0 == kick
			if (beatNumber % 2 === 0 && typeof this.half!=="undefined") this.half( time ); // quarter notes, ex:snare
			if (beatNumber % 4 === 0 && typeof this.quarter!=="undefined") this.quarter( time ); // quarter notes, ex:snare
			if (beatNumber % 6 === 0 && typeof this.sixth!=="undefined") this.sixth( time );
			if (beatNumber % 8 === 0 && typeof this.eighth!=="undefined") this.eighth( time ); // eigth notes, ex:hat
			if (typeof this.sixteenth!=="undefined") this.sixteenth( time );
		} else {
			if (beatNumber === 0 && typeof this.whole!=="undefined" ) this.whole( time );
			else if (beatNumber % 2 === 0 && typeof this.half!=="undefined") this.half( time );
			else if (beatNumber % 4 === 0 && typeof this.quarter!=="undefined") this.quarter( time );
			else if (beatNumber % 6 === 0 && typeof this.sixth!=="undefined") this.sixth( time );
			else if (beatNumber % 8 === 0 && typeof this.eighth!=="undefined") this.eighth( time );
			else if (typeof this.sixteenth!=="undefined") this.sixteenth( time );
		}
	}

	/**
	* advance current note and time by a 16th note
	* @method nextNote
	* @protected
	*/
	nextNote(){
		var secondsPerBeat = 60.0 / this.tempo;
		this.nextNoteTime += 0.25 * secondsPerBeat;	// Add beat length to last beat time

		this.current16thNote++;	// Advance the beat number, wrap to zero
		this.note = this.current16thNote-1;
		// if (this.current16thNote == this.bars*16) this.current16thNote = 0;
		if(this.current16thNote == 16){
			this.current16thNote = 0;
			this.currentBar++;
			if(this.currentBar == this.bars) this.currentBar = 0;
		}
	}
}

module.exports = AudioSequencer;
