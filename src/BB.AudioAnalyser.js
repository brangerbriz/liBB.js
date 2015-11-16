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
	 *  &nbsp;BB.Audio.init();<br>
	 *	<br>
	 *	&nbsp;var fft = new BB.AudioAnalyser(); <br>
	 *	&nbsp;// assuming samp is an instanceof BB.AudioSampler <br>
	 *	&nbsp;samp.connect( fft.analyser ); <br><br><br>
	 *	&nbsp;// you can override fft's defaults by passing a config <br>
	 *	&nbsp;var fft = new BB.AudioAnalyser({<br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;context: BB.Audio.context[3],<br>
	 *  &nbsp;&nbsp;&nbsp;&nbsp;connect: BB.Audio.context[3].destination<br>
	 *  &nbsp;}); <br>
	 * </code>
	 *
     * view basic <a href="../../examples/editor/?file=audio-analyser" target="_blank">BB.AudioAnalyser</a> example
	 */
    

	BB.AudioAnalyser = function( config ){
		
		// the AudioContext to be used by this module 
		if( typeof BB.Audio.context === "undefined" )
			throw new Error('BB Audio Modules require that you first create an AudioContext: BB.Audio.init()');
		
		if( BB.Audio.context instanceof Array ){
			if( typeof config === "undefined" || typeof config.context === "undefined" )
				throw new Error('BB.AudioAnalyser: BB.Audio.context is an Array, specify which { context:BB.Audio.context[?] }');
			else {
				this.ctx = config.context;
			}
		} else {
			this.ctx = BB.Audio.context;
		}

		/**
		 * the <a href="https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode" target="_blank">AnalyserNode</a> itself
		 * @type {AnalyserNode}
		 * @property analyser
		 */
		this.analyser 		= this.ctx.createAnalyser();
		
		this.fftSize 		= ( typeof config!=="undefined" && typeof config.fftSize !== 'undefined' ) ? config.fftSize : 2048;
		this.smoothing 		= ( typeof config!=="undefined" && typeof config.smoothing !== 'undefined' ) ? config.smoothing : 0.8;
		this.maxDecibels	= ( typeof config!=="undefined" && typeof config.maxDecibels !== 'undefined' ) ? config.maxDecibels : -30;
		this.minDecibels	= ( typeof config!=="undefined" && typeof config.minDecibels !== 'undefined' ) ? config.minDecibels : -90;

		this.analyser.fftSize 					= this.fftSize;
		this.analyser.smoothingTimeConstant 	= this.smoothing;
		this.analyser.maxDecibels 				= this.maxDecibels;
		this.analyser.minDecibels 				= this.minDecibels;			


		this.freqByteData 	= new Uint8Array( this.analyser.frequencyBinCount );
		this.freqFloatData 	= new Float32Array(this.analyser.frequencyBinCount);
		this.timeByteData 	= new Uint8Array( this.analyser.frequencyBinCount );
		this.timeFloatData 	= new Float32Array(this.analyser.frequencyBinCount);

		if( this.fftSize%2 !== 0 || this.fftSize < 32 || this.fftSize > 2048)
			throw new Error('Analyser: fftSize must be a multiple of 2 between 32 and 2048');

		// default destination is undefined
		// unless otherwise specified in { connect:AudioNode }
		if( typeof config !== "undefined" && typeof config.connect !== 'undefined' ){
			if( config.connect instanceof AudioDestinationNode ||
				config.connect instanceof AudioNode ) 
				this.analyser.connect( config.connect );
			else {
				throw new Error('BB.AudioAnalyser: connect property expecting an AudioNode');
			}
		} else {
			this.analyser.connect( this.ctx.destination );
		}

	};


	/**
	 * connects the Analyser to a particular AudioNode or AudioDestinationNode
	 * @method connect
	 * @param  {AudioNode} destination the AudioNode or AudioDestinationNode to connect to
	 * @param  {Number} output      which output of the the Sampler do you want to connect to the destination
	 * @param  {Number} input       which input of the destinatino you want to connect the Sampler to
	 * @example  
	 * <code class="code prettyprint">  
	 *  &nbsp;BB.Audio.init();<br>
	 *	<br>
	 *	&nbsp;var fft = new BB.AudioAnalyser();<br>
	 *	&nbsp;// connects AudioAnalyser to exampleNode <br>
	 *	&nbsp;//in additon to the default destination it's already connected to by default<br>
	 *	&nbsp;fft.connect( exampleNode ); 
	 *	<br>
	 * </code>
	 */
	BB.AudioAnalyser.prototype.connect = function( destination, output, input ){
		if( !(destination instanceof AudioDestinationNode || destination instanceof AudioNode) )
			throw new Error('AudioAnalyser.connect: destination should be an instanceof AudioDestinationNode or AudioNode');
		if( typeof output !== "undefined" && typeof output !== "number" )
			throw new Error('AudioAnalyser.connect: output should be a number');
		if( typeof intput !== "undefined" && typeof input !== "number" )
			throw new Error('AudioAnalyser.connect: input should be a number');

		if( typeof intput !== "undefined" ) this.analyser.connect( destination, output, input );
		else if( typeof output !== "undefined" ) this.analyser.connect( destination, output );
		else this.analyser.connect( destination );
	};

	/**
	 * diconnects the Analyser from the node it's connected to
	 * @method disconnect
	 * @param  {AudioNode} destination what it's connected to
	 * @param  {Number} output      the particular output number
	 * @param  {Number} input       the particular input number
	 * <code class="code prettyprint">  
	 *  &nbsp;BB.Audio.init();<br>
	 *	<br>
	 *	&nbsp;var fft = new BB.AudioAnalyser();<br>
	 *	&nbsp;// disconnects Analyser from default destination<br>
	 *	&nbsp;fft.disconnect();<br>
	 *	&nbsp;// connects AudioAnalyser to exampleNode <br>
	 *	&nbsp;fft.connect( exampleNode ); 
	 *	<br>
	 * </code>
	 */
	BB.AudioAnalyser.prototype.disconnect = function(destination, output, input ){
		if( typeof destination !== "undefined" &&
			!(destination instanceof AudioDestinationNode || destination instanceof AudioNode) )
			throw new Error('AudioAnalyser.disconnect: destination should be an instanceof AudioDestinationNode or AudioNode');
		if( typeof output !== "undefined" && typeof output !== "number" )
			throw new Error('AudioAnalyser.disconnect: output should be a number');
		if( typeof input !== "undefined" && typeof input !== "number" )
			throw new Error('AudioAnalyser.disconnect: input should be a number');

		if( typeof input !== "undefined" ) this.analyser.disconnect( destination, output, input );
		else if( typeof output !== "undefined" ) this.analyser.disconnect( destination, output );
		else if( typeof destination !== "undefined" ) this.analyser.disconnect( destination );
		else  this.analyser.disconnect();
	};


    /**
     * returns an array with frequency byte data
     * @method getByteFrequencyData
     *
	 * @example  
	 * <code class="code prettyprint">  
	 *  &nbsp;BB.Audio.init();<br>
	 *	<br>
	 *	&nbsp;var fft = new BB.AudioAnalyser();<br>
	 *	<br>
	 *	&nbsp;// then in a canvas draw loop...<br>
	 *	&nbsp;var fdata = fft.getByteFrequencyData();<br>
     *	&nbsp;for (var i = 0; i < fdata.length; i++) {<br>
     *	&nbsp;&nbsp;&nbsp;var value = fdata[i];<br>
 	 *	&nbsp;&nbsp;&nbsp;var percent = value / 256;<br>
	 *	&nbsp;&nbsp;&nbsp;var height = HEIGHT * percent;<br>
	 *	&nbsp;&nbsp;&nbsp;var offset = HEIGHT - height - 1;<br>
	 *	&nbsp;&nbsp;&nbsp;var barWidth = WIDTH/fdata.length;<br>
	 *	&nbsp;&nbsp;&nbsp;ctx.fillRect(i * barWidth, offset, barWidth, height);<br>
     *	&nbsp;};<br>
	 *	<br>
	 * </code>
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
     * 
	 * @example  
	 * <code class="code prettyprint">  
	 *  &nbsp;BB.Audio.init();<br>
	 *	<br>
	 *	&nbsp;var fft = new BB.AudioAnalyser();<br>
	 *	<br>
	 *	&nbsp;// then in a canvas draw loop...<br>
     *	&nbsp;var tdata = fft.getByteTimeDomainData();<br>
	 *	&nbsp;ctx.beginPath();<br>
	 *	&nbsp;var sliceWidth = WIDTH / tdata.length;<br>
	 *	&nbsp;var x = 0;<br>
     *	&nbsp;for (var i = 0; i < tdata.length; i++) {<br>
     *	&nbsp;&nbsp;&nbsp;var v = tdata[i] / 128.0;<br>
     *	&nbsp;&nbsp;&nbsp;var y = v * HEIGHT/2;		<br>
	 *	&nbsp;&nbsp;&nbsp;if(i===0) ctx.moveTo(x,y);<br>
	 *	&nbsp;&nbsp;&nbsp;else ctx.lineTo(x,y);		<br>
	 *	&nbsp;&nbsp;&nbsp;x+=sliceWidth;<br>
     *	&nbsp;}<br>
	 *	&nbsp;ctx.lineTo(WIDTH,HEIGHT/2);<br>
	 *	&nbsp;ctx.stroke();<br>
	 *	<br>
	 * </code>
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


    /**
     * returns the averaged amplitude between both channels
     * @method getAmplitude
     */
	BB.AudioAnalyser.prototype.getAmplitude = function(){
		var array = this.getByteFrequencyData();
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
	 * returns pitch frequence, based on <a href="https://github.com/cwilso/PitchDetect" target="_blank">Chris Wilson</a>
	 * @return {Number} pitch
     * @method detectPitch
	 * 
	 */
	BB.AudioAnalyser.prototype.detectPitch = function() {

		var SIZE = this.timeFloatData.length;
		var MAX_SAMPLES = Math.floor(SIZE/2);
		var MIN_SAMPLES = 0;  
		var best_offset = -1;
		var best_correlation = 0;
		var rms = 0;
		var foundGoodCorrelation = false;
		var correlations = new Array(MAX_SAMPLES);

		this.analyser.getFloatTimeDomainData( this.timeFloatData );

		for (var i=0;i<SIZE;i++) {
			var val = this.timeFloatData[i];
			rms += val*val;
		}
		rms = Math.sqrt(rms/SIZE);
		if (rms<0.01) // not enough signal
			return -1;

		var lastCorrelation=1;
		for (var offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
			var correlation = 0;

			for (var j=0; j<MAX_SAMPLES; j++) {
				correlation += Math.abs((this.timeFloatData[j])-(this.timeFloatData[j+offset]));
			}
			correlation = 1 - (correlation/MAX_SAMPLES);
			correlations[offset] = correlation; // store it, for the tweaking we need to do below.
			if ((correlation>0.9) && (correlation > lastCorrelation)) {
				foundGoodCorrelation = true;
				if (correlation > best_correlation) {
					best_correlation = correlation;
					best_offset = offset;
				}
			} else if (foundGoodCorrelation) {
				// short-circuit - we found a good correlation, then a bad one, so we'd just be seeing copies from here.
				// Now we need to tweak the offset - by interpolating between the values to the left and right of the
				// best offset, and shifting it a bit.  This is complex, and HACKY in this code (happy to take PRs!) -
				// we need to do a curve fit on correlations[] around best_offset in order to better determine precise
				// (anti-aliased) offset.

				// we know best_offset >=1, 
				// since foundGoodCorrelation cannot go to true until the second pass (offset=1), and 
				// we can't drop into this clause until the following pass (else if).
				var shift = (correlations[best_offset+1] - correlations[best_offset-1])/correlations[best_offset];  
				return this.ctx.sampleRate/(best_offset+(8*shift));
			}
			lastCorrelation = correlation;
		}
		if (best_correlation > 0.01) {
			return this.ctx.sampleRate/best_offset;
		}
		return -1;
	};


	return BB.AudioAnalyser;
});