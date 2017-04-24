// <a href="#" id="download">download a copy of the template</a>
// <script>document.querySelector("#download").onclick = function(){var cstr="";var code=document.querySelectorAll('.content');for(var i=0;i<code.length;i++){cstr+=code[i].textContent+"\n\n";}var d=document.createElement('a');d.setAttribute('href',"data:application/txt,"+encodeURIComponent(cstr));d.setAttribute('download',"BB.Template.js");document.body.appendChild(d);d.click();	}</script>

// tell the linter to accept es6 (ECMAScript 2015)
/* jshint esversion: 6 */

// class begins with <a href="http://usejsdoc.org/index.html" target="_blank">JSDoc</a> comment blocks

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
		// if your module depends on any 3rd party libraries make sure to check for them
		BB.Check.dependencies(['$','_','THREE','etc']); // example
		// here's an example of the constructor making use of another liBB module
		let err = new BB.ValidArg(this); // example
		err.checkType(n,"string");

		this._name = n;
	}

	// here's an example of getters and setters in es6

	/**
	* property description goes here...
	* @type {String}
	* @property name
	*/
	set name( n ){
		this._name = n;
	}

	get name(){
		return this._name;
	}

	// here's an example of a regular method

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

	// and here's an exmaple of a static method

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
// <b>module.exports</b> assumes this module/class is not being used in a browser, but rather will be compiled into liBB
module.exports = Template;





/* ~ * ~ liBB ~ * ~ */
