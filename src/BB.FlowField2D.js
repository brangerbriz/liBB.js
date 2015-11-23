/**
 * @class BB.FlowField2D
 * @param {Number} resolution [description]
 * @param {Number} width      Width in pixels used to specify the 
 * @param {[type]} height     Height in pixels used to specify
 */
BB.FlowField2D = function(resolution, width, height) {
	
	if (typeof width !== 'number') {
		throw new Error('BB.FlowField2D: resolution must be supplied and a number type.');
	} else if (typeof width !== 'number') {
		throw new Error('BB.FlowField2D: width must be supplied and a number type.');
	} else if (typeof height !== 'number') {
		throw new Error('BB.FlowField2D: height must be supplied and a number type.');
	}

	this.width  = width;
	this.height = height;

	this.rows = height/resolution;
	this.cols = width/resolution;

	this.resolution = resolution;
    this.field = [];

    for (var i = 0; i < this.cols; i++) {
      this.field[i] = [];
      for (var j = 0; j < this.rows; j++) {
        this.field[i][j] = new BB.Vector2(0, 0); 
      }
    }

    this._debugImage = null;
};

BB.FlowField2D.Noise = function(resolution, width, height, noiseStep) {
	
	if (typeof resolution !== 'number') {
		throw new Error('BB.FlowField2D.Noise: resolution must be supplied and a number type.');
	} else if (typeof width !== 'number') {
		throw new Error('BB.FlowField2D.Noise: width must be supplied and a number type.');
	} else if (typeof height !== 'number') {
		throw new Error('BB.FlowField2D.Noise: height must be supplied and a number type.');
	}

	BB.FlowField2D.call(this, resolution, width, height);

	var noiseInc = (typeof noiseStep === 'number') ? noiseStep : 0.1;
	
	var xoff = 0;
    
    for (var i = 0; i < this.cols; i++) {
      
      var yoff = 0;
      
      for (var j = 0; j < this.rows; j++) {

        var theta = BB.MathUtils.map(BB.MathUtils.noise(xoff, yoff), 0, 1, 0, Math.PI * 2);

        this.field[i][j].set(Math.cos(theta), Math.sin(theta));
        
        yoff += noiseInc;

      }

      xoff += noiseInc;
    }
};

BB.FlowField2D.Noise.prototype = Object.create(BB.FlowField2D.prototype);
BB.FlowField2D.Noise.prototype.constructor = BB.FlowField2D;

BB.FlowField2D.prototype.lookup = function(x, y) {

    var column = Math.floor(BB.MathUtils.clamp(x/this.resolution, 0, this.cols - 1));
    var row = Math.floor(BB.MathUtils.clamp(y/this.resolution, 0, this.rows - 1));
    return this.field[column][row].clone();
};

BB.FlowField2D.prototype.drawDebug = function(context, x, y, width, height) {

	// lazy load the image
	if (this._debugImage === null ||
		this._debugImageWidth !== width ||
		this._debugImageHeight !== height) {

		this._debugImage = new Image();
		this._debugImageWidth = width;
		this._debugImageHeight = height;

		var canvas = document.createElement('canvas');
		canvas.width = this.width;
		canvas.height = this.height;

		var ctx = canvas.getContext('2d');

		for (var i = 0; i < this.cols; i++) {
	    	
	    	for (var j = 0; j < this.rows; j++) {
	        	
	        	ctx.save();
	        	ctx.lineWidth = 0.5;
	        	ctx.strokeStyle = "#000"
	        	
	        	//drawVector(this.field[i][j],i*this.resolution,j*this.resolution,this.resolution-2);

			    var arrowsize = 4;
			    // Translate to location to render vector
			    ctx.translate(i * this.resolution, j * this.resolution);
			    
			    // Call vector heading function to get direction (note that pointing to the right is a heading of 0) and rotate
			    ctx.rotate(Math.atan2(this.field[i][j].y, this.field[i][j].x));
			
			    // Calculate length of vector & scale it to be bigger or smaller if necessary
			    var len = this.field[i][j].length() * this.resolution-2;
			    
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

	    this._debugImage.src = canvas.toDataURL();
	    this._debugImage.onload = function() {
	    	this.isLoaded = true;
	    }

	} else {

		if (this._debugImage.isLoaded) {
			context.drawImage(this._debugImage, x, y, width, height);
		}
	}
};
