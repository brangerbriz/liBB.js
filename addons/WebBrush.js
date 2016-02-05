/**
 * A web-spray style brush. extends from BB.BaseBrush2D
 * @class WebBrush
 * @constructor
 * @extends BB.BaseBrush2D
 * @param {Object} [config] A optional config object ( see BB.BaseBrush2D for list of properties )
 */
function WebBrush(config){

	BB.BaseBrush2D.call(this, config);

	this.controllerModuleHasIsDown = false;

	this.webpoints = { x:[], y:[] };

}

WebBrush.prototype = Object.create(BB.BaseBrush2D.prototype);
WebBrush.prototype.constructor = WebBrush;


/**
 * Update method. Usually called once per animation frame.
 * @method update
 * @param {Object} controllerModule An object with x and y properties and
 * optionally an isDown boolean (used for starting and stopping
 * spray).
 */
WebBrush.prototype.update = function(controllerModule) {

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
WebBrush.prototype.draw = function(context) {

	context = BB.BaseBrush2D.prototype.draw.call(this, context);

	context.save();   

	// draw down here...
	if (this.controllerModuleHasIsDown && !this.hidden || !this.controllerModuleHasIsDown) {

		var radius = this.height;
		var rx = (Math.random()*radius/2) * Math.cos(Math.random()*Math.PI*2);
		var ry = (Math.random()*radius/2) * Math.sin(Math.random()*Math.PI*2);
		var px = this.x+rx;
		var py = this.y+ry;
		this.webpoints.x.push(px);
		this.webpoints.y.push(py);
		context.fillStyle = "rgb("+this.color.r+", "+this.color.g+", "+this.color.b+")";   
		context.strokeStyle = "rgba("+this.color.r+", "+this.color.g+", "+this.color.b+","+this.color.a/255+")";
		context.beginPath();
		context.arc(px,py,1,0,Math.PI*2,true);
		context.closePath();
		context.fill();
		for (var i = 0; i < this.webpoints.x.length; i++) {
			ix = this.webpoints.x[i];
			iy = this.webpoints.y[i];
			if(BB.MathUtils.dist(px,py,ix,iy)<50){
				context.lineWidth = 1;
				context.beginPath();
				context.moveTo(px,py);
				context.lineTo(ix,iy);
				context.closePath();
				context.stroke();
			}
		}

	} 

	context.restore();
};


