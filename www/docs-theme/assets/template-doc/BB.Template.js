/*
!!!!!!!!!!!!!!!!!!!!!!!!!!!  INTRODUCTION  !!!!!!!!!!!!!!!!!!!!!!!!!!!!
any changes to this template should be documented in Template.js
Template.js is used to create the documentation page for this template
assuming you have docco installed globablly ( sudo npm install -g docco )
regenerate the documentation page after making changes like so:
	docco -c templateDoc.css Template.js
make sure you run that from: liBB/www/docs-theme/assets/template-doc/
!!!!!!!!!!! DELETE THIS COMMENT BEFORE USING THIS TEMPLATE  !!!!!!!!!!!
*/


/* jshint esversion: 6 */

let _mod_ = "Template";
let _3rd_party_deps = [];

function _3rdPartyChecks( depsList ){
	depsList.forEach((lib)=>{
		if( typeof window[lib] == "undefined" )
			throw new Error(_mod_+" depends on the "+lib+" library which is missing");
	});
}
if( typeof require !== "undefined" ){
	/*
	 Notice that we don't call it BB.ValidArg, because BB doesn't exist until the entire library is compiled.
	 Also notice that we don't call it ValidArg because that will throw a redeclaration error of the class being used as a stand-alone module
	*/
  	var BBValidArg = require('./BB.ValidArg'); // example

} else {

  if (typeof ValidArg === 'function') var BBValidArg = ValidArg; // example
  else throw new Error(_mod_+" depends on BB.ValidArg.js which is missing");

  _3rdPartyChecks( _3rd_party_deps );
}


/**
* description for this module goes here...
* @class BB.Template
* @constructor
* @example
* <code class="code prettyprint"><br>
* &nbsp;// use example goes here <br>
* </code>
*/
class Template {

	constructor( n ){
		_3rdPartyChecks( _3rd_party_deps );

		let err = new BBValidArg(this); // example dependency
		err.checkType(n,"string");

		this._name = n;
	}

	/**
	* setter description goes here...
	* @param {String} n the value of the property
	* @returns {String}
	*/
	set name( n ){
		this._name = n;
	}

	/**
	* getter description goes here...
	* @returns {String}
	*/
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

	/**
	* description for this static method goes here...
	* @static
	* @method m_name
	* @param {Number} val The value param description
	* @example
	* <code class="code prettyprint"><br>
	* &nbsp;// use example goes here <br>
	* </code>
	*/
	static s_name( val ){ }
}

if( typeof module !== "undefined") module.exports = Template;
