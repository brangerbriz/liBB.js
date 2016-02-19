        if ( window.innerWidth === 0 ) { window.innerWidth = parent.innerWidth; window.innerHeight = parent.innerHeight; }
			var canvas     = document.createElement('canvas');
			var ctx        = canvas.getContext('2d');
			document.body.appendChild(canvas);
			document.body.className = "radial-grey";
			var canvasX = 0; // var obtained from LeapMotion that will give an X coordinate
			var canvasY = 0; // var obtained from LeapMotion that will give an Y coordinate
			// canvasX and CanvasY will replace point.x and pointer.y 
			var logo       = new logo(ctx); // toys object
			var gravity    = new BB.Vector2(); // default 0
			var LeapMotion;
			var WIDTH, HEIGHT, ball,
		    prevX = prevY = 0 ,
			spin = 0.01;

		function setup() {
				
				LeapMotion = new BB.LeapMotion();// creates an instance of the LeapMotion module created for liBB library
				// 
				LeapMotion.GetLeapData(canvas,true,true); // gives canvas and enables X,Y tracking and enables gestures
				
				    window.onresize = function() {
			        WIDTH = canvas.width = window.innerWidth ;
			        HEIGHT = canvas.height = window.innerHeight;
			    }
			    window.onresize();
			    ball = new BB.Particle2D({
			        position: new BB.Vector2( Math.random()*WIDTH, Math.random()*HEIGHT ),
			        radius: 30,
			        friction: 0.9 //gui -name friction -max 1 -step 0.05
			    });
    	}
		function update() {

				canvasX = LeapMotion.canvasX; // puts the value obtained from sensor to the var created
				canvasY = LeapMotion.canvasY; // puts the value obtained from sensor to the var created


				// test in console that the gestures are being captured.
				if(LeapMotion.grab){
					console.log("Grab Gesture");
				}
				if(LeapMotion.pinch){
					console.log("Pinch Gesture");
				}
			    if(LeapMotion.circle){
			    	if(LeapMotion.clockwise){console.log(" Circle clockwise");}
			        else{console.log("Circle Gesture");}
			        console.log(LeapMotion.circleradius);
			    }
				
			    requestAnimationFrame(update);
			    ball.spring({
			    	position: new BB.Vector2(canvasX,canvasY),// now assigns the X,Y values to the position
			    	k:0.01,
			    	length: 100
			    });
			    gravity.y = 0; //gui -name gravity.y -min 0.0 -max 1.0 -steps 0.1
			    ball.applyForce( gravity );
			    ball.update();
			    // animate logo spin
			    if( BB.MathUtils.dist(ball.position.x, ball.position.y, prevX, prevY ) > 10 ){
			        spin = ( spin >= 0.3 ) ? 0.3 : spin+=0.005;
			    } else {
			        spin = ( spin <= 0 ) ? 0 : spin-=0.005;
			    }
			    logo.rotation += spin;
			    logo.update( ball );
			    prevX = ball.position.x;
			    prevY = ball.position.y;
			    draw();
		}
        // canvasX and CanvasY will replace point.x and pointer.y 
		function draw() {
			    ctx.clearRect(0,0,WIDTH,HEIGHT);
			    // draw string
			    var distance = BB.MathUtils.dist( canvasX, canvasY, ball.position.x, ball.position.y );
			    if(distance>500) distance = 500;
			    ctx.lineWidth = BB.MathUtils.map( distance, 0, 500, 5, 1);
			    ctx.beginPath();
			    ctx.moveTo(canvasX,canvasY);// assigns the values so that now the object moves using data from leapmotion sensor
			    ctx.lineTo( ball.position.x, ball.position.y );
			    ctx.closePath();
			    ctx.stroke();
			    // draw logo
			    logo.draw();
		}
			setup();
			update();
