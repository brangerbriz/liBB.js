
// create BB AudioContext ------------------------------------
BB.Audio.init();

// create AudioSampler[s]
var drum = new BB.AudioSampler({
	kick: '../../assets/audio/808/kick.ogg',
	snare: '../../assets/audio/808/snare.ogg',
	hat: '../../assets/audio/808/hat.ogg'
});

var kBeats = [];
var katyDuration;
var katy = new BB.AudioSampler({
	fireworks: '../../assets/audio/katy.ogg',
}, function( bufferObj ){
	katyDuration = bufferObj.fireworks.duration;
	kBeats[0] = Math.random()*katyDuration;
	kBeats[1] = Math.random()*katyDuration;
	kBeats[2] = Math.random()*katyDuration; 
	console.log( bufferObj )
});

// create AudioSequencer
var track = new BB.AudioSequencer({
	tempo: 120,

	whole: function( time ){ 
		drum.play('kick', time );
		katy.play('fireworks', time, kBeats[0], 0.25);
	},
	quarter: function( time ){ 
		drum.play('snare', time );
		katy.play('fireworks', time, kBeats[1], 0.25);
	},
	sixteenth: function( time ){
		drum.play('hat', time );
		katy.play('fireworks', time, kBeats[2], 0.25);
	}
});


// canvas animation -----------------------------------------
var canvas     = document.createElement('canvas');
var ctx        = canvas.getContext('2d');
document.body.appendChild(canvas);
document.body.className = "radial-grey";

var WIDTH, HEIGHT;
var sample = ["kick","snare","hat","katy"];
var s = 5; // inset for current sample
var sampler = { drums:true, katy:true }

function setup() {
    window.onresize = function() {
        WIDTH = canvas.width = window.innerWidth;
        HEIGHT = canvas.height = window.innerHeight;
        ctx.strokeStyle = "#ccc";
        ctx.fillStyle = "#e40477";
        ctx.textAlign = "right";
        ctx.font = '16px Arial';
	}
    window.onresize();
}

function update() {
   requestAnimationFrame(update);

   if(track.isPlaying) track.update();

   if(sampler.drums) drum.setGain(1);
   else drum.setGain(0);

   if(sampler.katy) katy.setGain(1);
   else katy.setGain(0);

   draw();
}


function draw() {
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    ctx.font = '16px Arial';
    ctx.fillStyle = "#e40477";

    // draw grid ...
    ctx.strokeRect(100,75,(WIDTH-400),200);
    for (var i = 0; i < 16; i++) {
    	ctx.strokeRect( 100+(i*(WIDTH-400)/16), 75, 1, 200 );
    };
    for (var i = 0; i < 4; i++) {
    	ctx.fillText(sample[i], 90, 110+(i*(200/4)));
    	ctx.strokeRect( 100, 75+(i*(200/4)), (WIDTH-400), 1 );
    };

    ctx.fillRect(100,75+150,(WIDTH-400),2);
    
    // draw drum samples ... 
    if(sampler.drums){    		
	    if(track.note==0) s=0; else s=5;
		ctx.fillRect(100+s, 75+s, ((WIDTH-400)/16)-(s*2), (200/4)-(s*2) );
		for (var i = 0; i < 4; i++) {
			if( (!track.multitrack && i>0) || track.multitrack ){
				if(track.note==(i*4)) s=0; else s=5;
				ctx.fillRect(100+(i*(WIDTH-400)/4)+s, 75+50+s, (WIDTH-400)/16-(s*2), 200/4-(s*2));
			}
		};
		for (var i = 0; i < 16; i++) {
			if( (!track.multitrack && i%4!==0) || track.multitrack ){
				if(track.note==i) s=0; else s=5;
				if(track.noteResolution==1 && i%2) {}
				else if(track.noteResolution==2 && i%4) {}
				else 
				ctx.fillRect(100+(i*(WIDTH-400)/16)+s, 75+100+s, (WIDTH-400)/16-(s*2), 200/4-(s*2));
			}
		};
	}

	// draw katy samples ...
	if(sampler.katy){	
		ctx.font = '12px Arial';
		for (var i = 0; i < 16; i++) {	
			if(track.note==i) s=0; else s=5;
			
			if(track.noteResolution==1 && i%2) {}
			else if(track.noteResolution==2 && i%4) {}
			else {
				// squares...
				ctx.fillStyle = "#e40477";
				ctx.fillRect(100+(i*(WIDTH-400)/16)+s, 75+150+s, (WIDTH-400)/16-(s*2), 200/4-(s*2)); 
				// sample times...
				ctx.fillStyle = "#fff";
				if(i==0)
				 	ctx.fillText(Math.round(kBeats[0]*100)/100, 100+((WIDTH-400)/16)+ i*((WIDTH-400)/16)-10, 243);	
				if( ((!track.multitrack && i>0) || track.multitrack) && i%4==0 )
					ctx.fillText(Math.round(kBeats[1]*100)/100, 100+((WIDTH-400)/16)+ i*((WIDTH-400)/16)-10, 255);
				if( (!track.multitrack && i%4!==0) || track.multitrack )
					ctx.fillText(Math.round(kBeats[2]*100)/100, 100+((WIDTH-400)/16)+ i*((WIDTH-400)/16)-10, 267);
			}

		};
	}

	// play head
	ctx.fillStyle = "#e40477";
	if(track.note>0) // ie. has started playing
		ctx.fillRect(100+(track.note*(WIDTH-400)/16), 75, 2, 200 );
	    
}

setup();
update();

// ----------------------------------------------------
// ------------------------     -----------------------
// ------------------------ dat -----------------------
// ------------------------ gui -----------------------
// ------------------------     -----------------------
// ----------------------------------------------------
var gui;
var dat_gui_lib = document.createElement('script');
dat_gui_lib.setAttribute('src','../../assets/js/dat.gui.min.js');
document.body.appendChild(dat_gui_lib);
dat_gui_lib.onload = function(){

    gui = new dat.GUI();  
    var buttons = {
    	updateHTML: function(){
    		if(track.isPlaying){
				gui.domElement.childNodes[1].childNodes[0].childNodes[0].childNodes[0].innerHTML = "stop";
				gui.domElement.childNodes[1].childNodes[1].childNodes[0].childNodes[0].innerHTML = "pause";
			} else {
				gui.domElement.childNodes[1].childNodes[0].childNodes[0].childNodes[0].innerHTML = "play (from start)"; 
				gui.domElement.childNodes[1].childNodes[1].childNodes[0].childNodes[0].innerHTML = "play (from pause)";
			}
    	},
    	stop: function(){  
			if(katy.loaded){
				track.toggle(); // DEFAULT TOGGLE FUNCTION ( START/STOP )
			}
			this.updateHTML();
    	},
    	pause: function(){  
			if(katy.loaded){
				track.toggle("pause"); // PLAY/PAUSE TOGGLE FUNCTION
			}
			this.updateHTML();
    	},
    	ranKaty: function(){
    		kBeats[0] = Math.random()*katyDuration;
			kBeats[1] = Math.random()*katyDuration;
			kBeats[2] = Math.random()*katyDuration; 
    	}
    }

    gui.add(buttons, 'stop').name('play (from start)');
    gui.add(buttons, 'pause').name('play (from pause)');

    gui.add(sampler,"drums");
    gui.add(sampler,"katy");

    gui.add(buttons,"ranKaty").name('randomize katy samples');

    gui.add(track, 'tempo', 10, 250).step(1); 

    gui.add(track,'multitrack');
    gui.add(track, 'noteResolution', 0, 2).step(1); 


}