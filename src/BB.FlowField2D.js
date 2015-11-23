/**
 * A 2D flow field object based off of Daniel Shiffman's Flow Field example in
 * Nature of Code.
 * @class BB.FlowField2D
 * @constructor
 * @param {Number} resolution Corresponds directly to the size of each flow
 * field cell. A larger number will result in fewer cells.
 * @param {Number} width      Width in pixels
 * @param {Number} height     Height in pixels
 * @example <code class="code prettyprint">&nbsp;var flowField = new
 * BB.FlowField2D(40, window.innerWidth, window.innerHeight);<br> </code>
 */
BB.FlowField2D = function(resolution, width, height) {
	
	if (typeof width !== 'number') {
		throw new Error('BB.FlowField2D: resolution must be supplied and a number type.');
	} else if (typeof width !== 'number') {
		throw new Error('BB.FlowField2D: width must be supplied and a number type.');
	} else if (typeof height !== 'number') {
		throw new Error('BB.FlowField2D: height must be supplied and a number type.');
	}

	/**
	 * Width of the flow field in pixels.
	 * @property {Number} width
	 */
	this.width  = width;

	/**
	 * Height of the flow field in pixels.
	 * @property {Number} height 
	 */
	this.height = height;

	this.rows = height/resolution;
	this.cols = width/resolution;

	/**
	 * The resolution of the flow field. Corresponds directly to the size of
	 * each flow field cell. A larger number will result in fewer cells.
	 * @property {Number} resolution
	 */
	this.resolution = resolution;

	/**
	 * A two-deminsional array of BB.Vector2Ds that makes up this flow field.
	 * All vectors default to values (0, 0) when first created.
	 * @property {Array} field
	 */
    this.field = [];

    for (var i = 0; i < this.cols; i++) {
      this.field[i] = [];
      for (var j = 0; j < this.rows; j++) {
        this.field[i][j] = new BB.Vector2(0, 0); 
      }
    }

    this._debugImage = null;
};

/**
 * Populate field with values using 2D perlin noise.
 * @method  generateNoiseField
 * @param  {Number} [seed=0]      A seed to use when generating noise (e.x.
 * Date.now() * 0.005)
 * @param  {Number} [noiseStep=0.1] The value to increase noise by per each
 * field cell.
 * @example <code class="code prettyprint"> &nbsp;// assuming flowField is an
 * instance of BB.FlowField2D<br>
 * &nbsp;function update() {<br>
 * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// assumes update(...) will be called once per animation frame<br>
 * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;flowField.generateNoiseField(Date.now()\*0.005, 0.1);<br>
 * &nbsp;};
 * </code>
 */
BB.FlowField2D.prototype.generateNoiseField = function(seed, noiseStep) {

	var noiseSeed = (typeof seed === 'number') ? seed : 0;
	var noiseInc = (typeof noiseStep === 'number') ? noiseStep : 0.1;
	
	var xoff = noiseSeed;
    
    for (var i = 0; i < this.cols; i++) {
      
      var yoff = noiseSeed;
      
      for (var j = 0; j < this.rows; j++) {

        var theta = BB.MathUtils.map(BB.MathUtils.noise(xoff, yoff), 0, 1, 0, Math.PI * 2);

        this.field[i][j].set(Math.cos(theta), Math.sin(theta));
        
        yoff += noiseInc;

      }

      xoff += noiseInc;
    }

    this._drawDebugImage = null;
};

/**
 * Populate a flow field with cells containing normalized random vectors
 * @method generateRandomField
 * @example <code class="code prettyprint"> &nbsp;// assuming flowField is an
 * instance of BB.FlowField2D<br>
 * &nbsp;function update() {<br>
 * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// assumes update(...) will be called once per animation frame<br>
 * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;flowField.generateRandomField();<br>
 * &nbsp;};
 * </code>
 */
BB.FlowField2D.prototype.generateRandomField = function() {

    for (var i = 0; i < this.cols; i++) {
      for (var j = 0; j < this.rows; j++) {
      	var cart = BB.MathUtils.polarToCartesian(1, BB.MathUtils.randomFloat(0, 360));
        this.field[i][j].set(cart[0], cart[1]);
      }
    }

    this._drawDebugImage = null;
};

/**
 * Lookup the corresponding field cell using pixel space coordinates x and y.
 * Note, x and y must be a value between 0 and width and height respectively.
 * @method  lookup
 * @param  {Number} x Pixel/screen x coordinate
 * @param  {Number} y Pixel/screen y coordinate
 * @return {BB.Vector2D} The cell "beneath" x and y
 * @example <code class="code prettyprint">&nbsp;// assuming flowField is an
 * instance of BB.FlowField2D<br> &nbsp;// assuming agent is an instance of
 * BB.Agent2D<br> &nbsp;var cell = flowField.lookup(agent.position.x,
 * agent.position.y);<br> &nbsp;agent.applyForce(cell);</code>
 */
BB.FlowField2D.prototype.lookup = function(x, y) {

    var column = Math.floor(BB.MathUtils.clamp(x/this.resolution, 0, this.cols - 1));
    var row = Math.floor(BB.MathUtils.clamp(y/this.resolution, 0, this.rows - 1));
    return this.field[column][row].clone();
};

/**
 * Draws a debug view of the flow field to context.
 * @param  {CanvasRenderingContext2D} context The 2D HTML5 Canvas context to
 * draw to.
 * @method  drawDebug
 * @param  {Number} x x position of the debug rectangle
 * @param  {Number} y y position of the debug rectangle
 * @param  {Number} width width of the debug rectangle
 * @param  {Number} height position of the debug rectangle
 * @param  {Boolean} [cache=true] Drawing the debug view is fairly expensive.
 * For this reason the drawDebug(...) function lazily caches an image of the
 * flow field that it draws to context, only updating when new values are
 * passed for width and height parameters. Set this parameter to false to
 * disable caching and redraw the flow field debug view each time drawDebug(...)
 * is called. 
 */
BB.FlowField2D.prototype.drawDebug = function(context, x, y, width, height, cache) {

	var self = this;

	// lazy load the image
	if ((cache !== false ) && 
		(this._debugImage === null ||
		this._debugImageWidth !== width ||
		this._debugImageHeight !== height)) {

		this._debugImage = new Image();
		this._debugImageWidth = width;
		this._debugImageHeight = height;

		var canvas = document.createElement('canvas');
		canvas.width = this.width;
		canvas.height = this.height;

		draw(canvas.getContext('2d'));

	    this._debugImage.src = canvas.toDataURL();
	    this._debugImage.onload = function() {
	    	this.isLoaded = true;
	    }

	    console.log('case 1');

	} else if (cache === false){
		draw(context);
		console.log('case 2');
	} else if (this._debugImage.isLoaded){
		context.drawImage(this._debugImage, x, y, width, height);
		console.log('case 3');
	}
	
	function draw(ctx) {

		ctx.save();

		for (var i = 0; i < self.cols; i++) {
	    	
	    	for (var j = 0; j < self.rows; j++) {
	        	
	        	ctx.save();
	        	ctx.lineWidth = 0.5;
	        	ctx.strokeStyle = "#000"
	        	
	        	//drawVector(self.field[i][j],i*self.resolution,j*self.resolution,self.resolution-2);

			    var arrowsize = 4;
			    // Translate to location to render vector
			    ctx.translate(i * self.resolution, j * self.resolution);
			    
			    // Call vector heading function to get direction (note that pointing to the right is a heading of 0) and rotate
			    ctx.rotate(Math.atan2(self.field[i][j].y, self.field[i][j].x));
			
			    // Calculate length of vector & scale it to be bigger or smaller if necessary
			    var len = self.field[i][j].length() * self.resolution-2;
			    
			    // Draw three lines to make an arrow (draw pointing up since we've rotate to the proper direction)
			    ctx.moveTo(0, 0);
			    ctx.lineTo(len, 0);
			    
			    // arrows
			    ctx.moveTo(len, 0);
			    ctx.lineTo(len - arrowsize, arrowsize/2);
			    ctx.moveTo(len, 0);
			    ctx.lineTo(len - arrowsize, -arrowsize/2);

			    ctx.restore();
	      	}
	    }

	    ctx.stroke();

	    ctx.restore();
	}
};
