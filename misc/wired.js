
// _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.    Create the Canvas   _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.
// _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.
// _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.


var canvas = document.createElement('canvas'); 		// create canvas element
	canvas.width = window.innerWidth;				// set the width to match the window's width
	canvas.height = window.innerHeight;				// set the height to match the window's height
	canvas.style.position = "absolute";				// position the canvas in a specific spot
	canvas.style.top = "0px";						// ...specifically 0 px from the top of the screen
	canvas.style.left = "0px";						// ...and 0 px from the left of the screen
document.body.appendChild(canvas);				

var ctx = canvas.getContext('2d');					// create the context ( ctx ) object for us to draw to
var context = ctx;									// some people prefer to write "context" instead of "ctx"

var WIDTH = window.innerWidth; 						// set the WIDTH variable to match the window's width
var HEIGHT = window.innerHeight; 					// set the HEIGHT variable to match the window's height

var PI = Math.PI;									// alias for PI

// in case someone resizes the window...

window.onresize = function(){
	WIDTH = canvas.width = window.innerWidth;		// set the WIDTH variable and the canvas.width to match the width of the window
	HEIGHT = canvas.height = window.innerHeight;	// set the Height variable and the canvas.height to match the height of the window
}

document.body.setAttribute( "oncontextmenu", "return false"); // avoid right mouse click menu

// _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.     Mouse Stuff        _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.
// _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.
// _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.

// variables && events to track the mouse activity

var mouseX = mouseY = 0;
var mouseDown = false;
var leftMouseDown = false;
var middleMouseDown = false;
var rightMouseDown = false;

document.onmousemove = function(e){
	mouseX = e.clientX;				// set the mouseX variable equal to the current mouse's x position
	mouseY = e.clientY;				// set the mouseY variable equal to the current mouse's y position
}

document.onmousedown = function(e){
	mouseDown = true;				// when we press the mouse down change the mouseDown variable to true
	switch (e.which) {
        case 1: leftMouseDown = true; break;
        case 2: middleMouseDown = true; break;
        case 3: rightMouseDown = true; break;
    }
    if(e.which==2) prevent
}

document.onmouseup= function(e){
	mouseDown = false;				// when the mouse button is not pressed change the mouseDown variable to false
	switch (e.which) {
        case 1: leftMouseDown = false; break;
        case 2: middleMouseDown = false; break;
        case 3: rightMouseDown = false; break;
    }
}


// _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.   the ruler guides     _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.
// _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.
// _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.


var horizontal = document.createElement('div');
var hlines = Math.floor(window.innerWidth/100);
for (var i = 0; i < hlines; i++) {
	var div = document.createElement('span');
		div.innerHTML =  i * 100;
		div.style.display = "inline-block";
		div.style.padding = "0";
		div.style.borderLeft = "1px solid black"
		div.style.paddingLeft = "5px";
		div.style.width = 100 - 6 + "px";
		div.style.margin = "0";
	horizontal.appendChild( div );
};
horizontal.style.position = "absolute";
horizontal.style.top = "0px";
horizontal.style.left = "0px";
horizontal.style.fontSize = "7px";
horizontal.style.display = "none";
document.body.appendChild(horizontal);

var vertical = document.createElement('div');
var vlines = Math.floor(window.innerHeight/100);
for (var i = 0; i < vlines; i++) {
	var div = document.createElement('div');
		div.innerHTML =  i * 100;
		div.style.padding = "0";
		div.style.margin = "0";
		div.style.height = 100 - 6 + "px";
		div.style.borderTop = "1px solid black"
		div.style.paddingTop = "5px";
	vertical.appendChild( div );
};
vertical.style.position = "absolute";
vertical.style.top = "0px";
vertical.style.left = "0px";
vertical.style.fontSize = "7px";
vertical.style.display = "none";
document.body.appendChild(vertical);



function showRuler( val ){
	var value = (val) ? "block" : "none";
	horizontal.style.display = value;
	vertical.style.display = value;
	showingRuler = val;
}
var showingRuler;
showRuler( true );						// this function shows the ruler, if set to "false" the project will have no ruler
										// ...regardless of whether or not you press "R"


// bellow is the function to show / hide ruler

document.onkeydown=function(event){				
	
	var key = (event.keyCode ? event.keyCode : event.which); // get the number of the key that was pressed
    
    if(key==82 && showingRuler){ 								// if that key is 82 ( which is the number for the "R" key )
    															// && if we've decided to show the ruler
    	var display = horizontal.style.display;					// check if we're showing the ruler
		if(display=="block"){									// if we are ...
			vertical.style.display = "none";					// ...hide the vertical ruler
			horizontal.style.display = "none";					// ...hide the horizontal ruler
		} else {												// if not...
			vertical.style.display = "block";					// show the vertical ruler
			horizontal.style.display = "block";					// show the horizontal ruler
		}	
    }	    

    console.log( key );
}

// _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*   UTILS  _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.
// _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.
// _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.



	function randomColor( alpha ){
		var r = Math.floor( Math.random()*255 );
		var g = Math.floor( Math.random()*255 );
		var b = Math.floor( Math.random()*255 );
		var a = (alpha) ? alpha : 1;
		return "rgba("+r+","+g+","+b+","+a+")";
	}


	Math.norm = function(value, min, max) {
		return (value - min) / (max - min);
	};

	Math.lerp = function(norm, min, max) {
		return (max - min) * norm + min;
	};

	Math.map = function(value, sourceMin, sourceMax, destMin, destMax) {
		return Math.lerp(Math.norm(value, sourceMin, sourceMax), destMin, destMax);
	};

	Math.clamp = function(value, min, max) {
		return Math.min(Math.max(value, Math.min(min, max)), Math.max(min, max));
	};

	Math.limit = function(value, min, max) { // semantic redundancy ( same as clamp )
		return Math.min(Math.max(value, Math.min(min, max)), Math.max(min, max));
	};

	Math.distance = function(p0, p1) {
		var dx = p1.x - p0.x,
			dy = p1.y - p0.y;
		return Math.sqrt(dx * dx + dy * dy);
	};

	Math.distanceXY = function(x0, y0, x1, y1) {
		var dx = x1 - x0,
			dy = y1 - y0;
		return Math.sqrt(dx * dx + dy * dy);
	};

	Math.circleCollision = function(c0, c1) {
		return Math.distance(c0, c1) <= c0.radius + c1.radius;
	};

	Math.circlePointCollision = function(x, y, circle) {
		return Math.distanceXY(x, y, circle.x, circle.y) < circle.radius;
	};

	Math.pointInRect = function(x, y, rect) {
		return Math.inRange(x, rect.x, rect.x + rect.width) &&
		       Math.inRange(y, rect.y, rect.y + rect.height);
	};

	Math.inRange = function(value, min, max) {
		return value >= Math.min(min, max) && value <= Math.max(min, max);
	};

	Math.rangeIntersect = function(min0, max0, min1, max1) {
		return Math.max(min0, max0) >= Math.min(min1, max1) && 
			   Math.min(min0, max0) <= Math.max(min1, max1);
	};

	Math.rectIntersect = function(r0, r1) {
		return Math.rangeIntersect(r0.x, r0.x + r0.width, r1.x, r1.x + r1.width) &&
			   Math.rangeIntersect(r0.y, r0.y + r0.height, r1.y, r1.y + r1.height);
	};
	
	Math.polyIntersect = function(polyVerts, point) {
        var j = polyVerts.length - 1,
            oddNodes = false,
            polyY = [], polyX = [],
            x = point[0],
            y = point[1];

        for (var s = 0; s < polyVerts.length; s++) {
            polyX.push(poly[s][0]);
            polyY.push(poly[s][1]);
        };
        for (var i = 0; i < polyVerts.length; i++) {
            if ((polyY[i]< y && polyY[j]>=y
            ||   polyY[j]< y && polyY[i]>=y)
            &&  (polyX[i]<=x || polyX[j]<=x)) {
              oddNodes^=(polyX[i]+(y-polyY[i])/(polyY[j]-polyY[i])*(polyX[j]-polyX[i])<x); 
            }
            j=i;
        }
        return oddNodes;
    };
    
	Math.degreesToRads = function(degrees) {
		return degrees / 180 * Math.PI;
	};

	Math.radsToDegrees = function(radians) {
		return radians * 180 / Math.PI;
	};

	Math.randomRange = function(min, max) {
		return min + Math.random() * (max - min);
	};

	Math.randomInt = function(min, max) {
		return Math.floor(min + Math.random() * (max - min + 1));
	};

// _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.  PERLIN NOISE  _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.
// _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.
// _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.

	// Ported from Stefan Gustavson's java implementation
	// http://staffwww.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf
	// Read Stefan's excellent paper for details on how this code works.
	//
	// Sean McCullough banksean@gmail.com
	 
	/**
	 * You can pass in a random number generator object if you like.
	 * It is assumed to have a random() method.
	 */
	var SimplexNoise = function(r) {
		if (r == undefined) r = Math;
	  this.grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0], 
	                                 [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1], 
	                                 [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]]; 
	  this.p = [];
	  for (var i=0; i<256; i++) {
		  this.p[i] = Math.floor(r.random()*256);
	  }
	  // To remove the need for index wrapping, double the permutation table length 
	  this.perm = []; 
	  for(var i=0; i<512; i++) {
			this.perm[i]=this.p[i & 255];
		} 
	 
	  // A lookup table to traverse the simplex around a given point in 4D. 
	  // Details can be found where this table is used, in the 4D noise method. 
	  this.simplex = [ 
	    [0,1,2,3],[0,1,3,2],[0,0,0,0],[0,2,3,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,3,0], 
	    [0,2,1,3],[0,0,0,0],[0,3,1,2],[0,3,2,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,3,2,0], 
	    [0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0], 
	    [1,2,0,3],[0,0,0,0],[1,3,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,3,0,1],[2,3,1,0], 
	    [1,0,2,3],[1,0,3,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,3,1],[0,0,0,0],[2,1,3,0], 
	    [0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0], 
	    [2,0,1,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,0,1,2],[3,0,2,1],[0,0,0,0],[3,1,2,0], 
	    [2,1,0,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,1,0,2],[0,0,0,0],[3,2,0,1],[3,2,1,0]]; 
	};
	 
	SimplexNoise.prototype.dot = function(g, x, y) { 
		return g[0]*x + g[1]*y;
	};
	 
	SimplexNoise.prototype.noise = function(xin, yin) { 
	  var n0, n1, n2; // Noise contributions from the three corners 
	  // Skew the input space to determine which simplex cell we're in 
	  var F2 = 0.5*(Math.sqrt(3.0)-1.0); 
	  var s = (xin+yin)*F2; // Hairy factor for 2D 
	  var i = Math.floor(xin+s); 
	  var j = Math.floor(yin+s); 
	  var G2 = (3.0-Math.sqrt(3.0))/6.0; 
	  var t = (i+j)*G2; 
	  var X0 = i-t; // Unskew the cell origin back to (x,y) space 
	  var Y0 = j-t; 
	  var x0 = xin-X0; // The x,y distances from the cell origin 
	  var y0 = yin-Y0; 
	  // For the 2D case, the simplex shape is an equilateral triangle. 
	  // Determine which simplex we are in. 
	  var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords 
	  if(x0>y0) {i1=1; j1=0;} // lower triangle, XY order: (0,0)->(1,0)->(1,1) 
	  else {i1=0; j1=1;}      // upper triangle, YX order: (0,0)->(0,1)->(1,1) 
	  // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and 
	  // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where 
	  // c = (3-sqrt(3))/6 
	  var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords 
	  var y1 = y0 - j1 + G2; 
	  var x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords 
	  var y2 = y0 - 1.0 + 2.0 * G2; 
	  // Work out the hashed gradient indices of the three simplex corners 
	  var ii = i & 255; 
	  var jj = j & 255; 
	  var gi0 = this.perm[ii+this.perm[jj]] % 12; 
	  var gi1 = this.perm[ii+i1+this.perm[jj+j1]] % 12; 
	  var gi2 = this.perm[ii+1+this.perm[jj+1]] % 12; 
	  // Calculate the contribution from the three corners 
	  var t0 = 0.5 - x0*x0-y0*y0; 
	  if(t0<0) n0 = 0.0; 
	  else { 
	    t0 *= t0; 
	    n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);  // (x,y) of grad3 used for 2D gradient 
	  } 
	  var t1 = 0.5 - x1*x1-y1*y1; 
	  if(t1<0) n1 = 0.0; 
	  else { 
	    t1 *= t1; 
	    n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1); 
	  }
	  var t2 = 0.5 - x2*x2-y2*y2; 
	  if(t2<0) n2 = 0.0; 
	  else { 
	    t2 *= t2; 
	    n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2); 
	  } 
	  // Add contributions from each corner to get the final noise value. 
	  // The result is scaled to return values in the interval [-1,1]. 
	  return 70.0 * (n0 + n1 + n2); 
	};
	 
	// 3D simplex noise 
	SimplexNoise.prototype.noise3d = function(xin, yin, zin) { 
	  var n0, n1, n2, n3; // Noise contributions from the four corners 
	  // Skew the input space to determine which simplex cell we're in 
	  var F3 = 1.0/3.0; 
	  var s = (xin+yin+zin)*F3; // Very nice and simple skew factor for 3D 
	  var i = Math.floor(xin+s); 
	  var j = Math.floor(yin+s); 
	  var k = Math.floor(zin+s); 
	  var G3 = 1.0/6.0; // Very nice and simple unskew factor, too 
	  var t = (i+j+k)*G3; 
	  var X0 = i-t; // Unskew the cell origin back to (x,y,z) space 
	  var Y0 = j-t; 
	  var Z0 = k-t; 
	  var x0 = xin-X0; // The x,y,z distances from the cell origin 
	  var y0 = yin-Y0; 
	  var z0 = zin-Z0; 
	  // For the 3D case, the simplex shape is a slightly irregular tetrahedron. 
	  // Determine which simplex we are in. 
	  var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords 
	  var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords 
	  if(x0>=y0) { 
	    if(y0>=z0) 
	      { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; } // X Y Z order 
	      else if(x0>=z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; } // X Z Y order 
	      else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; } // Z X Y order 
	    } 
	  else { // x0<y0 
	    if(y0<z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; } // Z Y X order 
	    else if(x0<z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; } // Y Z X order 
	    else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; } // Y X Z order 
	  } 
	  // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z), 
	  // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and 
	  // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where 
	  // c = 1/6.
	  var x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords 
	  var y1 = y0 - j1 + G3; 
	  var z1 = z0 - k1 + G3; 
	  var x2 = x0 - i2 + 2.0*G3; // Offsets for third corner in (x,y,z) coords 
	  var y2 = y0 - j2 + 2.0*G3; 
	  var z2 = z0 - k2 + 2.0*G3; 
	  var x3 = x0 - 1.0 + 3.0*G3; // Offsets for last corner in (x,y,z) coords 
	  var y3 = y0 - 1.0 + 3.0*G3; 
	  var z3 = z0 - 1.0 + 3.0*G3; 
	  // Work out the hashed gradient indices of the four simplex corners 
	  var ii = i & 255; 
	  var jj = j & 255; 
	  var kk = k & 255; 
	  var gi0 = this.perm[ii+this.perm[jj+this.perm[kk]]] % 12; 
	  var gi1 = this.perm[ii+i1+this.perm[jj+j1+this.perm[kk+k1]]] % 12; 
	  var gi2 = this.perm[ii+i2+this.perm[jj+j2+this.perm[kk+k2]]] % 12; 
	  var gi3 = this.perm[ii+1+this.perm[jj+1+this.perm[kk+1]]] % 12; 
	  // Calculate the contribution from the four corners 
	  var t0 = 0.6 - x0*x0 - y0*y0 - z0*z0; 
	  if(t0<0) n0 = 0.0; 
	  else { 
	    t0 *= t0; 
	    n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0, z0); 
	  }
	  var t1 = 0.6 - x1*x1 - y1*y1 - z1*z1; 
	  if(t1<0) n1 = 0.0; 
	  else { 
	    t1 *= t1; 
	    n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1, z1); 
	  } 
	  var t2 = 0.6 - x2*x2 - y2*y2 - z2*z2; 
	  if(t2<0) n2 = 0.0; 
	  else { 
	    t2 *= t2; 
	    n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2, z2); 
	  } 
	  var t3 = 0.6 - x3*x3 - y3*y3 - z3*z3; 
	  if(t3<0) n3 = 0.0; 
	  else { 
	    t3 *= t3; 
	    n3 = t3 * t3 * this.dot(this.grad3[gi3], x3, y3, z3); 
	  } 
	  // Add contributions from each corner to get the final noise value. 
	  // The result is scaled to stay just inside [-1,1] 
	  return 32.0*(n0 + n1 + n2 + n3); 
	};


var Perlin = new SimplexNoise();



// _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.  VECTOR CLASS  _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.
// _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.
// _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.

// adapted from the THREE.js Vector2() class
// props to  mrdoob / http://mrdoob.com/
// 			 philogb / http://blog.thejit.org/
// 			 egraether / http://egraether.com/
// 			 zz85 / http://www.lab4games.net/zz85/blog


var Vector = function( x, y ){

	this.x = x || 0;
	this.y = y || 0;

	this.set = function (x, y) {
	    this.x = x;
	    this.y = y;
	    return this;
	}
	this.setX = function (x) {
	    this.x = x;
	    return this;
	}
	this.setY = function (y) {
	    this.y = y;
	    return this;
	}
	this.setComponent = function (index, value) {
	    switch (index) {
	        case 0:
	            this.x = value;
	            break;
	        case 1:
	            this.y = value;
	            break;
	        default:
	            throw new Error('index is out of range: ' + index);
	    }
	}
	this.getComponent = function (index) {
	    switch (index) {
	        case 0:
	            return this.x;
	        case 1:
	            return this.y;
	        default:
	            throw new Error('index is out of range: ' + index);
	    }
	}
	this.copy = function (v) {
	    this.x = v.x;
	    this.y = v.y;
	    return this;
	}
	this.add = function (v, w) {
	    if (w !== undefined) {
	        console.warn('Vector: .add() now only accepts one argument. Use .addVectors( a, b ) instead.');
	        return this.addVectors(v, w);
	    }
	    this.x += v.x;
	    this.y += v.y;
	    return this;
	}
	this.addScalar = function (s) {
	    this.x += s;
	    this.y += s;
	    return this;
	}
	this.addVectors = function (a, b) {
	    this.x = a.x + b.x;
	    this.y = a.y + b.y;
	    return this;
	}
	this.sub = function (v, w) {
	    if (w !== undefined) {
	        console.warn('Vector: .sub() now only accepts one argument. Use .subVectors( a, b ) instead.');
	        return this.subVectors(v, w);
	    }
	    this.x -= v.x;
	    this.y -= v.y;
	    return this;
	}
	this.subScalar = function (s) {
	    this.x -= s;
	    this.y -= s;
	    return this;
	}
	this.subVectors = function (a, b) {
	    this.x = a.x - b.x;
	    this.y = a.y - b.y;
	    return this;
	}
	this.multiply = function (v) {
	    this.x *= v.x;
	    this.y *= v.y;
	    return this;
	}
	this.multiplyScalar = function (s) {
	    this.x *= s;
	    this.y *= s;
	    return this;
	}
	this.divide = function (v) {
	    this.x /= v.x;
	    this.y /= v.y;
	    return this;
	}
	this.divideScalar = function (scalar) {
	    if (scalar !== 0) {
	        var invScalar = 1 / scalar;
	        this.x *= invScalar;
	        this.y *= invScalar;
	    } else {
	        this.x = 0;
	        this.y = 0;
	    }
	    return this;
	}
	this.min = function (v) {
	    if (this.x > v.x) {
	        this.x = v.x;
	    }
	    if (this.y > v.y) {
	        this.y = v.y;
	    }
	    return this;
	}
	this.max = function (v) {
	    if (this.x < v.x) {
	        this.x = v.x;
	    }
	    if (this.y < v.y) {
	        this.y = v.y;
	    }
	    return this;
	}
	this.clamp = function (min, max) {
	    // This function assumes min < max, if this assumption isn't true it will not operate correctly
	    if (this.x < min.x) {
	        this.x = min.x;
	    } else if (this.x > max.x) {
	        this.x = max.x;
	    }
	    if (this.y < min.y) {
	        this.y = min.y;
	    } else if (this.y > max.y) {
	        this.y = max.y;
	    }
	    return this;
	}
	
	this.clampScalar = (function () {
	    var min, max;
	    return function (minVal, maxVal) {
	        if (min === undefined) {
	            min = new Vector();
	            max = new Vector();
	        }
	        min.set(minVal, minVal);
	        max.set(maxVal, maxVal);
	        return this.clamp(min, max);
	    };
	})();

	this.floor = function () {
	    this.x = Math.floor(this.x);
	    this.y = Math.floor(this.y);
	    return this;
	}
	this.ceil = function () {
	    this.x = Math.ceil(this.x);
	    this.y = Math.ceil(this.y);
	    return this;
	}
	this.round = function () {
	    this.x = Math.round(this.x);
	    this.y = Math.round(this.y);
	    return this;
	}
	this.roundToZero = function () {
	    this.x = (this.x < 0) ? Math.ceil(this.x) : Math.floor(this.x);
	    this.y = (this.y < 0) ? Math.ceil(this.y) : Math.floor(this.y);
	    return this;
	}
	this.negate = function () {
	    this.x = -this.x;
	    this.y = -this.y;
	    return this;
	}
	this.dot = function (v) {
	    return this.x * v.x + this.y * v.y;
	}
	this.lengthSq = function () {
	    return this.x * this.x + this.y * this.y;
	}
	this.length = function () {
	    return Math.sqrt(this.x * this.x + this.y * this.y);
	}
	this.normalize = function () {
	    return this.divideScalar(this.length());
	}
	// this.map = function (v, inmin, inmax, outmin, outmax) {
	// 	return (outmax - outmin) * (v-inmin)/(inmax-inmin) + outmin; 
	// }
	this.distanceTo = function (v) {
	    return Math.sqrt(this.distanceToSquared(v));
	}
	this.distanceToSquared = function (v) {
	    var dx = this.x - v.x,
	        dy = this.y - v.y;
	    return dx * dx + dy * dy;
	}
	this.setLength = function (l) {
	    var oldLength = this.length();
	    if (oldLength !== 0 && l !== oldLength) {
	        this.multiplyScalar(l / oldLength);
	    }
	    return this;
	}
	this.lerp = function (v, alpha) {
	    this.x += (v.x - this.x) * alpha;
	    this.y += (v.y - this.y) * alpha;
	    return this;
	}
	this.lerpVectors = function (v1, v2, alpha) {
	    this.subVectors(v2, v1).multiplyScalar(alpha).add(v1);
	    return this;
	}
	this.equals = function (v) {
	    return ((v.x === this.x) && (v.y === this.y));
	}
	this.fromArray = function (array, offset) {
	    if (offset === undefined) offset = 0;
	    this.x = array[offset];
	    this.y = array[offset + 1];
	    return this;
	}
	this.toArray = function (array, offset) {
	    if (array === undefined) array = [];
	    if (offset === undefined) offset = 0;
	    array[offset] = this.x;
	    array[offset + 1] = this.y;
	    return array;
	}
	this.fromAttribute = function (attribute, index, offset) {
	    if (offset === undefined) offset = 0;
	    index = index * attribute.itemSize + offset;
	    this.x = attribute.array[index];
	    this.y = attribute.array[index + 1];
	    return this;
	}
	this.clone = function () {
	    return new Vector(this.x, this.y);
	}

}




// _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'  PARTICLE CLASS   _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.
// _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.
// _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.




var Particle = function(x, y, speed, direction, grav){

	this.x = x||0;
	this.y = y||0;
	this.vx = Math.cos(direction) * speed || 0;
	this.vy = Math.sin(direction) * speed || 0;
	this.mass = 1;
	this.radius = 0;
	this.bounce = -1;
	this.friction = 1;
	this.gravity = grav || 0;
	this.springs = [];
	this.gravitations = [];

	// this.create = function(x, y, speed, direction, grav) {
	// 	var obj = Object.create(this);
	// 	obj.x = x;
	// 	obj.y = y;
	// 	obj.vx = Math.cos(direction) * speed;
	// 	obj.vy = Math.sin(direction) * speed;
	// 	obj.gravity = grav || 0;
	// 	obj.springs = [];
	// 	obj.gravitations = [];
	// 	return obj;
	// }

	this.addGravitation = function(p) {
		this.removeGravitation(p);
		this.gravitations.push(p);
	}

	this.removeGravitation = function(p) {
		for(var i = 0; i < this.gravitations.length; i += 1) {
			if(p === this.gravitations[i]) {
				this.gravitations.splice(i, 1);
				return;
			}
		}
	}

	this.addSpring = function(point, k, length) {
		this.removeSpring(point);
		this.springs.push({
			point: point,
			k: k,
			length: length || 0
		});
	}

	this.removeSpring = function(point) {
		for(var i = 0; i < this.springs.length; i += 1) {
			if(point === this.springs[i].point) {
				this.springs.splice(i, 1);
				return;
			}
		}
	}

	this.getSpeed = function() {
		return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
	}

	this.setSpeed = function(speed) {
		var heading = this.getHeading();
		this.vx = Math.cos(heading) * speed;
		this.vy = Math.sin(heading) * speed;
	}

	this.getHeading = function() {
		return Math.atan2(this.vy, this.vx);
	}

	this.setHeading = function(heading) {
		var speed = this.getSpeed();
		this.vx = Math.cos(heading) * speed;
		this.vy = Math.sin(heading) * speed;
	}

	this.accelerate = function(ax, ay) {
		this.vx += ax;
		this.vy += ay;
	}

	this.update = function() {
		this.handleSprings();
		this.handleGravitations();
		this.vx *= this.friction;
		this.vy *= this.friction;
		this.vy += this.gravity;
		this.x += this.vx;
		this.y += this.vy;
	}

	this.handleGravitations = function() {
		for(var i = 0; i < this.gravitations.length; i += 1) {
			this.gravitateTo(this.gravitations[i]);
		}
	}

	this.handleSprings = function() {
		for(var i = 0; i < this.springs.length; i += 1) {
			var spring = this.springs[i];
			this.springTo(spring.point, spring.k, spring.length);
		}
	}

	this.angleTo = function(p2) {
		return Math.atan2(p2.y - this.y, p2.x - this.x);
	}

	this.distanceTo = function(p2) {
		var dx = p2.x - this.x,
			dy = p2.y - this.y;

		return Math.sqrt(dx * dx + dy * dy);
	}

	this.gravitateTo = function(p2) {
		var dx = p2.x - this.x,
			dy = p2.y - this.y,
			distSQ = dx * dx + dy * dy,
			dist = Math.sqrt(distSQ),
			force = p2.mass / distSQ,
			ax = dx / dist * force,
			ay = dy / dist * force;

		this.vx += ax;
		this.vy += ay;
	}

	this.springTo = function(point, k, length) {
		var dx = point.x - this.x,
			dy = point.y - this.y,
			distance = Math.sqrt(dx * dx + dy * dy),
			springForce = (distance - length || 0) * k; 
		this.vx += dx / distance * springForce,
		this.vy += dy / distance * springForce;
	}

};


// _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.   BOID CLASS   _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.
// _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.
// _.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~._.~*'*~.

// adapted from @BlurSpline zz85 !!! http://www.joshuakoo.com/

var Boid = function( x,y, radius ){

	var vector = new Vector();

	var _acceleration;
	var _width = WIDTH || 500;
	var _height = HEIGHT || 500;
	var _goal;
	var _neighborhoodRadius = radius || 100;
	var _maxSpeed = 4;
	var _maxSteerForce = 0.1;
	var _avoidWalls = true;
	var _respawn = false;

	this.position = new Vector(x,y);
	this.velocity = new Vector();
	_acceleration = new Vector();

	this.x = this.position.x;
	this.y = this.position.y;

	this.setGoal = function( target ){
		_goal = target;
	}

	this.setAvoidWalls = function( value ){
		_avoidWalls = value;
	}

	this.setInfiniteWalls = function( value ){
		_respawn = value;
	}

	this.setWorldSize = function( width, height ){
		_width = width;
		_height = height;
	}

	//

	// this.run = function( boids ){ // avoidWalls + flock + move

	// 	if( Math.random() > 0.5 ){
	// 		this.flock( boids );
	// 	}

	// 	this.move();
	// }

	//

	this.move = function(){ // basic movement ( avoiding walls ) -------------------------------

		if( _avoidWalls ) this.checkBounds();
		else if( _respawn ) this.reSpawn();
		
		this.velocity.add( _acceleration );

		var l = this.velocity.length();

		if( l > _maxSpeed ){
			this.velocity.divideScalar( l / _maxSpeed );
		}

		this.position.add( this.velocity );
		this.x = this.position.x;
		this.y = this.position.y;
		_acceleration.set(0, 0);
	
	}

	this.avoidVec = function( target ){ // used in checkBounds
		
		var steer = new Vector();

		steer.copy( this.position );
		steer.sub( target );

		steer.multiplyScalar( 1 / this.position.distanceToSquared( target ) );

		return steer;

	}

	this.checkBounds = function(){  // used in move

		vector.set( 0, this.position.y );
		vector = this.avoidVec( vector );
		vector.multiplyScalar( 5 );
		_acceleration.add( vector );

		vector.set( _width, this.position.y );
		vector = this.avoidVec( vector );
		vector.multiplyScalar( 5 );
		_acceleration.add( vector );

		vector.set( this.position.x, 0 );
		vector = this.avoidVec( vector );
		vector.multiplyScalar( 5 );
		_acceleration.add( vector );

		vector.set( this.position.x, _height );
		vector = this.avoidVec( vector );
		vector.multiplyScalar( 5 );
		_acceleration.add( vector );

	}

	this.reSpawn = function(){
		if( this.x < -50  	 ) this.position.set( _width, this.y );
		if( this.x > _width  ) this.position.set( 0, this.y );
		if( this.y < -50  	 ) this.position.set( this.x, _height) ;
		if( this.y > _height ) this.position.set( this.x, 0 );
	}

	// ----------------------------

	// --------------------------------------------------

	this.flock = function( boids ){	// flocking behavior ---------------------------------------
		
		if( Math.random() > 0.5 ){
			if( _goal ){
				_acceleration.add( this.reach(_goal, 0.005) );
			}

			_acceleration.add( this.alignment( boids ) );
			_acceleration.add( this.cohesion( boids ) );
			_acceleration.add( this.separation( boids ) );
		}

		this.move();

	}



	this.avoid = function( target, targetY ){ // public
		if( target instanceof Array ){

			var boid, distance;
			var posSum = new Vector();
			var repulse = new Vector();

			for (var i = 0; i < target.length; i++) {
				
				if( Math.random() > 0.6 ) continue;

				boid = target[ i ];
				distance = boid.position.distanceTo( this.position );

				if( distance > 0 && distance <= _neighborhoodRadius ){

					repulse.subVectors( this.position, boid.position );
					repulse.normalize();
					repulse.divideScalar( distance );
					posSum.add( repulse );

				}

			};

			_acceleration.add( posSum );

		} else {

			if( typeof target == 'number'){
				target = new Vector( target, targetY );
			}

			var distance = this.position.distanceTo( target );

			if( distance < 150 ){

				var steer = new Vector();

				steer.subVectors( this.position, target );
				steer.multiplyScalar( 0.5 / distance );

				_acceleration.add( steer );

			}

		}
	}


	this.seek = function( target, targetY, amt  ){ // public

		var amount;

		if( typeof target == 'number'){
			target = new Vector( target, targetY );
			amount = amt || 0.005; 
		} else {
			amount = targetY || 0.005; 
		}

		var steer = new Vector();

		steer.subVectors( target, this.position );
		steer.multiplyScalar( amount );

		_acceleration.add( steer );
	}

	// 

	// used in flocking (reach) + alignment + cohesion + separation

	// 

	this.reach = function( target, amount ){ 

		var steer = new Vector();

		steer.subVectors( target, this.position );
		steer.multiplyScalar( amount );

		return steer;
	}


	this.alignment = function( boids ){

		var boid;
		var velSum = new Vector();
		var count = 0;

		for (var i = 0; i < boids.length; i++) {
			if( Math.random() > 0.6 ) continue;

			boid = boids[ i ];
			
			distance = boid.position.distanceTo( this.position );

			if( distance > 0 && distance <= _neighborhoodRadius ){

				velSum.add( boid.velocity );
				count++;

			}
		};

		if( count > 0 ){

			velSum.divideScalar( count );

			var l = velSum.length();

			if( l > _maxSteerForce ){
				velSum.divideScalar( l / _maxSteerForce );
			}
		}

		return velSum;
	}

	this.cohesion = function( boids ){

		var boid, distance;
		var posSum = new Vector();
		var steer = new Vector();
		var count = 0;

		for (var i = 0; i < boids.length; i++) {
			
			if( Math.random() > 0.6 ) continue;

			boid = boids[ i ];
			distance = boid.position.distanceTo( this.position );

			if( distance > 0 && distance <= _neighborhoodRadius ){

				posSum.add( boid.position );
				count++;

			}

			if( count > 0 ){
				posSum.divideScalar( count );
			}

			steer.subVectors( posSum, this.position );

			var l = steer.length();

			if( l > _maxSteerForce ){
				steer.divideScalar( l / _maxSteerForce );
			}

			return steer;
		};
	}

	this.separation = function( boids ){

		var boid, distance;
		var posSum = new Vector();
		var repulse = new Vector();

		for (var i = 0; i < boids.length; i++) {
			
			if( Math.random() > 0.6 ) continue;

			boid = boids[ i ];
			distance = boid.position.distanceTo( this.position );

			if( distance > 0 && distance <= _neighborhoodRadius ){

				repulse.subVectors( this.position, boid.position );
				repulse.normalize();
				repulse.divideScalar( distance );
				posSum.add( repulse );

			}

		};

		return posSum;
	}


}
