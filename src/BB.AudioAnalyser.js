/**
 * A module for doing FFT ( Fast Fourier Transform ) analysis on audio 
 * @module BB.AudioAnalyser
 * @extends BB.AudioBase
 */
define(['./BB', './BB.AudioBase'],
function(  BB,		  AudioBase ){

	'use strict';

	 /**
	 *  A module for doing FFT ( Fast Fourier Transform ) analysis on audio 
	 * @class BB.AudioAnalyser
	 * @constructor
 	 * @extends BB.AudioBase
	 * 
	 * @param {Object} config A config object to initialize the Sampler, must contain a "context: AudioContext" 
	 * property and can contain properties for fftSize, smoothing, maxDecibels and minDecibels
	 * ( see <a href="https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode" target="_blank">AnalyserNode</a> for details )
	 * 
	 * @example  
	 * in the example bellow "samp" is assumed to be an instanceof <a href="BB.AudioSampler.html" target="_blank">BB.AudioSampler</a> ( represented by the Gain in the image below ), it's connected to the Analyser which is connected to the BB.Audio.context ( ie. AudioDestination ) by default
	 * <br> <img src="../assets/images/audioanalyser.png"/><br>
	 * <code class="code prettyprint">  
	 *  &nbsp;BB.Audio.init();<br>
	 *	<br>
	 *	&nbsp;var fft = new BB.AudioAnalyser(); <br>
	 *	&nbsp;// assuming samp is an instanceof BB.AudioSampler <br>
	 *	&nbsp;samp.connect( fft.node ); <br><br><br>
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
		
		BB.AudioBase.call(this, config);

		/**
		 * the <a href="https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode" target="_blank">AnalyserNode</a> itself
		 * @type {AnalyserNode}
		 * @property node
		 */
		this.node 		= this.ctx.createAnalyser();
		
		this.fftSize 		= ( typeof config!=="undefined" && typeof config.fftSize !== 'undefined' ) ? config.fftSize : 2048;
		this.smoothing 		= ( typeof config!=="undefined" && typeof config.smoothing !== 'undefined' ) ? config.smoothing : 0.8;
		this.maxDecibels	= ( typeof config!=="undefined" && typeof config.maxDecibels !== 'undefined' ) ? config.maxDecibels : -30;
		this.minDecibels	= ( typeof config!=="undefined" && typeof config.minDecibels !== 'undefined' ) ? config.minDecibels : -90;

		this.node.fftSize 					= this.fftSize;
		this.node.smoothingTimeConstant 	= this.smoothing;
		this.node.maxDecibels 				= this.maxDecibels;
		this.node.minDecibels 				= this.minDecibels;			


		this.freqByteData 	= new Uint8Array( this.node.frequencyBinCount );
		this.freqFloatData 	= new Float32Array(this.node.frequencyBinCount);
		this.timeByteData 	= new Uint8Array( this.node.frequencyBinCount );
		this.timeFloatData 	= new Float32Array(this.node.frequencyBinCount);

		this.node.connect( this.gain );

		if( this.fftSize%2 !== 0 || this.fftSize < 32 || this.fftSize > 2048)
			throw new Error('Analyser: fftSize must be a multiple of 2 between 32 and 2048');

	};

 	BB.AudioAnalyser.prototype = Object.create(BB.AudioBase.prototype);
    BB.AudioAnalyser.prototype.constructor = BB.AudioAnalyser;

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
		this.node.getByteFrequencyData( this.freqByteData );
		return this.freqByteData;
	};

    /**
     * returns an array with frequency float data
     * @method getFloatFrequencyData
     */
	BB.AudioAnalyser.prototype.getFloatFrequencyData = function(){
		this.node.getFloatFrequencyData( this.freqFloatData );
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
		this.node.getByteTimeDomainData( this.timeByteData );
		return this.timeByteData;
	};

    /**
     * returns an array with time domain float data
     * @method getFloatTimeDomainData
     */
	BB.AudioAnalyser.prototype.getFloatTimeDomainData = function(){
		this.node.getFloatTimeDomainData( this.timeFloatData );
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
	 * returns pitch frequency (float) in Hz, based on <a href="https://github.com/cwilso/PitchDetect" target="_blank">Chris Wilson</a>
	 * @return {Number} pitch
     * @method getPitch
	 * 
	 */
	BB.AudioAnalyser.prototype.getPitch = function() {

		var SIZE = this.timeFloatData.length;
		var MAX_SAMPLES = Math.floor(SIZE/2);
		var MIN_SAMPLES = 0;  
		var best_offset = -1;
		var best_correlation = 0;
		var rms = 0;
		var foundGoodCorrelation = false;
		var correlations = new Array(MAX_SAMPLES);

		this.node.getFloatTimeDomainData( this.timeFloatData );

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


 	/**
     * returns an multi-dimentional array ( one array per channel ) with resampled buffer data ( for drawing an entire waveform of a file )
     * @method getResampledBufferData
     * 
	 * @example  
	 * <code class="code prettyprint">  
	 *  &nbsp;BB.Audio.init();<br>
	 *	<br>
	 *	&nbsp;var fft = new BB.AudioAnalyser();<br>
	 *	<br>
	 *	&nbsp;// then in a canvas draw loop...<br>
     *	&nbsp;var tdata = fft.getResampledBufferData();<br>
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
    BB.AudioAnalyser.prototype._resampleBufferData = function( chnlData, length ){
    	// maths via: http://stackoverflow.com/a/22103150/1104148
    	/*
			chnlData is a Float32Array describing that channel       
			we 'resample' with cumul, count, variance
			Offset 0 : PositiveCumul  1: PositiveCount  2: PositiveVariance
			       3 : NegativeCumul  4: NegativeCount  5: NegativeVariance
			that makes 6 data per bucket
		*/
		var resampled = new Float64Array(length * 6 );
		var i=0, j=0, buckIndex = 0;
		var min=1000, max=-1000;
		var thisValue=0, res=0;
		var sampleCount = chnlData.length;
		// first pass for mean
		for (i=0; i<sampleCount; i++) {
			// in which bucket do we fall ?
			buckIndex = 0 | ( length * i / sampleCount );
			buckIndex *= 6;
			// positive or negative ?
			thisValue = chnlData[i];
			if (thisValue>0) {
				resampled[buckIndex    ] += thisValue;
				resampled[buckIndex + 1] +=1;
			} else if (thisValue<0) {
				resampled[buckIndex + 3] += thisValue;
				resampled[buckIndex + 4] +=1;                           
			}
			if (thisValue<min) min=thisValue;
			if (thisValue>max) max = thisValue;
		}
		// compute mean now
		for (i=0, j=0; i<length; i++, j+=6) {
			if (resampled[j+1] !== 0) {
				resampled[j] /= resampled[j+1]; 
			}
			if (resampled[j+4]!== 0) {
				resampled[j+3] /= resampled[j+4];
			}
		}
		// second pass for mean variation  ( variance is too low)
		for (i=0; i<chnlData.length; i++) {
			// in which bucket do we fall ?
			buckIndex = 0 | (length * i / chnlData.length );
			buckIndex *= 6;
			// positive or negative ?
			thisValue = chnlData[i];
			if (thisValue>0) {
				resampled[buckIndex + 2] += Math.abs( resampled[buckIndex] - thisValue );               
			} else  if (thisValue<0) {
				resampled[buckIndex + 5] += Math.abs( resampled[buckIndex + 3] - thisValue );                           
			}
		}
		// compute mean variation/variance now
		for (i=0, j=0; i<length; i++, j+=6) {
			if (resampled[j+1]) resampled[j+2] /= resampled[j+1];
			if (resampled[j+4]) resampled[j+5] /= resampled[j+4];
		}	
		return resampled;
    };
	BB.AudioAnalyser.prototype.getResampledBufferData = function( buffer, length ){
		if( !(buffer instanceof AudioBuffer) ) throw new Error("BB.AudioAnalyser.getResampledBufferData: first parameter expecing an AudioBuffer (object)");
		if( typeof length !=="number") throw new Error("BB.AudioAnalyser.getResampledBufferData: second parameter expecing number (length to resample to)");
		
		var data = [];
		for (var i = 0; i < buffer.numberOfChannels; i++) {
			var chnlData = this._resampleBufferData( buffer.getChannelData(i), length );
			data.push( chnlData );
		}
		return data;
	};

	return BB.AudioAnalyser;
});