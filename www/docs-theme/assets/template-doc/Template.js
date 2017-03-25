// <a href="BB.Template.js" target="_blank">download a copy of the template</a>

// tell the linter to accept es6 (ECMAScript 2015)
/* jshint esversion: 6 */

// <h3>1. dependencies check </h3>

// the <b>_mod_</b> variable should be the name of this module as a string
let _mod_ = "Template";
// if the module depends on any third party libraries ( ex: Three.js ) you should include the names of any global variables in that library as a string ( ex: "THREE" ) in the <b>_3rd_party_deps</b> array
let _3rd_party_deps = [];

// this is a function for checking to make sure 3rd party dependencies have been included when necessary
function _3rdPartyChecks( depsList ){
  depsList.forEach((lib)=>{
    if( typeof window[lib] == "undefined" )
      throw new Error(_mod_+" depends on the "+lib+" library which is missing");
  });
}

// if there is a require object we assume that this file is being compiled into the liBB library and so we go ahead and load in any BB modules that this module depends on. <br><br> In this example we're using the BB.ValidArg module.
if( typeof require !== "undefined" ){

  var BBValidArg = require('./BB.ValidArg'); // example
  /*
   Notice that we don't call it BB.ValidArg, because BB doesn't exist until the entire library is compiled.
   Also notice that we don't call it ValidArg because that will throw a redeclaration error of the class being used as a stand-alone module
  */
// if there is no require object, we'll assume this module is being used on it's own in a browser <br><code> &lt;script src="BB.Template.js"&gt;&lt;/script&gt; </code>
} else {

  // check to make sure that any liBB dependencies have also been included via their own 'script' tags
  if (typeof ValidArg === 'function') var BBValidArg = ValidArg; // example
  else throw new Error(_mod_+" depends on BB.ValidArg.js which is missing");

  // lastly check for any 3rd party dependencies
  _3rdPartyChecks( _3rd_party_deps );
}



// <h3>2. the module class </h3>

// here is where the actual module class begins with <a href="http://usejsdoc.org/index.html" target="_blank">JSDoc</a> comment blocks

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
    // if your module depends on any 3rd party libraries make sure to include the check function in the constructor
    _3rdPartyChecks( _3rd_party_deps );
    // here's an example of the constructor making use of it's liBB dependency
    let err = new BBValidArg(this); // example
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
// we only want to <b>module.exports</b> if this is being compiled into liBB, otherwise we skip this step and the module behaves like any other JS class
if( typeof module !== "undefined") module.exports = Template;





/* ~ * ~ * ~ */
