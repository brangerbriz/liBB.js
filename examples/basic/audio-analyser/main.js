BB.Audio.init();

var fft = new BB.AudioAnalyser();

var katy = new BB.AudioSampler({
	connect: fft.analyser,
	fireworks: '../../assets/audio/katy.ogg'
}, function( bufferObj ){
	draw();
	katy.play('fireworks', 0, 0.5, 7.4);
});


// canvas

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

    // frequency spectrum
    var fdata = fft.getByteFrequencyData();
	ctx.fillStyle="#e40477";
    for (var i = 0; i < fdata.length; i++) {
    	var value = fdata[i];
 		var percent = value / 256;
		var height = HEIGHT * percent;
		var offset = HEIGHT - height - 1;
		var barWidth = WIDTH/fdata.length;
		ctx.fillRect(i * barWidth, offset, barWidth, height);
    };

    // waveform 
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
