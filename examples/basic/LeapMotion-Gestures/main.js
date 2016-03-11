


document.body.className = "radial-grey";
var leapMotion;
var frame;
var hands;
var fingers;
var typeHand;

var gestureOutput;
var gestureString;
var connectionOutput;
var connectionString;
var handOutput;
var handString;
var fingerOutput;
var fingerString;

  function setup() {
    gestureOutput = document.getElementsByName("gestureData");
    connectionOutput = document.getElementsByName("connectionData");
    handOutput = document.getElementsByName("handData");
    fingerOutput = document.getElementsByName("fingerData");
    gestureString = "";
    connectionString = " ";
    handString = " ";
    fingerString = "";
    // creates an instance of the LeapMotion module created for liBB library 
    leapMotion = new BB.LeapMotion({
    canvasConstructor:  null,
    coordinatesEnabled:  false,
    gesturesEnabled:  true
    });
  }
 function update() {

  frame = leapMotion.lastFrame;
  if(frame != null){
    hands = frame.hands;
    fingers = frame.fingers
    if(hands.length > 0){
      if(hands.length === 1){
       typeHand = hands[0].type;
       handString = "Hand Type: " + typeHand;
       handOutput[0].innerHTML = handString;
      }else{
        handString = "More than one hand detected";
        handOutput[0].innerHTML = handString;
       }  
    } else {
       handString = "No Hands Detected";
      handOutput[0].innerHTML = handString;
    }
    if(fingers.length > 0){;
      fingerString = "Amount of Fingers"+ fingers.length;
      fingerOutput[0].innerHTML = fingerString;
    }else{
      fingerString = "No fingers detected";
      fingerOutput[0].innerHTML = fingerString;
    }  
  }else{console.log(" Frame has a null value");}

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
   if( !leapMotion.grab && !leapMotion.pinch && !leapMotion.circle && !leapMotion.swipe && !leapMotion.screenTap && !leapMotion.keytap){
    gestureString = " No gesture detected";
    gestureOutput[0].innerHTML = gestureString;
   }

requestAnimationFrame(update);  		   
}
setup();
update();


