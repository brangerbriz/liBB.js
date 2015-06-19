/**
 * A module for standardizing mouse events so that they may be used with
 * the event funnel suite of modules. For use with HTML5 canvas only.
 * @module BBModMouseInput
 */
define(function(){
    
    /**
     * A module for standardizing mouse events so that they may be used with
     * the event funnel suite of modules.
     * @class  BBModMouseInput
     * @constructor
     * @param {Object} canvasElement The HTML5 canvas object listening for mouse input.
     */
    function BBModMouseInput(canvasElement) {

        var self = this;
        var movingTimeout = null;

        /**
         * The current x position.
         * @property x
         * @type {Number}
         * @default 0
         */
        this.x          = 0;

        /**
         * The current y position.
         * @property y
         * @type {Number}
         * @default 0
         */
        this.y          = 0;

        /**
         * The last clicked x position.
         * @property clickX
         * @type {Number}
         * @default 0
         */
        this.clickX     = 0;

        /**
         * The last clicked y position.
         * @property clickY
         * @type {Number}
         * @default 0
         */
        this.clickY     = 0;

        /**
         * Time in milliseconds that the mouse has been still before considering it's movement to be finished.
         * @property moveDebounce
         * @type {Number}
         */
        this.moveDebounce = 150;

        this._isMoving = false;
        this._isDown = false;

        /**
         * The HTML5 canvas element passed into BBModMouseInput during
         * construction.
         * @property canvasElem
         * @type {Object}
         */
        this.canvasElem = canvasElement;

        this.canvasElem.addEventListener('mousemove', function(e) {

            var mouse = getCanvasMouseCoords(e);
            self.x = mouse.x;
            self.y = mouse.y;
                
            if (!self.isMoving && self.hasOwnProperty('_moveStartCallback') &&
                typeof self._moveStartCallback === 'function') {

                self._moveStartCallback(self.x, self.y);
            }
        
            self._isMoving = true;

            clearTimeout(movingTimeout);
            movingTimeout = setTimeout(function(){

                if (self.isMoving &&
                    self.hasOwnProperty('_moveStopCallback') &&
                    typeof self._moveStartCallback === 'function') {

                    self._isMoving = false;
                    self._moveStopCallback(self.x, self.y);
                }
            }, self.moveDebounce);
        });

        this.canvasElem.addEventListener('mousedown', function(e){

            self._isDown = true;

            if (self.hasOwnProperty('_activeStartCallback') && 
                typeof self._activeStartCallback === 'function') {

                self._activeStartCallback(self.x, self.y);
            }
        });

        this.canvasElem.addEventListener('mouseup', function(e){

            self._isDown = false;

            if (self.hasOwnProperty('_activeStopCallback') &&
                typeof self._activeStopCallback === 'function') {

                self._activeStopCallback(self.x, self.y);
            }
        });

        this.canvasElem.addEventListener('click', function(e){

            var mouse = getCanvasMouseCoords(e);
            self.clickX = mouse.x;
            self.clickY = mouse.y;
        });

        this.canvasElem.addEventListener('mouseleave', function() {

            if (self._isDown && 
                self.hasOwnProperty('_activeStopCallback') && 
                typeof self._activeStopCallback === 'function') {

                self._activeStopCallback(self.x, self.y);
            }

            if (self.isMoving &&
                self.hasOwnProperty('_moveStopCallback') && 
                typeof self._moveStopCallback === 'function') {

                self._moveStopCallback(self.x, self.y);
            }

            self._isMoving = false;
            self._isDown   = false;
        });

        function getCanvasMouseCoords(e) {

            var rect = canvas.getBoundingClientRect();

            return {
                x: Math.round((e.clientX - rect.left) / (rect.right - rect.left) * self.canvasElem.width),
                y: Math.round((e.clientY - rect.top) / (rect.bottom - rect.top) * self.canvasElem.height)
            }
        }
    }

    /**
     * Holds wether or not the mouse is currently moving.
     * @property isMoving
     * @type {Boolean}
     * @default false
     */
    Object.defineProperty(BBModMouseInput.prototype, 'isMoving', {
        get: function(){
            return this._isMoving;
        },
        set: function(val){
            throw new Error('BBModMouseInput.isMoving (setter): BBModMouseInput.isMoving is a read-only property.');
        }
    });

     /**
     * Holds wether or not the mouse
     * @property isDown
     * @type {Boolean}
     * @default false
     */
    Object.defineProperty(BBModMouseInput.prototype, 'isDown', {
        get: function(){
            return this._isDown;
        },
        set: function(val){
            throw new Error('BBModMouseInput.isDown (setter): BBModMouseInput.isDown is a read-only property.');
        }
    });

    BBModMouseInput.prototype.update = function() {

        if (this.isMoving &&
            this.hasOwnProperty('_moveCallback') &&
            typeof this._moveCallback === 'function') {
            
            this._moveCallback(this.x, this.y);
        }
    }

    return BBModMouseInput;
});
