


document.body.className = "radial-grey";
var leapMotion;

var gestureOutput;
var gestureString;
var connectionOutput;
var connectionString;

  function setup() {
    gestureOutput = document.getElementsByName("gestureData");
    connectionOutput = document.getElementsByName("connectionData");
    gestureString = "";
    connectionString = " ";
    // creates an instance of the LeapMotion module created for liBB library 
    leapMotion = new BB.LeapMotion({
    canvasConstructor:  null,
    coordinatesEnabled:  false,
    gesturesEnabled:  true
    });
  }
 function update() {
	// test in console that the gestures are being captured.
  if(leapMotion.deviceStreaming){
    connectionString = " Device Streaming";
  }else{ connectionString = " Device NOT Streaming";}
	if(leapMotion.grab){
		gestureString = "Grab gesture detected";
	}
	if(leapMotion.pinch){
		gestureString = "Pinch gesture detected";
	}
	if(leapMotion.circle){
		if(leapMotion.clockwise){gestureString = "Circle-clockwise gesture detected  "+ leapMotion.circleradius+ " mm radius ";}
		else{gestureString = "Circle-counter-clockwise gesture detected  "+ leapMotion.circleradius+ " mm radius ";}
	}
   if(leapMotion.swipe){
    gestureString = "swipe gesture detected";
  }
  if(leapMotion.screenTap){
    gestureString = " screenTap gesture detected";
  }
  if(leapMotion.keytap){
    gestureString = " keytap gesture detected";
  }
  if(gestureOutput.length>0){
     gestureOutput[0].innerHTML = gestureString;
     connectionOutput[0].innerHTML = connectionString;
   }else{
    console.log("not found gestureOutput");
   }
requestAnimationFrame(update);  		   
}
setup();
update();


