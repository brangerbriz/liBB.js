
// BB LOGO OBJECT 
// ../n!ck 
// 
function logo( ctx, x, y, radius ){

	this.context = ctx;
	
	this.position = { 
		x: 0 || x, 
		y: 0 || y 
	};
	
	this.radius = radius || 30;
	
	this.color = {
		r:204,
		g:51,
		b:153,
		a:1,
		hex:'#cc3399'
	};

	this.bcolor = "#ffffff";
	
	this.rotation = 0;

	this.update = function( target ){
		this.position = target.position;
   		this.radius = target.radius;
	}
	
	this.draw = function(){
		this.context.save();
		this.context.translate(this.position.x, this.position.y);
		this.context.rotate(this.rotation);
		this.context.fillStyle ='rgba('+this.color.r+','+this.color.g+','+this.color.b+','+this.color.a+')'
		this.context.strokeStyle = this.color.hex;
		this.context.beginPath();
    	this.context.arc(0,0,this.radius,0,Math.PI*2,true); 
    	this.context.stroke();
    	this.context.fill();
    	this.context.fillStyle = this.bcolor;
    	this.context.fillRect( -this.radius*0.36, -this.radius*0.44, this.radius*0.88, this.radius*0.2 );
		this.context.fillRect( -this.radius*0.56, -this.radius*0.08, this.radius*1.08, this.radius*0.2 );
		this.context.fillRect( -this.radius*0.56, +this.radius*0.28, this.radius*1.08, this.radius*0.2 );
		this.context.fillRect( -this.radius*0.36, -this.radius*0.32, this.radius*0.2,  this.radius*0.28);
		this.context.fillRect( +this.radius*0.32, -this.radius*0.32, this.radius*0.2,  this.radius*0.28);
		this.context.fillRect( -this.radius*0.56, +this.radius*0.04, this.radius*0.2,  this.radius*0.28);
		this.context.fillRect( +this.radius*0.32, +this.radius*0.04, this.radius*0.2,  this.radius*0.28);
    	this.context.restore();
	}
}

