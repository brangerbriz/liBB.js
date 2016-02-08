/**
 * A module for streaming user audio ( getUserMedia )
 * @module BB.AudioStream
 * @extends BB.AudioBase
 */
define(['./BB', './BB.AudioBase'],
function(  BB,		  AudioBase ){

	'use strict';

	 /**
	 *  A module for streaming user audio ( getUserMedia )
	 * @class BB.AudioStream
	 * @constructor
	 * @extends BB.AudioBase
	 * 
	 * @param {Object} config An optional config object to initialize the Stream, 
	 * can contain the following:
	 * <code class="code prettyprint">
	 * &nbsp;{<br>
	 * &nbsp;&nbsp;&nbsp; context: BB.Audio.context[2], // choose specific context <br>
	 * &nbsp;&nbsp;&nbsp; connect: fft.node, // overide default destination <br>
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
		
		BB.AudioBase.call(this, config);

		/**
		 * the Audio Stream 
		 * @type {LocalMEdiaStream}
		 * @default null
		 * @property stream
		 */
		this.stream = null; // set by this.open()
		// this.node = null;

		// whether or not to automatically start the stream
		this.auto 		= (typeof config !== "undefined" &&  typeof config.autostart !== 'undefined' ) ? config.autostart : false;

		if(this.auto === true){
			this.open();
		}

	};

 	BB.AudioStream.prototype = Object.create(BB.AudioBase.prototype);
    BB.AudioStream.prototype.constructor = BB.AudioStream;

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
					self.node = input;
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

	return BB.AudioStream;
});