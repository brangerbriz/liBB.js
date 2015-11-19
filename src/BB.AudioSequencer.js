/**
 * A module for scheduling sounds ( in a more musical way ) 
 * @module BB.AudioSequencer
 */
define(['./BB'],
function(  BB ){

	'use strict';

	 /**
	  * The Web Audio API exposes access to the audio subsystem’s hardware clock
	  * ( the “audio clock” via .currentTime ). This is used for precisely
	  * scheduling parameters and events, much more precise than the JavaScript
	  * clock ( ie. Date.now(), setTimeout() ). However, once scheduled audio
	  * parameters and events can not be modified ( ex. you can’t change the
	  * tempo or pitch when something has already been scheduled... even if it hasn't started playing ). the
	  * BB.AudioSequencer is a collaboration between the audio clock and
	  * JavaScript clock based on Chris Wilson’s article, <a href="http://www.html5rocks.com/en/tutorials/audio/scheduling/" target="_blank">A Tale of Two Clocks - Scheduling Web Audio with Precision</a>
	  * which solves this problem.
	  * 
	  * @class BB.AudioSequencer
	  * @constructor
	  * @param {Object} config A config object to initialize the Sequencer, use keys "whole", "quarter", "sixth", "eighth" and "sixteenth" to schedule events at those times in a measure 
	  * additional (optional) config parameters include:
	  * <code class="code prettyprint">
	  * &nbsp;{<br>
	  * &nbsp;&nbsp;&nbsp; multitrack: false, // play only once sample at a given beat <br>
	  * &nbsp;&nbsp;&nbsp; noteResolution: 1, // play only 8th notes (see below)<br>
	  * &nbsp;&nbsp;&nbsp; scheduleAheadTime: 0.2 // schedule 200ms ahead (see below)<br>
	  * &nbsp;&nbsp;&nbsp; tempo: 150, // 150 beats per minute <br>
	  * &nbsp;}
	  * </code>
	  * 
	  * @example    
	  * the BB.AudioSequencer only handles scheduling ( it doesn't create any AudioNodes ), but it does require a <a href="BB.Audio.html" target="_blank">BB.Audio.context</a> because it uses the context.currentTime to property schedule events<br>
	  * <code class="code prettyprint"> 
	  * &nbsp;BB.Audio.init();<br>
	  * <br>
	  * &nbsp;// create AudioSequencer ( with optional parameters ) <br>
	  * &nbsp;// assuming drum is an instanceof BB.AudioSampler<br>
	  * &nbsp;var track = new BB.AudioSequencer({<br>
	  * &nbsp;&nbsp;&nbsp;tempo: 140, // in bpm <br><br>
	  * &nbsp;&nbsp;&nbsp;whole: function( time ){ <br>
	  * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;drum.play('kick', time );<br>
	  * &nbsp;&nbsp;&nbsp;},<br>
	  * &nbsp;&nbsp;&nbsp;quarter: function( time ){ <br>
	  * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;drum.play('snare', time );<br>
	  * &nbsp;&nbsp;&nbsp;},<br>
	  * &nbsp;&nbsp;&nbsp;sixteenth: function( time ){<br>
	  * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;drum.play('hat', time );<br>
	  * &nbsp;&nbsp;&nbsp;}<br>
	  * &nbsp;});<br>
	  * </code>
	  *
      * view basic <a href="../../examples/editor/?file=audio-sequencer" target="_blank">BB.AudioSequencer</a> example
	 */
   
	BB.AudioSequencer = function( config ){
    	// based on this tutorial: http://www.html5rocks.com/en/tutorials/audio/scheduling/
		
		if( !config ) throw new Error('BB.AudioSequencer: requires a config object');


		// the AudioContext to be used by this module 
		if( typeof BB.Audio.context === "undefined" )
			throw new Error('BB Audio Modules require that you first create an AudioContext: BB.Audio.init()');
		
		if( BB.Audio.context instanceof Array ){
			if( typeof config === "undefined" || typeof config.context === "undefined" )
				throw new Error('BB.AudioSequencer: BB.Audio.context is an Array, specify which { context:BB.Audio.context[?] }');
			else {
				this.ctx = config.context;
			}
		} else {
			this.ctx = BB.Audio.context;
		}


		/**
		 * tempo in beats per minute	
		 * @type {Number}
		 * @property tempo
		 * @default 120
		 */
		this.tempo 				= ( typeof config.tempo !== 'undefined' ) ? config.tempo : 120;
		
		/**
		 * whether or not sequencer is playing	
		 * @type {Boolean}
		 * @property isPlaying
		 * @default false
		 */
		this.isPlaying 			= false;	

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

		if(typeof config.whole !== "undefined"){
			if( typeof config.whole !== "function" )
				throw new ERROR('BB.AudioSequencer: "whole" should be a function -> whole: function(time){ ... }');
			else this.whole = config.whole;
		} else { this.whole = undefined; }

		if(typeof config.quarter !== "undefined"){
			if( typeof config.quarter !== "function" )
				throw new ERROR('BB.AudioSequencer: "quarter" should be a function -> quarter: function(time){ ... }');
			else this.quarter = config.quarter;
		} else { this.quarter = undefined; }

		if(typeof config.eighth !== "undefined"){
			if( typeof config.eighth !== "function" )
				throw new ERROR('BB.AudioSequencer: "eighth" should be a function -> eighth: function(time){ ... }');
			else this.eighth = config.eighth;
		} else { this.eighth = undefined; }

		if(typeof config.sixth !== "undefined"){
			if( typeof config.sixth !== "function" )
				throw new ERROR('BB.AudioSequencer: "sixth" should be a function -> sixth: function(time){ ... }');
			else this.sixth = config.sixth;
		} else { this.sixth = undefined; }

		if(typeof config.sixteenth !== "undefined"){
			if( typeof config.sixteenth !== "function" )
				throw new ERROR('BB.AudioSequencer: "sixteenth" should be a function -> sixteenth: function(time){ ... }');
			else this.sixteenth = config.sixteenth;
		} else { this.sixteenth = undefined; }

	};


    /**
     * toggles play/stop or play/pause
     * @method toggle
     * @param {String} [type] toggles play/pause instead of default play/stop
     *
     * @example
     * <code class="code prettyprint">
     * &nbsp;// toggles start/stop (ie. starts from beginning each time)<br>
     * &nbsp;track.toggle();<br>
     * &nbsp;// toggles play/pause (ie. starts from where last puased )<br>
     * &nbsp;track.toggle("pause");
     * </code>
     */
	BB.AudioSequencer.prototype.toggle = function( type ){
		this.isPlaying = !this.isPlaying;

		if (this.isPlaying) { // start playing
			
			if(type!=="pause")
				this.current16thNote = 0; // reset to beggining of sequence when toggled bax on
									  	
			this.nextNoteTime = this.ctx.currentTime;

			this.update();	// kick off scheduling
		} 
	};

    /**
     * advances to the next note ( when it's time )
     * @method update
     *
     * @example
     * <code class="code prettyprint">
     * &nbsp;// in update loop<br>
     * &nbsp;if(track.isPlaying) track.update();
     * </code>
     */
	BB.AudioSequencer.prototype.update = function(){
		/*
			"This function just gets the current audio hardware time, and compares it against 
			the time for the next note in the sequence - most of the time in this precise scenario 
			this will do nothing (as there are no metronome “notes” waiting to be scheduled, but when 
			it succeeds it will schedule that note using the Web Audio API, and advance to the next note."
			--http://www.html5rocks.com/en/tutorials/audio/scheduling/
		*/
		while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime ) {
			this.scheduleNote( this.current16thNote, this.nextNoteTime );
			this.nextNote();
		}
	};

    /**
     * schedules appropriate note based on noteResolution && beatNumber ( ie current16thNote )
     * @method scheduleNote
     * @protected
     */
	BB.AudioSequencer.prototype.scheduleNote = function(beatNumber, time){
		if ( (this.noteResolution==1) && (beatNumber%2) ) return;	// don't play non-8th 16th notes
		if ( (this.noteResolution==2) && (beatNumber%4) ) return;	// don't play non-quarter 8th notes

		// linting !(beatNumber % 16) throws: Confusing use of '!'
		// ...so === 0 instead

		if(this.multitrack){
			if (beatNumber === 0 && typeof this.whole!=="undefined") this.whole( time );	// beat 0 == kick			
			if (beatNumber % 4 === 0 && typeof this.quarter!=="undefined") this.quarter( time );	// quarter notes, ex:snare			
			if (beatNumber % 6 === 0 && typeof this.sixth!=="undefined") this.sixth( time );			
			if (beatNumber % 8 === 0 && typeof this.eighth!=="undefined") this.eighth( time );	// eigth notes, ex:hat			
			if (typeof this.sixteenth!=="undefined") this.sixteenth( time );				
		} else {
			if (beatNumber === 0 && typeof this.whole!=="undefined" ) this.whole( time );	
			else if (beatNumber % 4 === 0 && typeof this.quarter!=="undefined") this.quarter( time );
			else if (beatNumber % 6 === 0 && typeof this.sixth!=="undefined") this.sixth( time );	
			else if (beatNumber % 8 === 0 && typeof this.eighth!=="undefined") this.eighth( time );	
			else if (typeof this.sixteenth!=="undefined") this.sixteenth( time );		
		}

	};

    /**
     * advance current note and time by a 16th note
     * @method nextNote
     * @protected
     */
	BB.AudioSequencer.prototype.nextNote = function(){
	    
	    var secondsPerBeat = 60.0 / this.tempo;		    									
	    this.nextNoteTime += 0.25 * secondsPerBeat;	// Add beat length to last beat time 

	    this.current16thNote++;	// Advance the beat number, wrap to zero
	    this.note = this.current16thNote-1;
	    if (this.current16thNote == 16) this.current16thNote = 0;
	};

	return BB.AudioSequencer;
});