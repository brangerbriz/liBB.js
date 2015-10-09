var context, drum, isLoaded = false;

context = new (window.AudioContext || window.webkitAudioContext)();

drum = new BB.AudioSampler({
	context: context,
	kick: '../../assets/audio/808/kick.ogg'
}, function( bufferObj ){
	isLoaded = true;
});


var play = document.createElement('button');
	play.innerHTML = "play";
	play.onclick = function(){
		if(isLoaded) drum.play('kick');
	}
document.body.appendChild(play);