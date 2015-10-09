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
	 * @param {Object} config A config object to initialize the Stream, must contain a "context: AudioContext" 
	 * property and can contain properties for destination ( connect: destinationNode )
	 * 
	 * @example  
	 * <code class="code prettyprint">  
	 *  &nbsp;var context = new (window.AudioContext || window.webkitAudioContext)();<br><br>
	 *  &nbsp;var fft = new BB.AudioAnalyser({ <br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;context: context,<br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;fftSize: 1024<br>
	 *  &nbsp;});<br><br>
	 * &nbsp;var mic = new BB.AudioStream({<br>
	 * &nbsp;&nbsp;&nbsp;&nbsp;context:context,<br>
	 * &nbsp;&nbsp;&nbsp;&nbsp;connect:fft.analyser<br>
	 * &nbsp;});<br>
	 * </code>
	 */
	


	BB.AudioStream = function( config ){
		
		this.ctx 		= config.context;
		this.dest 		= ( typeof config.connect !== 'undefined' ) ? config.connect : this.ctx.destination;

		navigator.getUserMedia = 	navigator.getUserMedia ||
									navigator.webkitGetUserMedia ||
									navigator.mozGetUserMedia;

		var self = this;

		if(navigator.getUserMedia){
			navigator.getUserMedia({audio:true}, 
				function(stream){
					var input = self.ctx.createMediaStreamSource(stream);
					input.connect( self.dest );
				}, 
				function(e){
					throw new Error("Stream: "+ e );
				}
			);
		} else {
			console.log('getUserMedia not supported');
		}

		if( !config ) throw new Error('BufferLoader: requires a config object');

		if( !(this.ctx instanceof AudioContext) ) 
			throw new Error('BufferLoader: context should be an instance of AudioContext');
		
	};

	return BB.AudioStream;
});