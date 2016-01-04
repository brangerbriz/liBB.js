/**
 * A module for detecting platform ( browser ) information 
 * @module BB.Detect
 */
define(['./BB' ],
function(  BB ){

	'use strict';

	 /**
	 *  A module for detecting platform ( browser ) information 
	 * @class BB.Detect
	 * @constructor
	 */
    
	BB.Detect = function(){};


    /**
     * the browser info { name:'',version:'' }
     * @property browserInfo 
     * @type Object
     */   
    Object.defineProperty(BB.Detect, "browserInfo", {
        get: function() {
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
        },
        set: function(wave) {
            throw new Error('BB.Detect.browserInfo: is read only');
        }
    });

    /**
     * is/isn't on mobile device
     * @property browserInfo 
     * @type Boolean
     */   
    Object.defineProperty(BB.Detect, "isMobile", {
        get: function() {
			if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent)){
				return true;
			} else{
				return false;
			}
        },
        set: function(wave) {
            throw new Error('BB.Detect.browserInfo: is read only');
        }
    });	

    /**
     * does/doesn't support webGL
     * @property hasWebGL 
     * @type Boolean
     */   
    Object.defineProperty(BB.Detect, "hasWebGL", {
        get: function() {
        	return !! window.WebGLRenderingContext && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' );
        },
        set: function(wave) {
            throw new Error('BB.Detect.browserInfo: is read only');
        }
    });

	return BB.Detect;
});