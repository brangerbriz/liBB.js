var buffer, katy, play;

BB.Audio.init();

buffer = new BB.AudioBufferLoader({
 
    paths: ['../../assets/audio/katy.ogg']
 
 }, function(buffers){

    katy = BB.Audio.context.createBufferSource();
    katy.buffer = buffers[0];
    katy.loopStart = 0.5;
    katy.loopEnd = 7.4;
    katy.loop = true;
    katy.connect( BB.Audio.context.destination );

    play.innerHTML = "play";
    setInterval(randomPitch,200);
 });


play = document.createElement('button');
play.innerHTML = "loading...";
play.className = "center btn";
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
document.body.className = "radial-grey";

function randomPitch(){
	katy.playbackRate.value = BB.MathUtils.randomFloat(0.5,1.5);
}
