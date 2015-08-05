var canvas     = document.getElementById('canvas');
var ctx        = canvas.getContext('2d');

var WIDTH, HEIGHT;

function setup() {
    
    window.onresize = function() {
        WIDTH = canvas.width = window.innerWidth;
        HEIGHT = canvas.height = window.innerHeight;
    }
    
    window.onresize();

}


function update() {

}


function draw() {
    ctx.clearRect(0,0,WIDTH,HEIGHT);

}


setup();

setInterval(function(){
    update();
    draw();
}, 1000/60);
