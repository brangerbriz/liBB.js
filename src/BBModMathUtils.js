// all static utils
define({
    norm: function(value, min, max) {

        if (typeof value !== "number") {
            throw new Error("BBModMathUtils.norm: value is not a number type");
        } else if (typeof min !== "number") {
            throw new Error("BBModMathUtils.norm: min is not a number type");
        } else if (typeof max !== "number") {
            throw new Error("BBModMathUtils.norm: max is not a number type");
        }

        return (value - min) / (max - min);
    },
    lerp: function(norm, min, max) {

        if (typeof norm !== "number") {
            throw new Error("BBModMathUtils.lerp: norm is not a number type");
        } else if (typeof min !== "number") {
            throw new Error("BBModMathUtils.lerp: min is not a number type");
        } else if (typeof max !== "number") {
            throw new Error("BBModMathUtils.lerp: max is not a number type");
        }

        return (max - min) * norm + min;
    },
    map: function(value, sourceMin, sourceMax, destMin, destMax) {

        if (typeof value !== "number") {
            throw new Error("BBModMathUtils.map: value is not a number type");
        } else if (typeof sourceMin !== "number") {
            throw new Error("BBModMathUtils.map: sourceMin is not a number type");
        } else if (typeof sourceMax !== "number") {
            throw new Error("BBModMathUtils.map: sourceMax is not a number type");
        } else if (typeof destMin !== "number") {
            throw new Error("BBModMathUtils.map: destMin is not a number type");
        } else if (typeof destMax !== "number") {
            throw new Error("BBModMathUtils.map: destMax is not a number type");
        }

        return this.lerp(this.norm(value, sourceMin, sourceMax), destMin, destMax);
    },
    dist: function(p1x, p1y, p2x, p2y){
        
        if (typeof p1x !== "number") {
            throw new Error("BBModMathUtils.dist: p1x is not a number type");
        } else if (typeof p1y !== "number") {
            throw new Error("BBModMathUtils.dist: p1y is not a number type");
        } else if (typeof p2x !== "number") {
            throw new Error("BBModMathUtils.dist: p2x is not a number type");
        } else if (typeof p2y !== "number") {
            throw new Error("BBModMathUtils.dist: p2y is not a number type");
        }

        return Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2));
    },
    angleBtw: function(p1x, p1y, p2x, p2y){

        if (typeof p1x !== "number") {
            throw new Error("BBModMathUtils.angleBtwn: p1x is not a number type");
        } else if (typeof p1y !== "number") {
            throw new Error("BBModMathUtils.angleBtwn: p1y is not a number type");
        } else if (typeof p2x !== "number") {
            throw new Error("BBModMathUtils.angleBtwn: p2x is not a number type");
        } else if (typeof p2y !== "number") {
            throw new Error("BBModMathUtils.angleBtwn: p2y is not a number type");
        }

        return Math.atan2( p2x - p1x, p2y - p1y );
    },
    radToDeg: function(radians) {

        if (typeof radians !== "number") {
            throw new Error("BBModMathUtils.radToDegree: radians is not a number type");
        }

        return radians * (180.0 / Math.PI);
    },
    degToRad: function(degrees) {

        if (typeof degrees !== "number") {
            throw new Error("BBModMathUtils.degToRad: degrees is not a number type");
        }

        return degrees * (Math.PI / 180.0);
    }  
});