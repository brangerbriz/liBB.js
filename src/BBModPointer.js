// A module for funneling in and standardizing pointer-like events
// like mouse, touch, computer-vision detected hands, etc...
// It has basic properties like x, y, isMoving and if the eventModule
// that is passed into its update() has a selection interface (like the 
// click on a mouse), then it also has an isDown property.
// Note: This module is for use with HTML5 canvas only.

define(function(){

    function BBModPointer() {

        this.x = undefined;
        this.y = undefined;
        this.isMoving = false;
        this.isDown = null;
        this.hasSelectionInterface = false;
    }

    BBModPointer.prototype.update = function(eventModule) {

        if (eventModule) {

            // NOTE: add validation here to make sure that eventModule is a supported event

            // [].slice.call(arguments,1) converts the arguments ('array-like') 
            // Object into a real Array containing all arguments but the first.
            // this passes any other parameters in update to the eventModule's update func
            eventModule.update([].slice.call(arguments,1));
            eventModule.updatePointer();

            this.x = eventModule.x;
            this.y = eventModule.y;
            this.isMoving = eventModule.isMoving;

            if (eventModule.hasSelectionInterface !== undefined) {
                this.hasSelectionInterface = eventModule.hasSelectionInterface;
                this.isDown = eventModule.isDown;
            }

        } else {
            throw new Error("BBModPointer.update: eventModule is undefined");
        }
    }

    BBModPointer.prototype.on = function(eventName, eventModule, callback){
            
        if (eventName == "start") eventModule.start    = callback;
        else if (eventName == "stop") eventModule.stop = callback;
    }

    return BBModPointer;
});
