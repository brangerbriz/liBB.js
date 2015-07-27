var canvas     = document.getElementById('canvas');
var ctx        = canvas.getContext('2d');
var mouseInput = new BB.MouseInput(canvas);
var pointer    = new BB.Pointer(mouseInput);

var prevX, prevY, particles = [];

function setup() {
    
    window.onresize = function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    window.onresize();

}

function update() {

    mouseInput.update();
    pointer.update();
    
    if (pointer.isDown) {
        createParticle(pointer.x, pointer.y, prevX, prevY);
    }

    console.log('There are ' + particles.length + ' particles:');
    console.log(particles);
    for (var i = 0; i < particles.length; i++) {
        // particles[i].gravitateArray(particles);
        particles[i].update();
    }

    if (typeof particles[0] !== 'undefined') {
        console.log(particles[0].position);    
    }
    
    prevX = pointer.x;
    prevY = pointer.y;
}

function draw() {

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.fillStyle = '#cc3399';

    for (var i = 0; i < particles.length; i++) {
    
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
    particles.push(new BB.Particle2D({
        position: pos,
        velocity: pos.clone().sub(new BB.Vector2(prevX, prevY)),
        mass: BB.MathUtils.randomInt(10, 30),
        maxSpeed: 1
    }));
}

setup();

setInterval(function(){
    update();
    draw();
}, 1000/60);
