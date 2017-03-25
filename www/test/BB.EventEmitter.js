/* jshint esversion: 6 */

// ----------------------- || ----------------------- || -----------------------
//							  Check for  Dependencies
let _mod_ = "EventEmitter";
// ----------------------- || ----------------------- || -----------------------
let _3rd_party_deps = ["THREE"]; // global obj ( window property ) names as str

// check to make sure 3rd party dependencies have been included
function _3rdPartyChecks( depsList ){
	depsList.forEach((lib)=>{
		if( typeof window[lib] == "undefined" )
			throw new Error(_mod_+" depends on the "+lib+" library which is missing");
	});
}

// check to make sure liBB dependencies have been included
if( typeof require !== "undefined" ){ // in liBB
	var BBValidArg = require('./BB.ValidArg');
} else { // used as a stand-alone module in <script>
	if (typeof ValidArg === 'function') var BBValidArg = ValidArg;
	else throw new Error(_mod_+" depends on BB.ValidArg.js which is missing");
	_3rdPartyChecks( _3rd_party_deps );
}

// ----------------------- || ----------------------- || -----------------------


/**
* description for this module goes here...
* @class BB.EventEmitter
*/
class EventEmitter {
	/**
	* @constructor
	* @example
	* <code class="code prettyprint"><br>
	* &nbsp;// use example goes here <br>
	* </code>
	*/
	constructor( n ){
		_3rdPartyChecks( _3rd_party_deps );

		let err = new BBValidArg(this);
		err.checkType(n,"string");

		this._name = n;
	}

	set name( n ){
	  this._name = n;
	}

	get name(){
	  return this._name;
	}

	/**
	* description for this method goes here...
	* @method m_name
	* @param {Number} val The value param description
	* @example
	* <code class="code prettyprint"><br>
	* &nbsp;// use example goes here <br>
	* </code>
	*/
	m_name( val ){ }
}

if( typeof module !== "undefined") module.exports = EventEmitter;
