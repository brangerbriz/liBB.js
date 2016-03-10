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
     * A module implementing LeapMotion Sensor.
     *
     * __Note:__ The constructor makes throws an Error if the LeapMotion library is not already loaded.
     * If the LeapMotion library is not imported "missing LeapMotion library "  should appear in the console,
     * check LeapMotion docs or LiBB examples to see how to import library from html.
     * Method  enables the LeapMotion module to start 
     * obtaining the X,Y values from the sensor, these values must be called if needed.
     * Method also allows to detect if a gesture has occured.
     * @class BB.LeapMotion
     * @param {Canvas} canvas The created canvas that must be given to the LeapMotion module if canX and canvasY variable want to be used.
     * @param {Boolean} getXY Boolean value to enable/disable access to the X,Y values from LeapMotion Sensor .
     * @param {Boolean} getGestures Boolean value to enable/disable access to the getGestures from LeapMotion Sensor.
     * @constructor
     */
  BB.LeapMotion = function(config){ 

    // create variables that can be accesed later on to be able to have the data
   // canvasX, canvasY each will contain a numeric value that represent the position.

        /**
         * The pointers X position as given by the LeapMotion Sensor
         * @property y
         * @type {Number}
         * @default 0
         */
   BB.LeapMotion.prototype.x = 0;
         /**
         * The pointers Y position as given by the LeapMotion Sensor
         * @property y
         * @type {Number}
         * @default 0
         */
   BB.LeapMotion.prototype.y = 0;
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
  


       if(typeof Leap === 'undefined'){
         throw new Error(' missing LeapMotion library ');
       } 
   // using Leap. controller to create the connection to our sensor
        var controller = new Leap.Controller({enableGestures:true});
        var canvasGiven = false;

        // gets data from config
        var canvas = (config && typeof config.canvasConstructor === 'object') ? config.canvasConstructor : null;
        var getXY = (config && typeof config.coordinatesEnabled === 'boolean') ? config.coordinatesEnabled : false;
        var getGestures = (config && typeof config.gesturesEnabled === 'boolean') ? config.gesturesEnabled : false;

         if(canvas === null){
          console.log("No canvas given therefor x and y are not available");
          canvasGiven = false;
        }else{canvasGiven = true;}
        // the controller.on method lets us se what the sensor is telling us on each frame
        // frames are sent 200 frames per second
        controller.on("frame",function(frame){
          // frame.pointables allows us to detect when a frame has a pointable.(hand,finger)
                  if(frame.pointables.length>0 && getXY && canvasGiven){
                      var pointable = frame.pointables[0];
                      // creates and interaction box it provides normalized coordinates for hands, fingers, and tools within this box.
                      var interactionBox = frame.interactionBox;
                      // provides the stabalized tip position
                      var normalizedPosition = interactionBox.normalizePoint(pointable.stabilizedTipPosition, true);
                      // Convert the normalized coordinates to span the canvas
                      BB.LeapMotion.prototype.x = canvas.width * normalizedPosition[0];
                      BB.LeapMotion.prototype.y = canvas.height * (1 - normalizedPosition[1]);
                  }
                  // make all vars false when no hand detected fromo the LeaMotion
                  if(frame.hands.length === 0){
                      BB.LeapMotion.prototype.grab = false;
                      BB.LeapMotion.prototype.pinch = false;
                      BB.LeapMotion.prototype.circle = false;
                      BB.LeapMotion.prototype.keytap = false;
                      BB.LeapMotion.prototype.screenTap = false;
                      BB.LeapMotion.prototype.swipe = false;
                  }
                  // detects hands and makes sure user wants to check for gestures.  
                  if(frame.hands.length > 0 && getGestures){
                    var hand = frame.hands[0];
                    var position = hand.palmPosition;
                    // when a frame detects a hand and gestures are wanted it will give true when gesture grab     
                    if(hand.grabStrength == 1){
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
                          BB.LeapMotion.prototype.keytap = true; 
                          break;
                      case "screenTap":
                          BB.LeapMotion.prototype.screenTap = true;
                          break;
                      case "swipe":
                          BB.LeapMotion.prototype.swipe = true;
                          break;
                  }
              });
            }                                   
        });
    // connecto to the leap motion sensor to get data
    controller.connect();
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
