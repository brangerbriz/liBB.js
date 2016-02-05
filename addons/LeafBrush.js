/**
 * A pseudo-random leaf-spray brush. extends from BB.BaseBrush2D
 * @class LeafBrush
 * @constructor
 * @extends BB.BaseBrush2D
 * @param {Object} [config] A optional config object ( see BB.BaseBrush2D for list of properties )
 */
function LeafBrush(config){

	BB.BaseBrush2D.call(this, config);

	this.controllerModuleHasIsDown = false;

}

LeafBrush.prototype = Object.create(BB.BaseBrush2D.prototype);
LeafBrush.prototype.constructor = LeafBrush;


/**
 * Update method. Usually called once per animation frame.
 * @method update
 * @param {Object} controllerModule An object with x and y properties and
 * optionally an isDown boolean (used for starting and stopping
 * spray).
 */
LeafBrush.prototype.update = function(controllerModule) {

	BB.BaseBrush2D.prototype.update.call(this, controllerModule);

	if (controllerModule.hasOwnProperty('isDown')) {
		this.controllerModuleHasIsDown = true;
		this.hidden = (controllerModule.isDown === false);
	} else {
		this.controllerModuleHasIsDown = false;
	}

};


/**
 * Draws the brush to the context. Usually called once per animation frame.
 * @method draw
 * @param {Object} context The HTML5 canvas context you would like to draw
 * to.
 */
LeafBrush.prototype.draw = function(context) {

	context = BB.BaseBrush2D.prototype.draw.call(this, context);

	context.save();   

	// draw down here...
	if (this.controllerModuleHasIsDown && !this.hidden || !this.controllerModuleHasIsDown) {

		var angle = Math.random() * 360;
		var scale = Math.random()*1+1;
		var size = BB.MathUtils.map(this.height,0,200,5,100);
		var a = Math.random() * size/2 - size/4;
		var b = Math.random() * size/2 - size/4;
		var c = Math.random() * size/2 - size/4;
		var d = Math.random() * size/2 - size/4;
		context.translate(this.x, this.y);
		context.beginPath();
		context.rotate(Math.PI / 180 * angle);
		context.scale(scale, scale);
		context.fillStyle = "rgba("+this.color.r+", "+this.color.g+", "+this.color.b+","+this.color.a/255+")";
		context.beginPath();
		context.moveTo(0, 0);
		context.bezierCurveTo(a+size, b+0, c+0, d-size, 0, 0);
		context.closePath();
		context.fill();

	} 

	context.restore();
};


