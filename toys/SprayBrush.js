
function SprayBrush(config){

	BB.BaseBrush2D.call(this, config);

	this.controllerModuleHasIsDown = false;

}

SprayBrush.prototype = Object.create(BB.BaseBrush2D.prototype);
SprayBrush.prototype.constructor = SprayBrush;



SprayBrush.prototype.update = function(controllerModule) {

	BB.BaseBrush2D.prototype.update.call(this, controllerModule);

	if (controllerModule.hasOwnProperty('isDown')) {
		this.controllerModuleHasIsDown = true;
		this.hidden = (controllerModule.isDown === false);
	} else {
		this.controllerModuleHasIsDown = false;
	}

};

// BB.DynaBrush2D.prototype.drip = function( x,y,s,c,d, ctx ) {  
// 	y += Date.now()*0.05-d;
// 	var a = BB.MathUtils.map(this.color.a/255, 0, 1, 0.25, 1);
// 	ctx.beginPath();
// 	ctx.fillStyle = c;
// 	ctx.arc(x,y,s,0,Math.PI*2,true); 
// 	ctx.fill(); ctx.closePath();
// };


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

SprayBrush.prototype.draw = function(context) {

	context = BB.BaseBrush2D.prototype.draw.call(this, context);

	context.save();   

	// draw down here...
	if (this.controllerModuleHasIsDown && !this.hidden || !this.controllerModuleHasIsDown) {


	        var r = BB.MathUtils.map(this.height, 0, 200, 1, 80); 
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
	            // helper(this.x+rx,this.y+ry,sz,curCol, now, context,time*i);
	           
	            // setTimeout(function(){
	            // 	this.drip(this.x+rx,this.y+ry,sz,curCol, now, context);
	            // }, time*i);

	            this.drip(this.x+rx,this.y+ry,sz,curCol, now, context, time*i);

	        }  
	} 

	context.restore();
};


