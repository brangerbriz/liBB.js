/* jshint esversion: 6 */

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

 // -------------------------- Dependencies ----------
 // if( typeof require == "undefined" ){
 // 	throw new Error("BB.Math.js requires another module from liBB, use liBB.js instaed or... compiles custom ...");
 // } else {
 // 	var ValidArg = require('./BB.ValidArg');
 // }
var ValidArg = require('../utils/BB.ValidArg');

class Audio {

	constructor(){
		/**
		* returns an <a href="https://developer.mozilla.org/en-US/docs/Web/API/AudioContext" target="_blank">AudioContext</a> ( or an array of AudioContexts ) for use in BB.Audio modules
		* @type {AudioContext}
		* @property context
		*/
		this.context = undefined;
	}

	test( val ){
		var err = new ValidArg(this,[
			{ param:val, type:'string' }
		]);
	}

	/**
	 * initializes BB AudioContext(s)
	 * @param  {Number} num number of contexts you want to create ( if more than 1 )
	 * @method init
	 */
	static init( num ){


		var err = new ValidArg(this,[
			{ param:num, type:'number' }
		]);


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
	}

	/**
	 * returns AudioContext's currentTime
	 * @param  {Number} num index of context ( if more than one was initiated )
	 * @method getTime
	 */
	static getTime( num ){
		if(this.context instanceof Array){
			if(typeof num === "undefined")
				throw new Error('BB.Audio: there is more than one context, specify the index of desired context: .getTime( 0 )');
			return this.context[num].currentTime;
		} else {
			return this.context.currentTime;
		}
	}

}

if( typeof module !== "undefined") module.exports = Audio;
