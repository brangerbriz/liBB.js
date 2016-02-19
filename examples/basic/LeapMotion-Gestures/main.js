


document.body.className = "radial-grey";
var LeapMotion;

var gestureOutput;
var gestureString	;

  function setup() {
    gestureOutput = document.getElementsByName("gestureData");
    console.log(gestureOutput);
    gestureString = "";
    LeapMotion = new BB.LeapMotion();// creates an instance of the LeapMotion module created for liBB library 
	LeapMotion.GetLeapData(null,false,true); // gives canvas and enables X,Y tracking and enables gestures
  
  }
 function update() {
	// test in console that the gestures are being captured.
  if(LeapMotion.noHands){
    gestureString = "No Hands Detected";
  }
	if(LeapMotion.grab){
		gestureString = "Grab gesture detected";
	}
	if(LeapMotion.pinch){
		gestureString = "Pinch gesture detected";
	}
	if(LeapMotion.circle){
		if(LeapMotion.clockwise){gestureString = "Circle-clockwise gesture detected  "+ LeapMotion.circleradius+ " mm radius ";}
		else{gestureString = "Circle-counter-clockwise gesture detected  "+ LeapMotion.circleradius+ " mm radius ";}
	}
   if(LeapMotion.swipe){
    gestureString = "swipe gesture detected";
  }
  if(LeapMotion.screenTap){
    gestureString = " screenTap gesture detected";
  }
  if(LeapMotion.keytap){
    gestureString = " keytap gesture detected";
  }
  if(gestureOutput.length>0){
     gestureOutput[0].innerHTML = gestureString;
   }else{
    console.log("not found gestureOutput");
   }
 
  requestAnimationFrame(update);		   
}
setup();
update();




/*
Leap.loop(controllerOptions, function(frame) {
// Display Gesture object data
  var gestureOutput = document.getElementById("gestureData");
  var gestureString = "";
  if (frame.gestures.length > 0){
    for (var i = 0; i < frame.gestures.length; i++) {
      var gesture = frame.gestures[i];
      gestureString += "Gesture ID: " + gesture.id + ", "
                    + "type: " + gesture.type + ", "
                    + "state: " + gesture.state + ", "
                    + "hand IDs: " + gesture.handIds.join(", ") + ", "
                    + "pointable IDs: " + gesture.pointableIds.join(", ") + ", "
                    + "duration: " + gesture.duration + " &micro;s, ";

      switch (gesture.type) {
        case "circle":
          gestureString += "center: " + vectorToString(gesture.center) + " mm, "
                        + "normal: " + vectorToString(gesture.normal, 2) + ", "
                        + "radius: " + gesture.radius.toFixed(1) + " mm, "
                        + "progress: " + gesture.progress.toFixed(2) + " rotations";
          break;
        case "swipe":
          gestureString += "start position: " + vectorToString(gesture.startPosition) + " mm, "
                        + "current position: " + vectorToString(gesture.position) + " mm, "
                        + "direction: " + vectorToString(gesture.direction, 1) + ", "
                        + "speed: " + gesture.speed.toFixed(1) + " mm/s";
          break;
        case "screenTap":
        case "keyTap":
          gestureString += "position: " + vectorToString(gesture.position) + " mm";
          break;
        default:
          gestureString += "unkown gesture type";
      }
      gestureString += "<br />";
    }
  }
  else {
    gestureString += "No gestures";
  }
  gestureOutput.innerHTML = gestureString;

  // Store frame for motion functions
  previousFrame = frame;
})
*/