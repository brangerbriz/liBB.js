/**
 * A module for streaming user audio ( getUserMedia )
 * @module BB.AudioStream
 */
define(['./BB'],
function(  BB ){

	'use strict';

	 /**
	 *  A module for streaming user audio ( getUserMedia )
	 * @class BB.AudioStream
	 * @constructor
	 * 
	 * @param {Object} config An optional config object to initialize the Stream, 
	 * can contain the following:
	 * <code class="code prettyprint">
	 * &nbsp;{<br>
	 * &nbsp;&nbsp;&nbsp; context: BB.Audio.context[2], // choose specific context <br>
	 * &nbsp;&nbsp;&nbsp; connect: fft.analyser, // overide default destination <br>
	 * &nbsp;&nbsp;&nbsp; autostart: true // will automatically start the stream <br>
	 * &nbsp;}
	 * </code>	 
	 * 
	 * @example  
	 * <code class="code prettyprint">  
	 *  &nbsp;BB.Audio.init();<br>
	 *	<br>
	 *	&nbsp;var mic = new BB.AudioStream();<br>
	 *	<br>
	 * </code>
	 * <br>
	 * BB.AudioStream ( represented by Gain below ) connects to <a href="BB.Audio.html">BB.Audio.context</a> by default<br>
	 * <img src="../assets/images/audiosampler1.png">
	 */

	BB.AudioStream = function( config ){
		
		/**
		 * the Audio Stream 
		 * @type {LocalMEdiaStream}
		 * @default null
		 * @property stream
		 */
		this.stream = null; // set by this.open()

		// the AudioContext to be used by this module 
		if( typeof BB.Audio.context === "undefined" )
			throw new Error('BB Audio Modules require that you first create an AudioContext: BB.Audio.init()');
		
		if( BB.Audio.context instanceof Array ){
			if( typeof config === "undefined" || typeof config.context === "undefined" )
				throw new Error('BB.AudioStream: BB.Audio.context is an Array, specify which { context:BB.Audio.context[?] }');
			else {
				this.ctx = config.context;
			}
		} else {
			this.ctx = BB.Audio.context;
		}

		// default destination is context destination
		// unless otherwise specified in { connect:AudioNode }
		this.gain		= this.ctx.createGain();	
		if(typeof config !== "undefined" && typeof config.connect !== 'undefined' ){
			if( config.connect instanceof AudioDestinationNode ||
				config.connect instanceof AudioNode ) 
				this.gain.connect( config.connect );
			else {
				throw new Error('BB.AudioStream: connect property expecting an AudioNode');
			}
		} else {
			this.gain.connect( this.ctx.destination );
		}

		// whether or not to automatically start the stream
		this.auto 		= (typeof config !== "undefined" &&  typeof config.autostart !== 'undefined' ) ? config.autostart : false;

		if(this.auto === true){
			this.open();
		}

	};


    /**
     * starts the stream
     * @method start
     *
     * @example
     * <code class="code prettyprint">
     * &nbsp;// assuming "mic" is an instanceof BB.AudioStream<br>
     * &nbsp;if(!mic.stream) mic.open();
     * </code>
     */
	BB.AudioStream.prototype.open = function(){
		
		navigator.getUserMedia = (	navigator.getUserMedia ||
									navigator.webkitGetUserMedia ||
									navigator.mozGetUserMedia ||
                          			navigator.msGetUserMedia );
		var self = this;

		if(navigator.getUserMedia){
			navigator.getUserMedia({audio:true}, 
				function(stream){
					self.stream = stream;
					var input = self.ctx.createMediaStreamSource(stream);
					input.connect( self.gain );
				}, 
				function(e){
					throw new Error("BB.AudioStream: "+ e );
				}
			);
		} else {
			throw new Error('BB.AudioStream: getUserMedia not supported');
		}
	};

    /**
     * stops the stream
     * @method start
     *
     * @example
     * <code class="code prettyprint">
     * &nbsp;// assuming "mic" is an instanceof BB.AudioStream<br>
     * &nbsp;if(mic.stream) mic.close();
     * </code>
     */
	BB.AudioStream.prototype.close = function(){
		if(this.stream){
			this.stream.stop();
			this.stream = null;
		}
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
	 *	&nbsp;var fft = new BB.AudioAnalyser();<br>
	 *	&nbsp;var mic = new BB.AudioStream();<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp; mic.connect( fft.analyser );
	 * </code>
	 * <br>
	 * BB.AudioStream ( represented by Gain below ) connects to the BB.Audio.context by default, using <code>.connect()</code> also connects it to an additional node ( see disconnect below )
	 * <br>
	 * <img src="../assets/images/audiostream1.png">
	 */
	BB.AudioStream.prototype.connect = function( destination, output, input ){
		if( !(destination instanceof AudioDestinationNode || destination instanceof AudioNode) )
			throw new Error('AudioStream.connect: destination should be an instanceof AudioDestinationNode or AudioNode');
		if( typeof output !== "undefined" && typeof output !== "number" )
			throw new Error('AudioStream.connect: output should be a number');
		if( typeof intput !== "undefined" && typeof input !== "number" )
			throw new Error('AudioStream.connect: input should be a number');

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
	 *
	 *  @example  
	 * <code class="code prettyprint">  
	 *  &nbsp;BB.Audio.init();<br>
	 *	<br>
	 *	&nbsp;var fft = new BB.AudioAnalyser();<br>
	 *	&nbsp;var mic = new BB.AudioStream();<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp; mic.disconnect();<br>
	 *	&nbsp;&nbsp;&nbsp;&nbsp; mic.connect( fft.analyser );
	 * </code>
	 * <br>
	 * BB.AudioStream ( represented by Gain below ) connects to the BB.Audio.context by default, using <code>.disconnect()</code> disconnects it from it's default, then using <code>.connect()</code>  connects it to the Analyser ( which is connected to the BB.Audio.context by default )
	 * <br>
	 * <img src="../assets/images/audiostream2.png">
	 */
	BB.AudioStream.prototype.disconnect = function(destination, output, input ){
		if( typeof destination !== "undefined" &&
			!(destination instanceof AudioDestinationNode || destination instanceof AudioNode) )
			throw new Error('AudioStream.disconnect: destination should be an instanceof AudioDestinationNode or AudioNode');
		if( typeof output !== "undefined" && typeof output !== "number" )
			throw new Error('AudioStream.disconnect: output should be a number');
		if( typeof input !== "undefined" && typeof input !== "number" )
			throw new Error('AudioStream.disconnect: input should be a number');

		if( typeof input !== "undefined" ) this.gain.disconnect( destination, output, input );
		else if( typeof output !== "undefined" ) this.gain.disconnect( destination, output );
		else if( typeof destination !== "undefined" ) this.gain.disconnect( destination );
		else  this.gain.disconnect();
	};

	/**
	 * sets the gain level of the AudioSamppler ( in a sense, volume control ) 
	 * @method setGain
	 * @param {Number} num a float value, 1 being the default volume, below 1 decreses the volume, above one pushes the gain
	 */
	BB.AudioStream.prototype.setGain = function( num ){
		if( typeof num !== "number" )
			throw new Error('AudioStream.setGain: expecting a number');

		this.gain.gain.value = num;
	};

	return BB.AudioStream;
});