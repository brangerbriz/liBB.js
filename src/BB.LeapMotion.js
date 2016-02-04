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
         * @default undefined
         */
   BB.LeapMotion.prototype.canvasX = 0;
         /**
         * The pointers Y position as given by the LeapMotion Sensor
         * @property canvasY
         * @type {Number}
         * @default undefined
         */
   BB.LeapMotion.prototype.canvasY = 0;
   //creating function to be called to access x,y in a fast and easy way
   // function requires a canvas.
   /**
   * Method thats enables the LeapMotion module to star 
   * obtaining the X,Y values from the sensor, these values must be called if needed.
   *
   * @method LeapGetXY
   * @param {Canvas} canvas The created canvas that must be given to the LeapMotion module.
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
