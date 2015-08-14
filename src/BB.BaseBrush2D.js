/**
 * Base 2D brush class extended by BB.ImageBrush2D, BB.LineBrush2D, etc...
 * @module BB.BaseBrush2D
 */
define(['./BB', './BB.BrushManager2D', './BB.Color'],
function(  BB,        BrushManager2D,        Color){

    'use strict';

    BB.BaseBrush2D = BrushManager2D;
    BB.Color       = Color;

    /**
     * Base 2D brush class extended by BB.ImageBrush2D, BB.LineBrush2D,
     * etc...
     * @class BB.BaseBrush2D
     * @constructor
     * @param {Object} [config] An optional config hash to initialize any of
     * BB.BaseBrush2D's public properties
     * @example <code class="code prettyprint">&nbsp;var brush = new BB.BaseBrush2D({ width: 100,
     * height: 100, color: new BB.Color(255, 0, 0) }); </code>
     */
    BB.BaseBrush2D = function(config) {

        /**
         * The brush's x position.
         * @property x
         * @type Number
         * @default 0
         */
        this.x        = (config && config.x && typeof config.x === 'number') ? config.x : 0;

        /**
         * The brush's y position.
         * @property y
         * @type Number
         * @default 0
         */
        this.y        = (config && config.y && typeof config.y === 'number') ? config.y : 0;

        /**
         * The brush's width.
         * @property width
         * @type Number
         * @default 10
         */
        this.width    = (config && config.width && typeof config.width === 'number') ? config.width : 10;

        /**
         * The brush's height.
         * @property height
         * @type Number
         * @default 10
         */
        this.height   = (config && config.height && typeof config.height === 'number') ? config.height : 10;

        /**
         * The brush's rotation in degrees. This property is not always used with each brush variant.
         * @property rotation
         * @type Number
         * @default 0
         */
        this.rotation = (config && config.rotation && typeof config.rotation === 'number') ? config.rotation : 0;
        
        /**
         * The brush's color.
         * @property color
         * @type BB.Color
         * @default null
         */
        this.color    = (config && config.color && config.color instanceof BB.Color) ? config.color : null;
        
        /**
         * Wether or not to draw the brush to the screen. Toggle this variable
         * to hide and show the brush.
         * @property hidden
         * @type Boolean
         * @default false
         */
        this.hidden   = (config && config.hidden && typeof hidden === 'boolean') ? config.hidden : false;
        
        /**
         * The type of brush. Defaults to "base" for BB.BaseBrush, "image" for
         * BB.ImageBrush, etc... and should be treated as read-only.
         * @property type
         * @type String
         * @default "base"
         */
        this.type    = "base";

        this.manager = (config && config.manager && config.manager instanceof BB.BrushManager2D) ? config.manager : null;
    };

    /**
     * Base update method. Usually called once per animation frame.
     * @method update
     * @param {Object} controllerModule An object with x and y properties and
     * optionally an isDown boolean (used for beginning and ending
     * strokeds/marks).
     * @example  <code class="code prettyprint"> &nbsp; var brush = new BB.BaseBrush2D({ width: 50, height: 100 });<br>
     * &nbsp; brush.scale(2);<br>
     * &nbsp; brush.width // 100<br>
     * &nbsp; brush.heigh // 200
     * </code>
     */
    BB.BaseBrush2D.prototype.update = function(controllerModule) {

        if (controllerModule !== undefined) {
            
            if (controllerModule.x !== undefined && typeof controllerModule.x === 'number') {
                this.x = controllerModule.x;
            } else {
                throw new Error('BB.BaseBrush.update: controllerModule parameter does not have a valid x parameter');
            }

            if (controllerModule.y !== undefined && typeof controllerModule.y === 'number') {
                this.y = controllerModule.y;
            } else {
                throw new Error('BB.BaseBrush.update: controllerModule parameter does not have a valid y parameter');
            }

        } else {
            throw new Error('BB.BaseBrush.update: missing controllerModule parameter');
        }
    };

    /**
     * Base draw method. Usually called once per animation frame.
     * @method draw 
     */
    BB.BaseBrush2D.prototype.draw = function(context) {

        if (!context) {
            throw new Error('BB.BaseBrush.draw: Invalid context parameter');
        }

        var returnContext = context;

        if(this.manager instanceof BB.BrushManager2D) {
            returnContext = this.manager.secondaryContext;   
        }

        return returnContext;
    };

    /**
     * Multiplies width and height properties by amount.
     * @method scale
     * @param {Number} amount Amount to scale width and height by
     * @example  <code class="code prettyprint">
     * &nbsp;var mouseInput = new BB.MouseInput(document.getElementById('canvas'));<br>
     * &nbsp;var pointer = new BB.Pointer(mouseInput);<br>
     * &nbsp;var brush = new BB.BaseBrush();<br>
     * <br>
     * &nbsp; // called once per animation frame (from somewhere else in your app)<br>
     * &nbsp;function update() {<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;mouseInput.update();<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;pointer.update();<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;brush.update(pointer); // update the brush using the pointer<br>
     * &nbsp;}
     * </code>
     */
    BB.BaseBrush2D.prototype.scale = function(amount) {
        
        if (typeof amount === 'number') {
            
            this.width *= amount;
            this.height *= amount;

        } else {
            throw new Error("BB.BaseBrush2D.scale: scale is not a number type");
        }
    };

    return BB.BaseBrush2D;
});
