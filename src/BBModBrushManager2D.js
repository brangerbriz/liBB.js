/**
 * Basic scene manager for brushes and pointers. BBModBrushManager2D provides
 * functionality to
 * @module BBModBrushManager2D
 */
define(['./BBModBaseBrush2D', 'BBModBaseBrush2D', 'BBModPointer'],
function(  BBModBaseBrush2D,   BBModBaseBrush2D,   BBModPointer ){


    function BBModBrushManager2D(canvas) {

        if (typeof canvas === 'undefined' || 
            !(canvas instanceof HTMLCanvasElement)) {
            throw new Error('BBModBrushManager2D: An HTML5 canvas object must be supplied as a first parameter.');
        }

        if (window.getComputedStyle(canvas).getPropertyValue('position') !== 'absolute') {
            throw new Error('BBModBrushManager2D: the HTML5 canvas passed into the BBModBrushManager2D'
            + ' constructor must be absolutely positioned. Sorry ;).');
        }

        this._parentCanvas = canvas;        
        this.canvas  = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.secondaryCanvas = document.createElement('canvas');
        this._parentCanvas.parentNode.insertBefore(this.secondaryCanvas, this._parentCanvas.nextSibling);
        this.updateCanvasPosition();

        this._numUndos = 5; // matches public numUndos w/ getter and setter

        this._history   = []; // array of base-64 encoded img srcs
        this._purgatory = []; // array of undone base-64 encoded img srcs that
                              // can be placed back in history with redo function

        this._fboImage = new Image();
        this._fboImage.onerror = function(err) {
           console.log('BBModBrushManager2D: src failed to load: ' + err.target.src);
        }

        //// https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image
        //// uncommenting this causes error described here:
        //// https://github.com/brangerbriz/bbmod/issues/1
        // this._fboImage.crossOrigin = "anonymous";

        this._pointers = [];
        // array of booleans indicating which pointers are currently active (down
        this._pointerStates = [];

        this._needsUndo = false;
        this._needsRedo = false;
        this._srcLoadWaiting = false;
        this._somePointersDown = false;

        // add empty canvas to the history
        this._history.push(this.canvas.toDataURL());
    }

    Object.defineProperty(BBModBrushManager2D.prototype, "numUndos", {
        get: function() {
            return this._numUndos;
        },
        set: function(val) {
            
            this._numUndos = val;
            
            // remove old undos if they exist
            if (this._numUndos < this._history.length - 1) {
                this._history.splice(0, this._history.length - this._numUndos - 1);
            }
        }
    });

    BBModBrushManager2D.prototype.trackPointers = function(pointers) {
        
        if (pointers instanceof Array) {

            for (var i = 0; i < pointers.length; i++) {
             
                var pointer = pointers[i];
                if (! (pointer instanceof BBModPointer)) {
                    throw new Error('BBModBrushManager2D.trackPointers: pointers[' 
                        + i + '] is not an instance of BBModPointer.');
                } else {
                    this._pointers.push(pointer);
                    this._pointerStates.push(pointer.isDown);
                }
            }

        } else {
            throw new Error('BBModBrushManager2D.trackPointers: pointers parameter must be an array of pointers.');
        }
    }

    BBModBrushManager2D.prototype.untrackPointers = function() {
        this._pointers = [];
        this._pointerStates = [];
    }

    BBModBrushManager2D.prototype.untrackPointerAtIndex = function(index) {
        
        if (typeof this._pointers[index] !== 'undefined') {
            this._pointers.splice(index, 1);
            this._pointerStates.splice(index, 1);
        } else {
            throw new Error('BBModBrushManager2D.untrackPointerAtIndex: Invalid pointer index ' 
                + index + '. there is no pointer at that index.');
        }
    }

    BBModBrushManager2D.prototype.hasPointers = function() {
        return this._pointers.length > 0;
    }

    BBModBrushManager2D.prototype.hasUndo = function() {
        return this._history.length > 1;
    }

    BBModBrushManager2D.prototype.hasRedo = function() {
        return this._purgatory.length > 0;
    }

    BBModBrushManager2D.prototype.update = function() {

        if (! this.hasPointers()) {
            throw new Error('BBModBrushManager2D.update: You must add at least one pointer to '
                            + 'the brush manager with BBModBrushManager2D.addPointers(...)');
        }

        this._somePointersDown = this._pointerStates.some(function(val){ return val === true });

        for (var i = 0; i < this._pointers.length; i++) {
            
            var pointer = this._pointers[i];

            // state change detected
            if (pointer.isDown === false &&
                this._pointerStates[i] === true) {

                if (this._history.length === this.numUndos + 1) {
                    this._history.shift();
                }

                this._history.push(this.canvas.toDataURL());
            }

            this._pointerStates[i] = pointer.isDown;
        }
    }

    BBModBrushManager2D.prototype.draw = function(context) {

        var self = this;

        function drawToFBOAndContext() {
            self.context.clearRect(0, 0, self.canvas.width, self.canvas.height);
            self.context.drawImage(self._fboImage, 0, 0);
            context.drawImage(self._fboImage, 0, 0); 
        }

        // don't override 
        if (!this._srcLoadWaiting) {
            this._fboImage.onload = function() {
                drawToFBOAndContext();
                self._srcLoadWaiting = false;
            }
        }
        
        
        if (this._needsUndo) {
            
            if (this._purgatory.length == this.numUndos + 1) {
                this._purgatory.shift();
            }

            this._purgatory.push(this._history.pop());

            this._fboImage.src = this._history[this._history.length - 1];
            this._srcLoadWaiting = true;
            
            this._needsUndo = false;

        } else if (this._needsRedo) {
            
            if (this._purgatory.length > 0 &&
                !self._srcLoadWaiting) {

                this._fboImage.onload = function() {
                
                    drawToFBOAndContext();

                    if (self._history.length === self.numUndos + 1) {
                        self._history.shift();
                    }

                    self._history.push(self.canvas.toDataURL());
                    self._srcLoadWaiting = false;
                }
                
                this._fboImage.src = this._purgatory.pop();
                this._srcLoadWaiting = true;
                this._needsRedo = false;
            }
        
        } else if (this._somePointersDown) {

            this._fboImage.src = this.canvas.toDataURL();
            this._srcLoadWaiting = true;

            if (this._purgatory.length > 0) {
                this._purgatory = [];
            }
        }
        
        // if the image has loaded
        // if (this._fboImage.complete) {
            context.drawImage(this._fboImage, 0, 0);    
        // }
    }

    BBModBrushManager2D.prototype.undo = function() {

        if (this._history.length > 1) {
            this._needsUndo = true; 
        }
    }

    BBModBrushManager2D.prototype.redo = function() {

        if (this._history.length > 0) {
            this._needsRedo = true;
        }
    }

    BBModBrushManager2D.prototype.updateCanvasPosition = function() {

        this.canvas.width = this._parentCanvas.width;
        this.canvas.height = this._parentCanvas.height;

        this.secondaryCanvas.width  = this.canvas.width;
        this.secondaryCanvas.height = this.canvas.height;
        this.secondaryContext       = this.secondaryCanvas.getContext('2d');

        var parentCanvasStyle = window.getComputedStyle(this._parentCanvas);

        this.secondaryCanvas.style.position      = 'absolute';
        this.secondaryCanvas.style.pointerEvents = 'none';
        this.secondaryCanvas.style.top           = parentCanvasStyle.getPropertyValue('top');
        this.secondaryCanvas.style.right         = parentCanvasStyle.getPropertyValue('right');
        this.secondaryCanvas.style.bottom        = parentCanvasStyle.getPropertyValue('bottom');
        this.secondaryCanvas.style.left          = parentCanvasStyle.getPropertyValue('left');
        
        var parentZIndex = parentCanvasStyle.getPropertyValue('z-index');

        if (isNaN(parentZIndex)) {

            throw new Error('BBModBrushManager2D: the HTML5 canvas passed into the BBModBrushManager2D'
                + ' constructor should have a z-index property value that is numeric. Currently the value is "' 
                + parentZIndex + '".');

            parentZIndex = 0;

        } else {
            parentZIndex = parseInt(parentZIndex);
        }

        this.secondaryCanvas.style.zIndex = parentZIndex + 1;
         
    }

    BBModBrushManager2D.prototype._getCurrentContext = function() {
        return this._somePointersDown ? this.secondaryContext : this.context;
    }

    return BBModBrushManager2D;
});
