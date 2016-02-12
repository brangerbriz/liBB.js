var kinect = BBMod.KinectInput({
	device: 0,
	depth: true,
	color: false,
	infrared: false
});

var pointer = BBMod.Pointer();

function update() {
    
    kinect.update();
    pointer.update(kinect);

};

kinect.open(deviceNum, callback);
kinect.close(callback);

kinect.listDevices(callback);

kinect.on('connect', callback);
kinect.on('disconnect', callback);
kinect.on('error', callback);
kinect.on('networkError', callback);

kinect.nearClip(1500, callback); // in cm
kinect.farClip(4000, callback); // in cm

kinect.enable('color', callback);
kinect.enable('depth', callback);
kinect.enable('infrared', callback);

kinect.disable('color', callback);
kinect.disable('depth', callback);
kinect.disable('infrared', callback);

kinect.tilt(10, callback);
kinect.setTilt(45, callback);
kinect.acceleration(callback);
kinect.setLED('red', callback);

kinect.getDistanceAt(x, y, callback);

kinect.on('motion', 0.05, callback);
kinect.on('contour', callback); // fires at framerate
kinect.on('nearestPixel', callback); // fires at framerate

kinect.on('colorFrame', callback); // fires at or near framerate
kinect.on('depthFrame', callback); // fires at or near framerate
kinect.on('infraredFrame', callback); // fires at or near framerate

//OpenNI Events (from ofxOpenNI)
kinect.on('userTrackingStopped', callback);
kinect.on('userTrackingStarted', callback);
kinect.on('userCalibrationStarted', callback);
kinect.on('userCalibrationStopped', callback);
kinect.on('userSkeletonLost', callback);
kinect.on('userSkeletonFound', callback);

kinect.on('jointTorso', callback);
kinect.on('jointNeck', callback);
kinect.on('jointHead', callback);

kinect.on('jointLeftShoulder', callback);
kinect.on('jointLeftElbow', callback);
kinect.on('jointLeftHand', callback);

kinect.on('jointRightShoulder', callback);
kinect.on('jointRightElbow', callback);
kinect.on('jointRightHand', callback);

kinect.on('jointLeftHip', callback);
kinect.on('jointLeftKnee', callback);
kinect.on('jointLeftFoot', callback);

kinect.on('jointRightHip', callback);
kinect.on('jointRightKnee', callback);
kinect.on('jointRightFoot', callback);
