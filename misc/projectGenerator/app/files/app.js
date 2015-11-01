var nw = require('nw.gui');
var win = nw.Window.get();

var canvas     = document.createElement('canvas');
var ctx        = canvas.getContext('2d');
document.body.appendChild(canvas);
document.body.className = "radial-grey";

var WIDTH, HEIGHT;
var color = new BB.Color();

function setup() {
    
    window.onresize = function() {
        WIDTH = canvas.width = window.innerWidth;
        HEIGHT = canvas.height = window.innerHeight;
    }

    document.onkeypress = function(e){
      var e = window.event || e;
      if(e.keyCode == 17) win.close(); // cntrl + Q
      if(e.keyCode == 6 ) (win.isKioskMode) ? nw.Window.get().leaveKioskMode() : nw.Window.get().enterKioskMode(); // cntrl + F
      if(e.keyCode == 7) (document.body.style.cursor=="") ? document.body.style.cursor = "none" : document.body.style.cursor = ""; // cntrl + G
    }
    
    window.onresize();

}

function update() {
   requestAnimationFrame(update);

   color.shift(1)

   draw();
}


function draw() {
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    ctx.fillStyle = color.rgb;
    ctx.fillRect( WIDTH/2-50,HEIGHT/2-50,100,100 );
}

setup();
update();