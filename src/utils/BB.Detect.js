/* jshint esversion: 6 */

/**
*  A module for detecting platform ( browser ) information
* @class BB.Detect
*/
class Detect {
	/**
	 * returns the browser info as an object
	 * @method browserInfo
	 * @example
	 * <code class="code prettyprint">
	 * &nbsp;// ex: { name: "Firefox", version: "46" }<br>
	 * &nbsp;BB.Detect.browserInfo<br>
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
	 * @method isMobile
	 * @example
	 * <code class="code prettyprint">
	 * &nbsp;// ex: false <br>
	 * &nbsp;BB.Detect.isMobile;<br>
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
	 * @method hasWebGL
	 * @example
	 * <code class="code prettyprint">
	 * &nbsp;// ex: true <br>
	 * &nbsp;BB.Detect.hasWebGL<br>
	 * </code>
	 */
	static hasWebGL(){
		return !! window.WebGLRenderingContext && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' );
	}
}

// export { Detect }; // see note in main.js file
if( typeof module !== "undefined") module.exports = Detect;
