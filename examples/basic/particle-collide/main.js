var canvas     = document.getElementById('canvas');
var ctx        = canvas.getContext('2d');

var WIDTH, HEIGHT, balls = [];

function setup() {
    
    window.onresize = function() {
        WIDTH = canvas.width = window.innerWidth;
        HEIGHT = canvas.height = window.innerHeight;
    }
    
    window.onresize();

    for (var i = 0; i < 50; i++) {
        
        var ball = new BB.Particle2D({
            position: new BB.Vector2( Math.random()*WIDTH, Math.random()*HEIGHT ),
            velocity: new BB.Vector2( BB.MathUtils.randomFloat(-1,1), BB.MathUtils.randomFloat(-5,5) ),
            radius: BB.MathUtils.randomInt(15, 30),
            elasticity: 0.1
        });

        balls.push( ball );
    };
}

function update() {
    for (var i = 0; i < balls.length; i++) {

        balls[i].collide({
            top:0,
            right: WIDTH,
            bottom: HEIGHT,
            left: 0,
            particles: balls
        });

        balls[i].update();

    };
}

function draw() {
    ctx.clearRect(0,0,WIDTH,HEIGHT);

    for (var i = 0; i < balls.length; i++) {
        ctx.fillStyle = "#cc3399";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc( balls[i].position.x, balls[i].position.y, balls[i].radius, 0, Math.PI*2 );
        ctx.closePath();
        ctx.fill();
    };
}


setup();

setInterval(function(){
    update();
    draw();
}, 1000/60);
