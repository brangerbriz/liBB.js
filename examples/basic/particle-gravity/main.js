var canvas     = document.getElementById('canvas');
var ctx        = canvas.getContext('2d');
var mouseInput = new BB.MouseInput(canvas);
var pointer    = new BB.Pointer(mouseInput);

var prevX, prevY, color, particles = [], gravitators = [];

function setup() {
    
    

    window.onresize = function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    window.onresize();

    document.body.style.backgroundColor = "#FF8CD9";

    color = new BB.Color();

    for (var i = 0; i < 5; i++) {
        gravitators.push({
            position: new BB.Vector2(BB.MathUtils.randomInt(0, window.innerWidth),
                                     BB.MathUtils.randomInt(0, window.innerHeight)),
            mass: BB.MathUtils.randomInt(1000, 5000)
        });
    }

}

function update() {

    mouseInput.update();
    pointer.update();
    
    if (pointer.isDown) {
        createParticle(pointer.x, pointer.y, prevX, prevY);
    }
    
    for (var i = 0; i < particles.length; i++) {
        particles[i].gravitateArray(gravitators);
        particles[i].update();
    }

    // if (typeof particles[0] !== 'undefined') {
    //     console.log(particles[0].position);    
    // }
    
    prevX = pointer.x;
    prevY = pointer.y;
}

function draw() {

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);    
    ctx.fillStyle = '#cc3399';

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

    ctx.fillStyle = '#7F2060';

    for (i = 0; i < gravitators.length; i++) {
        ctx.beginPath();
        ctx.arc(gravitators[i].position.x, 
                gravitators[i].position.y,
                gravitators[i].mass/50,
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

    particles.push(particle);
}

setup();

setInterval(function(){
    update();
    draw();
}, 1000/60);
