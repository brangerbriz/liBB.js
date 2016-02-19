/**
 * A module implementing LeapMotion Sensor
 * @module BB.LeapMotion
 */


// module to get x, y from leapmotion
// used leap-0.6.4.js as needed for the leapmotion to function
define(['./BB'],
function(BB){

    'use strict';
  /**
     * A module implementing LeapMotion Sensor
     * @class BB.LeapMotion
     * @param {[Null]} [Note] The constructor makes sure that the LeapMotion library is imported.
     * If the LeapMotion library is not imported "missing LeapMotion library " will apear,
     * check LeapMotion docs or LiBB examples to see how to import library from html.
     * @constructor
     */
   BB.LeapMotion = function(){ 
       if(typeof(Leap) === 'undefined'){
         throw new Error(' missing LeapMotion library ');
       }
     };
   // create variables that can be accesed later on to be able to have the data
   // canvasX, canvasY each will contain a numeric value that represent the position.

        /**
         * The pointers X position as given by the LeapMotion Sensor
         * @property canvasX
         * @type {Number}
         * @default 0
         */
   BB.LeapMotion.prototype.canvasX = 0;
         /**
         * The pointers Y position as given by the LeapMotion Sensor
         * @property canvasY
         * @type {Number}
         * @default 0
         */
   BB.LeapMotion.prototype.canvasY = 0;
         /**
         * Boolean value corresponding to the grab gesture detected by the LeapMotion sensor.
         * @property grab
         * @type {Gesture}
         * @default false
         */
   BB.LeapMotion.prototype.grab = false;
         /**
         * Boolean value corresponding to the pinch gesture detected by the LeapMotion sensor.
         * @property pinch
         * @type {Gesture}
         * @default false
         */
   BB.LeapMotion.prototype.pinch = false;
        /**
         * Boolean value corresponding to the circle gesture detected by the LeapMotion sensor.
         * @property circle
         * @type {Gesture}
         * @default false
         */
   BB.LeapMotion.prototype.circle = false;
        /**
         * Boolean value corresponding to the keytap gesture detected by the LeapMotion sensor.
         * @property keytap
         * @type {Gesture}
         * @default false
         */
   BB.LeapMotion.prototype.keytap = false;
        /**
         * Boolean value corresponding to the screenTap gesture detected by the LeapMotion sensor.
         * @property screenTap
         * @type {Gesture}
         * @default false
         */
   BB.LeapMotion.prototype.screenTap = false;
        /**
         * Boolean value corresponding to the swipe gesture detected by the LeapMotion sensor.
         * @property swipe
         * @type {Gesture}
         * @default false
         */
   BB.LeapMotion.prototype.swipe = false;
    /**
         * Boolean value corresponding to the clockwise detected by the LeapMotion.
         * @property clockwise
         * @type {Gesture}
         * @default false
         */
   BB.LeapMotion.prototype.clockwise = false;
    /**
         * Double especifies the radius of the circle gesture in mm.
         * @property circleradius
         * @type {Number}
         * @default 0
         */
   BB.LeapMotion.prototype.circleradius = 0;
   /**
         * Boolean value indicating if the LeapMotion device is streaming data.
         * @property deviceStreaming
         * @type {Connection indicator}
         * @default false
         */
   BB.LeapMotion.prototype.deviceStreaming = false;
   /**
         * Boolean value indicating if the LeapMotion device is disconected.
         * @property deviceDisconnected
         * @type {Connection indicator}
         * @default false
         */
   BB.LeapMotion.prototype.deviceConnected = false;
    /**
         * Boolean value indicating if the LeapMotion device dettects no hands.
         * @property noHands
         * @type {Indicator}
         * @default false
         */
   BB.LeapMotion.prototype.noHands = false;
  

   //creating function to be called to access x,y in a fast and easy way
   // function requires a canvas.
   /**
   * Method that enables the LeapMotion module to start 
   * obtaining the X,Y values from the sensor, these values must be called if needed.
   * Method also allows to detect if a gesture has occured.
   * @method GetLeapData
   * @param {Canvas} canvas The created canvas that must be given to the LeapMotion module if canX and canvasY variable want to be used.
   * @param {Boolean} GetXY Boolean value to enable/disable access to the X,Y values from LeapMotion Sensor .
   * @param {Boolean} GetGestures Boolean value to enable/disable access to the GetGestures from LeapMotion Sensor.
   */
   // GetLeapData method accepts need 3 inputs
   // 1 tha canvas created 
   // 2 a boolean value to get X,Y values 
   // 3 a boolean value to get gestures 
   BB.LeapMotion.prototype.GetLeapData= function(canvas , GetXY , GetGestures){
   // using Leap. controller to create the connection to our sensor
        var controller = new Leap.Controller({enableGestures:true});
        var canvasGiven = false;
         if(canvas === null){
          console.log("No canvas given therefor canvasX and canvasY are not available");
          canvasGiven = false;
        }else{canvasGiven = true;}
        // the controller.on method lets us se what the sensor is telling us on each frame
        // frames are sent 200 frames per second
        controller.on("frame",function(frame){
          // frame.pointables allows us to detect when a frame has a pointable.(hand,finger)
                if(frame.pointables.length>0 && GetXY && canvasGiven){
                    var pointable = frame.pointables[0];
                    // creates and interaction box it provides normalized coordinates for hands, fingers, and tools within this box.
                    var interactionBox = frame.interactionBox;
                    // provides the stabalized tip position
                    var normalizedPosition = interactionBox.normalizePoint(pointable.stabilizedTipPosition, true);
                    // Convert the normalized coordinates to span the canvas
                    BB.LeapMotion.prototype.canvasX = canvas.width * normalizedPosition[0];
                    BB.LeapMotion.prototype.canvasY = canvas.height * (1 - normalizedPosition[1]);
                }
                // make all vars false when no hand detected fromo the LeaMotion
                if(frame.hands.length === 0){
                    BB.LeapMotion.prototype.noHands = true;
                    BB.LeapMotion.prototype.grab = false;
                    BB.LeapMotion.prototype.pinch = false;
                    BB.LeapMotion.prototype.circle = false;
                    BB.LeapMotion.prototype.keytap = false;
                    BB.LeapMotion.prototype.screenTap = false;
                    BB.LeapMotion.prototype.swipe = false;
                }
                // detects hands and makes sure user wants to check for gestures.  
                if(frame.hands.length > 0 && GetGestures){
                  //console.log("Recognice hands ! ");
                  var hand = frame.hands[0];
                  var position = hand.palmPosition;
                 
                  // when a frame detects a hand and gestures are wanted it will give true when gesture grab     
                  if(hand.grabStrength == 1){
                    //console.log("Grabstrength equal 1 ");
                    BB.LeapMotion.prototype.noHands = false;
                    BB.LeapMotion.prototype.grab = true;
                    BB.LeapMotion.prototype.pinch = false;
                    BB.LeapMotion.prototype.circle = false;
                    BB.LeapMotion.prototype.keytap = false;
                    BB.LeapMotion.prototype.screenTap = false;
                    BB.LeapMotion.prototype.swipe = false;
                  }else{
                    BB.LeapMotion.prototype.grab = false;
                  }
                  // when a frame detects a hand and gestures are wanted it will give true when gesture pinch     
                  if(hand.pinchStrength == 1){
                   // console.log("Pinchstrength equal 1 ");
                    BB.LeapMotion.prototype.noHands = false;
                    BB.LeapMotion.prototype.grab = false;
                    BB.LeapMotion.prototype.pinch = true;
                    BB.LeapMotion.prototype.circle = false;
                    BB.LeapMotion.prototype.keytap = false;
                    BB.LeapMotion.prototype.screenTap = false;
                    BB.LeapMotion.prototype.swipe = false;
                 }else{
                    BB.LeapMotion.prototype.pinch = false;
                 }
                } 
            // when no gestures are being detected all the pre loaded gestures are falsed. (circle,keytap,screenTap,swipe)    
            if(frame.valid && frame.gestures.length === 0){
              BB.LeapMotion.prototype.noHands = false;
                    BB.LeapMotion.prototype.circle = false;
                    BB.LeapMotion.prototype.keytap = false;
                    BB.LeapMotion.prototype.screenTap = false;
                    BB.LeapMotion.prototype.swipe = false;
            } 
            // when a gesture is detected it will take each gesture and set to true the var that corresponds to the gesture 
            // making the gesture available to the user  
            if(frame.valid && frame.gestures.length > 0){              
              frame.gestures.forEach(function(gesture){           
                  switch (gesture.type){
                      case "circle":
                      //console.log("circle ");}
                      BB.LeapMotion.prototype.noHands = false;
                          BB.LeapMotion.prototype.circle = true;
                          var pointableID = gesture.pointableIds[0];
                          var direction = frame.pointable(pointableID).direction;
                          var dotProduct = Leap.vec3.dot(direction, gesture.normal);
                          if(dotProduct > 0){
                            // detects if the circle gesture is clockwise and sets var.
                             BB.LeapMotion.prototype.clockwise = true;
                          }else{ BB.LeapMotion.prototype.clockwise = false;}
                          BB.LeapMotion.prototype.circleradius = gesture.radius.toFixed(1) ;
                          break;                     
                      case "keyTap":
                      //console.log("keytap");
                      BB.LeapMotion.prototype.noHands = false;
                          BB.LeapMotion.prototype.keytap = true; 
                          break;
                      case "screenTap":
                     // console.log("screentap");
                     BB.LeapMotion.prototype.noHands = false;
                          BB.LeapMotion.prototype.screenTap = true;
                          break;
                      case "swipe":
                      //console.log("swipe ");
                      BB.LeapMotion.prototype.noHands = false;
                          BB.LeapMotion.prototype.swipe = true;
                          break;
                  }
              });
            }                                   
        });
    // connecto to the leap motion sensor to get data
    controller.connect();
   
    controller.on('deviceDisconnected', onDeviceDisconnect);
      function onDeviceDisconnect(){
       BB.LeapMotion.prototype.deviceConnected = false;
      }
    controller.on('deviceConnected', onDeviceConnected);
      function onDeviceConnected(){
        BB.LeapMotion.prototype.deviceConnected = true;
      } 
    controller.on('deviceStreaming', onStreaming);
      function onStreaming(){
        BB.LeapMotion.prototype.deviceStreaming = true;
      }
    controller.on('deviceStopped', onStopped);
      function onStopped(){
        BB.LeapMotion.prototype.deviceStreaming = false;
      }   
   };
   return BB.LeapMotion;
});
