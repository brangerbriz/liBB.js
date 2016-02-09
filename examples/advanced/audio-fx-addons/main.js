document.body.className = "radial-black";

// audio .~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._
// .~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._
BB.Audio.init();

var katy, fft;
var filer, reverb, chorus, drive, flanger;
var gui;

function setup(){

    fft = new BB.AudioAnalyser();

    drive = new AFXdrive({
        connect: fft
    });

    chorus = new AFXchorus({
        connect: drive
    });

    ringMod = new AFXringmod({
        connect: chorus
    });

    flanger = new AFXflanger({
        connect: ringMod
    });

    reverb = new BB.AudioFX('reverb',{
        connect: flanger
    });

    filter = new BB.AudioFX('filter',{
        connect: reverb
    });

    katy = new BB.AudioSampler({
        connect: filter,
        fireworks: '../../assets/audio/katy.ogg'
    });

    // set initial "wetness" (presence) of fx
    filter.wet = 0.1;
    reverb.wet = 0.5;

    setupGUI();
    setupCanvas();
    drawCanvas();

}

// canvas .~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._
// .~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._

var canvas     = document.createElement('canvas');
var ctx        = canvas.getContext('2d');
canvas.className = "absolute";
document.body.appendChild(canvas);
document.body.className = "radial-black";

var WIDTH, HEIGHT;

function setupCanvas() {
    window.onresize = function() {
        WIDTH = canvas.width = window.innerWidth;
        HEIGHT = canvas.height = window.innerHeight;
    }
    window.onresize();
}

function drawCanvas() {
    requestAnimationFrame(drawCanvas);
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    BB.A2VUtils.drawTimeDomainData( fft, canvas );
    BB.A2VUtils.drawFrequencyData( fft, canvas, {color:'#333'});
}

// GUI .~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._
// .~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._


function setupGUI(){
    var buttons = {
        play: function(){ katy.play('fireworks') },
        stop: function(){ katy.node.stop() }
    }
    gui = new dat.GUI();  


    var dr = gui.addFolder('drive');
    dr.add( drive, 'wet', 0.0, 1.0).step(0.05);
    dr.add( drive, 'drive', 0.01, 20.0).step(0.01);

    var ch = gui.addFolder('chorus');
    ch.add( chorus, 'wet', 0.0, 1.0).step(0.05);
    ch.add( chorus, 'speed', 0.5, 15).step(0.25);
    ch.add( chorus, 'delay', 0.005, 0.055).step(0.005);
    ch.add( chorus, 'depth', 0.0005, 0.004).step(0.0005);

    var rm = gui.addFolder('ring mod');
    rm.add( ringMod, 'wet', 0.0, 1.0).step(0.05);
    rm.add( ringMod, 'frequency', 9.0, 13.0).step(0.01);

    var fl = gui.addFolder('flanger');
    fl.add( flanger, 'wet', 0.0, 1.0).step(0.05);
    fl.add( flanger, 'speed', 0.05, 5.0).step(0.05);
    fl.add( flanger, 'delay', 0.001, 0.02).step(0.001);
    fl.add( flanger, 'depth', 0.0005, 0.005).step(0.00025);
    fl.add( flanger, 'feedback', 0.0, 1.0).step(0.01);

    var rv = gui.addFolder('reverb');
    rv.add( reverb, 'wet', 0.0, 1.0).step(0.05);

    var fi = gui.addFolder('lowpass filter');
    fi.add( filter, 'wet', 0.0, 1.0).step(0.05);



    gui.add( buttons, 'play' );
    gui.add( buttons, 'stop' );
}

// load additional scripts ( scriptLoader via exUtils.js )
scriptLoader([
    '../../assets/js/dat.gui.bb.min.js',
    '../../assets/js/A2VUtils.js',
    '../../assets/js/AFXchorus.js',
    '../../assets/js/AFXdrive.js',
    '../../assets/js/AFXringmod.js',
    '../../assets/js/AFXflanger.js'
], setup );
