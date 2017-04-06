/* jshint esversion: 6 */

/**
*  A module for checking different things about the envirnomnet. This includes detecting platform ( browser ) information as well as checking for 3rd Party libraries a module might be dependent on
* @class BB.Check
*/
class Check {
	/**
	 * returns the browser info as an object
	 * @static
	 * @method browserInfo
	 * @example
	 * <code class="code prettyprint">
	 * &nbsp;// ex: { name: "Firefox", version: "46" }<br>
	 * &nbsp;BB.Check.browserInfo();<br>
	 * </code>
	 */
	static browserInfo(){
		var ua= navigator.userAgent, tem,
		M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
		if(/trident/i.test(M[1])){
			tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
			return 'IE '+(tem[1] || '');
		}
		if(M[1]=== 'Chrome'){
			tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
			if(tem !== null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
		}
		M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
		if((tem= ua.match(/version\/(\d+)/i))!== null) M.splice(1, 1, tem[1]);
		return { 'name': M[0], 'version': M[1] };
	}

	/**
	 * returns boolean whether it is/isn't on mobile device
	 * @static
	 * @method isMobile
	 * @example
	 * <code class="code prettyprint">
	 * &nbsp;// ex: false <br>
	 * &nbsp;BB.Check.isMobile();<br>
	 * </code>
	 */
	static isMobile() {
		if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent)){
			return true;
		} else{
			return false;
		}
	}

	/**
	 * returns boolean whether it does/doesn't support webGL
	 * @static
	 * @method hasWebGL
	 * @example
	 * <code class="code prettyprint">
	 * &nbsp;// ex: true <br>
	 * &nbsp;BB.Check.hasWebGL();<br>
	 * </code>
	 */
	static hasWebGL(){
		return !! window.WebGLRenderingContext && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' );
	}

	/**
	 * returns an object with audio codec support info
	 * @static
	 * @method audioSupport
	 * @example
	 * <code class="code prettyprint">
	 * &nbsp;BB.Check.audioSupport();<br>
	 * &nbsp;// returns { <br>
	 * &nbsp;//&nbsp;&nbsp;&nbsp;mp3:"probably",  <br>
	 * &nbsp;//&nbsp;&nbsp;&nbsp;vorbis:"no",  <br>
	 * &nbsp;//&nbsp;&nbsp;&nbsp;wav:"maybe",  <br>
	 * &nbsp;//&nbsp;&nbsp;&nbsp;aac:"probably"  <br>
	 * &nbsp;// } <br>
	 * </code>
	 */
	static audioSupport(){
		let aObj = {
			mp3:'no', vorbis:'no', wav:'no', aac:'no'
		};
		let a = document.createElement('audio');
		if( typeof a.canPlayType == "function" ){
			aObj.mp3 = a.canPlayType('audio/mpeg;');
			if( aObj.mp3 === '' ) aObj.mp3 = 'no';
			aObj.vorbis = a.canPlayType('audio/ogg; codecs="vorbis"');
			if( aObj.vorbis === '' ) aObj.vorbis = 'no';
			aObj.wav = a.canPlayType('audio/wav; codecs="1"');
			if( aObj.wav === '' ) aObj.wav = 'no';
			aObj.aac = a.canPlayType('audio/mp4; codecs="mp4a.40.2"');
			if( aObj.aac === '' ) aObj.aac = 'no';
		}
		return aObj;
	}

	/**
	 * returns an object with video codec support info as well as whether or not there is support for posters and captions
	 * @static
	 * @method videoSupport
	 * @example
	 * <code class="code prettyprint">
	 * &nbsp;BB.Check.videoSupport();<br>
	 * &nbsp;// returns { <br>
	 * &nbsp;//&nbsp;&nbsp;&nbsp;webm:"probably",  <br>
	 * &nbsp;//&nbsp;&nbsp;&nbsp;h264:"no",  <br>
	 * &nbsp;//&nbsp;&nbsp;&nbsp;theora:"maybe",  <br>
	 * &nbsp;//&nbsp;&nbsp;&nbsp;captions:"probably"  <br>
	 * &nbsp;//&nbsp;&nbsp;&nbsp;poster:"probably"  <br>
	 * &nbsp;// } <br>
	 * </code>
	 */
	static videoSupport(){
		let vObj = {
			captions:'no', poster:'no',
			webm:'no', h264:'no', theora:'no'
		};
		let v = document.createElement('video');
		if( typeof v.canPlayType == "function" ){

			vObj.webm = v.canPlayType('video/webm; codecs="vp8, vorbis"');
			if( vObj.webm === '' ) vObj.webm = 'no';
			vObj.h264 = v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
			if( vObj.h264 === '' ) vObj.h264 = 'no';
			vObj.theora = v.canPlayType('video/ogg; codecs="theora"');
			if( vObj.theora === '' ) vObj.theora = 'no';

			vObj.poster = ('poster' in document.createElement('video')) ? 'probably' : 'no';
			vObj.captions = ('src' in document.createElement('track')) ? 'probably' : 'no';

		}
		return vObj;
	}

	/**
	* check that third party libraries have been included. If the module depends on any third party libraries ( ex: Three.js ) you should include the names of any global variables in that library as a string ( ex: "THREE" ) in the deps Array
	* @static
	* @method dependencies
	* @param {Array|String} deps the String ( or Array of Strings ) of any global objects you want to check for
	* @example
	* <code class="code prettyprint">
	* &nbsp;// will throw an error only if window.THREE is undefined<br>
	* &nbsp;BB.Check.dependencies('THREE');<br>
	* </code>
	*/
	static dependencies( deps ){

		if( typeof deps === "string"){
			if( typeof window[deps] == "undefined" )
				throw new Error("you are using a module that depends on the "+deps+" library which is missing");
		} else {
			if( !(deps instanceof Array) )
				throw new Error('Check.dependencies requires that you pass it a String or Array of Strings to check for');
			else {
				deps.forEach((lib)=>{
					if( typeof window[lib] == "undefined" )
						throw new Error("you are using a module that depends on the "+lib+" library which is missing");
				});
			}
		}
	}
}

// export { Check }; // see note in main.js file
if( typeof module !== "undefined") module.exports = Check;
