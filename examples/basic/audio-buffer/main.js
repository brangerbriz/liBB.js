var context, buffer, katy, play;

context = new (window.AudioContext || window.webkitAudioContext)();

buffer = new BB.AudioBufferLoader({
 
    context: context,
    paths: ['../../assets/audio/katy.ogg']
 
 }, function(buffers){

    katy = context.createBufferSource();
    katy.buffer = buffers[0];
    katy.loopStart = 0.5;
    katy.loopEnd = 7.4;
    katy.loop = true;
    katy.connect( context.destination );

    play.innerHTML = "play";
    setInterval(randomPitch,200);
 });


play = document.createElement('button');
play.innerHTML = "loading...";
play.onclick = function(){
	if(play.innerHTML=="play"){
		play.innerHTML = "stop";
		katy.start(0); 
	}
	else if(play.innerHTML=="stop"){
		document.body.removeChild(play);
		katy.stop();
	}
}
document.body.appendChild(play);

function randomPitch(){
	katy.playbackRate.value = BB.MathUtils.randomFloat(0.5,1.5);
	// alternatively...
	// katy.detune.value = BB.MathUtils.randomInt(-1200,1200);
}