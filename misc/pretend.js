
	
	var mouseInput = new BBModMouseInput();

	var selection; // keep track of current selection from GUI

	var pointer = new BBModPointer({
		manager: brushManager
	});

	var starBrush = new BBModShapeBrush({
		variant: "star",
		rotation: 45,
		manager: brushManager
	});

	var poopBrush = new BBModShapeBrush({
		variant: "poop",
		rotation: 45,
		manager: brushManager
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
			
		//brushManager.update();
		
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

		switch(selection){
			case "star" : starBrush.draw(); break;
			case "poop" : poopBrush.draw(); break;
		}

		brushManager.draw();
		

		for (var i = 0; i < arrows.length; i++) {
			arrows[i].draw();
		};



	}