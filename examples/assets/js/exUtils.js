function scriptLoader( paths, callback ){
	
	if( !(paths instanceof Array) ) throw new Error('scriptLoader: first argument should be an array of paths to the js files');

	var loaded = 0;
	var total = paths.length;
	
	for (var i = 0; i < paths.length; i++) {
		if( typeof paths[i] !== 'string' ) throw new Error('scriptLoader: first argument should be an array of paths (strings) to the js files');
		var script = document.createElement('script');
			script.setAttribute('src', paths[i]);
			document.body.appendChild(script);
			script.onload = function(){
				loaded++;
				if( loaded == total ) callback();
			}
	};
}