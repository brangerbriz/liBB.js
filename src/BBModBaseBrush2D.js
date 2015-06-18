/**
 * Base 2D brush class extended by BBModImageBrush2D, BBModLineBrush2D, etc...
 * @module BBModBaseBrush2D
 */
define(['./BBModColor'], function(BBModColor){

    /**
     * Base 2D brush class extended by BBModImageBrush2D, BBModLineBrush2D,
     * etc...
     * @class BBModBaseBrush2D
     * @constructor
     * @param {Object} [config] An optional config hash to initialize any of
     * BBModBaseBrush2D's public properties
     * @example <div><code> var baseBrush = new BBModBaseBrush2D({ width: 100,
     * height: 100, color: new BBModColor(255, 0, 0) }); </code></div>
     */
    function BBModBaseBrush2D(config) {

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
         * @property w
         * @type Number
         * @default 50
         */
        this.width    = (config && config.width && typeof config.width === 'number') ? config.width : 50;

        /**
         * The brush's height.
         * @property height
         * @type Number
         * @default 50
         */
        this.height   = (config && config.height && typeof config.height === 'number') ? config.height : 50;

        /**
         * The brush's rotation. This property is not always used with each brush variant.
         * @property rotation
         * @type Number
         * @default 0
         */
        this.rotation = (config && config.rotation && typeof config.rotation === 'number') ? config.rotation : 0;
        
        /**
         * The brush's color.
         * @property color
         * @type BBModColor
         * @default null
         */
        this.color    = (config && config.color && config.color instanceof BBModColor) ? config.color : null;
        
        /**
         * Wether or not to draw the brush to the screen. Toggle this variable
         * to hide and show the brush.
         * @property hidden
         * @type Boolean
         * @default false
         */
        this.hidden   = (config && config.hidden && typeof hidden === 'boolean') ? config.hidden : false;
        
        /**
         * The type of brush. Defaults to "base" for BBModBaseBrush, "image" for
         * BBModImageBrush, etc... and should be treated as read-only.
         * @property type
         * @type String
         * @default "base"
         */
        this.type = "base";
    }

    /**
     * Base update method. Usually called once per animation frame.
     * @method update
     * @param {Object} controllerModule An object with x and y properties and
     * optionally an isDown boolean (used for beginning and ending
     * strokeds/marks). ) 
     */
    BBModBaseBrush2D.prototype.update = function(controllerModule) {

        if (controllerModule !== undefined) {
            
            if (controllerModule.x !== undefined && typeof controllerModule.x === 'number') {
                this.x = controllerModule.x;
            } else {
                throw new Error('BBModBaseBrush.update: controllerModule parameter does not have a valid x parameter');
            }

            if (controllerModule.y !== undefined && typeof controllerModule.y === 'number') {
                this.y = controllerModule.y;
            } else {
                throw new Error('BBModBaseBrush.update: controllerModule parameter does not have a valid y parameter');
            }

        } else {
            throw new Error('BBModBaseBrush.update: missing controllerModule parameter');
        }
    }

    /**
     * Base draw method. Usually called once per animation frame.
     * @method draw 
     */
    BBModBaseBrush2D.prototype.draw = function() {

        // if (!this.hidden) {

        // }
    }

    /**
     * Multiplies width and height properties by amount.
     * @method scale
     * @param {Number} amount Amount to scale width and height by
     */
    BBModBaseBrush2D.prototype.scale = function(amount) {
        
        if (typeof amount === 'number') {
            
            this.width *= amount;
            this.height *= amount;

        } else {
            throw new Error("BBModBaseBrush2D.scale: scale is not a number type");
        }
    }

    return BBModBaseBrush2D;
});
