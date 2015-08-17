/**
 * Basic scene manager for brushes and pointers. BB.BrushManager2D allows a
 * drawing scene (that uses brushes) to persist while the rest of the canvas is
 * cleared each frame. It also provides functionality to undo/redo manager to
 * your drawing actions. <br><br> Note: The BB.BrushManager2D class creates a new canvas
 * that is added to the DOM on top of the canvas object that you pass to its
 * constructor. This is acheived through some fancy CSS inside of
 * BB.BrushManager2D.updateCanvasPosition(...). For this reason the canvas
 * passed to the constructor must be absolutely positioned and
 * BB.BrushManager2D.updateCanvasPosition(...) should be called each time that
 * canvas' position or size is updated.
 * @module BB.BrushManager2D
 */
define(['./BB', 'BB.Pointer'],
function(  BB,      Pointer ){

    'use strict';

    BB.Pointer = Pointer;

    /**
     * Basic scene manager for brushes and pointers. BB.BrushManager2D allows a
     * drawing scene (that uses brushes) to persist while the rest of the canvas is
     * cleared each frame. It also provides functionality to undo/redo manager to
     * your drawing actions. <br><br> <i>Note: The BB.BrushManager2D class creates a new canvas
     * that is added to the DOM on top of the canvas object that you pass to its
     * constructor. This is acheived through some fancy CSS inside of
     * BB.BrushManager2D.updateCanvasPosition(...). For this reason the canvas
     * passed to the constructor must be absolutely positioned and
     * BB.BrushManager2D.updateCanvasPosition(...) should be called each time that
     * canvas' position or size is updated.</i>
     * @class BB.BrushManager2D
     * @constructor
     * @param {[HTMLCanvasElement]} canvas The HTML5 canvas element for the
     * brush manager to use.
     * @example
     * <code class="code prettyprint">&nbsp;var brushManager = new BB.BrushManager2D(document.getElementById('canvas'));
     * </code>
     */    
    BB.BrushManager2D = function(canvas) {

        var self = this;

        if (typeof canvas === 'undefined' || 
            !(canvas instanceof HTMLCanvasElement)) {
            throw new Error('BB.BrushManager2D: An HTML5 canvas object must be supplied as a first parameter.');
        }

        if (window.getComputedStyle(canvas).getPropertyValue('position') !== 'absolute') {
            throw new Error('BB.BrushManager2D: the HTML5 canvas passed into the BB.BrushManager2D' + 
                ' constructor must be absolutely positioned. Sorry ;).');
        }

        /**
         * The canvas element passed into the BB.BrushManager2D constructor
         * @property _parentCanvas
         * @type {HTMLCanvasElement}
         * @protected
         */
        this._parentCanvas    = canvas;

        /**
         * The 2D drawing context of the canvas element passed into the
         * BB.BrushManager2D constructor
         * @property _parentContext
         * @type {CanvasRenderingContext2D}
         * @protected
         */
        this._parentContext   = canvas.getContext('2d');

         /**
          * An in-memory canvas object used internally by BB.BrushManager to
          * draw to and read pixels from
          * @property canvas
          * @type {HTMLCanvasElement}
         */
        this.canvas           = document.createElement('canvas');

        /**
          * The 2D drawing context of canvas
          * @property context
          * @type {CanvasRenderingContext2D}
         */
        this.context          = this.canvas.getContext('2d');

        /**
         * A secondary canvas that is used internally by BB.BrushManager. This
         * canvas is written to the DOM on top of _parentCanvas (the canvas
         * passed into the BB.BaseBrush2D constructor). It is absolutely
         * positioned and has a z-index 1 higher than _parentCanvas.
         * @property secondaryCanvas
         * @type {HTMLCanvasElement}
         */
        this.secondaryCanvas  = document.createElement('canvas');

        /**
          * The 2D drawing context of secondaryCanvas
          * @property secondaryContext
          * @type {CanvasRenderingContext2D}
         */
        this.secondaryContext = this.secondaryCanvas.getContext('2d');

        this._parentCanvas.parentNode.insertBefore(this.secondaryCanvas, this._parentCanvas.nextSibling);
        this.updateCanvasPosition();

        this._numUndos = 5; // matches public numUndos w/ getter and setter

        /**
         * An array of base-64 encoded images that represent undo states.
         * @property _history
         * @type {Array}
         * @protected
         */
        this._history   = [];

        /**
         * An array of base-64 encoded images that represent redo states.
         * @property _purgatory
         * @type {Array}
         * @protected
         */
        this._purgatory = [];

        /**
         * An internal FBO (Frame Buffer Object) that is assigned the pixels
         * from canvas and is drawn during BB.BrushManager2D.draw()
         * @property _fboImage
         * @type {Image}
         * @protected
         */
        this._fboImage = new Image();
        this._fboImage.onload = function() {
            
            self.secondaryContext.clearRect(0, 0, self.canvas.width, self.canvas.height);
            self.secondaryCanvas.style.display = self._parentCanvas.style.display;
            self._fboImageLoadWaiting = false;
        };

        /**
         * A deep copy of _fboImage that is drawn in BB.BrushManager2D.draw()
         * when _fboImage is reloading
         * @property _fboImageTemp
         * @type {Image}
         * @default null
         * @protected
         */
        this._fboImageTemp = null;

        this._fboImage.onerror = function(err) {
           console.log('BB.BrushManager2D: src failed to load: ' + err.target.src);
        };

        /**
         * A secondary internal FBO (Frame Buffer Object) that is assigned the
         * pixels from _secondaryCanvas
         * @property _secondaryFboImage
         * @type {Image}
         * @protected
         */
        this._secondaryFboImage = new Image();

        // called by assigning src during this.update() when 
        // all pointers are up and at least one was down last frame
        this._secondaryFboImage.onload = function() {

            self.context.clearRect(0, 0, self.canvas.width, self.canvas.height);
    
            self.context.drawImage(self._fboImage, 0, 0);
            self.context.drawImage(self._secondaryFboImage, 0, 0);

            if (self._history.length === self.numUndos + 1) {
                self._history.shift();
            }

            var image = self.canvas.toDataURL();
            self._history.push(image);

            self._fboImageTemp = self._fboImage.cloneNode(true);
            self._fboImageTemp.onload = function(){}; //no-op

            self._fboImage.src = image;

            self.secondaryCanvas.style.display = "none";
            self._parentContext.drawImage(self._secondaryFboImage, 0, 0);
            self._fboImageLoadWaiting = true;
        };

        //// https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image
        //// uncommenting this causes error described here:
        //// https://github.com/brangerbriz/BBMod.js/issues/1
        // this._fboImage.crossOrigin = "anonymous";

        /**
         * An array of BB.Pointer object used to control the brushes drawn to
         * brush mananger
         * @property _pointers
         * @type {Array}
         * @protected
         */
        this._pointers = [];

        /**
         * An array of booleans indicating which pointers are currently active (down)
         * @property _pointerStates
         * @type {Array}
         * @protected
         */
        this._pointerStates = [];

        /**
         * Internal flag to determine if BB.BrushManager2D.undo() was called
         * since the BB.BrushManager2D.update()
         * @property _needsUndo
         * @type {Boolean}
         * @protected
         */
        this._needsUndo = false;

        /**
         * Internal flag to determine if BB.BrushManager2D.redo() was called
         * since the BB.BrushManager2D.update()
         * @property _needsRedo
         * @type {Boolean}
         * @protected
         */
        this._needsRedo = false;

        /**
         * Boolean that holds true if at least one pointer is active (down)
         * @property _somePointersDown
         * @type {Boolean}
         * @protected
         */
        this._somePointersDown = false;

        /**
         * Internal flag checked against in BB.BrushManager2D.draw() that
         * holds wether or not _fboImage is finished loaded. Note: this flag is
         * purposefully not set when _fboImage.src is set from undo() or redo().
         * @property _fboImageLoadWaiting
         * @type {Boolean}
         * @protected
         */
        this._fboImageLoadWaiting = false;

        // add empty canvas to the history
        this._history.push(this.canvas.toDataURL());
    };

    /**
     * The number of undo/redo states to save
     * @property numUndos
     * @type {Number}
     * @default 5
     */
    Object.defineProperty(BB.BrushManager2D.prototype, "numUndos", {
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

    /**
     * Set the brush manager to use these pointers when drawing.
     * BB.BrushManager2D must be tracking at least one pointer in order to
     * update().
     * @method trackPointers
     * @param  {Array} pointers An array of BB.Pointer objects for
     * BB.BrushManager2D to track.
     */
    BB.BrushManager2D.prototype.trackPointers = function(pointers) {
        
        if (pointers instanceof Array) {

            for (var i = 0; i < pointers.length; i++) {
             
                var pointer = pointers[i];
                if (! (pointer instanceof BB.Pointer)) {
                    throw new Error('BB.BrushManager2D.trackPointers: pointers[' +
                        i + '] is not an instance of BB.Pointer.');
                } else {
                    this._pointers.push(pointer);
                    this._pointerStates.push(pointer.isDown);
                }
            }

        } else {
            throw new Error('BB.BrushManager2D.trackPointers: pointers parameter must be an array of pointers.');
        }
    };

    /**
     * Untrack all pointers.
     * @method untrackPointers
     */
    BB.BrushManager2D.prototype.untrackPointers = function() {
        this._pointers = [];
        this._pointerStates = [];
    };

    /**
     * Untrack one pointer at index. Pointers tracked by BB.BrushManager2D
     * have indexes based on the order they were added by calls to
     * BB.BrushManager2D.trackPointers(...). Untracking a pointer removes it
     * from the internal _pointers array which changes the index of all pointers
     * after it. Keep this in mind when using this method.
     * @method untrackPointerAtIndex
     * @param {Number} index The index of the pointer to untrack.
     */
    BB.BrushManager2D.prototype.untrackPointerAtIndex = function(index) {
        
        if (typeof this._pointers[index] !== 'undefined') {
            this._pointers.splice(index, 1);
            this._pointerStates.splice(index, 1);
        } else {
            throw new Error('BB.BrushManager2D.untrackPointerAtIndex: Invalid pointer index ' +
                index + '. there is no pointer at that index.');
        }
    };

    /**
     * A method to determine if the brush manager is currently tracking pointers.
     * @method hasPointers
     * @return {Boolean} True if brush manager is tracking pointers.
     */
    BB.BrushManager2D.prototype.hasPointers = function() {
        return this._pointers.length > 0;
    };

    /**
     * A method to determine if the brush manager currently has an undo state.
     * @method hasUndo
     * @return {Boolean} True if brush manager has an undo state in its queue.
     */
    BB.BrushManager2D.prototype.hasUndo = function() {
        return this._history.length > 1;
    };

    /**
     * A method to determine if the brush manager currently has an redo state.
     * @method hasRedo
     * @return {Boolean} True if brush manager has an redo state in its queue.
     */
    BB.BrushManager2D.prototype.hasRedo = function() {
        return this._purgatory.length > 0;
    };

    /**
     * BB.BrushManager2D's update method. Should be called once per animation frame.
     * @method update
     */
    BB.BrushManager2D.prototype.update = function() {

        if (! this.hasPointers()) {
            throw new Error('BB.BrushManager2D.update: You must add at least one pointer to ' +
                            'the brush manager with BB.BrushManager2D.addPointers(...)');
        }

        var somePointersDown = this._pointerStates.some(function(val){ return val === true; });

        // if there are no pointers down this frame
        // but there were some last frame
        if (this._somePointersDown && !somePointersDown) {

            this._secondaryFboImage.src = this.secondaryCanvas.toDataURL();
        }

        for (var i = 0; i < this._pointers.length; i++) {

            this._pointerStates[i] = this._pointers[i].isDown;
        }

        this._somePointersDown = somePointersDown;
       
        var image;

        if (this._needsUndo) {
            
            if (this._purgatory.length == this.numUndos + 1) {
                this._purgatory.shift();
            }

            this._purgatory.push(this._history.pop());

            this._fboImage.src = this._history[this._history.length - 1];
            
            this._needsUndo = false;

        } else if (this._needsRedo) {
            
            if (this._purgatory.length > 0) {

                image = this._purgatory.pop();
                this._fboImage.src = image;
                this._history.push(image);
                this._needsRedo = false;
            }
        
        } else if (this._somePointersDown) {

            if (this._purgatory.length > 0) {
                this._purgatory = [];
            }
        }
    };


    /**
     * Draws the brush manager scene to the canvas supplied in the
     * BB.BrushManager2D constructor or the optionally, "context" if it was
     * provided as a parameter. Should be called once per animation frame.
     * @method update
     * @param {[CanvasRenderingContext2D]} context An optional drawing context
     * that will be drawn to if it is supplied.
     */
    BB.BrushManager2D.prototype.draw = function(context) {

        if (typeof context === "undefined" ) {
            context = this._parentContext;
        } else if(! (context instanceof CanvasRenderingContext2D)) {
            throw new Error('BB.BrushManager2D.draw: context is not an instance of CanvasRenderingContext2D');
        }

        // if the image has loaded
        if (this._fboImage.complete) {

            context.drawImage(this._fboImage, 0, 0);   

        } else if (this._fboImageTemp !== null){

            context.drawImage(this._fboImageTemp, 0, 0);

            if (this._fboImageLoadWaiting) {

                context.drawImage(this._secondaryFboImage, 0, 0);

            }
        }
    };

    /**
     * Undo one drawing action if available
     * @method undo
     */
    BB.BrushManager2D.prototype.undo = function() {

        if (this._history.length > 1) {
            this._needsUndo = true; 
        }
    };

    /**
     * Redo one drawing action if available
     * @method redo
     */
    BB.BrushManager2D.prototype.redo = function() {

        if (this._history.length > 0) {
            this._needsRedo = true;
        }
    };

    /**
     * Notifies brush manager that the canvas passed into the
     * BB.BrushManager2D constructor has been moved or resized. It is
     * important to call this method whenever the positional CSS from the parent
     * canvas is changed so that BB.BrushManager2D's internal canvases may be
     * updated appropriately.
     * @method updateCanvasPosition
     * @example
     * <code class="code prettyprint">
     * &nbsp;var canvas = document.getElementById('canvas');<br>
     * &nbsp;var brushManager = new BB.BrushManager(canvas);<br>
     * <br>
     * &nbsp;window.onresize = function() {<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;canvas.width  = window.innerWidth;<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;canvas.height = window.innerHeight;<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;brushManager.updateCanvasPosition();<br>
     * &nbsp;}
     * </code>
     */
    BB.BrushManager2D.prototype.updateCanvasPosition = function() {

        this.canvas.width = this._parentCanvas.width;
        this.canvas.height = this._parentCanvas.height;

        this.secondaryCanvas.width  = this.canvas.width;
        this.secondaryCanvas.height = this.canvas.height;

        var parentCanvasStyle = window.getComputedStyle(this._parentCanvas);

        this.secondaryCanvas.style.position      = 'absolute';
        this.secondaryCanvas.style.pointerEvents = 'none';
        this.secondaryCanvas.style.top           = parentCanvasStyle.getPropertyValue('top');
        this.secondaryCanvas.style.right         = parentCanvasStyle.getPropertyValue('right');
        this.secondaryCanvas.style.bottom        = parentCanvasStyle.getPropertyValue('bottom');
        this.secondaryCanvas.style.left          = parentCanvasStyle.getPropertyValue('left');
        this.secondaryCanvas.style.margin        = parentCanvasStyle.getPropertyValue('margin');
        this.secondaryCanvas.style.border        = parentCanvasStyle.getPropertyValue('border');
        this.secondaryCanvas.style.padding       = parentCanvasStyle.getPropertyValue('padding');
        
        var parentZIndex = parentCanvasStyle.getPropertyValue('z-index');

        if (isNaN(parentZIndex)) {

            parentZIndex = 0;
            this.secondaryCanvas.style.zIndex = parentZIndex + 1;

            throw new Error('BB.BrushManager2D: the HTML5 canvas passed into the BB.BrushManager2D' +
                ' constructor should have a z-index property value that is numeric. Currently the value is "' +
                parentZIndex + '".');

        } else {
            parentZIndex = parseInt(parentZIndex);
            this.secondaryCanvas.style.zIndex = parentZIndex + 1;
        } 
    };

    return BB.BrushManager2D;
});
