// audio ~ ~ ~ * ~ ~ ~ * ~ ~ ~ * ~ ~ ~ * ~ ~ ~ * ~ ~ ~ 
// 
BB.Audio.init();

var fft = new BB.AudioAnalyser();

var O = new BB.AudioTone({ 
	connect: fft.node,
	volume: 0.5
});

var settings = { // for dat.gui
	attack: 0.1,
	release:1.0,
	chords: ["NONE","maj","min","dim","7","min7","maj7","sus4","7sus4","6","min6","aug","7-5","7+5","min7-5","min/maj7","maj7+5","maj7-5","9","min9","maj9","7+9","7-9","7+9-5","6/9","9+5","9-5","min9-5","11","min11","11-9","13","min13","maj13","add9","minadd9","sus2","5"],
	chord: "NONE",
	scales: ["major","naturalminor","harmonicminor","melodicminor","majorpentatonic","minorpentatonic","blues","minorblues","majorblues","augmented","diminished","phrygiandominant","dorian","phrygian","lydian","mixolydian","locrian","jazzmelodicminor","dorianb2","lydianaugmented","lydianb7","mixolydianb13","locrian#2","superlocrian","wholehalfdiminished","halwholediminished","enigmatic","doubleharmonic","hungarianminor","persian","arabian","japanese","egyptian","hirajoshi","nickfunk1","nickfunk2"],
	arpeggiate: false,
	arpeggioSpeed: 0.2,
	scale: "major",
	randomizeArp: function(){
		arpOrder = [];
		var max = O.scales[this.scale].length;
		var length = BB.MathUtils.randomInt( 2, max );
		for (var i = 0; i < length; i++) {
			// arpOrder.push( Math.floor(Math.random()*O.scales[settings.scale].length-1) );
			arpOrder.push( BB.MathUtils.randomInt(0,O.scales[settings.scale].length-1) );
		};
		console.log("arp: "+arpOrder)
	}
}

var kd = []; // which canvas-drawing-of-keys are pressed
var arp = null; // arpeggiator interval loop
var arpOrder = [0,1,2,3];
var arpPos = -1;

function playKey( root, semitones, canvaskey ){
	if(settings.arpeggiate){
		if(arp===null){ 
			O.createScale( settings.scale, O.freq( root, semitones ) );
			arpeggiator();
			arp = setInterval( arpeggiator, settings.arpeggioSpeed*1000 );
		}
	} else {
		if(settings.chord!=="NONE"){
			O.chordOn({
				frequency: O.freq( root, semitones ),
				attack: settings.attack,
				type: settings.chord
			});
		} else {
			O.noteOn( O.freq( root, semitones ), 1, settings.attack); 
		}		
	}

	kd[canvaskey]=true;
}

function releaseKey(root, semitones, canvaskey ){
	if(settings.arpeggiate){
		clearInterval( arp );
		arp=null;
		arpPos=-1;
	} else {
		if(settings.chord!=="NONE"){
			O.chordOff({
				frequency: O.freq( root, semitones ),
				release: settings.release,
				type: settings.chord
			});
		} else {
			O.noteOff( O.freq( root, semitones ), settings.release); 
		}
	}
	kd[canvaskey]=false; 
}


function arpeggiator(){
	arpPos++;
	if(arpPos>arpOrder.length-1) arpPos=0;
	var freq = O.scales[settings.scale][ arpOrder[arpPos] ];
 	
 	O.makeNote({ 
      type: "sine", 
      frequency: freq, 
      duration: settings.arpeggioSpeed,
      attack: 0,//settings.attack,
      release:0//settings.release
    });
}


// canvas ~ ~ ~ * ~ ~ ~ * ~ ~ ~ * ~ ~ ~ * ~ ~ ~ * ~ ~ ~ 
// 
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

function drawKeyboard( keys, x,y,w,h ){
	// draw white keys
	for (var i = 0; i < keys; i++) {
		ctx.strokeStyle = "#ccc";
		ctx.strokeRect((i*w)+x, (y)*h, w, h  );
	};
	for (var i = 0; i < keys; i++) {
		if(kd[i]===true) {
			ctx.fillStyle = "#e40477";
			ctx.fillRect((i*w)+x, (y)*h, w, h  );
		}
	};
	// draw black keys
	var flats = [];
	for (var i = 0; i < keys; i++) {
		ctx.fillStyle = "#ccc";		
		if( i%7==1 || i%7==2 || i%7==4 || i%7==5 || i%7==6 ){
			ctx.fillRect(  (i*w)+x-(w/4), (y)*h, w/2, h/2 );
			flats.push((i*w)+x-(w/4))
		}
	};
	for (var i = 13; i < kd.length; i++) {
		if(kd[i]===true) {
			ctx.fillStyle = "#e40477";
			ctx.fillRect(  flats[i-13], (y)*h, w/2, h/2 );
		}
	};
}

function drawWaveForm( FFT, X, W, H ){	
    var tdata = FFT.getByteTimeDomainData();
	ctx.lineWidth = 2;
	ctx.strokeStyle = "#e40477";
	ctx.beginPath();
	var sliceWidth = W * 1.0 / tdata.length;
	var x = X;
    for (var i = 0; i < tdata.length; i++) {
    	var v = tdata[i] / 128.0;
    	var y = v * H;		
		if(i===0) ctx.moveTo(x,y);
		else ctx.lineTo(x,y);		
		x+=sliceWidth;
    }
	ctx.lineTo(WIDTH-X,H);
	ctx.stroke();
}

function draw() {
   requestAnimationFrame(draw);
    ctx.clearRect(0,0,WIDTH,HEIGHT);

    var keys = 13;
	var ksize = WIDTH/20;
    var pianoX = WIDTH/2-(ksize*keys)/2;
	var pianoW = ksize * keys;

    drawKeyboard( keys, pianoX, 0, ksize, HEIGHT/2 );
    drawWaveForm( fft, pianoX, pianoW, HEIGHT/4 );
}

setup();
draw();


// keyboard ~ ~ ~ * ~ ~ ~ * ~ ~ ~ * ~ ~ ~ * ~ ~ ~ * ~ ~ ~ 
// 
document.onkeydown=function(e){
    var e=window.event || e
 	switch(e.keyCode){
		case 81:   playKey(264,0, 0);  break; // C
		case 50:   playKey(264,1,13);  break; // C#
		case 87:   playKey(264,2, 1);  break; // D
		case 51:   playKey(264,3,14);  break; // D#
		case 69:   playKey(264,4, 2);  break; // E
		case 82:   playKey(264,5, 3);  break; // F
		case 53:   playKey(264,6,15);  break; // F#
		case 84:   playKey(264,7, 4);  break; // G
		case 54:   playKey(264,8,16);  break; // G#
		case 89:   playKey(264,9, 5);  break; // A
		case 55:   playKey(264,10,17); break; // A#
		case 85:   playKey(264,11, 6); break; // B
		case 73:   playKey(264,12, 7); break; // C
		case 57:   playKey(264,13,18); break; // C#
		case 79:   playKey(264,14, 8); break; // D
		case 48:   playKey(264,15,19); break; // D#
		case 80:   playKey(264,16, 9); break; // E
		case 219:  playKey(264,17,10); break; // F
		case 187:  playKey(264,18,20); break; // F#
		case 221:  playKey(264,19,11); break; // G
		case 220:  playKey(264,21,12); break; // A ( instead of G# )

    }
}
document.onkeyup=function(e){
    var e=window.event || e
 	switch(e.keyCode){
		case 81:   releaseKey(264,0, 0);  break; // C
		case 50:   releaseKey(264,1,13);  break; // C#
		case 87:   releaseKey(264,2, 1);  break; // D
		case 51:   releaseKey(264,3,14);  break; // D#
		case 69:   releaseKey(264,4, 2);  break; // E
		case 82:   releaseKey(264,5, 3);  break; // F
		case 53:   releaseKey(264,6,15);  break; // F#
		case 84:   releaseKey(264,7, 4);  break; // G
		case 54:   releaseKey(264,8,16);  break; // G#
		case 89:   releaseKey(264,9, 5);  break; // A
		case 55:   releaseKey(264,10,17); break; // A#
		case 85:   releaseKey(264,11, 6); break; // B
		case 73:   releaseKey(264,12, 7); break; // C
		case 57:   releaseKey(264,13,18); break; // C#
		case 79:   releaseKey(264,14, 8); break; // D
		case 48:   releaseKey(264,15,19); break; // D#
		case 80:   releaseKey(264,16, 9); break; // E
		case 219:  releaseKey(264,17,10); break; // F
		case 187:  releaseKey(264,18,20); break; // F#
		case 221:  releaseKey(264,19,11); break; // G
		case 220:  releaseKey(264,21,12); break; // A ( instead of G# )		
    }
}

// ----------------------------------------------------
// ------------------------     -----------------------
// ------------------------ dat -----------------------
// ------------------------ gui -----------------------
// ------------------------     -----------------------
// ----------------------------------------------------
var dat_gui_lib = document.createElement('script');
dat_gui_lib.setAttribute('src','../../assets/js/dat.gui.bb.min.js');
document.body.appendChild(dat_gui_lib);
dat_gui_lib.onload = function(){

    var gui = new dat.GUI();  

    var types = [ "sine", "square", "sawtooth", "triangle" ];
    gui.add(O, 'volume', 0, 1);
    gui.add(O, 'type', types );
    gui.add(settings, 'attack', 0, 0.5).step(0.1);
    gui.add(settings, 'release', 0, 3).step(0.1);
    
    var chord = gui.addFolder('Chords');
    chord.add(settings, 'chord', settings.chords);

    var arp = gui.addFolder('Arpeggio');
    arp.add(settings, 'arpeggiate').name('toggle arpeggiate');
    arp.add(settings, 'scale', settings.scales).onChange(function(){
    	setTimeout(function(){
    		arpOrder=[];
			for (var i = 0; i < O.scales[settings.scale].length; i++) arpOrder.push( i );
    	},1000);
    });
    arp.add(settings, 'arpeggioSpeed', 0.1, 1.0).step(0.1);
    arp.add(settings,"randomizeArp");

}