/**
 * A module for creating an internal BB Web Audio API AudioContext
 * @module BB.Audio
 */
define(['./BB'],
function(  BB){

    'use strict';
    
    /**
     * A module for creating an internal BB Web Audio API <a href="https://developer.mozilla.org/en-US/docs/Web/API/AudioContext" target="_blank">AudioContext</a>
     * @class BB.Audio
     * @constructor
     * @example  
     * <code class="code prettyprint">  
     * &nbsp;BB.Audio.init();<br>
     * &nbsp;// then ( if you need direct access ) call...<br>
     * &nbsp;BB.Audio.context;<br>
     * <br>
     * &nbsp;// or...<br>
     * &nbsp;BB.Audio.init(3)<br>
     * &nbsp;// then call...<br>
     * &nbsp;BB.Audio.context[0];<br>
     * &nbsp;BB.Audio.context[1];<br>
     * &nbsp;BB.Audio.context[2];<br>
     * </code>
     */

    BB.Audio = function(){

        /**
         * returns an <a href="https://developer.mozilla.org/en-US/docs/Web/API/AudioContext" target="_blank">AudioContext</a> ( or an array of AudioContexts ) for use in BB.Audio modules
         * @type {AudioContext}
         * @property context
         */
        this.context = undefined;
    };
    

    /**
     * initializes BB AudioContext(s)
     * @param  {Number} num number of contexts you want to create ( if more than 1 )
     * @method init
     */
    BB.Audio.init = function( num ){
        if(typeof num !== "undefined"){

            this.context = [];
            for (var i = 0; i < num; i++) {
                window.AudioContext = window.AudioContext||window.webkitAudioContext;
                this.context.push( new AudioContext() );
            }

        } else {

            window.AudioContext = window.AudioContext||window.webkitAudioContext;
            this.context = new AudioContext();
        
        }
    };

    /**
     * returns AudioContext's currentTime
     * @param  {Number} num index of context ( if more than one was initiated )
     * @method init
     */
    BB.Audio.getTime = function(num){
        if(this.context instanceof Array){
            if(typeof num === "undefined")
                throw new Error('BB.Audio: there is more than one context, specify the index of desired context: .getTime( 0 )');
            return this.context[num].currentTime;
        } else {
            return this.context.currentTime;
        }
    };

    return BB.Audio;
});