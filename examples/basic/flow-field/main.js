var canvas = document.createElement('canvas');
canvas.id = 'canvas';
document.body.appendChild(canvas);

document.body.className = "radial-grey";

var ctx        = canvas.getContext('2d');
var mouseInput = new BB.MouseInput(canvas);

var WIDTH, HEIGHT, agents = [];
var color = new BB.Color();
var flowField = null;

function setup() {
    
    window.onresize = function() {
        WIDTH = canvas.width = window.innerWidth;
        HEIGHT = canvas.height = window.innerHeight;
    }
    
    window.onresize();

    flowField = new BB.FlowField2D(40, WIDTH, HEIGHT);

    var amount = 50; //gui -name amount

    for (var i = 0; i < amount; i++) {
        
        var agent = new BB.Agent2D({
            maxSpeed: 6, //gui -name maxSpeed -min 5 -max 10
            position: new BB.Vector2( Math.random() * WIDTH, Math.random() * HEIGHT ),
            velocity: new BB.Vector2( BB.MathUtils.randomFloat(-1,1), BB.MathUtils.randomFloat(-5,5) ),
            radius: 50
        });

        agents.push(agent);
    };
}

function update() {
    
    requestAnimationFrame(update);

    mouseInput.update();

    var mouse = new BB.Vector2(mouseInput.x, mouseInput.y);

    flowField.generateNoiseField(Date.now() * 0.0005, 0.1);

    for (var i = 0; i < agents.length; i++) {

        agents[i].applyForce(flowField.lookup(agents[i].position.x, agents[i].position.y));

        agents[i].update();

        // atari style boarders
        if (agents[i].position.x < -agents[i].radius)  
            agents[i].position.x = WIDTH + agents[i].radius;

        if (agents[i].position.y < -agents[i].radius)  
            agents[i].position.y = HEIGHT + agents[i].radius;

        if (agents[i].position.x > WIDTH + agents[i].radius) 
            agents[i].position.x = -agents[i].radius;

        if (agents[i].position.y > HEIGHT + agents[i].radius) 
            agents[i].position.y = -agents[i].radius;

    };

    draw();
}

function draw() {
    
    ctx.clearRect(0,0,WIDTH,HEIGHT);

    flowField.drawDebug(ctx, 0, 0, WIDTH, HEIGHT, false);

    var width = 30;
    var height = 50;

    for (var i = 0; i < agents.length; i++) {
       
        ctx.fillStyle = color.hex;
        ctx.save();
        ctx.translate(agents[i].position.x, agents[i].position.y);
    
        // add 90 degrees to rotate triangle (which is drawn pointy side up)
        ctx.rotate(agents[i].heading + BB.MathUtils.degToRad(90));
        ctx.beginPath();
        ctx.moveTo(-width/2, height/2);
        ctx.lineTo(0, - height/2);
        ctx.lineTo(width/2, height/2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    };

}

setup();
update();
