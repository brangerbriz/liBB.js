var canvas     = document.createElement('canvas');
var ctx        = canvas.getContext('2d');
document.body.appendChild(canvas);
document.body.className = "radial-grey";

var WIDTH, HEIGHT;
var SIZE = 100;
var mouse = new BB.MouseInput( canvas );
var pointer = new BB.Pointer( mouse );

var pen = new BB.LineBrush2D({
	color: new BB.Color(0,0,0),
	weight: SIZE,
  variant: "ink"
});

var spray = new SprayBrush({
  color: new BB.Color(),
  weight: SIZE
});

var rainbow = new RainbowBrush({
	color: new BB.Color(0,0,0,200),
  weight: SIZE*2
});

var burst = new BB.ImageBrush2D({
    variant: 'seal',
    color: new BB.Color(0,0,0,50),
    width: SIZE,
    height: SIZE
});


var currentBrush = pen;


function setup() {
    window.onresize = function() {
        WIDTH = canvas.width = window.innerWidth;
        HEIGHT = canvas.height = window.innerHeight;
    }
    window.onresize();
}

// pointer.on('activestop', function(x, y){
//   if( currentBrush == pen ){
//     if( pen.color.hex == "#f47321" ) pen.color.hex = "#005030";
//     else pen.color.hex = "#f47321";
//   }
// });


function update() {
    requestAnimationFrame(update);

    mouse.update();
    pointer.update();
   
    currentBrush.update( pointer );
    if (currentBrush == burst) {
      currentBrush.rotation += 1;
    }
    else if(currentBrush == spray ){
      currentBrush.color.shift(4);
    }

   draw();
}


function draw() {

    currentBrush.draw( ctx );


}

setup();
update();


// UI ----------------
// 
function selected( ele ){
  inkbrush.style.backgroundColor = "#fff";
  inkbrush.style.color = "#000";
  spraybrush.style.backgroundColor = "#fff";
  spraybrush.style.color = "#000";
  rainbowbrush.style.backgroundColor = "#fff";
  rainbowbrush.style.color = "#000";
  //
  ele.style.backgroundColor = "#e40477";
  ele.style.color = "#fff";
}

var erase = document.createElement('button');
  erase.innerHTML = "erase";
  erase.className = "abs-right btn";
  erase.onclick = function(){
    ctx.clearRect(0,0,WIDTH,HEIGHT);
  }
document.body.appendChild(erase);


var inkbrush = document.createElement('button');
  inkbrush.innerHTML = "inkbrush";
  inkbrush.className = "abs-right btn";
  inkbrush.onclick = function(){
    currentBrush = pen;
    selected( this );
  }
document.body.appendChild(inkbrush);
inkbrush.style.top = inkbrush.clientHeight*1 + 20 +"px";

var spraybrush = document.createElement('button');
  spraybrush.innerHTML = "spraybrush";
  spraybrush.className = "abs-right btn";
  spraybrush.onclick = function(){
    currentBrush = spray;
    selected( this );
  }
document.body.appendChild(spraybrush);
spraybrush.style.top = spraybrush.clientHeight*2 + 30 +"px";

var rainbowbrush = document.createElement('button');
  rainbowbrush.innerHTML = "rainbowbrush";
  rainbowbrush.className = "abs-right btn";
  rainbowbrush.onclick = function(){
    currentBrush = rainbow;
    selected( this );
  }
document.body.appendChild(rainbowbrush);
rainbowbrush.style.top = rainbowbrush.clientHeight*3 + 40 +"px";

var burstbrush = document.createElement('button');
  burstbrush.innerHTML = "burstbrush";
  burstbrush.className = "abs-right btn";
  burstbrush.onclick = function(){
    currentBrush = burst;
    selected( this );
  }
document.body.appendChild(burstbrush);
burstbrush.style.top = burstbrush.clientHeight*4 + 50 +"px";

var changesize = document.createElement('input');
  changesize.setAttribute('type','range');
  changesize.style.position = "absolute";
  changesize.style.left = "10px";
  changesize.style.top = "10px";
  changesize.onchange = function(){
    SIZE = this.value*2;
    pen.weight = SIZE;
    spray.weight = SIZE;
    rainbow.weight = SIZE;
    burst.width = burst.height = SIZE;
  }
document.body.appendChild(changesize);
selected( inkbrush );
