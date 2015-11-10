/**
 * A module for doing FFT ( Fast Fourier Transform ) analysis on audio 
 * @module BB.AudioAnalyser
 */
define(['./BB'],
function(  BB ){

	'use strict';

	 /**
	 *  A module for doing FFT ( Fast Fourier Transform ) analysis on audio 
	 * @class BB.AudioAnalyser
	 * @constructor
	 * 
	 * @param {Object} config A config object to initialize the Sampler, must contain a "context: AudioContext" 
	 * property and can contain properties for fftSize, smoothing, maxDecibels and minDecibels
	 * ( see <a href="https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode" target="_blank">AnalyserNode</a> for details )
	 * 
	 * @example  
	 * <code class="code prettyprint">  
	 *  &nbsp;var context = new (window.AudioContext || window.webkitAudioContext)();<br>
	 *	<br>
	 *	&nbsp;var fft = new BB.AudioAnalyser({ context: context }); <br>
	 *	&nbsp;// assuming samp is an instanceof BB.AudioSampler <br>
	 *	&nbsp;samp.connect( fft.analyser ); <br>
	 *	&nbsp;// fft will then connect to the context.destination by default <br>
	 *	&nbsp;// ...unless otherwise connected to somthing else
	 * </code>
	 */
    

	BB.AudioAnalyser = function( config ){
		
		this.ctx 			= config.context;
		/**
		 * the AnalyserNode itself ( used by other nodes when connecting to this )
		 * @type {AnalyserNode}
		 * @property analyser
		 */
		this.analyser 		= this.ctx.createAnalyser();
		this.dest 			= this.ctx.destination;
		this.fftSize 		= ( typeof config.fftSize !== 'undefined' ) ? config.fftSize : 2048;
		this.smoothing 		= ( typeof config.smoothing !== 'undefined' ) ? config.smoothing : 0.8;
		this.maxDecibels	= ( typeof config.maxDecibels !== 'undefined' ) ? config.maxDecibels : -30;
		this.minDecibels	= ( typeof config.minDecibels !== 'undefined' ) ? config.minDecibels : -90;

		this.analyser.fftSize 					= this.fftSize;
		this.analyser.smoothingTimeConstant 	= this.smoothing;
		this.analyser.maxDecibels 				= this.maxDecibels;
		this.analyser.minDecibels 				= this.minDecibels;

		this.freqByteData 	= new Uint8Array( this.analyser.frequencyBinCount );
		this.freqFloatData 	= new Float32Array(this.analyser.frequencyBinCount);
		this.timeByteData 	= new Uint8Array( this.analyser.frequencyBinCount );
		this.timeFloatData 	= new Float32Array(this.analyser.frequencyBinCount);

		if( !config ) throw new Error('Analyser: requires a config object');
		if( !(this.ctx instanceof AudioContext) ) 
			throw new Error('Analyser: context should be an instance of AudioContext');
		if( this.fftSize%2 !== 0 || this.fftSize < 32 || this.fftSize > 2048)
			throw new Error('Analyser: fftSize must be a multiple of 2 between 32 and 2048');

		this.analyser.connect( this.dest );		
		
	};

    /**
     * method for connecting to other nodes ( overrides the default connection to context.destination )
     * @method connect
     * @param {Object} destination either an AudioDestinationNode or AudioNode to connect to 
     * @param {Number} [output] this analyser's output, 0 for left channel, 1 for right channel ( default 0 )
     * @param {Number} [input] input of the node you're connecting this to, 0 for left channel, 1 for right channel ( default 0 )
     */
	BB.AudioAnalyser.prototype.connect = function(destination, output, input ){
		if( !(destination instanceof AudioDestinationNode || destination instanceof AudioNode) )
			throw new Error('Analyser: destination should be an instanceof AudioDestinationNode or AudioNode');
		this.dest = destination;
		this.analyser.connect( this.dest, output, input );
	};

    /**
     * returns an array with frequency byte data
     * @method getByteFrequencyData
     */
	BB.AudioAnalyser.prototype.getByteFrequencyData = function(){
		this.analyser.getByteFrequencyData( this.freqByteData );
		return this.freqByteData;
	};

    /**
     * returns an array with frequency float data
     * @method getFloatFrequencyData
     */
	BB.AudioAnalyser.prototype.getFloatFrequencyData = function(){
		this.analyser.getFloatFrequencyData( this.freqFloatData );
		return this.freqFloatData;
	};

    /**
     * returns an array with time domain byte data
     * @method getByteTimeDomainData
     */
	BB.AudioAnalyser.prototype.getByteTimeDomainData = function(){
		// https://en.wikipedia.org/wiki/Time_domain
		this.analyser.getByteTimeDomainData( this.timeByteData );
		return this.timeByteData;
	};

    /**
     * returns an array with time domain float data
     * @method getFloatTimeDomainData
     */
	BB.AudioAnalyser.prototype.getFloatTimeDomainData = function(){
		this.analyser.getFloatTimeDomainData( this.timeFloatData );
		return this.timeFloatData;
	};

	BB.AudioAnalyser.prototype.averageAmp = function( array ){
		var v = 0;
		var averageAmp;
		var l = array.length;
		for (var i = 0; i < l; i++) {
			v += array[i];
		}
		averageAmp = v / l;
		return averageAmp;
	};

    /**
     * returns the averaged amplitude between both channels
     * @method getAmplitude
     */
	BB.AudioAnalyser.prototype.getAmplitude = function(){
		return this.averageAmp( this.getByteFrequencyData() );
	};


	return BB.AudioAnalyser;
});