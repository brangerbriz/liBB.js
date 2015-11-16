/**
 * A module for creating an audio sampler, an object that can load, sample and play back sound files
 * @module BB.AudioSampler
 */
define(['./BB','./BB.AudioBufferLoader','./BB.Audio'],
function(  BB, 		 AudioBufferLoader,       Audio){

	'use strict';

	BB.AudioBufferLoader = AudioBufferLoader;

	 /**
	 *  A module for creating an audio sampler, an object that can load, sample and play back sound files
	 * @class BB.AudioSampler
	 * @constructor
	 * 
	 * @param {Object} config A config object to initialize the Sampler,
	 * can contain the following:
	 * <code class="code prettyprint">
	 * &nbsp;{<br>
	 * &nbsp;&nbsp;&nbsp; context: BB.Audio.context[2], // choose specific context <br>
	 * &nbsp;&nbsp;&nbsp; connect: fft.analyser, // overide default destination <br>
	 * &nbsp;&nbsp;&nbsp; autoload: false, // don't autoload ( sampler.load() later ) <br>
	 * &nbsp;&nbsp;&nbsp; rate: 2, // double the playback rate <br>
	 * &nbsp;&nbsp;&nbsp; // then as many additional keys for samples...<Br>
	 * &nbsp;&nbsp;&nbsp; soundA: 'path/to/file.ogg', <br>
	 * &nbsp;&nbsp;&nbsp; soundB: 'path/to/file.ogg'<br>
	 * &nbsp;}
	 * </code>
	 * 
	 * @param {Function} [callback] A callback, with a buffer Object Array ( see full example below )
	 * 
	 * @example  
	 * in the example below instantiating the BB.AudioSampler creates a <a href="https://developer.mozilla.org/en-US/docs/Web/API/GainNode" target="_blank">GainNode</a> ( essentially the Sampler's output ) connected to the default BB.Audio.context ( ie. AudioDestination )
	 * <br> <img src="../assets/images/audiosampler1.png"/>
	 * <br> everytime an individual sample is played, for example: <code> drum.play('kick')</code>, the corresponding <a href="https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer" target="_blank">AudioBuffer</a> ( from the URL provided in the config )  is created and connected to the sampler's GainNode ( the image below is an example of the graph when two samples are played )
	 * <br> <img src="../assets/images/audiosampler2.png"/> <br>
	 * <code class="code prettyprint">  
	 *  &nbsp;BB.Audio.init();<br>
	 *	<br>
	 *	&nbsp;var drum = new BB.AudioSampler({<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp;kick: 'audio/808/kick.ogg',<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp;snare: 'audio/808/snare.ogg',<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp;hat: 'audio/808/hat.ogg'<br>
	 *	&nbsp;}, function( bufferObj ){<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp;console.log( "loaded: " + bufferObj )<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp;run();<br>
	 *	&nbsp;});<br>
	 *	<br>
	 *	&nbsp;function run(){<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;drum.play('kick');<br>
	 *	&nbsp;}<br>
	 *	<br>
	 *	&nbsp;// a more complex config example...<Br>
	 *	&nbsp;// overrides default context ( BB.Audio.context )<br>
	 *	&nbsp;// overrides default connect ( BB.Audio.context.destination )<br>
	 *	&nbsp;BB.Audio.init(3);<br>
	 *	<br>
 	 *	&nbsp;var drum = new BB.AudioSampler({<br>
 	 *	&nbsp;&nbsp;&nbsp;&nbsp;context: BB.Audio.context[2],<br>
 	 *	&nbsp;&nbsp;&nbsp;&nbsp;connect: ExampleNode,<br>
 	 *	&nbsp;&nbsp;&nbsp;&nbsp;autoload: false,<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp;kick: 'audio/808/kick.ogg',<br>
	 *	&nbsp;});<br>
	 *	<br>
	 *	&nbsp;drum.load();
	 * </code>
	 *
     * view basic <a href="../../examples/editor/?file=audio-sampler" target="_blank">BB.AudioSampler</a> example
	 */
    
	BB.AudioSampler = function( config, callback ){
		
		// the AudioContext to be used by this module 
		if( typeof BB.Audio.context === "undefined" )
			throw new Error('BB Audio Modules require that you first create an AudioContext: BB.Audio.init()');
		
		if( BB.Audio.context instanceof Array ){
			if( typeof config === "undefined" || typeof config.context === "undefined" )
				throw new Error('BB.AudioSampler: BB.Audio.context is an Array, specify which { context:BB.Audio.context[?] }');
			else {
				this.ctx = config.context;
			}
		} else {
			this.ctx = BB.Audio.context;
		}
		
		/**
		 * whether or not the file(s) have loaded
		 * @type {Boolean}
		 * @property loaded
		 */
		this.loaded		= false;

		// callback to run after loading
		this.onload 	= callback;

		/**
		 * sample names, ex:['kick','snare']
		 * @type {Array}
		 * @property keys
		 */
		this.keys 		= []; 
		/**
		 * array of paths to sample audio files
		 * @type {Array}
		 * @property paths
		 */
		this.paths  	= []; 
		/**
		 * collection of sample buffers
		 * @type {Object}
		 * @property buffers
		 */
		this.buffers	= {}; 
		/**
		 * changes the pitch (<a href="https://en.wikipedia.org/wiki/Cent_%28music%29" target="_blank">-1200 to 1200</a> )
		 * @type {Number}
		 * @property detune
		 * @default 0
		 * @protected
		 *  --- webkit doesn't seem to support detune :-/ so replacing this with 
		 */
		this.detune 	= ( typeof config.detune !== 'undefined' ) ? config.detune : 0;
		/**
		 * changes the playback rate ( pitch and speed ), (<a href="https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/playbackRate" target="_blank">reference</a> )
		 * @type {Number}
		 * @property rate
		 */
		this.rate 	= ( typeof config.rate !== 'undefined' ) ? config.rate : 1;

		// whether or not to autoload the files
		this.auto 		= ( typeof config.autoload !== 'undefined' ) ? config.autoload : true;

		// will be instance of BB.AudioBufferLoader
		this.loader 	= undefined;

		// default destination is context destination
		// unless otherwise specified in { connect:AudioNode }
		this.gain		= this.ctx.createGain();	
		if( typeof config.connect !== 'undefined' ){
			if( config.connect instanceof AudioDestinationNode ||
				config.connect instanceof AudioNode ) 
				this.gain.connect( config.connect );
			else {
				throw new Error('BB.AudioSampler: connect property expecting an AudioNode');
			}
		} else {
			this.gain.connect( this.ctx.destination );
		}

		if( !config ) throw new Error('BB.AudioSampler: requires a config object');

		if( typeof this.auto !== 'boolean' ) 
			throw new Error('BB.AudioSampler: autoload should be either true or false');


		// setup keys && paths
		for (var key in config ) {
			if( key!=='context' && key!=='autoload' && key!=="connect" && key!=="rate"){
				this.keys.push( key );
				this.paths.push( config[key] );
			}
		}

		if( this.auto===true ) this.load();
	};


    /**
     * creates buffers from url paths using BB.AudioBufferLoader, this
     * automatically runs in constructor ( and thus no need to ever call it )
     * unless autoload is set to false in the config in the constructor
     * @method load
     */
	BB.AudioSampler.prototype.load = function(){

		var self = this;

		this.loader = new BB.AudioBufferLoader({

			context: this.ctx,
			autoload: this.auto,
			paths: this.paths

		}, function(buffers){

			for (var i = 0; i < buffers.length; i++) {
				self.buffers[self.keys[i]] = buffers[i];
			}

			self.loaded = true;
			
			if(typeof self.onload !== 'undefined' ) self.onload( self.buffers ); // callback

		});

	};

	/**
	 * connects the Sampler to a particular AudioNode or AudioDestinationNode
	 * @method connect
	 * @param  {AudioNode} destination the AudioNode or AudioDestinationNode to connect to
	 * @param  {Number} output      which output of the the Sampler do you want to connect to the destination
	 * @param  {Number} input       which input of the destinatino you want to connect the Sampler to
	 * @example  
	 * <code class="code prettyprint">  
	 *  &nbsp;BB.Audio.init();<br>
	 *	<br>
	 *	&nbsp;var drum = new BB.AudioSampler({<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp;kick: 'audio/808/kick.ogg',<br>
	 *	&nbsp;}, run );<br>
	 *	<br>
	 *	&nbsp;function run(){<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;drum.connect( exampleNode );<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// connected to both default BB.Audio.context && exampleNode<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// so if exampleNode is also connected to BB.Audio.context by default,<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// ...then you've got drum connected to BB.Audio.context twice<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;drum.play('kick');<br>
	 *	&nbsp;}<br>
	 * </code>
	 * <br>
	 * ...which looks like this ( where the first Gain is the Sampler and the second is the exampleNode )<br>
	 * <img src="../assets/images/audiosampler3.png">
	 */
	BB.AudioSampler.prototype.connect = function( destination, output, input ){
		if( !(destination instanceof AudioDestinationNode || destination instanceof AudioNode) )
			throw new Error('AudioSampler.connect: destination should be an instanceof AudioDestinationNode or AudioNode');
		if( typeof output !== "undefined" && typeof output !== "number" )
			throw new Error('AudioSampler.connect: output should be a number');
		if( typeof intput !== "undefined" && typeof input !== "number" )
			throw new Error('AudioSampler.connect: input should be a number');

		if( typeof intput !== "undefined" ) this.gain.connect( destination, output, input );
		else if( typeof output !== "undefined" ) this.gain.connect( destination, output );
		else this.gain.connect( destination );

	};

	/**
	 * diconnects the Sampler from the node it's connected to
	 * @method disconnect
	 * @param  {AudioNode} destination what it's connected to
	 * @param  {Number} output      the particular output number
	 * @param  {Number} input       the particular input number
	 * <code class="code prettyprint">  
	 *  &nbsp;BB.Audio.init();<br>
	 *	<br>
	 *	&nbsp;var drum = new BB.AudioSampler({<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp;kick: 'audio/808/kick.ogg',<br>
	 *	&nbsp;}, run );<br>
	 *	<br>
	 *	&nbsp;function run(){<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;drum.disconnect(); // disconnected from default BB.Audio.context<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;drum.connect( exampleNode ); // connected to exampleNode only<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;drum.play('kick');<br>
	 *	&nbsp;}<br>
	 * </code>
	 * <br>
	 * ...which looks like this ( where the first Gain is the Sampler and the second is the exampleNode )<br>
	 * <img src="../assets/images/audiosampler4.png">
	 */
	BB.AudioSampler.prototype.disconnect = function(destination, output, input ){
		if( typeof destination !== "undefined" &&
			!(destination instanceof AudioDestinationNode || destination instanceof AudioNode) )
			throw new Error('AudioSampler.disconnect: destination should be an instanceof AudioDestinationNode or AudioNode');
		if( typeof output !== "undefined" && typeof output !== "number" )
			throw new Error('AudioSampler.disconnect: output should be a number');
		if( typeof input !== "undefined" && typeof input !== "number" )
			throw new Error('AudioSampler.disconnect: input should be a number');

		if( typeof input !== "undefined" ) this.gain.disconnect( destination, output, input );
		else if( typeof output !== "undefined" ) this.gain.disconnect( destination, output );
		else if( typeof destination !== "undefined" ) this.gain.disconnect( destination );
		else  this.gain.disconnect();
	};

	// ^ ^ ^ ^ ^ 
	// Maybe add an "output" or "modulate" function that usese the AudioNode.connect(AudioParam)
	// https://developer.mozilla.org/en-US/docs/Web/API/AudioNode/connect%28AudioParam%29
	// so we can manipulate parameters w/ the audio signal from AudioSampler
	// ^ ^ ^ ^ ^

	/**
	 * sets the gain level of the AudioSamppler ( in a sense, volume control ) 
	 * @method setGain
	 * @param {Number} num a float value, 1 being the default volume, below 1 decreses the volume, above one pushes the gain
	 */
	BB.AudioSampler.prototype.setGain = function( num ){
		if( typeof num !== "number" )
			throw new Error('AudioSampler.setGain: expecting a number');

		this.gain.gain.value = num;
	};



    /**
     * schedules an audio buffer to be played
     * @method play
     * @param {String} key name of particular sample ( declared in constructor ) 
     * @param {Number} [when] scheduled time in the AudioContext's timeline/clock (ie. currentTime) to play the file ( default 0, ie. automatically )
     * @param {Number} [offset] default is 0 (ie. beggining of the sample ) but can be offset (seconds) to start at another point in the sample
     * @param {Number} [duration] default is the duration of the entire sample (seconds) can be shortened to a lesser amount
	 * @example  
	 * <code class="code prettyprint">  
	 * &nbsp;// plays the sample "fireworks" <br>
	 * &nbsp;// starts playing it when AudioContext.currentTime == 10<br>
	 * &nbsp;// starts the sample 30 seconds into the track<br>
	 * &nbsp;// plays for half a second, then stops<br>
	 * &nbsp;sampler.play('fireworks', 10, 30, 0.5);
	 * </code>
     */
	BB.AudioSampler.prototype.play = function( key, when, offset, duration ) {

		if( !key || this.keys.indexOf(key)<0 ) throw new Error('BB.AudioSampler: '+key+' was not defined in constructor');

		var source = this.ctx.createBufferSource(); 
			source.buffer = this.buffers[ key ];            
			// source.detune.value = this.detune;
			source.playbackRate.value = this.rate;
			source.connect( this.gain );   


		var w = ( typeof when !== 'undefined' ) ? when : 0;
		var o = ( typeof offset !== 'undefined' ) ? offset : 0;
		var d = ( typeof duration !== 'undefined' ) ? duration : source.buffer.duration;

	    source.start( w, o, d ); 

    };

	return BB.AudioSampler;
});