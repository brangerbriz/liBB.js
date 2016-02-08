/**
 * A module for creating oscillating tones ( periodic wave forms ) along with music theory utilities
 * @module BB.AudioTone
 * @extends BB.AudioBase
 */
define(['./BB', './BB.AudioBase' ],
function(  BB,        AudioBase ) {

    'use strict';
    
 /**
     * A module for creating oscillating tones ( periodic wave forms ) along with music theory utilities
     * @class BB.AudioTone
     * @constructor
     * @extends BB.AudioBase
     * 
     * @param {Object} config A config object to initialize the Tone,
     * can contain the following:<br><br>
     * <code class="code prettyprint">
     * &nbsp;{<br>
     * &nbsp;&nbsp;&nbsp; context: BB.Audio.context[2], // choose specific context <br>
     * &nbsp;&nbsp;&nbsp; connect: fft, // overide default destination <br>
     * &nbsp;&nbsp;&nbsp; volume: 0.5, // technically master "gain" (expolential multiplier)<br>
     * &nbsp;&nbsp;&nbsp; type: "custom", // "sine", "square", "sawtooth", "triangle", "custom"<br>
     * &nbsp;&nbsp;&nbsp; wave: [ 0, 1, 0, 0.5, 0, 0.25, 0, 0.125 ] // only for "custom" type<Br>
     * &nbsp;}
     * </code>
     * <br>
     * see the <a href="../../examples/editor/?file=audio-waveshaper" target="_blank">waveshaper</a> for an example of how the wave property works. the "wave" property abstracts the WebAudio API's <a href="https://developer.mozilla.org/en-US/docs/Web/API/PeriodicWave" target="_blank">createPeriodicWave</a> method a bit. the Array passed above starts with 0 followed by the fundamental's amplitude value, followed by how ever many subsequent harmonics you choose. Alternatively, you can also pass an object with a "real" and "imag" (imaginary) Float32Array, for example:
     * <br><br>
     * <code class="code prettyprint">
     * &nbsp;{<br>
     * &nbsp;&nbsp;&nbsp; context: BB.Audio.context[2], // choose specific context <br>
     * &nbsp;&nbsp;&nbsp; type: "custom", <br>
     * &nbsp;&nbsp;&nbsp; wave: {<br>
     * &nbsp;&nbsp;&nbsp;&nbsp; imag: new Float32Array([0,1,0,0.5,0,0.25,0,0.125]),<br>
     * &nbsp;&nbsp;&nbsp;&nbsp; real: new Float32Array(8)<br>
     * &nbsp;&nbsp;&nbsp; }<br>
     * &nbsp;}
     * </code>     
     * <br> 
     * @example  
     * in the example below instantiating the BB.AudioTone creates a <a href="https://developer.mozilla.org/en-US/docs/Web/API/GainNode" target="_blank">GainNode</a> ( essentially the Tone's output ) connected to the default BB.Audio.context ( ie. AudioDestination )
     * <br> <img src="../assets/images/audiosampler1.png"/>
     * <br> everytime an individual tone is played, for example: <code> O.makeNote("C#")</code>, a corresponding <a href="https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode/type" target="_blank">OscillatorNode</a> with it's own GainNode is created and connected to the Tone's master GainNode ( the image below is an example of the graph when two notes are played )
     * <br> <img src="../assets/images/audiotone1.png"/> <br>
     * <code class="code prettyprint">  
     *  &nbsp;BB.Audio.init();<br>
     *  <br>
     *  &nbsp;var O = new BB.AudioTone({<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;volume: 0.75,<br>
     *  &nbsp;&nbsp;&nbsp;&nbsp;type: "square"<br>
     *  &nbsp;});<br>
     *  <br>
     *  &nbsp; O.makeNote( 440 );<br>
     *  &nbsp; O.makeNote( 880 );<br>
     * </code>
     *
     * view basic <a href="../../examples/editor/?file=audio-tone" target="_blank">BB.AudioTone</a> example
     */

    BB.AudioTone = function( config ) {

        BB.AudioBase.call(this, config);


        if( !config ) config = {}; // instead of below? ...bad practice?
        // if( !config ) throw new Error('BB.AudioTone: requires a config object');

         /**
         * the type of wave
         * @type {String}
         * @property type
         */
        this.type = null;
        this._wave = null;
        var oscTypes = [ "sine", "square", "sawtooth", "triangle", "custom" ];
        if( typeof config.type !== "undefined"){
            if( oscTypes.indexOf(config.type) < 0 ){
                throw new Error('BB.AudioTone: type should be either "sine", "square", "sawtooth", "triangle" or "custom ');                
            } else if( config.type === "custom" ){

                if( typeof config.wave !== "undefined" ){
                    if(config.wave instanceof Array){

                        this.type = config.type;
                        this._wave = config.wave;
                        var imag = new Float32Array( config.wave );  // sine
                        var real = new Float32Array( imag.length );  // cos
                        this.wavetable = this.ctx.createPeriodicWave( real, imag ); 
                    
                    } else if(config.wave instanceof Object){

                        if(typeof config.wave.real === "undefined" || typeof config.wave.imag === "undefined"){
                            throw new Error('BB.AudioTone: wave object should contain a "real" and an "imag" (Float32Array) properties');   
                        } else if( !(config.wave.real instanceof Float32Array) || !(config.wave.imag instanceof Float32Array) ) {
                            throw new Error('BB.AudioTone: real and imag properties should be an instanceof Float32Array'); 
                        } else {
                            this.type = config.type;
                            this._wave = config.wave;
                            this.wavetable = this.ctx.createPeriodicWave( config.wave.real, config.wave.imag );
                        }                   

                    } else {
                        throw new Error('BB.AudioTone: wave should be instanceof Object or instanceof Array');
                    }
                } else {
                    throw new Error('BB.AudioTone: additional wave property is required for "custom" type');
                }

            } else { this.type = config.type; }
        } else {
            this.type = "sine";
        }

        this.polynotes = {}; // keep track of current polysymphonic notes

        this.gainInterval = null; // for elegently adjusting global gain

        this.scales = {
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

        this.chords = {
            "maj" : [],     // major
            "min" : [],     // minor
            "dim" : [],     // diminished
            "7" : [],       // 7th
            "min7" : [],    // minor 7th
            "maj7" : [],    // major 7th
            "sus4" : [],
            "7sus4" : [],
            "6" : [],
            "min6" : [],
            "aug" : [],
            "7-5" : [],
            "7+5" : [],
            "min7-5" : [],
            "min/maj7" : [],
            "maj7+5" : [],
            "maj7-5" : [],
            "9" : [],
            "min9" : [],
            "maj9" : [],
            "7+9" : [],
            "7-9" : [],
            "7+9-5" : [],
            "6/9" : [],
            "9+5" : [],
            "9-5" : [],
            "min9-5" : [],
            "11" : [],
            "min11" : [],
            "11-9" : [],
            "13" : [],
            "min13" : [],
            "maj13" : [],
            "add9" : [],
            "minadd9" : [],
            "sus2" : [],
            "5" : []
        };
    };

    BB.AudioTone.prototype = Object.create(BB.AudioBase.prototype);
    BB.AudioTone.prototype.constructor = BB.AudioTone;

    /**
     * the wave Array/Object
     * @property wave 
     * @type Object
     * @default null
     */   
    Object.defineProperty(BB.AudioTone.prototype, "wave", {
        get: function() {
            return this._wave;
        },
        set: function(wave) {
            if( typeof wave !== "undefined" ){
                if(wave instanceof Array){

                    this.type = "custom";
                    this._wave = wave;
                    var imag = new Float32Array( wave );  // sine
                    var real = new Float32Array( imag.length );  // cos
                    this.wavetable = this.ctx.createPeriodicWave( real, imag ); 
                
                } else if(wave instanceof Object){

                    if(typeof wave.real === "undefined" || typeof wave.imag === "undefined"){
                        throw new Error('BB.AudioTone.wave: wave object should contain a "real" and an "imag" (Float32Array) properties');  
                    } else if( !(wave.real instanceof Float32Array) || !(wave.imag instanceof Float32Array) ) {
                        throw new Error('BB.AudioTone.wave: real and imag properties should be an instanceof Float32Array');    
                    } else {
                        this.type = "custom";
                        this._wave = wave;
                        this.wavetable = this.ctx.createPeriodicWave( wave.real, wave.imag );
                    }                   

                } else {
                    throw new Error('BB.AudioTone.wave: wave should be instanceof Object or instanceof Array');
                }
            } else {
                throw new Error('BB.AudioTone.wave: expecting a wave argument ( Array or Object )');
            }
        }
    });


    // ... public utils .... .... .... .... .... .... .... .... .... .... .... .... .... .... .... .... ....

    /**
     * utility method which takes a root frequency and a number of semitones and returns the frequency of the "note" the specified number of semitones away from the root frequency
     * @method freq
     * @param {Number} root the root frequency ( in Hz )
     * @param {Number} semitones the number of semitones away from the root you need to know the frequency of ( negative values are lower pitches then root, positive values are higher pitches )
     * @param {String} [tuning] the kind of temperment to base the transposition on ( eitehr "equal" for equatempered tuning or "just" for pure/harmoniic tuning )
     * @return {Number} a frequency value in Hz
     * @example  
     * <code class="code prettyprint">  
     *  &nbsp;BB.Audio.init();<br>
     *  <br>
     *  &nbsp;var O = new BB.AudioTone();<br>
     *  <br>
     *  &nbsp; O.makeNote( O.freq( 440, 5 ) ); // plays a D,587.33Hz ( 5 semitones up from A,440Hz ) 
     * </code>
     */
    BB.AudioTone.prototype.freq = function( root, n, temp ){
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
            if(typeof root !== "number") throw new Error('BB.AudioTone.freq: expecting a frequency in Hz');

            rnd = root * ratios[n%12];
            if(n>=12) rnd = rnd * (Math.floor(n/12)+1);         
            return Math.round(rnd*100)/100;
        }
        else if(temp === "equal") {
            if(typeof root !== "number") throw new Error('BB.AudioTone.freq: expecting a frequency in Hz');
            if(typeof n === "undefined") n = 0;
            // formula via: http://www.phy.mtu.edu/~suits/NoteFreqCalcs.html
            var tr2 = Math.pow(2, 1/12); // the twelth root of 2
            rnd = root * Math.pow(tr2,n);
            return Math.round(rnd*100)/100;
        } else {
            throw new Error('not a scale');
        }

    };

    /**
     * utility method which takes a root note (String) and a number of semitones and returns the frequency of the "note" the specified number of semitones away from the root note
     * @method note
     * @param {Number} root the root note ( "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B" where "A" is 440 )
     * @param {Number} octave the number of octaves away from the root you need to know the frequency of ( negative values are lower pitches then root, positive values are higher pitches )
     * @param {Number} [frequency] alternative "A" frequency ( overrides default of 440 )
     * @return {Number} a frequency value in Hz
     * @example  
     * <code class="code prettyprint">  
     *  &nbsp;BB.Audio.init();<br>
     *  <br>
     *  &nbsp;var O = new BB.AudioTone();<br>
     *  <br>
     *  &nbsp; O.makeNote( O.note( "A", 1 ) ); // plays an A,880Hz ( 1 octave up from A,440Hz ) 
     * </code>
     */
    BB.AudioTone.prototype.note = function( note, transpose, root ){
        var nStr = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        var idx = nStr.indexOf(note);
        if( idx < 0 ) throw new Error('BB.AudioTone.note: expecting "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#" or "B"');

        var RT = (typeof root !== "number" ) ? 440 : root;
        var oct = (typeof transpose !== "number") ? 0 : transpose;
        note = idx + ( (oct+5)*12);

        return RT * Math.pow(2,(note-69)/12);
    };

    



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
    BB.AudioTone.prototype.createScale = function( scale, root, temp ){
        if( !(scale in this.scales) ) {
            throw new Error("BB.AudioTone.createScale: '"+scale+"' is not a valid scale name, choose from: "+Object.keys(this.scales) );
        } else {

            var tuning = "equal";
            if(typeof temp !== "undefined"){
                if( temp === "equal" || temp === "just" ){
                    tuning = temp;
                } else {
                    throw new Error('BB.AudioTone.createScale: temperment should be either "just" or "equal"');         
                }
            }
                    

            if(typeof root === "string") root = this.note(root);
            else if(typeof root === "number") root = root;
            else throw new Error('BB.AudioTone.createScale: expecting a frequency (number) or a note ("A","A#",etc.) as second paramter');
            

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
                this.scales[scale].push( this.freq( root, incSteps[i], tuning ) );
            } 

            return this.scales[scale];         
        }
    };


    // ... private utils .... .... .... .... .... .... .... .... .... .... .... .... .... .... .... .... ....

    // OVERRIDE the BB.AudioBase._globalGainUpdate()
    // 
    BB.AudioTone.prototype._globalGainUpdate = function( gradually, fromNoteOff ){
        if(typeof gradually === "undefined") gradually = 0;
        

        if(fromNoteOff){
            if(typeof this.gainInterval!=="undefined"){ 
                clearInterval( this.gainInterval );
                this.gainInterval = undefined;
            }

            var self = this;
            this.gainInterval = setInterval(function(){

                var count = 0;
                var decs = [];
                for (var k in self.polynotes) {
                    if (self.polynotes[k].down) count++;
                    else decs.push( self.polynotes[k].gain.gain.value );
                }   
                if( decs.length > 0 ){                  
                    var sum = decs.reduce(function(a, b) { return a + b; }); // via : http://stackoverflow.com/a/10624256                   
                    var polylength = count + sum;
                    if(polylength<1) polylength = 1;
                    if(BB.Detect.browserInfo.name=="Firefox"){
                        self.gain.gain.setTargetAtTimePoly( self.volume/polylength, 0, 0 ); 
                    } else {
                        self.gain.gain.setTargetAtTime( self.volume/polylength, 0, 0 ); 
                    }
                } else {
                    clearInterval( self.gainInterval );
                    self.gainInterval = undefined;
                }               
            },1000/60);

        } else {

                var count = 0;
                for (var k in this.polynotes) {
                    if (this.polynotes[k].down) count++;
                }           
                var polylength = (count===0) ? 1 : count;
                // this.gain.gain.value = this._volume / polylength;
                if(BB.Detect.browserInfo.name=="Firefox"){
                    this.gain.gain.setTargetAtTimePoly( this._volume/polylength, 0, gradually);
                } else {
                    this.gain.gain.setTargetAtTime( this._volume/polylength, 0, this._sec2tc(gradually));
                }
        }
    };

    BB.AudioTone.prototype._addPolyNote = function( freq, oscNode, gainNode ){
        this.polynotes[freq] = { down:true, osc:oscNode, gain:gainNode };
        this._globalGainUpdate( 0.25 );
    };

    BB.AudioTone.prototype._removePolyNote = function( freq ){       
        if(typeof this.polynotes[freq]!=="undefined"){
            if(typeof this.polynotes[freq].timeout!=="undefined")
                clearTimeout( this.polynotes[freq].timeout );
            this.polynotes[freq].osc.stop(0);
            this.polynotes[freq].gain.disconnect();
            delete this.polynotes[freq];
            
            this._globalGainUpdate( 0.25 );
        } 
    };

    BB.AudioTone.prototype._returnSteps = function( type ){
        // via >> http://www.phy.mtu.edu/~suits/chords.html
        // && >> http://www.cs.cmu.edu/~scottd/chords_and_scales/music.html
        var steps;
             if(type=="maj")     steps = [4, 3];
        else if(type=="min")     steps = [3, 4];
        else if(type=="dim")     steps = [3, 3];
        else if(type=="7")       steps = [4, 3, 3];
        else if(type=="min7")    steps = [3, 4, 3 ];
        else if(type=="maj7")    steps = [4, 3, 4];
        else if(type=="sus4")    steps = [5, 2];
        else if(type=="7sus4")   steps = [5, 2, 3];
        else if(type=="6")       steps = [4, 3, 2];
        else if(type=="min6")    steps = [3, 4, 2];
        else if(type=="aug")     steps = [4, 4];
        else if(type=="7-5")     steps = [4, 2, 4];
        else if(type=="7+5")     steps = [4, 4, 2];
        else if(type=="min7-5")  steps = [3, 3, 4];
        else if(type=="min/maj7")steps = [3, 4, 4];
        else if(type=="maj7+5")  steps = [4, 4, 3];
        else if(type=="maj7-5")  steps = [4, 2, 5];
        else if(type=="9")       steps = [4, 3, 3, -8];
        else if(type=="min9")    steps = [3, 4, 3, -8];
        else if(type=="maj9")    steps = [4, 3, 4, -9];
        else if(type=="7+9")     steps = [4, 3, 3, -7];
        else if(type=="7-9")     steps = [4, 3, 3, -9];
        else if(type=="7+9-5")   steps = [4, 2, 4, -7];
        else if(type=="6/9")     steps = [4, 3, 2, -7];
        else if(type=="9+5")     steps = [4, 4, 2, -8];
        else if(type=="9-5")     steps = [4, 2, 4, -8];
        else if(type=="min9-5")  steps = [3, 3, 4, -8];
        else if(type=="11")      steps = [4, 3, 3, -8, 3];
        else if(type=="min11")   steps = [3, 4, 3, -8, 3];
        else if(type=="11-9")    steps = [4, 3, 3, -9, 4];
        else if(type=="13")      steps = [4, 3, 3, -8, 3, 4];
        else if(type=="min13")   steps = [3, 4, 3, -8, 3, 4];
        else if(type=="maj13")   steps = [4, 3, 4, -9, 3, 4];
        else if(type=="add9")    steps = [4, 3, -5];
        else if(type=="minadd9") steps = [3, 4, -5];
        else if(type=="sus2")    steps = [2, 5];
        else if(type=="5")       steps = [7];

        return steps;
    };

    // ... make sounds!!!! .... .... .... .... .... .... .... .... .... .... .... .... .... .... .... .... ....


    /**
     * starts playing a tone 
     * 
     * @method noteOn
     * @param {number} frequency a value in Hz of the frequency you want to play
     * @param {number} [velocity] the volume/gain relative to the master volume/gain of this particular note ( default 1 )
     * @param {number} [attack] the time it takes for the note to fade in ( in seconds, default 0.05 )
     * @param {number} [schedule] if you want to schedule the note for later ( rather than play immediately ), in seconds ( relative to BB.Audio.context.currentTime )
     *
     * @example  
     * <code class="code prettyprint">  
     *  &nbsp;BB.Audio.init();<br>
     *  <br>
     *  &nbsp;var O = new BB.AudioTone({ volume: 0.5 });<br>
     *  <br>
     *  &nbsp; O.ntoeOn( 440, 1, 0.5 ); // will stay on, until noteOff(440) is executed
     * </code>
     */
    BB.AudioTone.prototype.noteOn = function( freq, velocity, attack, schedule ){
        if(typeof freq === "undefined") throw new Error('need frequency');
        // if(attack == 0) attack = 0.1; // fix firefox bug

        if( typeof this.polynotes[freq] !== "undefined"  ){
            // console.log(this.polynotes[freq].gain.gain.value);
            if( this.polynotes[freq].gain.gain.value < 0.99 ){
                // note currently fading out
                this._removePolyNote( freq );
            } else {
                // already being pressed, so do nothing
                // console.warn('BB.AudioTone.noteOn: this note is already on'); // <<< MAKE A NOTE OF THIS
                return;
            }
        } 

        var gainNode = this.ctx.createGain();
            gainNode.connect( this.gain );
            gainNode.gain.value = 0.0;
            gainNode.gain.name = "note";
        var osc = this.ctx.createOscillator();
            osc.connect( gainNode );
            osc.frequency.value = freq;
            if(this.type === "custom"){
                osc.setPeriodicWave( this.wavetable );
            } else {
                osc.type = this.type;
            }
            
        this._addPolyNote( freq, osc, gainNode );

        var now = (typeof schedule !== "undefined") ? schedule : this.ctx.currentTime;
        var vel = (typeof velocity !== "undefined") ? velocity : 1.0;
        var ack = (typeof attack !== "undefined" ) ? attack : 0.05;
        osc.start(now); 
        
        // this._fadePolyFill( gainNode.gain, vel, now, ack );
        if(BB.Detect.browserInfo.name=="Firefox"){
            gainNode.gain.setTargetAtTimePoly( vel, 0, ack); // maybe edit back to "now" instead of 0
        } else {
            gainNode.gain.setTargetAtTime( vel, 0, this._sec2tc(ack)); // maybe edit back to "now" instead of 0
        }

    };

    BB.AudioTone.prototype.chordOn = function( config ){ 
        var nStr = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

        if(typeof config !== "object") throw new Error('BB.AudioTone.chordOn: expecting config object');

        var root;
        if(typeof config.frequency === "number") root = config.frequency;
        else if(typeof config.frequency === "string" && nStr.indexOf(config.frequency) >= 0) root = this.note(config.frequency);
        else throw new Error('BB.AudioTone.chordOn: frequency paramter should either be a number or a note string ("A","A#", etc.)');

        var vel  = (typeof config.velocity !== "undefined")     ? config.velocity : 1;
        var ack  = (typeof config.attack !== "undefined")       ? config.attack : 0;
        var typ  = (typeof config.type !== "undefined")         ? config.type : "maj";
        var tun  = (typeof config.tuning !== "undefined")       ? config.tuning : "equal";
        var sch  = (typeof config.schedule !== "undefined")     ? config.schedule : 0;

        var steps = this._returnSteps( typ );
        var incSteps = [0];         

        for (var s = 1; s < steps.length+1; s++) {
            var inc = 0;
            for (var j = 0; j < s; j++) inc += steps[j];
            incSteps.push( inc );
        }

        for (var i = 0; i < incSteps.length; i++) {
            this.noteOn( O.freq(root, incSteps[i], tun), vel, ack, sch );                    
        }

    };



    /**
     * stops playing a tone
     * 
     * @method noteOff
     * @param {number} frequency a value in Hz of the note you want to stop playing
     * @param {number} [release] the time it takes for the note to fade out ( in seconds, default 0 )
     *
     * @example  
     * <code class="code prettyprint">  
     *  &nbsp;BB.Audio.init();<br>
     *  <br>
     *  &nbsp;var O = new BB.AudioTone({ volume: 0.5 });<br>
     *  <br>
     *  &nbsp; O.noteOn( 440, 1, 0.5 ); <br>
     *  &nbsp; setTimeout(function(){ O.noteOff(440); },1000);
     *  </code>
     */
    BB.AudioTone.prototype.noteOff = function( freq, release ){
        if(typeof freq === "undefined") throw new Error('need frequency');

        if(typeof this.polynotes[freq] !== "undefined"){
            this.polynotes[freq].down = false;

            var self= this;
            var now = this.ctx.currentTime;
            var dec = (typeof release !== "undefined") ? release : 0;
            // var decSec = (dec/20.0); // best guess of dec to seconds, also tried /10.0 ( dec should be 0 - 100 )
            // var release = now + decSec;  
            release = now + dec;
            
            this.polynotes[freq].gain.gain.cancelScheduledValues( now );
            if(BB.Detect.browserInfo.name=="Firefox"){
                this.polynotes[freq].gain.gain.setTargetAtTimePoly( 0.0, 0, dec); // maybe edit back to "now" instead of 0
            } else {
                this.polynotes[freq].gain.gain.setTargetAtTime( 0.0, 0, this._sec2tc(dec)); // maybe edit back to "now" instead of 0                
            }
            // this._fadePolyFill( this.polynotes[freq].gain.gain, 0.0, now, dec );
            this.polynotes[freq].osc.stop( release );           
            this._globalGainUpdate( this._sec2tc(dec), true );
            
            if(typeof this.polynotes[freq].timeout !== "undefined" )
                clearTimeout( this.polynotes[freq].timeout );
            this.polynotes[freq].timeout = setTimeout(function(){
                self._removePolyNote( freq );
            },dec*1000);
        }
    };

    

    BB.AudioTone.prototype.chordOff = function( config ){
        var nStr = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

        if(typeof config !== "object") throw new Error('BB.AudioTone.chordOff: expecting config object');

        var root;
        if(typeof config.frequency === "number") root = config.frequency;
        else if(typeof config.frequency === "string" && nStr.indexOf(config.frequency) >= 0) root = this.note(config.frequency);
        else throw new Error('BB.AudioTone.chordOff: frequency paramter should either be a number or a note string ("A","A#", etc.)');

        if(typeof config.type !== "string") throw new Error('BB.AudioTone.chordOff: expecting a type property (chord) as a string');

        var dec  = (typeof config.release !== "undefined")      ? config.release : 0;
        var tun  = (typeof config.tuning !== "undefined")       ? config.tuning : "equal";
        var typ  = config.type;

        var steps = this._returnSteps( typ );
        var incSteps = [0];         

        for (var s = 1; s < steps.length+1; s++) {
            var inc = 0;
            for (var j = 0; j < s; j++) inc += steps[j];
            incSteps.push( inc );
        }

        for (var i = 0; i < incSteps.length; i++) {
            this.noteOff( O.freq(root, incSteps[i], tun), dec );                    
        }

    };


    /**
     * plays (starts and stops) a tone 
     * @method makeNote
     * @param {object} config the first value can either be a config object or a note ( in either Hz or string format )
     * @param {Number} velocity the gain value ( relative to the Tone's master valume ) of this particular note
     * @param {Number} sustain the amount of time ( in seconds ) to sustain ( play ) the note
     *
     * @example  
     * <code class="code prettyprint">  
     *  &nbsp;BB.Audio.init();<br>
     *  <br>
     *  &nbsp;var O = new BB.AudioTone({ volume: 0.5 });<br>
     *  <br>
     *  &nbsp; O.makeNote("A"); // plays a 440 Hz sine wave<br>
     *  &nbsp; O.makeNote( 444, 0.5, 3 ); // plays a 444 Hz sine wave at half volume for three seconds<br>
     *  &nbsp; O.makeNote({<br>
     *  &nbsp;&nbsp;&nbsp; frequency: 220,<br>
     *  &nbsp;&nbsp;&nbsp; velocity: 0.75, // 75% of 0.5 ( ie. O's master gain )<br>
     *  &nbsp;&nbsp;&nbsp; attack: 1, // fade in for 1 second<br>
     *  &nbsp;&nbsp;&nbsp; sustain: 2, // hold note for 2 more seconds<br>
     *  &nbsp;&nbsp;&nbsp; release: 2, // fade out for 2 more seconds<br>
     *  &nbsp;&nbsp;&nbsp; schedule: BB.Audio.context.currentTime + 5, // play 5 seconds from now<br>
     *  &nbsp; });<br>
     * </code>
     */
    BB.AudioTone.prototype.makeNote = function( config, velocity, sustain ){

        var nStr = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        if( !config ) config = {};// instead of below? ...bad practice?
        
        var freq, vel, dur, ack, dec, sch;
        if ( typeof config === "object" ){
            if(typeof config.frequency !== "undefined"){
                freq = (typeof config.frequency === "number") ? config.frequency : this.note(config.frequency);
            } else { freq = 440; }           
            vel  = (typeof config.velocity !== "undefined")     ? config.velocity : 1;
            ack  = (typeof config.attack !== "undefined")       ? config.attack : 0;
            dec  = (typeof config.release !== "undefined")      ? config.release : 0;
            dur  = (typeof config.sustain !== "undefined")      ? config.sustain*1000 : 250;
            sch  = (typeof config.schedule !== "undefined")     ? config.schedule : 0;
        }
        else if( typeof config === "number" || typeof config === "string" && nStr.indexOf(config) >= 0  ){
            if(typeof config === "number")  freq = config;
            else                            freq = this.note(config);               
            vel  = (typeof velocity === "number") ? velocity : 1;
            dur  = (typeof sustain === "number") ? sustain*1000 : 250;
            ack  = 0;
            dec  = 0;
            sch  = 0;
            if(typeof velocity !=="undefined" && typeof velocity !== "number")
                throw new Error('BB.AudioTone.makeNote: velocity (second param) should be a number');
            if(typeof sustain !=="undefined" && typeof sustain !== "number")
                throw new Error('BB.AudioTone.makeNote: sustain (third param) should be a number');
        } 
        else {
            throw new Error('BB.AudioTone.makeNote: first argument should either be a config object or a frequency (number) or a note, "A", "A#", etc.');
        }

        if( typeof this.polynotes[freq] !== "undefined")
            if(typeof this.polynotes[freq].durTimeout !== "undefined")
                clearTimeout( this.polynotes[freq].durTimeout ); 

        this.noteOn( freq, vel, ack, true, sch );

        var self = this;
        this.polynotes[freq].durTimeout = setTimeout(function(){
            self.noteOff(freq, dec);
        }, dur );

    };

    /**
     * plays (starts and stops) a chord ( based on "just" or "equal" temperments ) from any of the following chord types: maj, 
     * min,  dim,  7,  min7,  maj7,  sus4, 7sus4, 6, min6, aug, 7-5, 7+5, min7-5, min/maj7, maj7+5, 
     * maj7-5, 9, min9, maj9, 7+9, 7-9, 7+9-5, 6/9, 9+5, 9-5, min9-5, 11, min11, 11-9, 13, min13, 
     * maj13, add9, minadd9, sus2, 5,
     * 
     * @method makeChord
     * @param {object} config object with any of the optional properties listed in the example below
     *
     * @example  
     * <code class="code prettyprint">  
     *  &nbsp;BB.Audio.init();<br>
     *  <br>
     *  &nbsp;var O = new BB.AudioTone({ volume: 0.5 });<br>
     *  <br>
     *  &nbsp; O.makeChord({<br>
     *  &nbsp;&nbsp;&nbsp; frequency: 220,<br>
     *  &nbsp;&nbsp;&nbsp; type: "min7", // plays a minor 7th chord<br>
     *  &nbsp;&nbsp;&nbsp; tuning: "just", // ...based on "just" (pure/harmonic) tuning rather the default eqaul tempered tuning<br>
     *  &nbsp;&nbsp;&nbsp; velocity: 0.75, // 75% of 0.5 ( ie. O's master gain )<br>
     *  &nbsp;&nbsp;&nbsp; attack: 1, // fade in for 1 second<br>
     *  &nbsp;&nbsp;&nbsp; sustain: 2, // hold note for 2 more seconds<br>
     *  &nbsp;&nbsp;&nbsp; release: 2, // fade out for 2 more seconds<br>
     *  &nbsp;&nbsp;&nbsp; schedule: BB.Audio.context.currentTime + 5, // play 5 seconds from now<br>
     *  &nbsp; });<br>
     * </code>
     */
    BB.AudioTone.prototype.makeChord = function( config ){  
        var nStr = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

        if(typeof config !=="object") throw new Error('BB.AudioTone.makeChord: expecting a config object');
        
        var root;
        if(typeof config.frequency === "number") root = config.frequency;
        else if(typeof config.frequency === "string" && nStr.indexOf(config.frequency) >= 0) root = this.note(config.frequency);
        else throw new Error('BB.AudioTone.makeChord: frequency should either be a number or a note("A","A#",etc.)');
        
        var vel  = (typeof config.velocity !== "undefined")     ? config.velocity : 1;
        var ack  = (typeof config.attack !== "undefined")       ? config.attack : 0;
        var dec  = (typeof config.release !== "undefined")      ? config.release : 0;
        var dur  = (typeof config.sustain !== "undefined")      ? config.sustain : 0.25;
        var typ  = (typeof config.type !== "undefined")         ? config.type : "maj";
        var tun  = (typeof config.tuning !== "undefined")       ? config.tuning : "equal";
        var sche  = (typeof config.schedule !== "undefined")    ? config.schedule : 0;

        var steps = this._returnSteps( typ );
        var incSteps = [0];         
        
        for (var s = 1; s < steps.length+1; s++) {
            var inc = 0;
            for (var j = 0; j < s; j++) inc += steps[j];
            incSteps.push( inc );
        }

        for (var i = 0; i < incSteps.length; i++) {                        
            this.makeNote({
                frequency: O.freq(root, incSteps[i], tun),
                velocity: vel,
                attack: ack,
                release: dec,
                sustain: dur,
                schedule: sch
            });
        }
    };

    return BB.AudioTone;
});