/**
 * A pseudo-random star-spray brush. extends from BB.BaseBrush2D
 * @class StarBrush
 * @constructor
 * @extends BB.BaseBrush2D
 * @param {Object} [config] A optional config object ( see BB.BaseBrush2D for list of properties )
 */
function StarBrush(config){

	BB.BaseBrush2D.call(this, config);

	this.controllerModuleHasIsDown = false;

}

StarBrush.prototype = Object.create(BB.BaseBrush2D.prototype);
StarBrush.prototype.constructor = StarBrush;


/**
 * Update method. Usually called once per animation frame.
 * @method update
 * @param {Object} controllerModule An object with x and y properties and
 * optionally an isDown boolean (used for starting and stopping
 * spray).
 */
StarBrush.prototype.update = function(controllerModule) {

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
StarBrush.prototype.draw = function(context) {

	context = BB.BaseBrush2D.prototype.draw.call(this, context);

	context.save();   

	// draw down here...
	if (this.controllerModuleHasIsDown && !this.hidden || !this.controllerModuleHasIsDown) {

		context.lineJoin = "miter";
		context.lineCap = "butt";
		var size = BB.MathUtils.map(this.height,0,200,1,20);
		var angle = Math.random()*360;
		var scale = Math.random()*2;
		context.translate(this.x,this.y);
		context.beginPath();
		context.rotate(Math.PI / 180 * angle);
		context.scale(scale, scale);
		context.strokeStyle = "rgba("+this.color.r+", "+this.color.g+", "+this.color.b+","+this.color.a/255+")";
		context.lineWidth = Math.random()*size;
		for ( var i = 5; i--;) {
			context.lineTo(0, size);
			context.translate(0, size);
			context.rotate((Math.PI * 2 / 10));
			context.lineTo(0, -size);
			context.translate(0, -size);
			context.rotate(-(Math.PI * 6 / 10));
		}
		context.lineTo(0, size);
		context.closePath();
		context.stroke();

	} 

	context.restore();
};


