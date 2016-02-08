
// audio .~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._
// .~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._
BB.Audio.init();

var reverb = new BB.AudioFX('reverb',{
	paths: [
		'../../assets/audio/impulse/reverb1.wav',
		'../../assets/audio/impulse/reverb2.wav',
		'../../assets/audio/impulse/reverb3.wav',
		'../../assets/audio/impulse/reverb4.wav',
		'../../assets/audio/impulse/reverb5.wav',
		'../../assets/audio/impulse/reverb6.wav'
	]
});

reverb.wet = 0.5; // set dry/wet mix to half/half by default

var katy = new BB.AudioSampler({
	connect: reverb,
	fireworks: '../../assets/audio/katy.ogg'

}, function( bufferObj ){

	katy.play('fireworks', 0, 30, 47);
	setInterval(function(){
		katy.play('fireworks',0,30,47);
	},47000);

});


// make buttons
function switchImpulseBtn( idx ){
	btn = document.createElement('button');
	btn.innerHTML = 'impulse file '+idx;
	btn.className = "center btn";
	btn.onclick = function(){
		reverb.useImpulse( idx );
	}
	document.body.appendChild(btn);
}
switchImpulseBtn( 0 );
switchImpulseBtn( 1 );
switchImpulseBtn( 2 );
switchImpulseBtn( 3 );
switchImpulseBtn( 4 );
switchImpulseBtn( 5 );

// make slider
document.body.className = "radial-grey";
var slider = document.createElement('input')
	slider.setAttribute('type','range');
	slider.className = "center btn";
	slider.onchange = function(){
		var lvl = parseInt(this.value)/100;
		reverb.wet = lvl;
	}
document.body.appendChild(slider);
var label = document.createElement('div');
	label.style.textAlign = "center";
	label.innerHTML = "mix ( dry -to- wet )";
document.body.appendChild(label);
