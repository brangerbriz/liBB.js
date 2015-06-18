
	
	var mouseInput = new BBModMouseInput();

	var pointer = new BBModPointer();

	var starBrush = new BBModShapeBrush({
		variant: "star",
		rotation: 45
	});

	var brushManager = new BBModBrushManager({
		tracking: [
			starBrush
		]
	});

	var arrows = [];
	var agents = [];



	document.onmousedown = function(e){

		var agent = new BBModAutoAgent({
			groupSteering: true
		});

		var arrow = new BBModShapeBrush({
			variant: "arrow"
		});

		arrows.push( arrow );
		agents.push( agent );

	}


	function update(){
			
		brushManager.update();
		
		//
		pointer.update(mouseInput);
		
		starBrush.update(pointer);
		starBrush.x = pointer.x + Math.random()*50;
		starBrush.color.h ++;


		for (var i = 0; i < agents.length; i++) {
			agents[i].follow( mouseInput );
			arrows[i].update( agents[i] );
		};


			
	}



	function draw(){
		requestAnimationFrame(draw);
		ctx.clearRect( 0, 0, canvas.width, canvas.height );

		brushManager.draw();

		for (var i = 0; i < arrows.length; i++) {
			arrows[i].draw();
		};



	}