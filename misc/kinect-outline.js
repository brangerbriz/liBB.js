var kinect = BBMod.KinectInput();

var pointer = BBMod.Pointer();

function update() {
    
    kinect.update();
    pointer.update(kinect);

};

kinect.on('personFound', function(){
    tirggerSound();
});

kinect.on('motion', 0.5, onKinectMotion);
kinect.off('motion');

function onKinectMotion() {

}