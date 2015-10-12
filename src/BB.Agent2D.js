// define(['./BB', './BB.Particle2D'], 
// function(  BB,        Particle2D){

// 'use strict';

// BB.Particle2D = Particle2D;

    BB.Agent2D = function(config) {

        BB.Particle2D.call(this, config);
    };

    BB.Agent2D.prototype = Object.create(BB.Particle2D.prototype);
    BB.Agent2D.prototype.constructor = BB.Agent2D;

    BB.Agent2D.prototype.seek = function(targets, maxForce, arriveDistance) {

        if (!(targets instanceof Array)) {
            targets = [ targets ];
        }

        if (typeof maxForce !== 'number') {
            maxForce = 0.1;
        }

        var desired = new BB.Vector2();
        var steer = new BB.Vector2();

        for (var i = 0; i < targets.length; i++) {
            
            desired.subVectors(targets[i], this.position);

            var d = desired.length();
            // Scale with arbitrary damping within 100 pixels
            if (d < arriveDistance) {
                
                var m = BB.MathUtils.map(d, 0, arriveDistance, 0, this.maxSpeed);
                desired.setLength(m);

            } else {
                desired.setLength(this.maxSpeed);
            }

            steer = desired.sub(this.velocity);
            
            if (steer.length() > maxForce) {
                steer.setLength(maxForce);
            }

            this.applyForce(steer);
        }
    };

    BB.Agent2D.prototype.avoid = function() {

    };

// return BB.Agent2D;

// });