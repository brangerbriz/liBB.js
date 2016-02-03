
// module to get x, y from leapmotion
// used leap-0.6.4.js as needed for the leapmotion to function
/**
 * A module to obtain the X and Y values from 
 * the LeapMotion sensor.
 * @module BB.LeapMotion
 */
define(['./BB'],
function(BB){

    'use strict';

      
   BB.LeapMotion = function(){ 
       if(typeof(Leap) === 'undefined'){
         throw new Error(' missing LeapMotion library ');
       }
     };
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
     /**
     * Creates a LeapMotion controller wich allows access to frames
     * when a pointable is detected it reads the X and Y values 
     * @method LeapGetXY
     * @param  {canvas} value The value to be scaled.
     * @return {BB.LeapMotion}       Returns the scaled value.
     */

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
