/**
 * A module for creating audio effects, ex: filters, reverb, delay, distortion, etc...
 * @module BB.AudioFX
 */
define(['./BB', './BB.Audio', './BB.Detect' ],
function(  BB,        Audio,        Detect ) {

    'use strict';
 
    /**
     * A module for creating audio effects, ex: filters, reverb, delay, distortion, etc...
     * @class BB.AudioFX
     * @constructor
     *
     * @param {String} type the type of effect you want to create ( filter, reverb, delay, distortion, etc. ) 
     * @param {Object} config A config object to initialize the effect ( include examples for diff effects )
     *
     * @example  
     * <br>
     * <h2> when using 'filter' type </h2><br>
     * in the example bellow the drum sampler is connected to the AudioFX ( in this case a 'filter' ), and the AudioFX is connected to the default BB.Audio destination
     * <code class="code prettyprint">  
     *  &nbsp;BB.Audio.init();<br>
     *  <br>
     *  &nbsp;var filt = new BB.AudioFX('filter');<br>
     *  <br>
     *  &nbsp;var drum = new BB.AudioSampler({<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;connect: filt.node,<br>  
     *  &nbsp;&nbsp;&nbsp;&nbsp;kick: 'audio/kick.ogg',<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;snare: 'audio/snare.ogg'<br>
     *  &nbsp;});<br>
     * </code>
     * <br>
     * BB.AudioFX can also take an option config object. when using the 'filter' type, a config object can include the following:
     * <code class="code prettyprint">  
     *  &nbsp;var filt = new BB.AudioFX('filter',{<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;connect: fft.node,<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;type: "lowpass",<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;frequency: 880, <br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;Q: 8,<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;gain: 5,<br>
     *  &nbsp;});<br>
     * </code>
     * filter types include "lowpass" (default), "highpass", "bandpass", "lowshelf", "highshelf", "peaking", "notch" and "allpass"
     * check out the <a href="https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode" target="_blank">BiquadFilterNode</a> documenation for more details on filter types and the properties ( frequency, Q, gain)
     * <br>
     * view basic <a href="../../examples/editor/?file=audio-fx-filter" target="_blank">BB.AudioFX 'filter'</a> example
     */
    
    BB.AudioFX = function( type, config ) {
        
        // the AudioContext to be used by this module 
        if( typeof BB.Audio.context === "undefined" )
            throw new Error('BB Audio Modules require that you first create an AudioContext: BB.Audio.init()');
        
        if( BB.Audio.context instanceof Array ){
            if( typeof config === "undefined" || typeof config.context === "undefined" )
                throw new Error('BB.AudioFX: BB.Audio.context is an Array, specify which { context:BB.Audio.context[?] }');
            else {
                this.ctx = config.context;
            }
        } else {
            this.ctx = BB.Audio.context;
        }
        
        // config obj
        if(typeof config !== "undefined" && typeof config !== "object" ){
            throw new Error('BB.AudioFX: second parameter should be a config object');
        } else if( typeof config === "undefined" ) config = {};

        // type conditionals
        var types = ["filter", "reverb", "delay", "distortion"];
        if(typeof type !== "string" || types.indexOf(type) < 0){
            throw new Error('BB.AudioFX: first argument should be a type of effect ("filter", "reverb", "delay" or "distortion")');
        } else {

            this.type = type;

            // error checking for 'filter'
            var filtTypes = ["lowpass", "highpass", "bandpass", "lowshelf", "highshelf", "peaking", "notch", "allpass"];
            if( typeof config.type !== "undefined" && filtTypes.indexOf(config.type) < 0 ) throw new Error('BB.AudioFX: config.type must be either "lowpass", "highpass", "bandpass", "lowshelf", "highshelf", "peaking", "notch" or "allpass" ');
            if( typeof config.frequency !=="undefined" && typeof config.frequency !== "number" ) throw new Error('BB.AudioFX: config.frequency should be a number');
            if( typeof config.gain !=="undefined" && typeof config.gain !== "number" ) throw new Error('BB.AudioFX: config.gain should be a number');
            if( typeof config.Q !=="undefined" && typeof config.Q !== "number" ) throw new Error('BB.AudioFX: config.Q should be a number');


            if(type==="filter"){
                this.node = this.ctx.createBiquadFilter(); 
                this.node.type = (typeof config.type !== "undefined") ? config.type : "lowpass";
                this.node.frequency.value = (typeof config.frequency !== "undefined") ? config.frequency : 220;
                this.node.gain.value = (typeof config.gain !== "undefined") ? config.gain : 3;
                this.node.Q.value = (typeof config.Q !== "undefined") ? config.Q : 8;
            }

            else if(type==="reverb"){

            }

            else if(type==="delay"){

            }

            else if(type==="distortion"){

            }

        }


        // default destination is undefined
        // unless otherwise specified in { connect:AudioNode }
        if( typeof config !== "undefined" && typeof config.connect !== 'undefined' ){
            if( config.connect instanceof AudioDestinationNode ||
                config.connect instanceof AudioNode ) 
                this.node.connect( config.connect );
            else {
                throw new Error('BB.AudioFX: connect property expecting an AudioNode');
            }
        } else {
            this.node.connect( this.ctx.destination );
        }
    };


    /**
     * frequency value when type is <b>'filter'</b>
     * @property frequency 
     * @type Number
     */   
    Object.defineProperty(BB.AudioFX.prototype, "frequency", {
        get: function() {
            if(this.type!=="filter") throw new Error('BB.AudioFX: frequency value only availalbe when using "filter" effect');
            return this.node.frequency.value;
        },
        set: function(frequency) {
            if(this.type!=="filter") throw new Error('BB.AudioFX: frequency value only availalbe when using "filter" effect');
            this.node.frequency.value = frequency;
        }
    });
    /**
     * gain value when type is <b>'filter'</b>
     * @property gain 
     * @type Number
     */   
    Object.defineProperty(BB.AudioFX.prototype, "gain", {
        get: function() {
            if(this.type!=="filter") throw new Error('BB.AudioFX: gain value only availalbe when using "filter" effect');
            return this.node.gain.value;
        },
        set: function(gain) {
            if(this.type!=="filter") throw new Error('BB.AudioFX: gain value only availalbe when using "filter" effect');
            this.node.gain.value = gain;
        }
    });
    /**
     * Q value when type is <b>'filter'</b>
     * @property Q 
     * @type Number
     */   
    Object.defineProperty(BB.AudioFX.prototype, "Q", {
        get: function() {
            if(this.type!=="filter") throw new Error('BB.AudioFX: Q property only availalbe when using "filter" effect');
            return this.node.Q.value;
        },
        set: function(Q) {
            if(this.type!=="filter") throw new Error('BB.AudioFX: Q property only availalbe when using "filter" effect');
            this.node.Q.value = Q;
        }
    });

    /**
     * connects the Effect to a particular AudioNode or AudioDestinationNode
     * @method connect
     * @param  {AudioNode} destination the AudioNode or AudioDestinationNode to connect to
     * @param  {Number} output      which output of the the Sampler do you want to connect to the destination
     * @param  {Number} input       which input of the destinatino you want to connect the Sampler to
     * @example  
     * <code class="code prettyprint">  
     *  &nbsp;BB.Audio.init();<br>
     *  <br>
     *  &nbsp;var filt = new BB.AudioFX('filter');<br>
     *  &nbsp;// connects AudioFX to exampleNode <br>
     *  &nbsp;//in additon to the default destination it's already connected to by default<br>
     *  &nbsp;filt.connect( exampleNode ); 
     *  <br>
     * </code>
     */
    BB.AudioFX.prototype.connect = function( destination, output, input ){
        if( !(destination instanceof AudioDestinationNode || destination instanceof AudioNode) )
            throw new Error('AudioFX.connect: destination should be an instanceof AudioDestinationNode or AudioNode');
        if( typeof output !== "undefined" && typeof output !== "number" )
            throw new Error('AudioFX.connect: output should be a number');
        if( typeof intput !== "undefined" && typeof input !== "number" )
            throw new Error('AudioFX.connect: input should be a number');

        if( typeof intput !== "undefined" ) this.node.connect( destination, output, input );
        else if( typeof output !== "undefined" ) this.node.connect( destination, output );
        else this.node.connect( destination );
    };

    /**
     * diconnects the Effect from the node it's connected to
     * @method disconnect
     * @param  {AudioNode} destination what it's connected to
     * @param  {Number} output      the particular output number
     * @param  {Number} input       the particular input number
     * <code class="code prettyprint">  
     *  &nbsp;BB.Audio.init();<br>
     *  <br>
     *  &nbsp;var filt = new BB.AudioFX('filter');<br>
     *  &nbsp;// disconnects Effect from default destination<br>
     *  &nbsp;filt.disconnect();<br>
     *  &nbsp;// connects AudioFX to exampleNode <br>
     *  &nbsp;filt.connect( exampleNode ); 
     *  <br>
     * </code>
     */
    BB.AudioFX.prototype.disconnect = function(destination, output, input ){
        if( typeof destination !== "undefined" &&
            !(destination instanceof AudioDestinationNode || destination instanceof AudioNode) )
            throw new Error('AudioFX.disconnect: destination should be an instanceof AudioDestinationNode or AudioNode');
        if( typeof output !== "undefined" && typeof output !== "number" )
            throw new Error('AudioFX.disconnect: output should be a number');
        if( typeof input !== "undefined" && typeof input !== "number" )
            throw new Error('AudioFX.disconnect: input should be a number');

        if( typeof input !== "undefined" ) this.node.disconnect( destination, output, input );
        else if( typeof output !== "undefined" ) this.node.disconnect( destination, output );
        else if( typeof destination !== "undefined" ) this.node.disconnect( destination );
        else  this.node.disconnect();
    };


    /**
     * <b>"filter" type only</b>. <br>calculate the frequency response for a length-specified list of audible frequencies 
     * @method calcFrequencyResponse
     * @param  {Number} length       the length of the frequency/response arrays
     * <code class="code prettyprint">  
     * &nbsp;var freqRes = filt.calcFrequencyResponse( canvas.width ); <br>
     * <br>
     * &nbsp;// maths via: http://webaudioapi.com/samples/frequency-response/<br>
     * &nbsp;var dbScale = Math.round(canvas.height/4);<br>
     * &nbsp;var dbScale2 = Math.round(canvas.height/12.5);<br>
     * &nbsp;var pixelsPerDb = (0.5 * canvas.height) / dbScale;<br>
     * &nbsp;ctx.beginPath();<br>
     * &nbsp;for (var i = 0; i < canvas.width; ++i) {<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;var mr = freqRes.magResponse[i];<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;var dbResponse = dbScale2 * Math.log(mr) / Math.LN10;<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;var x = i;<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;var y = (0.5 * canvas.height) - pixelsPerDb * dbResponse;<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;if ( i == 0 )    ctx.moveTo( x, y );<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;else             ctx.lineTo( x, y );<br>
     * &nbsp;}<br>
     * &nbsp;ctx.stroke();   <br>
     * </code>
     * view basic <a href="../../examples/editor/?file=audio-fx-filter" target="_blank">BB.AudioFX 'filter'</a> example
     */
    BB.AudioFX.prototype.calcFrequencyResponse = function( length ){
        if(this.type!=="filter") throw new Error('BB.AudioFX: calcFrequencyResponse() only works with "filter" FX type');
        if(typeof length !== "number") throw new Error('BB.AudioFX: expecting a length (number) argument');
        // some of this maths via: http://webaudioapi.com/samples/frequency-response/
        var noctaves = 11;
        var frequencyHz = new Float32Array(length);
        var magResponse = new Float32Array(length);
        var phaseResponse = new Float32Array(length);
        var nyquist = 0.5 * this.ctx.sampleRate;
        for (var i = 0; i < length; ++i) {
            var f = i / length;
            // Convert to log frequency scale (octaves).
            f = nyquist * Math.pow(2.0, noctaves * (f - 1.0));
            frequencyHz[i] = f;
        }

        this.node.getFrequencyResponse( frequencyHz, magResponse, phaseResponse );

        var res = { frequency:frequencyHz, magResponse:magResponse, phaseResponse:phaseResponse };
        // // debug
        // for(var j = 0; j <= frequencyHz.length-1;j++){
        //     console.log('freq: ' + frequencyHz[j] + 'Hz, mag: ' + magResponse[j] + ', phase: ' + phaseResponse[j] + ' radians.');
        // }
        return res;
    };

    return BB.AudioFX;
});