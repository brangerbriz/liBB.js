
// create BB AudioContext
BB.Audio.init();

// create AudioSampler
var drum = new BB.AudioSampler({
	kick: '../../assets/audio/808/kick.ogg',
	snare: '../../assets/audio/808/snare.ogg',
	hat: '../../assets/audio/808/hat.ogg'
});



// create play buttons to trigger sampler
var playKick = document.createElement('button');
	playKick.innerHTML = "kick";
	playKick.className = "center btn";
	playKick.onclick = function(){
		if(drum.loaded) drum.play('kick');
	}
document.body.appendChild(playKick);

var playSnare = document.createElement('button');
	playSnare.innerHTML = "snare";
	playSnare.className = "center btn";
	playSnare.onclick = function(){
		if(drum.loaded) drum.play('snare');
	}
document.body.appendChild(playSnare);

var playHat = document.createElement('button');
	playHat.innerHTML = "high hat";
	playHat.className = "center btn";
	playHat.onclick = function(){
		if(drum.loaded) drum.play('hat');
	}
document.body.appendChild(playHat);

document.body.className = "radial-grey";
