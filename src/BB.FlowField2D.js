BB.FlowField2D = function(field, width, height) {
	
	if (!(field instanceof Array) || field.length < 1 || ! (field[0] instanceof Array)) {
		throw new Error('BB.FlowField2D: field must be a two dimensional array.');
	} else if (typeof width !== 'number') {
		throw new Error('BB.FlowField2D: width must be supplied and a number type.');
	} else if (typeof height !== 'number') {
		throw new Error('BB.FlowField2D: height must be supplied and a number type.');
	}

	this.field  = field;
	this.width  = width;
	this.height = height;
	this.rows = field[0].length;
	this.cols = field.length;
	this.resolution = this.width/this.cols;
	console.log(this.resolution);

};

BB.FlowField2D.Noise = function(resolution, width, height, noiseStep) {
	
	if (typeof resolution !== 'number') {
		throw new Error('BB.FlowField2D.Noise: resolution must be supplied and a number type.');
	} else if (typeof width !== 'number') {
		throw new Error('BB.FlowField2D.Noise: width must be supplied and a number type.');
	} else if (typeof height !== 'number') {
		throw new Error('BB.FlowField2D.Noise: height must be supplied and a number type.');
	}

	var noiseInc = (typeof noiseStep === 'number') ? noiseStep : 0.1;

	var field = [];
	var cols = width/resolution;
	var rows = height/resolution;
	
	var xoff = 0;
    
    for (var i = 0; i < cols; i++) {
      
      var yoff = 0;

      field[i] = [];
      
      for (var j = 0; j < rows; j++) {

        var theta = BB.MathUtils.map(BB.MathUtils.noise(xoff, yoff), 0, 1, 0, Math.PI * 2);

        field[i][j] = new BB.Vector2(Math.cos(theta), Math.sin(theta));
        
        yoff += noiseInc;

      }

      xoff += noiseInc;
    }

    BB.FlowField2D.call(this, field, width, height);
};

BB.FlowField2D.Noise.prototype = Object.create(BB.FlowField2D.prototype);
BB.FlowField2D.Noise.prototype.constructor = BB.FlowField2D;

BB.FlowField2D.prototype.lookup = function(x, y) {

    var column = Math.floor(BB.MathUtils.clamp(x/this.resolution, 0, this.cols - 1));
    console.log(x, this.resolution, this.cols, column);
    var row = Math.floor(BB.MathUtils.clamp(y/this.resolution, 0, this.rows - 1));
    return this.field[column][row].clone();
};

BB.FlowField2D.prototype.drawDebug = function(context) {

};
