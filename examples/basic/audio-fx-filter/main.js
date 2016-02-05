// AUDIO >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

BB.Audio.init();
var offlineContext;
var duration = null;
var filteredBuffer;

var fft = new BB.AudioAnalyser();

var filt = new BB.AudioFX('filter',{
	connect: fft.node,
	type: "allpass",
	frequency: 880
});

var cream = new BB.AudioSampler({
	connect: filt.node,
	instrumental: '../../assets/audio/cream.ogg'
}, function( bufferObj ){

	var buff = bufferObj['instrumental'];	

	duration = buff.duration; 				// set global duration to buffer duration
	time = BB.Audio.context.currentTime;
	cream.play('instrumental'); 			// play track
	loop(); 								// start timeline loop

	drawData = buff; 													// set global drawData to buffer data
	var chnlData = fft.getResampledBufferData( drawData, WIDTH ); 	// resample buffer data for drawing
	drawWaveform( chnlData ); 											// draw waveform 
	
	window.onresize();
});


// offline renderer for drawingWaveform after being effected by filter ........
// 
function updateWaveform( buffer ){
	var offlineContext = new OfflineAudioContext( buffer.numberOfChannels, buffer.length, buffer.sampleRate );
	var source = offlineContext.createBufferSource();
	source.buffer = buffer;
	// mirror filt
	var filter = offlineContext.createBiquadFilter();
	filter.type = filt.node.type;
	filter.frequency.value = filt.frequency;
	filter.Q.value = filt.Q;
	filter.gain.value = filt.gain;
	source.connect(filter);
	filter.connect(offlineContext.destination);
	source.start(0);
	offlineContext.startRendering()
	offlineContext.oncomplete = function(e) {
	  	// filtered buffer 
	 	var chnlData = fft.getResampledBufferData( e.renderedBuffer, WIDTH );
		drawWaveform( chnlData );   // draw waveform from filtered buffer
		drawFilterShape();			// draw filter shape
	};
}

// canvas .........................................

var color = new BB.Color();
	color.createScheme("monochromatic");

var canvas     = document.createElement('canvas');
var ctx        = canvas.getContext('2d');
var canvas2    = document.createElement('canvas');
var ctx2       = canvas2.getContext('2d');	
document.body.appendChild(canvas);
document.body.appendChild(canvas2);
document.body.className = "radial-grey";

var WIDTH, HEIGHT;
var drawData = null;

function setup() {
    window.onresize = function() {
        WIDTH = canvas.width = window.innerWidth - 50;
        HEIGHT = canvas.height = 200;
        canvas2.width = 200;
        canvas2.height = 160;
        canvas.style.position = canvas2.style.position = timeline.style.position = "absolute";
        canvas.style.top = timeline.style.top = "25px";
        canvas2.style.top = "250px";
        canvas.style.left = canvas2.style.left = timeline.style.left = "25px";
        canvas.style.border = canvas2.style.border = "1px solid "+color.schemes.monochromatic[1].hex;
        if(cream.loaded){ // drawData not ready until AudioBuffer loads
        	updateWaveform( drawData );
        }
    }
    window.onresize();
}

function drawWaveform( chnlData ) { 
	for (var ch = 0; ch < chnlData.length; ch++) {
		if(ch==0) ty=HEIGHT*0.25; else ty=HEIGHT*0.74;
		// see: http://stackoverflow.com/a/22103150/1104148 for explination
		ctx.save();
		ctx.translate( 0.5, ty );   
		ctx.scale(1, HEIGHT/2);
		for (var i=0; i< WIDTH; i++) {
			j=i*6;
			// draw from positiveAvg - variance to negativeAvg - variance 
			ctx.strokeStyle = color.schemes.monochromatic[2].hex;
			ctx.beginPath();
			ctx.moveTo( i  , (chnlData[ch][j] - chnlData[ch][j+2] ));
			ctx.lineTo( i  , (chnlData[ch][j +3] + chnlData[ch][j+5] ) );
			ctx.stroke();
			// draw from positiveAvg - variance to positiveAvg + variance 
			ctx.strokeStyle = color.schemes.monochromatic[3].hex;
			ctx.beginPath();
			ctx.moveTo( i  , (chnlData[ch][j] - chnlData[ch][j+2] ));
			ctx.lineTo( i  , (chnlData[ch][j] + chnlData[ch][j+2] ) );
			ctx.stroke();
			// draw from negativeAvg + variance to negativeAvg - variance 
			ctx.beginPath();
			ctx.moveTo( i  , (chnlData[ch][j+3] + chnlData[ch][j+5] ));
			ctx.lineTo( i  , (chnlData[ch][j+3] - chnlData[ch][j+5] ) );
			ctx.stroke();
		}
		ctx.restore();
	};
}


function drawFilterShape(){
	var freqRes = filt.calcFrequencyResponse( canvas2.width ); // << calculate freqency response method

	ctx2.fillStyle = color.schemes.monochromatic[3].hex;
	ctx2.fillRect(0,0,canvas2.width,canvas2.height);
	// maths via: http://webaudioapi.com/samples/frequency-response/
	var dbScale = Math.round(canvas2.height/4);
	var dbScale2 = Math.round(canvas2.height/12.5);
	var pixelsPerDb = (0.5 * canvas2.height) / dbScale;
	ctx2.strokeStyle = color.schemes.monochromatic[2].hex;
	ctx2.lineWidth = 3;
	ctx2.beginPath();
	for (var i = 0; i < canvas2.width; ++i) {
        var mr = freqRes.magResponse[i];
        var dbResponse = dbScale2 * Math.log(mr) / Math.LN10;
        var x = i;
        var y = (0.5 * canvas2.height) - pixelsPerDb * dbResponse;
        if ( i == 0 ) 	ctx2.moveTo( x, y );
        else 			ctx2.lineTo( x, y );
    }
    ctx2.stroke();    
}


// TIMELINE ~ ~ ~ | ~ ~ ~

var mousedown = false;

function skipTo( e ){
	var t = BB.MathUtils.map( e.clientX, 0, innerWidth, 0, duration );
	cream.node.stop();
	cream.play('instrumental',0, t);
	xPos = e.clientX - 25;
	playhead.setAttribute('x1', xPos);
	playhead.setAttribute('x2', xPos);	
}

var timeline = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	timeline.setAttribute( 'width', window.innerWidth - 50 );
	timeline.setAttribute('height', 200 );
	timeline.style.width = window.innerWidth-50+"px";
	timeline.style.height = "200px";
	timeline.style.display = "block";
	timeline.style.cursor = "pointer";
	timeline.onmousedown = function(e){ mousedown = true; skipTo(e) }
	timeline.onmouseup = function(e){ mousedown = false; }
	timeline.onmousemove = function(e){
		if(mousedown) skipTo(e);
	}
document.body.appendChild( timeline );

var playhead = document.createElementNS("http://www.w3.org/2000/svg", "line");
 	playhead.setAttribute('y1','0');
	playhead.setAttribute('y2','200');
	playhead.setAttribute('x1', 0);
	playhead.setAttribute('x2', 0);
	playhead.setAttribute('stroke',color.schemes.monochromatic[1].hex);
	playhead.setAttribute('stroke-width',2);
timeline.appendChild( playhead );

var xPos = 0;
var time = 0;
function loop(){
	requestAnimationFrame(loop);
	var delta = BB.Audio.context.currentTime - time;
	var incPerSec = WIDTH / duration;
	xPos += incPerSec * delta;
	playhead.setAttribute('x1', xPos);
	playhead.setAttribute('x2', xPos);
	time = BB.Audio.context.currentTime;
}


setup();


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

	var set = {
		update_waveform: function(){ window.onresize() }
	}

	var wrap = document.createElement('div');
	wrap.style.position = "absolute";
	wrap.style.top = "250px";
    wrap.style.left = "250px";
    document.body.appendChild(wrap);

    var gui = new dat.GUI({autoPlace: false});  
	wrap.appendChild(gui.domElement);

    var types = [ "allpass", "lowpass", "highpass", "bandpass", "lowshelf", "highshelf", "peaking", "notch" ];

    gui.add( filt.node, 'type', types ).onChange( drawFilterShape );
    gui.add( filt, 'frequency', 20, 5000 ).onChange( drawFilterShape );
    gui.add( filt, 'gain', -10, 10 ).onChange( drawFilterShape );
    gui.add( filt, 'Q', 0, 20 ).onChange( drawFilterShape );
    gui.add( set, "update_waveform");

}