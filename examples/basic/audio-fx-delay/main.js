
// audio .~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._
// .~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._
BB.Audio.init();

var delay = new BB.AudioFX('delay',{
	max: 2,
	time: 1
});

delay.wet = 0.5; // set dry/wet mix to half/half by default

var katy = new BB.AudioSampler({
	connect: delay,
	fireworks: '../../assets/audio/katy.ogg'

}, function( bufferObj ){

	katy.play('fireworks', 0, 30, 47);
	setInterval(function(){
		katy.play('fireworks',0,30,47);
	},47000);

});


// make sliders
document.body.className = "radial-grey";
//
var slider = document.createElement('input')
	slider.setAttribute('type','range');
	slider.className = "center btn";
	slider.onchange = function(){
		var lvl = parseInt(this.value)/100;
		delay.wet = lvl;
	}
document.body.appendChild(slider);
var label = document.createElement('div');
	label.style.textAlign = "center";
	label.innerHTML = "mix ( dry -to- wet )";
document.body.appendChild(label);
//
var slider = document.createElement('input')
	slider.setAttribute('type','range');
	slider.className = "center btn";
	slider.onchange = function(){
		var lvl = BB.MathUtils.map( parseInt(this.value), 0, 100, 0, 5);
		delay.time = lvl;
	}
document.body.appendChild(slider);
var label = document.createElement('div');
	label.style.textAlign = "center";
	label.innerHTML = "delay time ( 0 - 1, because max was set to 1 )";
document.body.appendChild(label);
