
// create BB AudioContext
BB.Audio.init();

var fft = new BB.AudioAnalyser();
	fft.volume = 0; // to avoid feedback from speakers :) 

// create AudioStream
var mic = new BB.AudioStream({
	connect: fft
});



// canvas -----------------------------------------

var canvas     = document.createElement('canvas');
var ctx        = canvas.getContext('2d');
document.body.appendChild(canvas);
document.body.className = "radial-grey";

var WIDTH, HEIGHT;

function setup() {
    window.onresize = function() {
        WIDTH = canvas.width = window.innerWidth;
        HEIGHT = canvas.height = window.innerHeight;
    }
    window.onresize();
}

function draw() {
	requestAnimationFrame(draw);
    ctx.clearRect(0,0,WIDTH,HEIGHT);

    // draw waveform 
    var tdata = fft.getByteTimeDomainData();
	ctx.lineWidth = BB.MathUtils.map(fft.getAmplitude(), 0,45, 0,10);
	ctx.strokeStyle = "#000000";
	ctx.beginPath();
	var sliceWidth = WIDTH * 1.0 / tdata.length;
	var x = 0;
    for (var i = 0; i < tdata.length; i++) {
    	var v = tdata[i] / 128.0;
    	var y = v * HEIGHT/2;		
		if(i===0) ctx.moveTo(x,y);
		else ctx.lineTo(x,y);		
		x+=sliceWidth;
    }
	ctx.lineTo(WIDTH,HEIGHT/2);
	ctx.stroke();   
}

setup();
draw();

// create play buttons to open/close stream  ---------------

var streamBtn = document.createElement('button');
	streamBtn.innerHTML = "open stream";
	streamBtn.className = "abs btn";
	streamBtn.onclick = function(){
		if(!mic.stream){
			mic.open();
			streamBtn.innerHTML = "close stream";
		} else {
			mic.close();
			streamBtn.innerHTML = "open stream";
		}
	}
document.body.appendChild(streamBtn);

document.body.className = "radial-grey";
