var context, drum;

context = new (window.AudioContext || window.webkitAudioContext)();

drum = new BB.AudioSampler({
	context: context,
	kick: '../../assets/audio/808/kick.ogg'
});

var play = document.createElement('button');
	play.innerHTML = "play";
	play.onclick = function(){
		if(drum.loaded) drum.play('kick');
	}
document.body.appendChild(play);