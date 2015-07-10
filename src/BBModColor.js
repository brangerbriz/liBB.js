define(function(){

    function BBModColor(r, g, b, a) {
        
        this.r = r || 0;
        this.g = g || 0;
        this.b = b || 0;
        this.a = a || 255;
    }

    BBModColor.prototype.set = function(r, g, b, a) {

        if (r !== undefined) this.r = r;
        if (g !== undefined) this.g = g;
        if (b !== undefined) this.b = b;
        if (a !== undefined) this.a = a;
    };


    BBModColor.prototype.isEqual = function(color, excludeAlpha) {

        if (! color || ! (color instanceof BBModColor)) {
            throw new Error("BBModColor.isEqual: color parameter is not an instance of BBModColor");
        }

        if (excludeAlpha) {
            return (this.r === color.r &&
                    this.g === color.g &&
                    this.b === color.b);
        } else {
            return (this.r === color.r &&
                    this.g === color.g &&
                    this.b === color.b &&
                    this.a === color.a);
        }
    };

    return BBModColor;
});