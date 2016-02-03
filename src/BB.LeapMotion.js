
// module to get x, y from leapmotion
// used leap-0.6.4.js as needed for the leapmotion to function
/**
 * A module for obtaining the X and Y values from 
 * the LeapMotion sensor.
 * @module BB.LeapMotion
 */
define('BB.LeapMotion',['./BB', '../libs/leap-0.6.4', './BB.Vector2' ],
function(  BB,LeapMotion, Vector2){

   // 'use strict';

   BB.Vector2 = Vector2;
   /**
     * A module for obtaining the X and Y values from 
     * the LeapMotion sensor.
     * @class BB.LeapMotion
     * @param [null] The LeapMotion controller does not need an input to function.
     * @constructor
     */
   BB.LeapMotion = function(){  };
   // create variables that can be accesed later on to be able to have the data
   // canvasX, canvasY each will contain a numeric value that represent the position.
  /**
  * The users current x position as supplied by the LeapMotion Sensor.
  * @property canvasX
  * @type {Number}
  * @default undefined
  */
   BB.LeapMotion.prototype.canvasX = 0;
   /**
  * The users current y position as supplied by the LeapMotion Sensor.
  * @property canvasY
  * @type {Number}
  * @default undefined
  */
   BB.LeapMotion.prototype.canvasY = 0;
   //creating function to be called to access x,y in a fast and easy way
   // function requires a canvas.
   BB.LeapMotion.prototype.LeapGetXY= function(canvas){
   // using Leap. controller to create the connection to our sensor
        var controller = new Leap.Controller();
        // the controller.on method lets us se what the sensor is telling us on each frame
        // frames are sent 200 frames per second
        controller.on("frame",function(frame){
          // frame.pointables allows us to detect when a frame has a pointable.(hand,finger)
                if(frame.pointables.length>0)
                    {
                    var pointable = frame.pointables[0];
                    // creates and interaction box it provides normalized coordinates for hands, fingers, and tools within this box.
                    var interactionBox = frame.interactionBox;
                    // provides the stabalized tip position
                    var normalizedPosition = interactionBox.normalizePoint(pointable.stabilizedTipPosition, true);
                    // Convert the normalized coordinates to span the canvas
                    BB.LeapMotion.prototype.canvasX = canvas.width * normalizedPosition[0];
                    BB.LeapMotion.prototype.canvasY = canvas.height * (1 - normalizedPosition[1]);
                     }
                 });
        // connecto to the leap motion sensor to get data
                controller.connect();
                };
   return BB.LeapMotion;
});
