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
var container = document.createElement('div');
	container.style.position = 'absolute';
	container.style.top = '10px';
	container.style.left = window.innerWidth/4+'px';
	container.style.border = 'solid 1px #ccc';
	container.style.width = window.innerWidth/2+'px';
document.body.appendChild(container);

var canvas     = document.createElement('canvas');
var ctx        = canvas.getContext('2d');
container.appendChild(canvas);

document.body.className = "radial-grey";

var WIDTH, HEIGHT;

function setup() {
    window.onresize = function() {
        WIDTH = canvas.width = window.innerWidth/2;
        HEIGHT = canvas.height = 200;
        container.style.width = WIDTH+"px";
    }
    
    window.onresize();
}

function drawWaveForm( FFT, X, W, H ){	
    var tdata = FFT.getByteTimeDomainData();
	ctx.lineWidth = 3;
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
    drawWaveForm( fft, 0, WIDTH, HEIGHT/2 );    
}

setup();
draw();



// more info on the theory behind this here...
// http://jackschaedler.github.io/circles-sines-signals/dft_introduction.html


// GUI ~ ~ ~ * ~ ~ ~ * ~ ~ ~ * ~ ~ ~ * ~ ~ ~ * ~ ~ ~ 
//
function updateWaveForm(){
	var arr = [0];

	for (var i = 1; i < 11; i++) {
		var val = parseInt(document.getElementById('r'+i).getAttribute('y'));
		v = BB.MathUtils.map( val, 0,185, 1.0, 0.0 );
		arr.push( Math.round(v*10000)/10000 );
	};	

	var str = String(arr);
	str = str.replace(/,/g, ", ");
	nfo.innerHTML = "// adjust the fundamental && subsequent harmonics sliders<br> // when using 'custom' type, in BB.AudioTone, you must also pass the following wave property<br> wave: [ "+str+" ]";

	O.wave = arr; // <<<<<<< UPDATES THE "wave" PROPERTY WITH THE NEW PERIODIC WAVE ARRAY
	O.makeNote(220,1,0.5);
}

var freqs = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	freqs.setAttribute( 'width', window.innerWidth/2 );
	freqs.setAttribute('height', 200 );
	freqs.style.width = window.innerWidth/2+"px";
	freqs.style.height = "200px";
	freqs.style.display = "block";
container.appendChild( freqs );

var mousedown = false;
var curY = null;
var mouseY = null;
var selSVG = null;

document.onmousemove = function(e){
	if(mousedown){
		var newY = curY + (e.clientY-mouseY);
		if(newY>185) newY = 185;
		if(newY<0) newY = 0;
		console.log( selSVG )
		document.getElementById('r'+selSVG).setAttribute('y',newY);
		document.getElementById('l'+selSVG).setAttribute('y1',newY);
	}
}
document.onmouseup = function(){
	mousedown=false;
	curY = null;
	mouseY = null;
	selSVG = null;	
	updateWaveForm();
}

for (var i = 1; i < 11; i++) {

	var interv = (WIDTH/10);
	var offset = (WIDTH/10)/2;

	var l = document.createElementNS("http://www.w3.org/2000/svg", "line");
		if( i==1 ) l.setAttribute('y1','0');
		else l.setAttribute('y1','185');
		l.setAttribute('y2','200');
		l.setAttribute('x1', (i*interv) - offset);
		l.setAttribute('x2', (i*interv) - offset);
		l.setAttribute('stroke','#e40477');
		l.setAttribute('stroke-width',10);
		l.id = "l"+i;
	freqs.appendChild( l );
	var r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		r.setAttribute('x',(i*interv) - offset -7.5);
		if( i==1 ) r.setAttribute('y','0');
		else r.setAttribute('y','185');
		r.setAttribute('height','15');
		r.setAttribute('width','15');
		r.setAttribute('stroke','#e40477');
		r.setAttribute('fill','#e40477');
		r.setAttribute('stroke-width',1);
		r.style.cursor = "pointer";
		r.id = 'r'+i;
		r.onmousedown = function(e){
			mousedown=true;
			mouseY = e.clientY;
			curY = parseInt(this.getAttribute("y"));
			selSVG = parseInt( this.id.substr(1,this.length) );
		}
	freqs.appendChild( r );
	
};


var nfo = document.createElement('div');
	nfo.innerHTML = "// adjust the fundamental && subsequent harmonics sliders<br> // when using 'custom' type, in BB.AudioTone, you must also pass the following wave property<br> wave: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]";
	nfo.style.position = 'absolute';
	nfo.style.top = container.offsetHeight+20+'px';
	nfo.style.left = window.innerWidth/4+'px';
	nfo.style.fontFamily = 'sans-serif';
	nfo.style.width = window.innerWidth/2+'px';
	document.body.appendChild(nfo);
