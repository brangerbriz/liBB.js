/**
 * A module for creating filter, reverb and delay effects ( abstracts the WebAudio API BiquadFilterNode, ConvolverNode and DelayNode ), for more advanced audio effects see the <a href="BB.AFX.html" target="_blank">BB.AFX</a> base Audio Effects module
 * @module BB.AudioFX
 * @extends BB.AudioBase
 */
define(['./BB', './BB.AudioBase', './BB.AudioBufferLoader'],
function(  BB,        AudioBase,        AudioBufferLoader ) {

    'use strict';
    
    BB.AudioBufferLoader = AudioBufferLoader;

    /**
     * A module for creating filter, reverb and delay effects ( abstracts the WebAudio API BiquadFilterNode, ConvolverNode and DelayNode ), for more advanced audio effects see the <a href="BB.AFX.html" target="_blank">BB.AFX</a> base Audio Effects module
     * @class BB.AudioFX
     * @constructor
     * @extends BB.AudioBase
     * 
     * @param {String} type the type of effect you want to create ( filter, reverb and delay) 
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
     *  &nbsp;&nbsp;&nbsp;&nbsp;connect: filt,<br>  
     *  &nbsp;&nbsp;&nbsp;&nbsp;kick: 'audio/kick.ogg',<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;snare: 'audio/snare.ogg'<br>
     *  &nbsp;});<br>
     * </code>
     * <br>
     * BB.AudioFX can also take an option config object. when using the 'filter' type, a config object can include the following:
     * <code class="code prettyprint">  
     *  &nbsp;var filt = new BB.AudioFX('filter',{<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;connect: fft,<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;type: "lowpass",<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;frequency: 880, <br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;Q: 8,<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;fgain: 5,<br>
     *  &nbsp;});<br>
     * </code>
     * filter types include "lowpass" (default), "highpass", "bandpass", "lowshelf", "highshelf", "peaking", "notch" and "allpass"
     * check out the <a href="https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode" target="_blank">BiquadFilterNode</a> documenation for more details on filter types and the properties ( frequency, Q, gain)
     * <br>
     * view basic <a href="../../examples/editor/?file=audio-fx-filter" target="_blank">BB.AudioFX 'filter'</a> example
     * <br>
     * <br>
     * <br>
     * <br>
     * <h2> when using 'reverb' type </h2><br>
     * the AudioFX ( 'reverb' ), can be used just like the 'filter' example above. there's two ways to create "reverb" FX, either algorithmically ( default ) or by pasing it paths to impulse file[s] ( see <a href="https://en.wikipedia.org/wiki/Convolution_reverb" target="_blank">conolution reverb</a> on wikipedia) 
     * <code class="code prettyprint">  
     *  &nbsp;// algorithmically calculate convolution's impulse buffer<br>
     *  &nbsp;var reverb = new BB.AudioFX('reverb');<br>
     *  <br>
     *  &nbsp;// customize algorithmically generated impulse buffer<br>
     *  &nbsp;var reverb = new BB.AudioFX('reverb',{<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;duration: 2,<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;decay: 4.3,<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;reverse:true<br>
     *  });<br>
     *  <br>
     *  &nbsp;// generate convolution buffer from impulse file<br>
     *  &nbsp;var reverb = new BB.AudioFX('reverb',{<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;paths: ['audio/impulse.wav']<br>
     *  });<br>
     * </code>
     * check out the <a href="https://developer.mozilla.org/en-US/docs/Web/API/ConvolverNode" target="_blank">ConvolutionNode</a> documenation for more info
     * <br>
     * view basic <a href="../../examples/editor/?file=audio-fx-reverb" target="_blank">BB.AudioFX 'reverb'</a> example
     * <br>
     * <br>
     * <br>
     * <br>
     * <h2> when using 'delay' type </h2><br>
     * the AudioFX ( 'delay' ), can be used just like the 'filter' example above. 
     * <code class="code prettyprint">  
     *  &nbsp;var delay = new BB.AudioFX('delay');<br>
     *  <br>
     *  &nbsp;// with optional config <br>
     *  &nbsp;var delay = new BB.AudioFX('delay',{<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;max: 5, // max delay time <br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;time: 1 // current delay time <br>
     *  });<br>
     *  <br>
     *  &nbsp;// modify delay time afterwards<br>
     *  &nbsp;delay.time = 3.2; <br>
     * </code>
     * check out the <a href="https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createDelay" target="_blank">DelayNode</a> documenation for more info
     * <br>
     * view basic <a href="../../examples/editor/?file=audio-fx-delay" target="_blank">BB.AudioFX 'delay'</a> example
     */
    
    BB.AudioFX = function( type, config ) {
        
        BB.AudioBase.call(this, config);
        
        // config obj
        if(typeof config !== "undefined" && typeof config !== "object" ){
            throw new Error('BB.AudioFX: second parameter should be a config object');
        } else if( typeof config === "undefined" ) config = {};

        // type conditionals
        var types = ["filter", "reverb", "delay"];
        if(typeof type !== "string" || types.indexOf(type) < 0){
            throw new Error('BB.AudioFX: first argument should be a type of effect ("filter", "reverb" or "delay")');
        } else {

            this.type = type;

            if(type==="filter"){
                // error checking for 'filter'
                var filtTypes = ["lowpass", "highpass", "bandpass", "lowshelf", "highshelf", "peaking", "notch", "allpass"];
                if( typeof config.type !== "undefined" && filtTypes.indexOf(config.type) < 0 ) throw new Error('BB.AudioFX: config.type must be either "lowpass", "highpass", "bandpass", "lowshelf", "highshelf", "peaking", "notch" or "allpass" ');
                if( typeof config.frequency !=="undefined" && typeof config.frequency !== "number" ) throw new Error('BB.AudioFX: config.frequency should be a number');
                if( typeof config.fgain !=="undefined" && typeof config.fgain !== "number" ) throw new Error('BB.AudioFX: config.fgain should be a number');
                if( typeof config.Q !=="undefined" && typeof config.Q !== "number" ) throw new Error('BB.AudioFX: config.Q should be a number');

                this.node = this.ctx.createBiquadFilter(); 
                this.node.type = (typeof config.type !== "undefined") ? config.type : "lowpass";
                this.node.frequency.value = (typeof config.frequency !== "undefined") ? config.frequency : 220;
                this.node.gain.value = (typeof config.fgain !== "undefined") ? config.fgain : 3;
                this.node.Q.value = (typeof config.Q !== "undefined") ? config.Q : 8;
            }

            else if(type==="reverb"){
                this.node = this.ctx.createConvolver();
                this.impulse = { buffers: null };

                if( typeof config.paths !== "undefined"){
                    var self = this;                    
                    var loader = new BB.AudioBufferLoader({
                        paths: config.paths
                    }, function(buffers){
                        self.impulse.buffers = buffers;
                        self.node.buffer = self.impulse.buffers[0];
                    });

                } else {
                    var duration, decay, reverse;

                    if(typeof config.duration !== "undefined" ){
                        if(typeof config.duration !== "number") throw new Error('BB.AudioFX: reverb config.duration should be a number');
                        else duration = config.duration;
                    } else { duration = 1;  }
                    
                    if(typeof config.decay !== "undefined" ){
                        if(typeof config.decay !== "number") throw new Error('BB.AudioFX: reverb config.decay should be a number');
                        else decay = config.decay;
                    } else { decay = 2.0;  }
                    
                    if(typeof config.reverse !== "undefined" ){
                        if(typeof config.reverse !== "boolean") throw new Error('BB.AudioFX: reverb config.reverse should be a boolean');
                        else reverse = config.reverse;
                    } else { reverse = false;  }

                    this.node.buffer = this._impulseResponse( duration, decay, reverse );

                } 

            }

            else if(type==="delay"){
                this._max = null;
                this._time = null;

                if(typeof config.max !== 'undefined'){
                    if(typeof config.max !== 'number') throw new Error('BB.AudioFX: config.max should be a number in seconds');
                    else this._max = config.max;
                } else { this._max = 1; }

                this.node = this.ctx.createDelay( this._max );
                
                if( typeof config.time !== "undefined" ){
                    if(typeof config.time !== "number") throw new Error('BB.AudioFX: delay.time should be a number in seconds, up to max');
                    else this._time = config.time;
                } else { this._time = 1; }
                    
                this.node.delayTime.value = this._time;
            }   

        }

        // ................... FX loop ..............................
        //  for bypassing fx // dry + wet channels
        
        this.input = this.ctx.createGain();  // input  :: receives connection
                                             // output :: this.gain ( form AudioBase );
        
        this._wet = new BB.AudioBase({ connect: this.gain });
        this._dry = new BB.AudioBase({ connect: this.gain });
        this._dry.volume = 0;

        // input > dry > output 
        this.input.connect( this._dry.gain ); 
        
        // input > fx > wet > output
        this.input.connect( this.node ); 
        this.node.connect( this._wet.gain );

    };

    BB.AudioFX.prototype = Object.create(BB.AudioBase.prototype);
    BB.AudioFX.prototype.constructor = BB.AudioFX;

   
    /**
     * the dry channel gain/volume
     * @property dry 
     * @type Number
     * @default 0
     */   
    Object.defineProperty(BB.AudioFX.prototype, "dry", {
        get: function() {
            return this._dry.volume;
        },
        set: function(v) {
            if( typeof v !== 'number'){
                throw new Error("BB.AudioFX.dry: expecing a number");
            } else {
                this._dry.setGain( v );
                var diff = 1 - v;
                this._wet.setGain( diff );
            }
        }
    }); 

    /**
     * the wet channel gain/volume
     * @property wet 
     * @type Number
     * @default 1
     */   
    Object.defineProperty(BB.AudioFX.prototype, "wet", {
        get: function() {
            return this._wet.volume;
        },
        set: function(v) {
            if( typeof v !== 'number'){
                throw new Error("BB.AudioFX.wet: expecing a number");
            } else {
                this._wet.setGain( v );
                var diff = 1 - v;
                this._dry.setGain( diff );
            }
        }
    }); 

    /**
     * set's the dry gain ( && adjust the wet gain accordingly, so that they total to 1 )
     * @method setDryGain
     * @param {Number} num a float value, 1 being the default volume, below 1 decreses the volume, above one pushes the gain
     * @param {Number} ramp value in seconds for how quickly/slowly to ramp to the new value (num) specified
     *
     * @example  
     * <code class="code prettyprint">  
     *  &nbsp;BB.Audio.init();<br>
     *  <br>
     *  &nbsp;var fx = new BB.AudioFX('filter');<br>
     *  &nbsp;var noise = new BB.AudioNoise({<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;connect: fx<br>
     *  &nbsp;});<br>
     *  <br>
     *  &nbsp; fx.setDryGain( 0.75, 2 ); // raises dry level from 0 - 0.75 over 2 seconds (wet level drops to 0.25)<br>
     *  // if no ramp value is needed, you could alternatively do<br>
     *  &nbsp; fx.dry.volume = 0.75; // immediately jumps to 0.75 (and wet to 0.25) <br>
     * </code>
     */
    BB.AudioFX.prototype.setDryGain = function( num, gradually ) {
        if( typeof num !== "number" )
            throw new Error('BB.AudioFX.setDryGain: first argument expecting a number');
        
        this._dry._volume = num;
        var diff = 1 - num;
        this._wet._volume = diff;

        if(typeof gradually !== "undefined"){
            if( typeof num !== "number" )
                throw new Error('BB.AudioFX.setDryGain: second argument expecting a number');
            else {
                this._dry._globalGainUpdate( gradually );
                this._wet._globalGainUpdate( gradually );
            }
        }
        else { this._dry._globalGainUpdate(0); this._wet._globalGainUpdate(0); }
    };

    /**
     * set's the wet gain ( && adjust the dry gain accordingly, so that they total to 1 )
     * @method setWetGain
     * @param {Number} num a float value, 1 being the default volume, below 1 decreses the volume, above one pushes the gain
     * @param {Number} ramp value in seconds for how quickly/slowly to ramp to the new value (num) specified
     *
     * @example  
     * <code class="code prettyprint">  
     *  &nbsp;BB.Audio.init();<br>
     *  <br>
     *  &nbsp;var fx = new BB.AudioFX('filter');<br>
     *  &nbsp;var noise = new BB.AudioNoise({<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;connect: fx<br>
     *  &nbsp;});<br>
     *  <br>
     *  &nbsp; fx.setWetGain( 0.15, 2 ); // drops wet level from 1 - 0.15 over 2 seconds (dry level rises to 0.85)<br>
     *  // if no ramp value is needed, you could alternatively do<br>
     *  &nbsp; fx.wet.volume = 0.15; // immediately jumps to 0.15 (and dry to 0.85) <br>
     * </code>
     */
    BB.AudioFX.prototype.setWetGain = function( num, gradually ) {
        if( typeof num !== "number" )
            throw new Error('BB.AudioFX.setWetGain: first argument expecting a number');
        
        this._wet._volume = num;
        var diff = 1 - num;
        this._dry._volume = diff;

        if(typeof gradually !== "undefined"){
            if( typeof num !== "number" )
                throw new Error('BB.AudioFX.setWetGain: second argument expecting a number');
            else {
                this._wet._globalGainUpdate( gradually );
                this._dry._globalGainUpdate( gradually );
            }
        }
        else { this._wet._globalGainUpdate(0); this._dry._globalGainUpdate(0); }
    };



    /*
     * ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'` ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'` (=^.^=) -{ 'filter' stuffs }
     * ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'` ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`
     * ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'` ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`
     * ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'` ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`
     * ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'` ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`
     */

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
     * fgain value when type is <b>'filter'</b>
     * @property fgain 
     * @type Number
     */   
    Object.defineProperty(BB.AudioFX.prototype, "fgain", {
        get: function() {
            if(this.type!=="filter") throw new Error('BB.AudioFX: fgain value only availalbe when using "filter" effect');
            return this.node.gain.value;
        },
        set: function(fgain) {
            if(this.type!=="filter") throw new Error('BB.AudioFX: fgain value only availalbe when using "filter" effect');
            this.node.gain.value = fgain;
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
     * <b>"filter" type only</b>. <br>calculate the frequency response for a length-specified list of audible frequencies ( can be used to draw a curve representing the filter )
     * @method calcFrequencyResponse
     * @param  {Number} length       the length of the frequency/response arrays
     * <code class="code prettyprint">  
     * &nbsp;var freqRes = filt.calcFrequencyResponse( canvas.width ); <br>
     * <br><br><br>
     * &nbsp;// maths via: http://webaudioapi.com/samples/frequency-response/<br>
     * &nbsp;var dbScale = Math.round(canvas.height/4);<br>
     * &nbsp;var dbScale2 = Math.round(canvas.height/12.5);<br>
     * &nbsp;var pixelsPerDb = (0.5 \* canvas.height) / dbScale;<br>
     * &nbsp;ctx.beginPath();<br>
     * &nbsp;for (var i = 0; i < canvas.width; ++i) {<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;var mr = freqRes.magResponse[i];<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;var dbResponse = dbScale2 \* Math.log(mr) / Math.LN10;<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;var x = i;<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;var y = (0.5 \* canvas.height) - pixelsPerDb \* dbResponse;<br>
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


    /*
     * ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'` ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'` (=^.^=) -{ 'reverb' stuffs }
     * ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'` ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`
     * ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'` ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`
     * ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'` ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`
     * ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'` ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`
     */
    
    /**
     * <b>"reverb" type only</b>. <br> when using impulse files, you can use this method to switch between the different files initially loaded in the 'paths' when the AudioFX 'reverb' was instantiated 
     * @method useImpuse
     * @param  {Number} index of impulse.buffers to be used
     * <code class="code prettyprint">  
     *  &nbsp;var reverb = new BB.AudioFX('reverb',{<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;paths:[<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'audio/giant_hall.wav',<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'audio/small_room.wav',<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'audio/telephone.wav'<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;]<br>
     *  });<br>
     *  <br>
     *  &nbsp;// by default 'audio/giant_hall.wav' (or reverb.impulse.buffers[0]) is used<br>
     *  &nbsp;// below we switch to small_room.wav (or reverb.impulse.buffers[1])<br>
     *  &nbsp;reverb.useImpulse(1);
     * </code>
     * view basic <a href="../../examples/editor/?file=audio-fx-reverb" target="_blank">BB.AudioFX 'reverb'</a> example
     */
    BB.AudioFX.prototype.useImpulse = function( num ) {
        if( !isNaN(num) && num.toString().indexOf('.') === -1){
            if( num >= this.impulse.buffers.length ) 
                throw new Error('BB.AudioFX.useImpulse: the value cannot be larger than '+(this.impulse.buffers.length-1)+', the length of impulse.buffers');
            else this.node.buffer = this.impulse.buffers[num];
        } else {
            throw new Error("BB.AudioFX.useImpulse: expecting an integer");
        }
    };
    
    BB.AudioFX.prototype._impulseResponse = function( duration, decay, reverse ) {
        // via :: http://stackoverflow.com/a/34482734
        var sampleRate = this.ctx.sampleRate;
        var length = sampleRate * duration;
        var impulse = this.ctx.createBuffer(2, length, sampleRate); // maybe expose channel number? so it's not always 2 by default
        var impulseL = impulse.getChannelData(0);
        var impulseR = impulse.getChannelData(1);

        for (var i = 0; i < length; i++){
          var n = reverse ? length - i : i;
          impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
          impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
        }
        return impulse;
    };

    /*
     * ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'` ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'` (=^.^=) -{ 'delay' stuffs }
     * ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'` ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`
     * ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'` ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`
     * ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'` ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`
     * ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'` ~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`~-._.-~`'`
     */
    
    /**
     * the <b>delay</b> time (up to max specified)
     * @property time 
     * @type Number
     * @default 0
     */   
    Object.defineProperty(BB.AudioFX.prototype, "time", {
        get: function() {
            return this._time;
        },
        set: function(v) {
            if( typeof v !== 'number'){
                throw new Error("BB.AudioFX.time: expecing a number in seconds (up to max value)");
            } else {
                this._time = v;
                this.node.delayTime.value = this._time;
            }
        }
    }); 

    return BB.AudioFX;
});