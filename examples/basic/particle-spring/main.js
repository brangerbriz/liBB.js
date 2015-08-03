var canvas     = document.getElementById('canvas');
var ctx        = canvas.getContext('2d');
var mouseInput = new BB.MouseInput(canvas);
var pointer    = new BB.Pointer(mouseInput);
var logo       = new logo(ctx); // toys object

var WIDTH, HEIGHT, ball, 
    prevX = prevY = 0 , 
    spin = 0.01;

function setup() {
    
    window.onresize = function() {
        WIDTH = canvas.width = window.innerWidth;
        HEIGHT = canvas.height = window.innerHeight;
    }
    
    window.onresize();

    ball = new BB.Particle2D({
        position: new BB.Vector2( Math.random()*WIDTH, Math.random()*HEIGHT ),
        radius: 30,
        friction: 0.95
    });
}

function update() {
    mouseInput.update();
    pointer.update();

    ball.spring({
        position: pointer,
        k: 0.01,
        length: 100
    });
    ball.update();



    if( BB.MathUtils.dist(ball.position.x, ball.position.y, prevX, prevY ) > 10 ){
        spin = ( spin >= 0.3 ) ? 0.3 : spin+=0.005;
    } else {
        spin = ( spin <= 0 ) ? 0 : spin-=0.005;
    }
    logo.rotation += spin;
    logo.update( ball );

    prevX = ball.position.x;
    prevY = ball.position.y;
}

function draw() {
    ctx.clearRect(0,0,WIDTH,HEIGHT);

    var distance = BB.MathUtils.dist( pointer.x, pointer.y, ball.position.x, ball.position.y );
    if(distance>500) distance = 500;
    ctx.lineWidth = BB.MathUtils.map( distance, 0, 500, 5, 1);
    ctx.beginPath();
    ctx.moveTo(pointer.x, pointer.y);
    ctx.lineTo( ball.position.x, ball.position.y );
    ctx.closePath();
    ctx.stroke();

    logo.draw();
}


setup();

setInterval(function(){
    update();
    draw();
}, 1000/60);
