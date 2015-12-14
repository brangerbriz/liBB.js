/**
 * A pseudo-random spray-can style brush with drip animation. extends from BB.BaseBrush2D
 * @class SprayBrush
 * @constructor
 * @extends BB.BaseBrush2D
 * @param {Object} [config] A optional config object ( see BB.BaseBrush2D for list of properties )
 */
function SprayBrush(config){

	BB.BaseBrush2D.call(this, config);

	this.controllerModuleHasIsDown = false;
	
	this.weight = (typeof config !== "undefined" && typeof config.weight !== "undefined") ? config.weight : 50;

	// if( this.weight )

}

SprayBrush.prototype = Object.create(BB.BaseBrush2D.prototype);
SprayBrush.prototype.constructor = SprayBrush;


/**
 * Update method. Usually called once per animation frame.
 * @method update
 * @param {Object} controllerModule An object with x and y properties and
 * optionally an isDown boolean (used for starting and stopping
 * spray).
 */
SprayBrush.prototype.update = function(controllerModule) {

	BB.BaseBrush2D.prototype.update.call(this, controllerModule);

	if (controllerModule.hasOwnProperty('isDown')) {
		this.controllerModuleHasIsDown = true;
		this.hidden = (controllerModule.isDown === false);
	} else {
		this.controllerModuleHasIsDown = false;
	}

};

/**
 * called in draw() to animate post-drip effect
 * @param  {Number} x    xposition of parent paint splotch
 * @param  {Number} y    y-position of partent paint splotch
 * @param  {Number} s    randomized drip size
 * @param  {String} c    current SprayBrush color (as rgba string)
 * @param  {Number} d    time parent paint splotch was made
 * @param  {Object} ctx  HTML5 Canvas Context
 * @param  {Number} time delay time
 */
SprayBrush.prototype.drip = function( x,y,s,c,d, ctx, time ) {  

	setTimeout(function(x,y,s,c,d, ctx){
		
		y += Date.now()*0.05-d;
		// var a = BB.MathUtils.map(this.color.a/255, 0, 1, 0.25, 1);
		ctx.beginPath();
		ctx.fillStyle = c;
		ctx.arc(x,y,s,0,Math.PI*2,true); 
		ctx.fill(); ctx.closePath();	
	    
	}, time, x,y,s,c,d, ctx);
};

/**
 * Draws the brush to the context. Usually called once per animation frame.
 * @method draw
 * @param {Object} context The HTML5 canvas context you would like to draw
 * to.
 */
SprayBrush.prototype.draw = function(context) {

	context = BB.BaseBrush2D.prototype.draw.call(this, context);

	context.save();   

	// draw down here...
	if (this.controllerModuleHasIsDown && !this.hidden || !this.controllerModuleHasIsDown) {


		// var r = BB.MathUtils.map(this.weight, 0, 200, 1, 80); 
		var r = this.weight;
		var rx = (Math.random()*r/2) * Math.cos(Math.random()*Math.PI*2);
		var ry = (Math.random()*r/2) * Math.sin(Math.random()*Math.PI*2);
		var add = (r>10) ? r/10 : 1;
		var mult = (r>35) ? 10 : 5;
		var size = (Math.random()*mult) + add;
		var a = BB.MathUtils.map(this.color.a/255, 0, 1, 0.25, 1);
		context.beginPath();
		context.fillStyle = "rgba("+this.color.r+", "+this.color.g+", "+this.color.b+","+a+")";    
		context.arc(this.x+rx,this.y+ry,size,0,Math.PI*2,true); // main larger splotch
		context.fill(); context.closePath();
		for (var i = 0; i < 5; i++) { // sprinkle
			subSize = (size*0.2>=1) ? Math.random()*size-size*0.2 : Math.random()*size;
			context.arc(this.x+((Math.random()*r)-r/2),this.y+((Math.random()*r)-r/2),Math.abs(subSize),0,Math.PI*2,true);
			context.fill(); context.closePath();
		}
		var now = Date.now()*0.05;
		var sz = Math.random()*3;
		var time = (Math.random()*3)+8;
		var curCol = context.fillStyle;
		for (var i = 0; i < Math.round(r*0.8); i++) {   // drip on larger splotch
			this.drip(this.x+rx,this.y+ry,sz,curCol, now, context, time*i);
		}  
	} 

	context.restore();
};


