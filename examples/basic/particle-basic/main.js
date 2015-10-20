var canvas     = document.createElement('canvas');
var ctx        = canvas.getContext('2d');
document.body.appendChild(canvas);
document.body.className = "radial-black";

var mouseInput = new BB.MouseInput(canvas);
var pointer    = new BB.Pointer(mouseInput);

var color, prevX, prevY, color, WIDTH, HEIGHT, particles = [];

function setup() {
    
    window.onresize = function() {
        WIDTH = canvas.width = window.innerWidth;
        HEIGHT = canvas.height = window.innerHeight;
    }
    
    window.onresize();

    color = new BB.Color();
}

function update() {

    requestAnimationFrame(update);

    mouseInput.update();
    pointer.update();
    
    if (pointer.isDown) {
        createParticle(pointer.x, pointer.y, prevX, prevY);
    }

    for (var i = 0; i < particles.length; i++) {
        
        particles[i].update();
        if (particles[i].velocity.x == 0 &&
            particles[i].velocity.y == 0) {
            particles[i].velocity.set(BB.MathUtils.randomFloat(-1, 1),
                                      BB.MathUtils.randomFloat(-1, 1));
        }

        if (checkEdges(particles[i], particles[i].mass/10)) {
            particles.splice(i, 1);
            if (i > 0) i--;
        }



        if( Math.abs(particles[i].velocity.x) > 2 || Math.abs(particles[i].velocity.y) > 2  ){
            particles[i].mass+=2;
        } else {
            particles[i].mass--;
        }

        if( particles[i].mass <= 10 ){
            particles.splice(i, 1);
            if (i > 0) i--;
        }
    }
    
    prevX = pointer.x;
    prevY = pointer.y;

    draw();
}

function draw() {
    ctx.clearRect(0,0,WIDTH,HEIGHT);

    for (var i = 0; i < particles.length; i++) {
        ctx.fillStyle = particles[i].color;
        ctx.beginPath();
        ctx.arc(particles[i].position.x, 
                particles[i].position.y,
                particles[i].mass/10,
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
        mass: BB.MathUtils.randomInt(100, 300),
        maxSpeed: 2
    });

    color.shift(2);
    particle.color = color.rgb;
    particles.push(particle);
}

function checkEdges(particle, radius) {

    return (particle.position.x - radius > window.innerWidth || 
            particle.position.x + radius < 0 ||
            particle.position.y - radius > window.innerHeight ||
            particle.position.y + radius < 0);
}

setup();
update();

