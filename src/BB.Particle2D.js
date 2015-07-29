define(['./BB', './BB.Vector2'], 
function(  BB,        Vector2){

    'use strict';

    BB.Vector2 = Vector2;

    BB.Particle2D = function(config) {

        if (config &&
            typeof config.heading === 'number' &&
            typeof config.velocity === 'number') {
            throw new Error('BB.Particle2D: Heading and velocity cannot both be properties included '
                            + 'in the BB.Particle2D constructor config parameter.');
        }

        this.velocity = new BB.Vector2(0, 0);

        var x = (config && typeof config.x === 'number') ? config.x : 0;
        var y = (config && typeof config.y === 'number') ? config.y : 0;
        
        // this.speed    = (config && typeof config.speed === 'number') ? config.speed : 0;

        var heading   = (config && typeof config.heading === 'number') ? config.heading : 1.5 * Math.PI;

        this.position = (config && typeof config.position === 'object' && config.position instanceof BB.Vector2) 
                            ? config.position : new BB.Vector2(x, y);
                            
        if (config && typeof config.velocity === 'object' && config.velocity instanceof BB.Vector2) {
            this.velocity = config.velocity;
        }

        this.acceleration = (config && typeof config.acceleration === 'object' && config.acceleration instanceof BB.Vector2) 
                            ? config.acceleration : new BB.Vector2(0, 0);

        this.mass     = (config && typeof config.mass === 'number') ? config.mass : 1;
        this.radius   = (config && typeof config.radius === 'number') ? config.radius : 0;
        this.friction = (config && typeof config.friction === 'number') ? config.friction : 1;

        this._springs      = [];
        this._gravitations = []; // Array of BB.Vector2s

        // console.log('this.position:', this.position);

    };

    Object.defineProperty(BB.Particle2D.prototype, 'heading', {
        get: function() {
            return Math.atan2(this.velocity.y, this.velocity.x);
        },
        set: function(heading) {
            var speed = this.velocity.getLength();
            this.velocity.set(Math.cos(heading) * speed, Math.sin(heading) * speed);
        }
    });

    BB.Particle2D.prototype.gravitate = function(vector2, mass) {

        if (typeof vector2 !== 'object' || ! (vector2 instanceof BB.Vector2)) {
            throw new Error('BB.Particle2D.gravitate: vector2 parameter must be present and an instance of BB.Vector2.');
        }

        if (typeof mass !== 'number') {
            throw new Error('BB.Particle2D.gravitate: mass parameter must be present and a Number type.');
        }

        this._gravitations.push({
            position: vector2,
            mass: mass
        });
    };

     BB.Particle2D.prototype.gravitateArray = function(array) {

        if (typeof array === 'undefined' || ! (array instanceof Array)) {
            throw new Error('BB.Particle2D.gravitateArray: array parameter must be present and an array of objects with position and mass properties.');
        }

        for (var i = 0; i < array.length; i++) {
            
            if (typeof array[i].position !== 'object' || ! (array[i].position instanceof BB.Vector2)) {
                throw new Error('BB.Particle2D.gravitateArray: array element ' + i 
                                + ' does not have a position property that is an instance of BB.Vector2.');
            }

            if (typeof array[i].mass !== 'number') {
                throw new Error('BB.Particle2D.gravitateArray: array element ' + i 
                                + ' does not have a mass property that is an instance of type Number.');
            }

            this._gravitations.push(array[i]);
        }
    };

    BB.Particle2D.prototype.spring = function(vector2, k, length) {

        if (typeof vector2 !== 'object' || ! (vector2 instanceof BB.Vector2)) {
            throw new Error('BB.Particle2D.spring: vector2 parameter must be present and an instance of BB.Vector2.');
        }

        if (typeof k !== 'number') {
            throw new Error('BB.Particle2D.spring: k parameter must be present and a Number type.');
        }

        if (typeof length !== 'undefined' && typeof length !== 'number') {
            throw new Error('BB.Particle2D.spring: length parameter is present but is not a Number type.');
        }

        this._springs.push({
            point: vector2,
            k: k,
            length: length || 0
        });
    };

    BB.Particle2D.prototype.springArray = function(array) {

        if (typeof array === 'undefined' || ! (array instanceof Array)) {
            throw new Error('BB.Particle2D.springArray: array parameter must '
                + 'be present and an array of objects with position, k, and length properties.');
        }

        for (var i = 0; i < array.length; i++) {
            
            if (typeof array[i].position !== 'object' || ! (array[i].position instanceof BB.Vector2)) {
                throw new Error('BB.Particle2D.springArray: array element ' + i 
                                + ' does not have a position property that is an instance of BB.Vector2.');
            }

            if (typeof array[i].k !== 'number') {
                throw new Error('BB.Particle2D.springArray: array element ' + i 
                                + ' does not have a k property that is an instance of type Number.');
            }

            if (typeof array[i].length !== 'undefined' && typeof array[i].length !== 'number') {
                throw new Error('BB.Particle2D.springArray: array element ' + i 
                                + ' does not have a length property that is an instance of type Number.');
            }

            this._springs.push({
                point: vector2,
                k: k,
                length: length || 0
            });
        }
    };

    // Object.defineProperty(BB.Particle2D.prototype, 'speed', {
    //     get: function() {
    //         return this.velocity.length();
    //          // Math.sqrt((this.velocity.x * this.velocity.x) + (this.velocity.y * this.velocity.y));
    //     },
    //     set: function(speed) {
    //         // var heading = this.heading;
    //         // this.velocity.set(Math.cos(heading) * speed, Math.sin(heading) * speed);
    //         this.velocity.setLength(speed);
    //     }
    // });

    BB.Particle2D.prototype.update = function() {

        var i = 0;

        // for (; i < this._springs.length; i++) {
            
        // }

        // apply gravitations
        var accVector = new BB.Vector2();
        for (i = 0; i < this._gravitations.length; i++) {
            
            var g = this._gravitations[i];
            var dx = g.position.x - this.position.x,
                dy = g.position.y - this.position.y,
                distSQ = dx * dx + dy * dy,
                dist = Math.sqrt(distSQ),
                force = g.mass / distSQ,
                ax = dx / dist * force,
                ay = dy / dist * force;

            // this.velocity.x += ax;
            // this.velocity.y += ay; 
            accVector.set( ax, ay );
            this.applyForce( accVector );
            // this.acceleration.add( new BB.Vector2(ax,ay) );

        }

        this.acceleration.multiplyScalar(this.friction);
       
        this.velocity.add(this.acceleration);

        this.position.add(this.velocity);

        this.acceleration.multiplyScalar(0);

        this._gravitations = [];
        this._springs = [];
        
    };

    BB.Particle2D.prototype.applyForce = function(force) {

        if (typeof force !== 'object' || ! (force instanceof BB.Vector2)) {
            throw new Error('BB.Particle2D.applyForce: force parameter must be present and an instance of BB.Vector2');
        }

        return this.acceleration.add(force.clone().divideScalar(this.mass));
        // return this.acceleration.add( force );

    };

    return BB.Particle2D;
});