var canvas     = document.createElement('canvas');
var ctx        = canvas.getContext('2d');
document.body.appendChild(canvas);
document.body.className = "radial-grey";

var mouseInput = new BB.MouseInput(canvas);
var pointer    = new BB.Pointer(mouseInput);
var logo       = new logo(ctx); // toys object
var gravity    = new BB.Vector2(); // default 0 

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
        friction: 0.95 //gui -name friction -max 1 -step 0.05
    });
}

function update() {
    
    requestAnimationFrame(update);

    mouseInput.update();
    pointer.update();

    // update ball
    ball.spring({
        position: pointer,
        k: 0.01, //gui -name k -min 0.001 -max 0.3 -step 0.001
        length: 100 //gui -name length -max 200
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

function draw() {
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    // draw string
    var distance = BB.MathUtils.dist( pointer.x, pointer.y, ball.position.x, ball.position.y );
    if(distance>500) distance = 500;
    ctx.lineWidth = BB.MathUtils.map( distance, 0, 500, 5, 1);
    ctx.beginPath();
    ctx.moveTo(pointer.x, pointer.y);
    ctx.lineTo( ball.position.x, ball.position.y );
    ctx.closePath();
    ctx.stroke();
    // draw logo
    logo.draw();
}


setup();
update();
