// A module for funneling in and standardizing pointer-like events
// like mouse, touch, computer-vision detected hands, etc...
// It has basic properties like x, y, isMoving and if the eventModule
// that is passed into its update() has a selection interface (like the 
// click on a mouse), then it also has an isDown property.
// Note: This module is for use with HTML5 canvas only.

/**
 * A module for funneling in and standardizing basic pointer-like interfaces
 * like mouse and touch.
 * @module BBModPointer
 */
define(['./BBModMouseInput'], function(BBModMouseInput){


    //NOTE: called inside BBModPointer using .call()
    //to bind this to BBModPointer instance
    function bindEventsToControllerModule() {

        // the BBMouseInput module uses event listeners attatched to it's
        // HTML5 canvas to fire these callbacks directly, so pass them along.
        if (this.controllerModule instanceof BBModMouseInput) {

            this.controllerModule._activeStartCallback = this._activeStartCallback;
            this.controllerModule._activeStopCallback  = this._activeStopCallback;
            this.controllerModule._moveStartCallback   = this._moveStartCallback;
            this.controllerModule._moveStopCallback    = this._moveStopCallback;
            this.controllerModule._moveCallback        = this._moveCallback;
        }
    }

    /**
     * A module for funneling in and standardizing basic pointer-like interfaces
     * like mouse and touch.
     * @class BBModPointer
     * @param {Object} controllerModule The input module you would like to control
     * this pointer with.
     * @constructor
     */
    function BBModPointer(controllerModule) {

        if (!controllerModule) {
            throw new Error('BBModPointer: controllerModule parameter is missing from the BBModPointer constructor.');
        } else if (!controllerModule instanceof BBModMouseInput) {
            throw new Error("BBModPointer.update: controllerModule is not a supported object type.");
            this.controllerModule = null;
        }

        this.controllerModule = controllerModule;


        /**
         * The pointer's current x position as supplied by the eventModule in BBModPointer.update(...).
         * @property x
         * @type {Number}
         * @default undefined
         */
        this.x = null;

        /**
         * The pointer's current y position as supplied by the eventModule in BBModPointer.update(...).
         * @property y
         * @type {Number}
         * @default undefined
         */
        this.y = null;

        /**
         * A variable holding wether or not the event module controlling this
         * pointer object (via BBModPointer.update(...)) is moving
         * @property isMoving
         * @type {Boolean}
         * @default false
         */
        this.isMoving = false;

        /**
         * A variable holding wether or not the selection interface (i.e. mouse
         * button, etc...) controlling this pointer object (via
         * BBModPointer.update(...)) is active.
         * @property isDown
         * @type {Boolean}
         * @default false
         */
        this.isDown = false;

        /**
         * Does the selection interface controlling this pointer have a
         * selection interface (like a button)?
         * @property hasSelectionInterface
         * @type {Boolean}
         * @default false
         */
        this.hasSelectionInterface = false;

        this._activeStartCallback = null;
        this._activeStopCallback  = null;
        this._moveStartCallback   = null;
        this._moveStopCallback    = null;
        this._moveCallback        = null;
    }

    Object.defineProperty(BBModPointer.prototype, "controllerModule", {
        get: function(){
            return this._controllerModule;
        },
        set: function(val){

            this._controllerModule = val;

            // rebind the event callbacks in case this is 
            // a new controller module
            bindEventsToControllerModule.call(this);
        }
    });

    /**
     * Update the pointer using the controllerModule.
     * @method update
     * @param  {Object} controllerModule 
     */
    BBModPointer.prototype.update = function() {

        // add a new conditional for each module that pointer supports and then
        // update BBModPointer's internals (x, y, isMoving) in a custom way for
        // each type of input (kinect, etc...)
        if (this.controllerModule instanceof BBModMouseInput) {

            // these assignments are easy for a mouse input object but will take
            // more work for other types of modules (i.e. kinect)...
            this.x                     = this.controllerModule.x;
            this.y                     = this.controllerModule.y;
            this.isMoving              = this.controllerModule.isMoving;
            this.isDown                = this.controllerModule.isDown;
            this.hasSelectionInterface = false;
        }
    }

    /**
     * A method used to register "activestart", "activestop", "movestart", and
     * "movestop" events.
     * @method on
     * @param  {String}   eventName   The event to register callback to.
     * "activestart", "activestop", "movestart", and "movestop" are all valid
     * events.
     * @param  {Function} callback    The callback to execute once the
     * registered event has fired.
     */
    BBModPointer.prototype.on = function(eventName, callback){
        
        // save the callback so that it can be used later in update() if it needs to be    
        if (eventName == "activestart")      this._activeStartCallback       = callback;
        else if (eventName == "activestop")  this._activeStopCallback        = callback;
        else if (eventName == "movestart")   this._moveStartCallback         = callback;
        else if (eventName == "movestop")    this._moveStopCallback          = callback;
        else if (eventName == "move")        this._moveCallback              = callback;
        else {
            throw new Error('BBModPointer.on: eventName is not a supported event.');
        }

        if (this._controllerModule === null) {
            throw new Error('BBModPointer.on: pointer has no controller module.'
                            +' You must first call BBModPointer.update() to assign this pointer a controller module.');
        }

        bindEventsToControllerModule.call(this);
    }

    return BBModPointer;
});
