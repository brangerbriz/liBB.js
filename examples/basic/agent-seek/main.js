var canvas = document.createElement('canvas');
canvas.id = 'canvas';
document.body.appendChild(canvas);

document.body.className = "radial-grey";

var ctx        = canvas.getContext('2d');
var gravity    = new BB.Vector2();
var mouseInput = new BB.MouseInput(canvas);
var color      = new BB.Color();
var maxForce = 0.1 //gui -name maxForce -min 0.1 -max 1.0 -step 0.1

var WIDTH, HEIGHT, agent;

function setup() {
    
    window.onresize = function() {
        WIDTH = canvas.width = window.innerWidth;
        HEIGHT = canvas.height = window.innerHeight;
    }
    
    window.onresize();
    
    agent = new BB.Agent2D({
        // NOTE: setting the maxSpeed too high can cause the 'arrive' behavior not to work
        maxSpeed: 5, //gui -name maxSpeed -min 1 -max 5 -step 1 
        position: new BB.Vector2( Math.random()*WIDTH, Math.random()*HEIGHT ),
        velocity: new BB.Vector2( BB.MathUtils.randomFloat(-1,1), BB.MathUtils.randomFloat(-5,5) ),
        radius: BB.MathUtils.randomInt(15, 30)
    });
}

function update() {
    
    requestAnimationFrame(update);

    mouseInput.update();

    var mouse = new BB.Vector2(mouseInput.x, mouseInput.y);

    agent.seek(mouse, maxForce, 150);
    agent.applyForce(gravity);
    agent.update();

    draw();
}

function draw() {
    
    ctx.clearRect(0,0,WIDTH,HEIGHT);

    var width = 30;
    var height = 50;
       
    ctx.fillStyle = color.hex;
    ctx.save();
    ctx.translate(agent.position.x, agent.position.y);

    // add 90 degrees to rotate triangle (which is drawn pointy side up)
    ctx.rotate(agent.heading + BB.MathUtils.degToRad(90));
    ctx.beginPath();
    ctx.moveTo(-width/2, height/2);
    ctx.lineTo(0, - height/2);
    ctx.lineTo(width/2, height/2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}


setup();
update();
