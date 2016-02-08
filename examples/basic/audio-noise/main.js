
// audio .~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._
// .~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._
BB.Audio.init();

// var reverb = BB.Audio.context.createConvolver();
// var rGain = BB.Audio.context.createGain();
// 	reverb.connect( rGain );
// 	rGain.connect( BB.Audio.context.destination );	

// var xhr = new XMLHttpRequest();
// xhr.open("GET", '../../assets/audio/impulse_rev.wav', true);
// xhr.responseType = "arraybuffer";
// xhr.onreadystatechange = function() {
// 	if (xhr.readyState === 4) {
// 		if (xhr.status < 300 && xhr.status > 199 || xhr.status === 302) {
// 			BB.Audio.context.decodeAudioData(xhr.response, function(buffer) {
// 				reverb.buffer = buffer;
// 			}, function(e) {
// 				if (e) console.log("Error decoding data" + e);
// 			});
// 		}
// 	}
// };
// xhr.send(null);


var fft = new BB.AudioAnalyser({
	// connect: reverb
});


var brown = new BB.AudioNoise({
	connect: fft.node,
	type: "brown"
});

var white = new BB.AudioNoise({
	connect: fft.node,
	volume: 0.5,
	type: "white"
});


// Noise can be used to generate anykind of sound buffer
// here's a sine wave calculated from scratch
var custom = new BB.AudioNoise({
	connect: fft.node,
	volume: 0.5,
	type: function(){
		var frameCount = this.ctx.sampleRate * this.duration;
		// loop through channels
		for (var ch = 0; ch < this.channels; ch++) {
			var data = this.buffer.getChannelData( ch );
			// loop through entire length of buffer
			for (var i = 0; i < frameCount; i++) {
				data[i] = Math.sin(i/30);
			};
		};	
	}
});

// reverb.buffer = custom.buffer;


// make buttons
function makeBtn( obj, txt ){
	btn = document.createElement('button');
	btn.innerHTML = txt;
	btn.className = "center btn";
	btn.onclick = function(){
		obj.makeNoise();
	}
	document.body.appendChild(btn);
}
makeBtn( white, 'white noise' );
makeBtn( brown, 'brown noise' );
makeBtn( custom, 'sine wave' );

// canvas .~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._
// .~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._

var canvas     = document.createElement('canvas');
var ctx        = canvas.getContext('2d');
canvas.className = "absolute";
document.body.appendChild(canvas);
document.body.className = "radial-black";

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
    BB.A2VUtils.drawTimeDomainData( fft, canvas );
}

// load A2VUtils.js addon
var a2v = document.createElement('script');
a2v.setAttribute('src','../../assets/js/A2VUtils.js');
document.body.appendChild(a2v);
a2v.onload = function(){ setup(); draw(); }
