/* jshint esversion: 6 */

/**
 * A module for creating an internal BB <a href="https://developer.mozilla.org/en-US/docs/Web/API/AudioContext" target="_blank">AudioContext</a> as well as providing various <b>music theory utilities</b> for other Audio Modules
 * @class BB.Audio
 * @constructor
 * @example
 * <code class="code prettyprint">
 * &nbsp;BB.Audio.init();<br>
 * &nbsp;// then ( if you need direct access ) call...<br>
 * &nbsp;BB.Audio.context;<br>
 * <br>
 * &nbsp;// .init() will also return the context<br>
 * &nbsp;// so you could assign it to a variable...<br>
 * &nbsp;// ...and use it as you would any WebAudio context<br>
 * &nbsp; var context = BB.Audio.init();<br>
 * &nbsp; var oscillator = context.createOscillator();
 * </code>
 */

class Audio {

	constructor( num ){
		/**
		* returns the <a href="https://developer.mozilla.org/en-US/docs/Web/API/AudioContext" target="_blank">AudioContext</a> used by all BB.Audio modules
		* @type {AudioContext}
		* @property context
		*/
		this.context = undefined;

		/**
		* optional dynamic compressor, see <a href="#method_activateCompressor">activateCompressor()</a>
		* @type {DynamicsCompressorNode}
		* @property compressor
		*/
		this.compressor = undefined;

		/**
		* the context's final destination, usually your computer speakers
		* @type {AudioDestinationNode}
		* @property destination
		*/
		this.destination = undefined;
		/**
		* collects any scales generated from the .createScale() method
		* @type {Object}
		* @property scales
		*/
		this.scales = {};
	}

	/**
	 * initializes BB AudioContext
	 * @method init
	 * @return BB.Audio.context
	 */
	static init(){
		window.AudioContext = window.AudioContext||window.webkitAudioContext;
		this.context = new AudioContext();
		this.compressor = this.context.createDynamicsCompressor();
		// this.destination = this.context.destination;
		this.destination = this.context.createGain();
		this.destination.connect( this.context.destination );

		return this.context;
	}

	/**
	 * returns the BB AudioContext's currentTime
	 * @method getTime
	 */
	static getTime(){
		return this.context.currentTime;
	}

	/**
	 * alias for BB.Audio.getTime()
	 * @method now
	 */
	static now(){
		return this.context.currentTime;
	}

	/**
	 * returns the BB AudioContext's sampleRate
	 * @method getSampleRate
	 */
	static getSampleRate(){
		return this.context.sampleRate;
	}

	/**
	* activates the built in BB.Audio.compressor, this connects the BB.Audio.destination to BB.Audio.compressor, and disconnects it from the default BB.Audio.context.destination ( instead the BB.Audio.compressor is connected to the BB.Audio.context.destination, essentially placing itself between all other BB.Audio modules and your speakers ). To see how much the compressor is reducing at any given time call <b><code>BB.Audio.compressor.reduction</code></b>
	* @method activateCompressor
	* @param {Object} [config] settings object, can include the following properties: threshold, knee, ratio, attack and release
	* @example
	* <code class="code prettyprint">
	*  &nbsp;BB.Audio.init();<br>
	*  <br>
	*  &nbsp;BB.Audio.activateCompressor({<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;threshold: -50,<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;knee: 40,<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;ratio: 12,<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;attack: 0.1,<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;release: 0.25<br>
	*  &nbsp;});<br>
	* </code>
	*/
	static activateCompressor( config ){
		let err = new BB.ValidArg(this);
		err.checkType( config, ["object","undefined"], "config" );

		try {
			this.destination.disconnect( this.context.destination );
		} catch(error) {
			throw new Error('BB.Audio: compressor is already activated');
		}
		this.destination.connect( this.compressor );
		this.compressor.connect( this.context.destination );

		if( typeof config !== "undefined" ){
			if(typeof config.threshold!=="undefined")
				this.compressor.threshold.value = config.threshold;
			if(typeof config.knee!=="undefined")
				this.compressor.knee.value = config.knee;
			if(typeof config.ratio!=="undefined")
				this.compressor.ratio.value = config.ratio;
			if(typeof config.attack.value !=="undefined")
				this.compressor.attack.value = config.attack;
			if(typeof config.release!=="undefined")
				this.compressor.release.value = config.release;
		}
	}

	/**
	 * disconnects BB.Audio.destination from the compressor and connects it back to the default BB.Audio.context.destination
	 * @method deactivateCompressor
	 */
	static deactivateCompressor(){
		try {
			this.destination.disconnect( this.compressor );
		} catch(error){
			throw new Error('BB.Audio: compressor is not currently active');
		}
		this.destination.connect( this.context.destination );
		this.compressor.disconnect( this.context.destination );
	}

	/**
	 * decode audio files into audio buffers
	 * @method loadBuffers
	 * @param {String|Array} path (or Array of paths) to audio file(s)
	 * @param {function} callback callback funciton with the decoded buffer (or array of buffers)
	 */
	static loadBuffers( path, callback ){
		let err = new BB.ValidArg(this);
		let buffers = [];
		let urls = [];
		if( path instanceof Array ){
			path.forEach((p)=>{
				err.checkType(p,"string","loadBuffer: the Array you past can only consist of path strings");
				urls.push( p );
			});
		} else {
			err.checkType(path,"string","loadBuffer()");
			urls.push( path );
		}

		urls.forEach(( url )=>{
			let req = new XMLHttpRequest();
			req.open('get', url, true);
			req.responseType = 'arraybuffer';
			let ctx = BB.Audio.context;
			req.onload = function() {
				ctx.decodeAudioData(req.response, function(buffer) {
					buffers.push( buffer );
					if( buffers.length==urls.length){
						if(buffers.length==1) callback( buffer );
						else callback( buffers );
					}
				});
			};
			req.onerror = function(){ throw new Error('BB.Audio.loadBuffer: XHMHttpRequest Error'); };
			req.send();
		});
	}

	// ------------------------------------------ MUSIC THOERY UTILS -----------

	/**
	* utility method which takes a root frequency and a number of semitones and returns the frequency of the "note" the specified number of semitones away from the root frequency
	* @method halfStep
	* @param {Number} root the root frequency ( in Hz )
	* @param {Number} semitones the number of half steps away from the root you need to know the frequency of ( negative values are lower pitches then root, positive values are higher pitches )
	* @param {String} [tuning] the kind of temperment to base the transposition on ( eitehr "equal" for equatempered tuning or "just" for pure/harmoniic tuning )
	* @return {Number} a frequency value in Hz
	* @example
	* <code class="code prettyprint">
	*  &nbsp;BB.Audio.init();<br>
	*  <br>
	*  &nbsp;var tone = new BB.AudioTone();<br>
	*  &nbsp;var D = BB.Audio.halfStep( 440, 5 )<br>
	*  <br>
	*  &nbsp;tone.noteOn( D ); // plays a D,587.33Hz ( 5 semitones up from A,440Hz )
	* </code>
	*/
	static halfStep(  root, n, temp  ){
		let err = new BB.ValidArg(this);
		err.checkType(root,"number",'BB.AudioTone.halfStep: first param expecting a number for frequency of root note in Hz');
		err.checkType(n,"number",'steps');
		err.checkType(temp,["string","undefined"]);

		if(typeof temp === "undefined") temp = "equal";
        // see https://www.youtube.com/watch?v=Y5RNrvcQ7q0 for details on different temperments
        var rnd = null;
        if(temp === "just"){
            var ratios = [
                // just intonation ( aka "chromatic scale" aka "pure intonnation" aka "harmonic tuning" )
                1,      // unison ( 1/1 )       // C
                25/24,  // minor second         // C#
                9/8,    // major second         // D
                6/5,    // minor third          // D#
                5/4,    // major third          // E
                4/3,    // fourth               // F
                45/32,  // diminished fifth     // F#
                3/2,    // fifth                // G
                8/5,    // minor sixth          // G#
                5/3,    // major sixth          // A
                9/5,    // minor seventh        // A#
                15/8,   // major seventh        // B
                // 2        // octave ( 2/1 )       // C
            ];

            rnd = root * ratios[n%12];
            if(n>=12) rnd = rnd * (Math.floor(n/12)+1);
            return Math.round(rnd*100)/100;
        }
        else if(temp === "equal") {
            if(typeof n === "undefined") n = 0;
            // formula via: http://www.phy.mtu.edu/~suits/NoteFreqCalcs.html
            var tr2 = Math.pow(2, 1/12); // the twelth root of 2
            rnd = root * Math.pow(tr2,n);
            return Math.round(rnd*100)/100;
        } else {
            throw new Error('BB.Audio.halfStep: third parmeter (for temperment) should be either "equal" or "just"');
        }
	}

	/**
	* utility method which takes a note (String) and returns it's frequency. It can also be passed a number of octaves and returns the frequency of the "note" the specified number of octaves away from the root note
	* @method getFreq
	* @param {Number} root the root note ( "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B" where "A" is 440 )
	* @param {Number} [octave] the number of octaves away from the root you need to know the frequency of ( negative values are lower pitches then root, positive values are higher pitches )
	* @param {Number} [A4] alternative "A4" frequency ( overrides default of 440 )
	* @return {Number} a frequency value in Hz
	* @example
	* <code class="code prettyprint">
	*  &nbsp;BB.Audio.init();<br>
	*  <br>
	*  &nbsp;var tone = new BB.AudioTone();<br>
	*  &nbsp;var A5 = BB.Audio.getFreq( "A", 1 )<br>
	*  <br>
	*  &nbsp;tone.noteOn( A5 ); // plays an A,880Hz ( 1 octave up from A,440Hz )
	* </code>
	*/
	static getFreq( note, transpose, root ){
		let err = new BB.ValidArg(this);
		err.checkType(note,["number","string"],'BB.AudioTone.getFreq: first param expecting a note string or number for frequency of root note in Hz');
		err.checkType(transpose,["number","undefined"]);
		err.checkType(root,["number","undefined"]);

		let nStr = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
		let idx = nStr.indexOf(note);
		if( idx < 0 ) throw new Error('BB.AudioTone.getFreq: expecting "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#" or "B"');

		let RT = (typeof root !== "number" ) ? 440 : root;
		let oct = (typeof transpose !== "number") ? 5 : transpose;
		note = idx + ( (oct)*12);

		return RT * Math.pow(2,(note-69)/12);
	}

	/**
	* generates a musical scale ( array of related frequency values ) from a
	* root note.
	*
	* the notes are stored in an array in the <code>.scales</code> property (
	* object ) and can be accessed by querying the key ( name ) of the scale type
	* you generated like so: <code> .scales.major </code>, which
	* will return an array of notes ( frequency number values in Hz )
	*
	* @method createScale
	*
	* @param  {String} scale name of the scale type you want to generate.
	* can be either major, naturalminor, harmonicminor, melodicminor, majorpentatonic,
	* minorpentatonic, blues, minorblues, majorblues, augmented, diminished, phrygiandominant,
	* dorian, phrygian, lydian, mixolydian, locrian, jazzmelodicminor, dorianb2, lydianaugmented,
	* lydianb7, mixolydianb13, locrian#2, superlocrian, wholehalfdiminished, halwholediminished,
	* enigmatic, doubleharmonic, hungarianminor, persian, arabian, japanese, egyptian, hirajoshi,
	* nickfunk1, nickfunk2
	*
	* @param  {Number} root the fundamental/root note of the scale ( the "A" in an "A major" )
	* can be either a number (frequency in Hz) or a note string ( "A", "A#", "B", etc )
	*
	* @param {String} [tuning] the kind of tuning (temperment) you would like to use to derive the scale with,
	* can be either "equal" (default) or "just"
	*
	* @return {Array} the newly created array
	*
	* @example
	* <code class="code prettyprint">
	*  &nbsp;BB.Audio.init();<br>
	*  <br>
	*  &nbsp;var O = new BB.AudioTone({ volume: 0.5 });<br>
	*  <br>
	*  &nbsp; function scheduler( freq, tuning, timeout ) { <br>
	*  &nbsp;&nbsp;&nbsp; return function() { <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; setTimeout(function(){ <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; O.makeNote({ <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; type: "sine", <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; tuning: tuning, <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; frequency: freq, <br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; duration: 0.25,<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; attack: 0.1,<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; release:0.5<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; });<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; },timeout);<br>
	*  &nbsp;&nbsp;&nbsp; }<br>
	*  &nbsp; } <br>
	*  <br>
	*  &nbsp; function playScale( scale, root, tuning ){<br>
	*  &nbsp;&nbsp;&nbsp; O.createScale( scale, root ); // this line generates the scale <br>
	*  <br>
	*  &nbsp;&nbsp;&nbsp; for (var i = 0; i < O.scales[scale].length; i++) {<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; var freq = O.scales[scale][i];<br>
	*  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; scheduler( freq, tuning, i*500 )();<br>
	*  &nbsp;&nbsp;&nbsp; };<br>
	*  &nbsp; }<br>
	*  <br>
	*  &nbsp; playScale( "major", 220, "just" );<br>
	* </code>
	*/
	static createScale( scale, root, temp ){

		if( typeof this.scales == "undefined" ) this.scales = {
			"major" : [],
			"naturalminor" : [],
			"harmonicminor" : [],
			"melodicminor" : [],
			"majorpentatonic" : [],
			"minorpentatonic" : [],
			"blues" : [],
			"minorblues" : [],
			"majorblues" : [],
			"augmented" : [],
			"diminished" : [],
			"phrygiandominant" : [],
			"dorian" : [],
			"phrygian" : [],
			"lydian" : [],
			"mixolydian" : [],
			"locrian" : [],
			"jazzmelodicminor" : [],
			"dorianb2" : [],
			"lydianaugmented" : [],
			"lydianb7" : [],
			"mixolydianb13" : [],
			"locrian#2" : [],
			"superlocrian" : [],
			"wholehalfdiminished" : [],
			"halwholediminished" : [],
			"enigmatic" : [],
			"doubleharmonic" : [],
			"hungarianminor" : [],
			"persian" : [],
			"arabian" : [],
			"japanese" : [],
			"egyptian" : [],
			"hirajoshi" : [],
			"nickfunk1" : [],
			"nickfunk2" : []
		};

		if( !(scale in this.scales) ) {
			throw new Error("BB.Audio.createScale: '"+scale+"' is not a valid scale name, choose from: "+Object.keys(this.scales) );
		} else {

			var tuning = "equal";
			if(typeof temp !== "undefined"){
				if( temp === "equal" || temp === "just" ){
					tuning = temp;
				} else {
					throw new Error('BB.Audio.createScale: temperment should be either "just" or "equal"');
				}
			}


			if(typeof root === "string") root = BB.Audio.getFreq(root);
			else if(typeof root === "number") root = root;
			else throw new Error('BB.Audio.createScale: expecting a frequency (number) or a note ("A","A#",etc.) as second paramter');


			// via >> http://www.cs.cmu.edu/~scottd/chords_and_scales/music.html
			var steps;
				 if(scale=="major")                 steps = [2, 2, 1, 2, 2, 2, 1];
			else if(scale=="naturalminor")          steps = [2, 1, 2, 2, 1, 2, 2];
			else if(scale=="harmonicminor")         steps = [2, 1, 2, 2, 1, 3, 1];
			else if(scale=="melodicminor")          steps = [2, 1, 2, 2, 2, 2, 1];
			else if(scale=="majorpentatonic")       steps = [2, 2, 3, 2, 3];
			else if(scale=="minorpentatonic")       steps = [3, 2, 2, 3, 2];
			else if(scale=="blues")                 steps = [3, 2, 1, 1, 3, 2];
			else if(scale=="minorblues")            steps = [2, 1, 2, 1, 1, 1, 2, 2];
			else if(scale=="majorblues")            steps = [2, 1, 1, 1, 1, 1, 2, 1, 2];
			else if(scale=="augmented")             steps = [2, 2, 2, 2, 2, 2];
			else if(scale=="diminished")            steps = [2, 1, 2, 1, 2, 1, 2, 1];
			else if(scale=="phrygiandominant")      steps = [1, 3, 1, 2, 1, 2, 2];
			else if(scale=="dorian")                steps = [2, 1, 2, 2, 2, 1, 2];
			else if(scale=="phrygian")              steps = [1, 2, 2, 2, 1, 2, 2];
			else if(scale=="lydian")                steps = [2, 2, 2, 1, 2, 2, 1];
			else if(scale=="mixolydian")            steps = [2, 2, 1, 2, 2, 1, 2];
			else if(scale=="locrian")               steps = [1, 2, 2, 1, 2, 2, 2];
			else if(scale=="jazzmelodicminor")      steps = [2, 1, 2, 2, 2, 2, 1];
			else if(scale=="dorianb2")              steps = [1, 2, 2, 2, 2, 1, 2];
			else if(scale=="lydianaugmented")       steps = [2, 2, 2, 2, 1, 2, 1];
			else if(scale=="lydianb7")              steps = [2, 2, 2, 1, 2, 1, 2];
			else if(scale=="mixolydianb13")         steps = [2, 2, 1, 2, 1, 2, 2];
			else if(scale=="locrian#2")             steps = [2, 1, 2, 1, 2, 2, 2];
			else if(scale=="superlocrian")          steps = [1, 2, 1, 2, 2, 2, 2];
			else if(scale=="wholehalfdiminished")   steps = [2, 1, 2, 1, 2, 1, 2, 1];
			else if(scale=="halwholediminished")    steps = [1, 2, 1, 2, 1, 2, 1, 2];
			else if(scale=="enigmatic")             steps = [1, 3, 2, 2, 2, 1, 1];
			else if(scale=="doubleharmonic")        steps = [1, 3, 1, 2, 1, 3, 1];
			else if(scale=="hungarianminor")        steps = [2, 1, 3, 1, 1, 3, 1];
			else if(scale=="persian")               steps = [1, 3, 1, 1, 2, 3, 1];
			else if(scale=="arabian")               steps = [2, 2, 1, 1, 2, 2, 2];
			else if(scale=="japanese")              steps = [1, 4, 2, 1, 4];
			else if(scale=="egyptian")              steps = [2, 3, 2, 3, 2];
			else if(scale=="hirajoshi")             steps = [2, 1, 4, 1, 4];
			else if(scale=="nickfunk1")             steps = [3, 2, 2, 3, 2, 3, 2];
			else if(scale=="nickfunk2")             steps = [3, 2, 1, 1, 3, 2, 3, 2, 1];

			this.scales[scale] = [];

			var incSteps = [0];
			for (var s = 1; s < steps.length+1; s++) {
				var inc = 0;
				for (var j = 0; j < s; j++) inc += steps[j];
				incSteps.push( inc );
			}

			for (var i = 0; i < incSteps.length; i++) {
				this.scales[scale].push( BB.Audio.halfStep( root, incSteps[i], tuning ) );
			}

			return this.scales[scale];
		}
	}

}

module.exports = Audio;
