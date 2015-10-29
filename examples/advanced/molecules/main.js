var canvas     = document.createElement('canvas');
var ctx        = canvas.getContext('2d');
document.body.appendChild(canvas);
document.body.className = "radial-grey";

var mouseInput = new BB.MouseInput(canvas);
var pointer    = new BB.Pointer(mouseInput);

var WIDTH, HEIGHT;
var mouseDown = false;
var molecules = [];
var particles = [];

function makeMolecule( x, y ){

    var n = BB.MathUtils.randomInt(1,3);
    var balls = [];
    var targs = [];

    for (var i = 0; i < n; i++) {
        
        var px = x;//BB.MathUtils.randomInt( x-100, x+100 );
        var py = y;//BB.MathUtils.randomInt( y-100, y+100 );
        var vx = BB.MathUtils.randomInt( -10, 10 );
        var vy = BB.MathUtils.randomInt( -10, 10);
        var ball = new BB.Particle2D({
            position: new BB.Vector2( px, py ),
            velocity: new BB.Vector2( vx, vy ),
            friction: 0.95,
            radius: 15
        });
        
        ball.k = 0.1,       // for springs
        ball.length = 100   // for springs

        balls.push( ball );
        particles.push( ball )
    }; 

    // 2 spring targets per ball
    if( n > 1 ){
        for (var i = 0; i < n; i++) {
            
            var a = (i+1==n) ? 0 : i+1;
            var b = (i+2>=n) ? (i+2>n) ? 1 : 0 : i+2;
            targs.push([ balls[ a ], balls[ b ] ]); 
        };      
    }
    
    molecules.push( { balls:balls, targs:targs } );    
}

//             


function setup() {
    
    window.onresize = function() {
        
        WIDTH = canvas.width = window.innerWidth;
        HEIGHT = canvas.height = window.innerHeight;
    }
    
    window.onresize();

    document.body.addEventListener("mousedown", function(e) {
        mouseDown=true; 
    });
    document.body.addEventListener("mouseup", function(e) {
        mouseDown=false; 
        makeMolecule( e.clientX, e.clientY );
    });


    ctx.fillStyle = "#cc3399";
    makeMolecule( WIDTH/2, HEIGHT/2 );
}


function update() {
    
    requestAnimationFrame(update);

    mouseInput.update();
    pointer.update();

   for (var j = 0; j < molecules.length; j++) {
                    
        var balls = molecules[j].balls;
        var targs = molecules[j].targs;

        for (var i = 0; i < balls.length; i++) {

            // spring
            if( molecules[j].balls.length > 1 ) 
                balls[i].spring( targs[i] );

            // collide
            balls[i].collide({
                top: 0,
                bottom: HEIGHT,
                left: 0,
                right: WIDTH,
                particles: particles
            });

            // gravitate
            if( mouseDown && BB.MathUtils.dist(balls[i].position.x, balls[i].position.y, pointer.x, pointer.y) > 200 )
                balls[i].gravitate({ x:pointer.x, y:pointer.y }, 10000 );

            // update
            balls[i].update();
        };
    };

    draw();
}


function draw() {
    ctx.clearRect(0,0,WIDTH,HEIGHT);

    for (var j = 0; j < molecules.length; j++) {
                    
        var balls = molecules[j].balls;
        var targs = molecules[j].targs;     

        if( typeof targs !== "undefined"){
            for (var i = 0; i < balls.length; i++) {
                var t = (i-1<0) ? balls.length-1 : i-1;
                // draw line
                ctx.beginPath();
                ctx.moveTo( balls[t].position.x, balls[t].position.y );
                ctx.lineTo( balls[i].position.x, balls[i].position.y );
                ctx.closePath();
                ctx.stroke();
            };  
        }
        
        for (var i = 0; i < balls.length; i++) {
            // draw ball                
            ctx.beginPath();
            ctx.arc( balls[i].position.x, balls[i].position.y, balls[i].radius, 0, Math.PI*2 );
            ctx.closePath();
            ctx.fill();
        };
    }
}


setup();
update();
