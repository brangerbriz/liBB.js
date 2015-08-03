var canvas     = document.getElementById('canvas');
var ctx        = canvas.getContext('2d');
var logo = new logo(ctx);
var WIDTH, HEIGHT;
var star, planet, comet;


function setup() {
    
    window.onresize = function() {
        WIDTH = canvas.width = window.innerWidth;
        HEIGHT = canvas.height = window.innerHeight;
    }
    
    window.onresize();

    star = new BB.Particle2D({
        position: new BB.Vector2( WIDTH/2, HEIGHT/2 ),
        radius: 30,
        mass: 20000
    });

    planet = new BB.Particle2D({
        position: new BB.Vector2( WIDTH/2+200, HEIGHT/2 ),
        heading: -Math.PI / 2,
        speed: 10
    });

    comet = new BB.Particle2D({
        position: new BB.Vector2( BB.MathUtils.randomInt(WIDTH), BB.MathUtils.randomInt(HEIGHT) ),
        velocity: new BB.Vector2( BB.MathUtils.randomInt(10), BB.MathUtils.randomInt(10) )
    });
}

function update() {
    // update logo
    logo.update( star )

    // update planet
    // planet.gravitate( star );                
    // planet.gravitate( star.position, star.mass );
    planet.gravitate( { x:WIDTH/2, y:HEIGHT/2 }, 20000 );
    planet.update();

    // update comet
    comet.gravitate([ star, planet ]);
    comet.update();
}

function draw() {
    ctx.clearRect( 0, 0, WIDTH, HEIGHT );
                
    // draw logo ( ie. star )
    logo.draw();

    // draw planet              
    ctx.beginPath();
    ctx.arc( planet.position.x, planet.position.y, 15, 0, Math.PI*2 );
    ctx.closePath();
    ctx.fill();

    // draw comet
    var sz = 10;
    ctx.fillRect( comet.position.x-sz/2, comet.position.y-sz/2, sz, sz  );
}


setup();

setInterval(function(){
    update();
    draw();
}, 1000/60);
