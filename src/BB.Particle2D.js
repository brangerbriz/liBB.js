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

        this.maxSpeed = (config && typeof config.maxSpeed === 'number') ? config.maxSpeed : 10;

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
        for (i = 0; i < this._gravitations.length; i++) {
            
            var g = this._gravitations[i];
            // var distance = g.position.distanceTo(this.position);
            // var force = g.position.clone().sub(this.position);
            
            // force.setLength(g.mass / (distance * distance));

            // this.applyForce(force);

            // var dx = g.position.x - this.position.x;
            // var dy = g.position.y - this.position.y;
            // var distSQ = dx * dx + dy * dy;
            // var dist = Math.sqrt(distSQ);
            // var force = g.mass / distSQ;
            
            // var ax = dx / dist * force;
            // var ay = dy / dist * force;

            // if (flag) {
            //     this.acceleration.x += ax;
            //     this.acceleration.y += ay;
            // } else {
            //     this.applyForce(new BB.Vector2(ax, ay));
            // }
            

                // Calculate direction of force
                var force = this.position.clone().sub(g.position);
        
                // Distance between objects       
                var distance = force.length();
                
                // Limiting the distance to eliminate "extreme" results for very close or very far objects                            
                distance = BB.MathUtils.clamp(distance, 5, 25);
                
                // Normalize vector (distance doesn't matter here, we just want this vector for direction)                                  
                force.normalize();
                
                // Calculate gravitional force magnitude  
                var strength = (/*this.G * */this.mass * g.mass) / (distance * distance);
                
                // Get force vector --> magnitude * direction
                force.multiplyScalar(strength);
                // force.negate(); // attract instead

                // this.applyForce(force);

                this.acceleration.x += force.x; //ax;
                this.acceleration.y += force.y; //ay;
            // 
        }

        this.acceleration.multiplyScalar(this.friction);

        // if (this.acceleration.x !== 0 && this.acceleration.y !== 0) {

        //     console.log("velocity before:", this.velocity);
        // }

        this.velocity.add(this.acceleration);
        
        // if (this.acceleration.x !== 0 && this.acceleration.y !== 0) {
        //     console.log('acceleration:', this.acceleration);
        //     console.log("velocity after:", this.velocity);
        // }

        this.velocity.setLength(this.maxSpeed);
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

    };

    return BB.Particle2D;
});