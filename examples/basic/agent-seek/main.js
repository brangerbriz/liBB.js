var canvas     = document.createElement('canvas');
canvas.id = 'canvas';
document.body.appendChild(canvas);

var ctx        = canvas.getContext('2d');
var gravity    = new BB.Vector2();
var mouseInput = new BB.MouseInput(canvas);

var WIDTH, HEIGHT, agents = [];

function setup() {
    
    window.onresize = function() {
        WIDTH = canvas.width = window.innerWidth;
        HEIGHT = canvas.height = window.innerHeight;
    }
    
    window.onresize();

    var amount = 50; //gui -name amount
    for (var i = 0; i < amount; i++) {
        
        var agent = new BB.Agent2D({
            position: new BB.Vector2( Math.random()*WIDTH, Math.random()*HEIGHT ),
            velocity: new BB.Vector2( BB.MathUtils.randomFloat(-1,1), BB.MathUtils.randomFloat(-5,5) ),
            radius: BB.MathUtils.randomInt(15, 30),
            elasticity: 0.1 //gui -name elasticity -min 0.0 -max 0.5 -steps 0.01
        });

        agent.collide({
            top: 0,
            right: canvas.width,
            bottom: canvas.height,
            left: 0
        });

        agents.push(agent);
    };
}

function update() {
    
    requestAnimationFrame(update);

    gravity.y = 0; //gui -name gravity.y -max 0.5 -steps 0.1

    mouseInput.update();

    var mouse = new BB.Vector2(mouseInput.x, mouseInput.y);

    for (var i = 0; i < agents.length; i++) {

        agents[i].seek(mouse, 0.1, 100);

        agents[i].applyForce(gravity);

        agents[i].update();
    };

    draw();
}

function draw() {
    
    ctx.clearRect(0,0,WIDTH,HEIGHT);

    var width = 30;
    var height = 50;

    for (var i = 0; i < agents.length; i++) {
       
        ctx.fillStyle = "#cc3399";
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
