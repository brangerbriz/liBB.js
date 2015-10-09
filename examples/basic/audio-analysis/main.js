// audio
var context =  new (window.AudioContext || window.webkitAudioContext)();

var fft = new BB.AudioAnalyser({ context: context });

katy = new BB.AudioSampler({
	context: context,
	fireworks: '../../assets/audio/katy.ogg'
}, function( bufferObj ){
	draw();
	play();
});

function play(){
	if(katy.loaded){
		katy.connect( fft.analyser );
		// play fireworks immediately for a few seconds ( from 0.5 to 7.4 )
		katy.play('fireworks', 0, 0.5, 7.4);
	}
}


// canvas
var canvas     = document.getElementById('canvas');
var ctx        = canvas.getContext('2d');

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


    var fdata = fft.getByteFrequencyData();
	ctx.fillStyle="black";
    for (var i = 0; i < fdata.length; i++) {
    	var value = fdata[i];
 		var percent = value / 256;
		var height = HEIGHT * percent;
		var offset = HEIGHT - height - 1;
		var barWidth = WIDTH/fdata.length;
		ctx.fillRect(i * barWidth, offset, barWidth, height);
    };


    var tdata = fft.getByteTimeDomainData();
	
	ctx.lineWidth = 2;
	ctx.strokeStyle = "red";
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




// var play = document.createElement('button');
// 	play.innerHTML = "play";
// 	play.onclick = function(){
// 		if(isLoaded) drum.play('kick');
// 	}
// document.body.appendChild(play);