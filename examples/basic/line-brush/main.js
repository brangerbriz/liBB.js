var canvas     = document.createElement('canvas');
var ctx        = canvas.getContext('2d');
document.body.appendChild(canvas);
document.body.className = "radial-grey";

var WIDTH, HEIGHT;
var mouse = new BB.MouseInput( canvas );
var pointer = new BB.Pointer( mouse );

var pen = new BB.LineBrush2D({
	color: new BB.Color(),
	weight: 20,
	width: 25,
	variant: "solid"
});

function setup() {
    window.onresize = function() {
        WIDTH = canvas.width = window.innerWidth;
        HEIGHT = canvas.height = window.innerHeight;
    }
    
    window.onresize();

}


window.addEventListener('load', function(){ // on page load
 
    document.body.addEventListener('touchstart', function(e){
        alert(e.changedTouches[0].pageX) // alert pageX coordinate of touch point
    }, false)
 
}, false);


function update() {
   requestAnimationFrame(update);

   mouse.update();
   pointer.update();
   pen.update( pointer );

   draw();
}


function draw() {

    pen.draw( ctx );

}

setup();
update();


// UI ----------------

function selected( ele ){
	for (var i = 1; i < buttons.length; i++) {
		buttons[i].style.backgroundColor = "#fff";
		buttons[i].style.color = "#000";
	};
	ele.style.backgroundColor = "#e40477";
	ele.style.color = "#fff";
}

var buttons = [];
var names = ['erase','solid','ink','ink-osc','soft','lines','calligraphy'];
for (var i = 0; i < 7; i++) {
	
	var btn = document.createElement('button');
		btn.innerHTML = names[i];
		btn.className = "abs-right btn";
		btn.name = names[i];
		if(i==0){
			btn.onclick = function(){
				ctx.clearRect(0,0,WIDTH,HEIGHT);
			}			
		} else {
			btn.onclick = function(){
				pen.variant = this.name;
				selected( this );
			}
		}

	buttons.push( btn )
	document.body.appendChild( btn );
	if(i>0)
		buttons[i].style.top = buttons[i].clientHeight*i + ((i+1)*10) +"px";
};

selected( buttons[1] );

