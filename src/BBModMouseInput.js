// A module for standardizing mouse events so that they may be used with
// the event funnel suite of modules.
// Note: This module is for use with HTML5 canvas only.

define(function(){

    function BBModMouseInput(canvasElement) {

        var self = this;
        var movingTimeout = undefined;
        var movingTimeoutMillis = 150; // timeout to check if mouse is moving

        this.hasSelectionInterface = true; // can this click, or otherwise have some method of activation
        this.x          = 0; // the current x
        this.y          = 0; // the current y
        this.prevX      = 0; // the previous mouse x
        this.prevY      = 0; // the previous mouse y
        this.clickX     = 0; // the last clicked x
        this.clickY     = 0; // the last clicked y
        this.prevClickX = 0; // the previous last clicked x
        this.prevClickY = 0; // the previous last clicked y
        this.isMoving   = false;
        this.isDown     = false;

        this.canvasElem = canvasElement;
        this.canvasElem.addEventListener('mousemove', function(e) {

            var mouse = getCanvasMouseCoords(e);
            self.prevX = self.x;
            self.prevY = self.y;
            self.x = mouse.x;
            self.y = mouse.y;
            self.isMoving = true;

            clearTimeout(movingTimeout);
            movingTimeout = setTimeout(function(){
                self.isMoving = false;
            }, movingTimeoutMillis);
        });

        this.canvasElem.addEventListener('mousedown', function(e){

            self.isDown = true;

            if (self.start && typeof self.start === 'function') {
                self.start(self.x, self.y);
            }
        });

        this.canvasElem.addEventListener('mouseup', function(e){

            self.isDown = false;

            if (self.stop && typeof self.stop === 'function') {
                self.stop(self.x, self.y);
            }
        });

        this.canvasElem.addEventListener('click', function(e){

            var mouse = getCanvasMouseCoords(e);
            self.prevClickX = self.clickX;
            self.prevClickY = self.clickY;
            self.clickX = mouse.x;
            self.clickY = mouse.y;
        });

        this.canvasElem.addEventListener('mouseleave', function() {

            if (self.isDown && self.stop && typeof self.stop === 'function') {
                self.stop(self.x, self.y);
            }

            self.isMoving = false;
            self.isDown   = false;
        });

        function getCanvasMouseCoords(e) {

            var rect = canvas.getBoundingClientRect();

            return {
                x: Math.round((e.clientX - rect.left) / (rect.right - rect.left) * self.canvasElem.width),
                y: Math.round((e.clientY - rect.top) / (rect.bottom - rect.top) * self.canvasElem.height)
            }
        }
    }

    BBModMouseInput.prototype.update = function() {
        // empty...
    }

    BBModMouseInput.prototype.updatePointer = function() {
        // update the pointer code specifically...
    }

    return BBModMouseInput;
});
