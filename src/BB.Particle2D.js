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
        
        this.speed    = (config && typeof config.speed === 'number') ? config.speed : 1;

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
        
        // NOTE: should this really be here? This is making a strange assumption that gravity is pointing -y
        // which is not actually how gravity works in physics.
        this.gravity  = (config && typeof config.gravity === 'number') ? config.gravity : 0;

        this.maxSpeed = (config && typeof config.maxSpeed === 'number') ? config.maxSpeed : 10;

        this._springs      = [];
        this._gravitations = []; // Array of BB.Vector2s

        // console.log('this.position:', this.position);

    };

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
                                + ' does not have a mass property that is an instance of BB.Vector2.');
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

    Object.defineProperty(BB.Particle2D.prototype, 'speed', {
        get: function() {
            return Math.sqrt((this.velocity.x * this.velocity.x) + (this.velocity.y * this.velocity.y));
        },
        set: function(speed) {
            var heading = this.heading;
            this.velocity.set(Math.cos(heading) * speed, Math.sin(heading) * speed);
        }
    });

    Object.defineProperty(BB.Particle2D.prototype, 'heading', {
        get: function() {
            return Math.atan2(this.velocity.y, this.velocity.x);
        },
        set: function(heading) {
            var speed = this.speed;
            this.velocity.set(Math.cos(heading) * speed, Math.sin(heading) * speed);
        }
    });

    BB.Particle2D.prototype.update = function() {

        var i = 0;

        // for (; i < this._springs.length; i++) {
            
        // }

        // apply gravitations
        for (i = 0; i < this._gravitations.length; i++) {
            
            var g = this._gravitations[i];
            // console.log('gravitation', i, ':', this._gravitations[i]);
            var distance = g.position.distanceTo(this.position);
            console.log('distance:', distance);
            var force = g.position.sub(this.position);
            // console.log('force:', force);
            force.setLength(g.mass / (distance * distance));
            // console.log('force:', force);
            this.applyForce(force);

            // var dx = p2.x - this.x,
            // dy = p2.y - this.y,
            // distSQ = dx * dx + dy * dy,
            // dist = Math.sqrt(distSQ),
            // force = p2.mass / distSQ,
            
            // ax = dx / dist * force,
            // ay = dy / dist * force;

            // this.vx += ax;
            // this.vy += ay;

        }

        // console.log('position: ', this.position.x, this.position.y);
        // console.log('acceleration: ', this.acceleration.x, this.acceleration.y);
        // console.log('velocity: ', this.velocity.x, this.velocity.y);
        this.acceleration.multiplyScalar(this.friction);

        //console.log('acceleration: ', this.acceleration.x, this.acceleration.y);
        this.velocity.add(this.acceleration);
        // console.log('velocity: ', this.velocity.x, this.velocity.y);
        this.velocity.setLength(this.maxSpeed);
        // console.log('velocity: ', this.velocity.x, this.velocity.y);
        this.position.add(this.velocity);
        // console.log('position: ', this.position.x, this.position.y);
        this.acceleration.multiplyScalar(0);
        // console.log('acceleration: ', this.acceleration.x, this.acceleration.y);
        // console.log('position: ', this.position.x, this.position.y);
        // console.log();
        // debugger;
        
        // debugger;

        // this.vx *= this.friction;
        // this.vy *= this.friction;
        // this.vy += this.gravity;
        // this.x += this.vx;
        // this.y += this.vy;

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