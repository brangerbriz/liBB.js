var canvas     = document.createElement('canvas');
var ctx        = canvas.getContext('2d');
document.body.appendChild(canvas);
document.body.className = "radial-grey";

var WIDTH, HEIGHT;

function setup() {
    
    window.onresize = function() {
        WIDTH = canvas.width = window.innerWidth;
        HEIGHT = canvas.height = window.innerHeight;
    }
    
    window.onresize();

}


function update() {
   requestAnimationFrame(update);

   // update code goes here...

   draw();
}


function draw() {
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    
}

setup();
update();
