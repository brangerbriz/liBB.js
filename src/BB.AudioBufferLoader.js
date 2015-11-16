/**
 * A module for creating audio buffers from audio files
 * @module BB.AudioBufferLoader
 */
define(['./BB'],
function(  BB){

    'use strict';
    
    /**
     * A module for creating audio buffers from audio files
     * @class BB.AudioBufferLoader
     * @constructor
     * @param {Object} config A config object to initialize the buffer ( context:AudioContext, paths: Array of file paths, autoload:boolean)
     * @param {Function} [callback] A callback, with a buffer Object
     * @example  
     * <code class="code prettyprint">  
     * &nbsp;BB.Audio.init();<br>
     * <br>
     * &nbsp;// one way to do it<br>
     * &nbsp;var loader = new BB.AudioBufferLoader({<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;paths: ['audio/katy.ogg','audio/entro.ogg']<br>
     * &nbsp;}, function(buffers){<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;console.log('loaded:', buffers )<br>
     * &nbsp;});<br>
     * <br>
     * &nbsp;// another way to do it<br>
     * &nbsp;loader = new BB.AudioBufferLoader({ <br>
     * &nbsp;&nbsp;&nbsp;&nbsp;context:BB.Audio.context, <br>
     * &nbsp;&nbsp;&nbsp;&nbsp;paths:['katy.ogg','entro.ogg'], <br>
     * &nbsp;&nbsp;&nbsp;&nbsp;autoload:false <br>
     * &nbsp;});<br>
     * &nbsp;loader.load(); // call load later, ex under some other condition<br>
     * </code>
     *
     * view basic <a href="../../examples/editor/?file=audio-buffer" target="_blank">BB.AudioBufferLoader</a> example
     */


    BB.AudioBufferLoader = function( config, callback ){
        

        // the AudioContext to be used by this module 
        if( typeof BB.Audio.context === "undefined" )
            throw new Error('BB Audio Modules require that you first create an AudioContext: BB.Audio.init()');
        
        if( BB.Audio.context instanceof Array ){
            if( typeof config === "undefined" || typeof config.context === "undefined" )
                throw new Error('BB.AudioBufferLoader: BB.Audio.context is an Array, specify which { context:BB.Audio.context[?] }');
            else {
                this.ctx = config.context;
            }
        } else {
            this.ctx = BB.Audio.context;
        }

        /**
         * array of paths to audio files to load 
         * @type {Array}
         * @property urls
         */
        this.urls       = config.paths;

        // whether or not to autoload the files
        this.auto       = ( typeof config.autoload !== 'undefined' ) ? config.autoload : true;

        //callback to run after loading
        this.onload     = callback;
        
        // to know when to callback
        this._cnt       = 0; 

        /**
         * audio buffers array, accessible in callback
         * @type {Array}
         * @property buffers
         */
        this.buffers    = [];

        if( !config ) throw new Error('BB.AudioBufferLoader: requires a config object');

        if( !(this.ctx instanceof AudioContext) ) 
            throw new Error('BB.AudioBufferLoader: context should be an instance of AudioContext');
        
        if( !(this.urls instanceof Array) ) 
            throw new Error('BB.AudioBufferLoader: paths should be an Array of paths');
        
        if( typeof this.auto !== 'boolean' ) 
            throw new Error('BB.AudioBufferLoader: autoload should be either true or false');

        if( this.auto===true ) this.load();
    };

    /**
     * private function used by load() to load a buffer
     * @method loadbuffer
     * @param {String} path to audio file 
     * @param {Number} index of buffer 
     * @protected
     */
    BB.AudioBufferLoader.prototype.loadbuffer = function(url, index){
        var self = this;

        // create rootpath to get around bug ( which seems to have gone away? )
        // var fullpath = window.location.pathname;
        // var filename = fullpath.replace(/^.*[\\\/]/, '');
        // var rootpath = fullpath.substring(0,fullpath.length-filename.length);
        
        // http://www.html5rocks.com/en/tutorials/webaudio/intro/#toc-load  
        var req = new XMLHttpRequest();
            req.open('GET', url, true);
            req.responseType = 'arraybuffer';
            req.onload = function(){

                self.ctx.decodeAudioData( req.response, function(decodedData){ 
                    // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/decodeAudioData
                    if(!decodedData) throw new Error('BB.AudioBufferLoader: decodeAudioData: could not decode: ' + url );
                    
                    self.buffers[index] = decodedData;
                    
                    if( ++self._cnt == self.urls.length && typeof self.onload !=='undefined') 
                        self.onload( self.buffers ); // if callback do callback 
                
                },function(err){ throw new Error('BB.AudioBufferLoader: decodeAudioData:'+err);});
            };
            req.onerror = function(){ throw new Error('BB.AudioBufferLoader: XHMHttpRequest'); };
            req.send();
    };

    /**
     * creates buffers from url paths set in the constructor, automatically runs
     * in constructor unless autoload is set to false ( in the config )
     * @method load 
     */
    BB.AudioBufferLoader.prototype.load = function(){
        for (var i = 0; i < this.urls.length; i++) this.loadbuffer( this.urls[i], i );
    };   

    return BB.AudioBufferLoader;
});