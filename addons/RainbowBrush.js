/**
 * A rainbow brush. extends from BB.BaseBrush2D
 * @class RainbowBrush
 * @constructor
 * @extends BB.BaseBrush2D
 * @param {Object} [config] A optional config object ( see BB.BaseBrush2D for list of properties )
 */
function RainbowBrush(config){

	BB.BaseBrush2D.call(this, config);

	this.controllerModuleHasIsDown = false;

	this.prevX = null;
	this.prevY = null;

	this.weight = (typeof config !== "undefined" && typeof config.weight !== "undefined") ? config.weight : 50;

    this._lineStartedThisFrame = !this.hidden;

    this.context = config.context;

    this.gradient = null;

    this._image = new Image();
    // this._star = '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="200px" height="200px" viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><path fill="rgba(211,197,67,' + this.color.a/255 + ')" d="M143.169,166.502L100,135.139l-43.169,31.363l16.489-50.746L30.152,84.391h53.359L100,33.644l16.489,50.748h53.358 l-43.168,31.365L143.169,166.502z M100,127.723l31.756,23.072l-12.13-37.332l31.757-23.072H112.13L100,53.06L87.87,90.391H48.618 l31.756,23.072l-12.13,37.332L100,127.723z"/></svg>';
    this._star = '<svg version="1.1" id="Your_Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="200px" height="200px" viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve"><path fill="rgba(102,102,102,1)" d="M143.169,166.502L100,135.139l-43.169,31.363l16.489-50.746L30.152,84.391h53.359L100,33.644l16.489,50.748h53.358 l-43.168,31.365L143.169,166.502z M100,127.723l31.756,23.072l-12.13-37.332l31.757-23.072H112.13L100,53.06L87.87,90.391H48.618 l31.756,23.072l-12.13,37.332L100,127.723z"/></svg>';
    this._image.src = 'data:image/svg+xml;base64,' + window.btoa(this._star);
}

RainbowBrush.prototype = Object.create(BB.BaseBrush2D.prototype);
RainbowBrush.prototype.constructor = RainbowBrush;

/**
 * Update method. Usually called once per animation frame.
 * @method update
 * @param {Object} controllerModule An object with x and y properties and
 * optionally an isDown boolean (used for starting and stopping
 * spray).
 */
RainbowBrush.prototype.update = function(controllerModule) {

	BB.BaseBrush2D.prototype.update.call(this, controllerModule);

	if (controllerModule.hasOwnProperty('isDown')) {
		this.controllerModuleHasIsDown = true;
		this.hidden = (controllerModule.isDown === false);
	} else {
		this.controllerModuleHasIsDown = false;
	}

};

RainbowBrush.prototype.grad = function( context, x, y, angle ){
    // calc the topside and bottomside points of the tangent line
    var offX1 = x + (this.weight*0.15) / 2.25 * Math.cos(angle);
    var offY1 = y + (this.weight*0.15) / 2.25 * Math.sin(angle);
    var offX2 = x + (this.weight*0.15) / 2.25 * Math.cos(angle - Math.PI);
    var offY2 = y + (this.weight*0.15) / 2.25 * Math.sin(angle - Math.PI);
    // create a gradient stretching between 
    // the calculated top & bottom points
    var gradient = context.createLinearGradient(offX1, offY1, offX2, offY2);
    gradient.addColorStop(0.00,   'rgba(255,0,0,'+this.color.a/255+')');
    gradient.addColorStop(1 / 12, 'rgba(255,127,0,'+this.color.a/255+')');
    gradient.addColorStop(2 / 12, 'rgba(255,255,0,'+this.color.a/255+')');
    gradient.addColorStop(3 / 12, 'rgba(127,255,0,'+this.color.a/255+')');
    gradient.addColorStop(4 / 12, 'rgba(0,255,0,'+this.color.a/255+')');
    gradient.addColorStop(5 / 12, 'rgba(0,255,127,'+this.color.a/255+')');
    gradient.addColorStop(6 / 12, 'rgba(0,255,255,'+this.color.a/255+')');
    gradient.addColorStop(7 / 12, 'rgba(0,127,255,'+this.color.a/255+')');
    gradient.addColorStop(8 / 12, 'rgba(0,0,255,'+this.color.a/255+')');
    gradient.addColorStop(9 / 12, 'rgba(127,0,255,'+this.color.a/255+')');
    gradient.addColorStop(10 / 12, 'rgba(255,0,255,'+this.color.a/255+')');
    gradient.addColorStop(1.00,   'rgba(255,0,127,'+this.color.a/255+')');

    return (gradient);
}


RainbowBrush.prototype.drawRainbow = function(context) {
    
    if (this.controllerModuleHasIsDown && !this.hidden || !this.controllerModuleHasIsDown) {
  		 	
		if (this._lineStartedThisFrame) {
		    
			context.beginPath();
			context.moveTo(this.x, this.y);

			this._lineStartedThisFrame = false;

		} else { // we are in the middle of the rainbow
			context.save(); 
			var dx = this.x - this.prevX;
			var dy = this.y - this.prevY;
			var angle = Math.atan2( dy, dx ) - Math.PI/2;

			context.lineWidth = this.weight * 0.15;
			context.lineTo(this.x, this.y);
			context.strokeStyle = this.grad( context, this.x, this.y, angle );
			context.stroke();
			context.closePath();
			context.beginPath();
			context.moveTo(this.x, this.y);
			context.restore();
		}
        
	} else {
		this._lineStartedThisFrame = true;
	}
};

RainbowBrush.prototype.drawStars = function(context){
	if (this.controllerModuleHasIsDown && !this.hidden || !this.controllerModuleHasIsDown) {
		
		context.save();  
		this.color.shift(2);
		context.translate(this.x, this.y);
		context.rotate( (Math.random()*2)*Math.PI );
		var size = Math.random()*this.weight/8 + this.weight/16;
		context.drawImage( this._image, 
				Math.random()*this.weight/4 - this.weight/4,
				Math.random()*this.weight/4 - this.weight/4,
				size, size
			);
		context.restore();
	} 	
}


/**
 * Draws the brush to the context. Usually called once per animation frame.
 * @method draw
 * @param {Object} context The HTML5 canvas context you would like to draw
 * to.
 */
RainbowBrush.prototype.draw = function(context) {

	context = BB.BaseBrush2D.prototype.draw.call(this, context);

	this.drawStars( context );
	this.drawRainbow( context );
	this.drawStars( context );
	
	this.prevX = this.x;
	this.prevY = this.y;

};


