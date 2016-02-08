BB.Audio.init();

var fft = new BB.AudioAnalyser();

var katy = new BB.AudioSampler({
	connect: fft,
	fireworks: '../../assets/audio/katy.ogg'
}, function( bufferObj ){
	draw();
	katy.play('fireworks', 0, 30, 47);
	// loop
	setInterval(function(){
		katy.play('fireworks',0,30,47);
	},47000);
});

// via Chris Wilson >> https://github.com/cwilso/PitchDetect
var noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function noteFromPitch( frequency ) {
	var noteNum = 12 * (Math.log( frequency / 440 )/Math.log(2) );
	return Math.round( noteNum ) + 69;
}
function frequencyFromNoteNumber( note ) {
	return 440 * Math.pow(2,(note-69)/12);
}
function centsOffFromPitch( frequency, note ) {
	return Math.floor( 1200 * Math.log( frequency / frequencyFromNoteNumber( note ))/Math.log(2) );
}

// canvas ---------------------------------------------

var canvas     = document.createElement('canvas');
var ctx        = canvas.getContext('2d');
document.body.appendChild(canvas);
document.body.className = "radial-grey";

var WIDTH, HEIGHT;
var pitch, note, detune, copy;

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
    ctx.fillStyle = "#000";

    pitch = fft.getPitch();
 	note =  noteFromPitch( pitch );
 	detune = centsOffFromPitch( pitch, note );
 	if(pitch == -1) note = "--";
 	ctx.font = WIDTH/4+'px BB';
 	ctx.textBaseline = 'top';
 	ctx.textAlign = 'center';
 	if(pitch > -1)
 		ctx.fillText( noteStrings[note%12], WIDTH/2, 150 );

 	ctx.fillStyle = "#e40477";
 	ctx.fillRect(WIDTH/2,80,detune*2,15);
    ctx.fillStyle = "#000";
 	ctx.fillRect(WIDTH/2,75, 2, 25);
 	ctx.font = "32px Arial";
 	ctx.textAlign = 'right';
 	ctx.fillText('♭          ',WIDTH/2,70);
 	ctx.textAlign = 'left';
 	ctx.fillText('          ♯',WIDTH/2,70);
 	ctx.textAlign = 'center';
 	ctx.fillStyle = "#e40477"; 	
 	ctx.fillText( Math.round(pitch)+"Hz", WIDTH/2, HEIGHT-100);
    
}

setup();
