// audio ~ ~ ~ * ~ ~ ~ * ~ ~ ~ * ~ ~ ~ * ~ ~ ~ * ~ ~ ~ 
// 
BB.Audio.init();

var fft = new BB.AudioAnalyser();

var O = new BB.AudioTone({ 
	connect: fft,
	volume: 0.5
});


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

function draw() {
	requestAnimationFrame(draw);
    ctx.clearRect(0,0,WIDTH,HEIGHT);

    // draw waveform 
    var tdata = fft.getByteTimeDomainData();
	ctx.lineWidth = 3;
	ctx.strokeStyle = "#e40477";
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
    var settings = {
    	frequency: 440,
    	attack: 0.1,
    	sustain: 0.5,
    	release:0.2,
    	type: "sine",
    	makeNote: function(){ 
    		O.makeNote({ 
    			frequency: this.frequency,
    			attack: this.attack,
    			sustain: this.sustain,
    			release: this.release
    		});
    	},
    	randomize: function(){
    		O.type = types[Math.floor(Math.random()*types.length)];
    		O.makeNote({
    			frequency: this.frequency=Math.random()*1800+200,	
    			attack: this.attack=Math.random()*3,
    			sustain: this.sustain=Math.random()*3,
    			release: this.release=Math.random()*3
    		});
    	}
    }

    gui.add(O, 'volume', 0, 1);
    gui.add(settings, 'frequency', 200, 2000 ).listen();
    gui.add(O, 'type', types ).listen();
    gui.add(settings, 'attack', 0, 3).step(0.1).listen();
    gui.add(settings, 'sustain', 0, 3).step(0.1).listen();
    gui.add(settings, 'release', 0, 3).step(0.1).listen();
    gui.add(settings, 'makeNote');
    gui.add(settings, 'randomize');

}