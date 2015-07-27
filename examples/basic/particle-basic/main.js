var canvas     = document.getElementById('canvas');
var ctx        = canvas.getContext('2d');
var mouseInput = new BB.MouseInput(canvas);
var pointer    = new BB.Pointer(mouseInput);

var prevX, prevY, color, particles = [];

function setup() {
    
    window.onresize = function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    window.onresize();

    document.body.style.backgroundColor = "#000";

    color = new BB.Color();
}

function update() {

    mouseInput.update();
    pointer.update();
    
    if (pointer.isDown) {
        createParticle(pointer.x, pointer.y, prevX, prevY);
    }

    for (var i = 0; i < particles.length; i++) {
        particles[i].update();
    }
    
    prevX = pointer.x;
    prevY = pointer.y;
}

function draw() {

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);    

    for (var i = 0; i < particles.length; i++) {
        ctx.fillStyle = particles[i].color;
        ctx.beginPath();
        ctx.arc(particles[i].position.x, 
                particles[i].position.y,
                particles[i].mass,
                0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
    }
}

function createParticle(x, y, prevX, prevY) {
    
    var pos = new BB.Vector2(x, y);

    var acc = (x == prevX && y == prevY) ? 
        new BB.Vector2(BB.MathUtils.randomFloat(-1, 1),
                       BB.MathUtils.randomFloat(-1, 1)) 
        : pos.clone().sub(new BB.Vector2(prevX, prevY));
 
    var particle = new BB.Particle2D({
        position: pos,
        acceleration: acc,
        mass: BB.MathUtils.randomInt(10, 30),
        maxSpeed: 2
    });

    color.shift(2);
    particle.color = color.getRGB();
    particles.push(particle);
}

setup();

setInterval(function(){
    update();
    draw();
}, 1000/60);
