/**
 * A 2D Autonomous Agent class for "intelligent" physics behaviors.
 * @module BB.Agent2D
 * @extends BB.Particle2D
 */
define(['./BB', './BB.Particle2D'], 
function(  BB,        Particle2D){

'use strict';

    BB.Particle2D = Particle2D;

    /**
     * A 2D Autonomous Agent class for "intelligent" physics behaviors.
     * @class BB.Agent2D
     * @constructor
     * @extends BB.Particle2D
     * @param {Object} config Agent2D configuration object. Exactly the same
     * configuration object expected in BB.Particle2D.
     * @example  <code class="code prettyprint">
     * &nbsp;var WIDTH = window.innerWidth;<br>
     * &nbsp;var HEIGH = window.innerHeight;<br>
     * &nbsp;var agent = new BB.Agent2D({<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;maxSpeed: 6,<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;position: new BB.Vector2( Math.random() \* WIDTH, Math.random() \* HEIGHT ),<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;velocity: new BB.Vector2(1, 2),<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;radius: 50<br>
     * &nbsp;});
     * </code>
     */
    BB.Agent2D = function(config) {

        BB.Particle2D.call(this, config);
    };

    BB.Agent2D.prototype = Object.create(BB.Particle2D.prototype);
    BB.Agent2D.prototype.constructor = BB.Agent2D;


    // NOTE: flee is a _secret_ parameter used internally by flee() to invert
    // the seek behavior
    /**
    * Applies a force that steers the agent towards target(s). Opposite of flee.
    * @method seek
    * @param  {Array} targets         An array of BB.Vector2 objects. May
    * also be a single BB.Vector2 object.
    * @param  {Number} [maxForce=0.1]     The maximum force used to limit the
    * seek behavior. Defaults to 0.1 if parameter is null or undefined.
    * @param  {Number} [arriveDistance] Threshold distance to apply the
    * arrive behavior. If a non-null/undefined value is supplied, the agent
    * will slow its movement porportionate to its distance from a target if
    * it is within this distance from that target.
    * @param  {Number} [multiplier=1]   An optional parameter (usually between 0-1.0) used to scale the
    * seek force. This multiplier operation is run right before the seek
    * force is applied, after the force may have already been limited by
    * maxForce.
    * @example <code class="code prettyprint">&nbsp;// assuming agent is an instance of BB.Agent2D<br>
    * &nbsp;// assuming targets is an array of BB.Vector2s<br>
    * &nbsp;agent.seek(targets, 0.1, 200);<br>
    * </code>
    */
    BB.Agent2D.prototype.seek = function(targets, maxForce, arriveDistance, multiplier, flee) {

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

            if (typeof arriveDistance === 'number') {

                var d = desired.length();

                // Scale with arbitrary damping within 100 pixels
                if (d < arriveDistance) {
                    
                    var m = BB.MathUtils.map(d, 0, arriveDistance, 0, this.maxSpeed);
                    desired.setLength(m);              

                } else {
                    desired.setLength(this.maxSpeed);
                }

            } else {
                desired.setLength(this.maxSpeed);
            }

            if (flee === true) desired.negate();

            steer.subVectors(desired, this.velocity);
            
            if (steer.length() > maxForce) {
                steer.setLength(maxForce);
            }

            if (typeof multiplier === 'number') {
                steer.multiplyScalar(multiplier);
            }

            this.applyForce(steer);
        }
    };

    /**
    * Applies a force that steers the agent away from particles(s). Opposite of seek.
    * @method flee
    * @param  {Array} targets         An array of BB.Vector2 objects. May
    * also be a single BB.Vector2 object.
    * @param  {Number} [maxForce=0.1]     The maximum force used to limit the
    * flee behavior. Defaults to 0.1 if parameter is null or undefined.
    * @param  {Number} [multiplier=1]   An optional parameter (usually between 0-1.0) used to scale the
    * flee force. This multiplier operation is run right before the flee
    * force is applied, after the force may have already been limited by
    * maxForce. 
    * @example <code class="code prettyprint">&nbsp;// assuming agent is an instance of BB.Agent2D<br>
    * &nbsp;// assuming targets is an array of BB.Vector2s<br>
    * &nbsp;agent.flee(targets, 0.1);<br>
    * &nbsp;// or to half the flee force, use a multiplier<br>
    * &nbsp;agent.flee(targets, 0.1, 0.5);<br>
    * </code>
    */
    BB.Agent2D.prototype.flee = function(targets, maxForce, multiplier) {
        this.seek(targets, maxForce, null, multiplier, true);
    };

    /**
    * Applies a force that steers the agent to avoid particles(s).
    * @method avoid
    * @param  {Array} particles       An array of BB.Particle2D objects. May
    * also be a single BB.Particle2D object.
    * @param  {Number} [maxForce]     The maximum force used to limit the
    * avoid behavior. Defaults to 0.1 if parameter is null or undefined.
    * @param  {Number} [seperationDistance] Threshold distance to apply the
    * avoid behavior. Defaults to 20 if parameter is null or undefined.
    * @param  {Number} [multiplier=1]   An optional parameter (usually between 0-1.0) used to scale the
    * avoid force. This multiplier operation is run right before the avoid
    * force is applied, after the force may have already been limited by
    * maxForce. 
    * @example <code class="code prettyprint">&nbsp;// assuming agent is an instance of BB.Agent2D<br>
    * &nbsp;// assuming particles is an array of BB.Particle2Ds<br>
    * &nbsp;agent.avoid(particles, 0.1, 100);<br>
    * &nbsp;// or to half the avoid force, use a multiplier<br>
    * &nbsp;agent.avoid(particles, 0.1, 100, 0.5);<br>
    * </code>
    */
    BB.Agent2D.prototype.avoid = function(particles, maxForce, seperationDistance, multiplier) {

        if (!(particles instanceof Array)) {
            particles = [particles];
        }

        if (typeof maxForce !== 'number') {
            maxForce = 0.1;
        }

        if (typeof seperationDistance !== 'number') {
            seperationDistance = 20;
        }

        var diff = new BB.Vector2();
        var steer = new BB.Vector2();

        var sum = new BB.Vector2();
        var count = 0;

        for (var i = 0; i < particles.length; i++) {
            
            if (! (particles[i] instanceof BB.Particle2D)) {
                throw new Error('BB.Agent2D.avoid: This particle is not an instance of BB.Particle2D');
            }

            var d = diff.subVectors(this.position, particles[i].position).length();

            if (d > 0 && d < seperationDistance) {
                
                diff.normalize().divideScalar(d);
                sum.add(diff);
                count++;
            }
        }

        // average
        if (count > 0) {
            
            sum.divideScalar(count);
            sum.normalize();
            sum.multiplyScalar(this.maxSpeed);

            steer.subVectors(sum, this.velocity);

            if (steer.length() > maxForce) {
                steer.setLength(maxForce);
            }

            if (typeof multiplier === 'number') {
                steer.multiplyScalar(multiplier);
            }

            this.applyForce(steer);
        }

    };

    /**
    * Alias of avoid(). Applies a force that steers the agent to avoid particles(s).
    * @method seperate
    * @param  {Array} particles       An array of BB.Particle2D objects. May
    * also be a single BB.Particle2D object.
    * @param  {Number} [maxForce]     The maximum force used to limit the
    * avoid behavior. Defaults to 0.1 if parameter is null or undefined.
    * @param  {Number} [seperationDistance] Threshold distance to apply the
    * avoid behavior. Defaults to 20 if parameter is null or undefined.
    * @param  {Number} [multiplier=1]   An optional parameter (usually between 0-1.0) used to scale the
    * avoid force. This multiplier operation is run right before the avoid
    * force is applied, after the force may have already been limited by
    * maxForce.
     */
    BB.Agent2D.prototype.seperate = BB.Agent2D.prototype.avoid;

    /**
    * Applies a force that that is the average velocity of all nearby particles(s).
    * @method align
    * @param  {Array} particles       An array of BB.Particle2D objects. May
    * also be a single BB.Particle2D object.
    * @param  {Number} [maxForce=0.1]     The maximum force used to limit the
    * align behavior. Defaults to 0.1 if parameter is null or undefined.
    * @param  {Number} [neighborDistance=50] Threshold distance to apply the
    * align behavior. Defaults to 20 if parameter is null or undefined.
    * @param  {Number} [multiplier=1]   An optional parameter (usually between 0-1.0) used to scale the
    * align force. This multiplier operation is run right before the align
    * force is applied, after the force may have already been limited by
    * maxForce. 
    * @example <code class="code prettyprint">&nbsp;// assuming agent is an instance of BB.Agent2D<br>
    * &nbsp;// assuming particles is an array of BB.Vector2s<br>
    * &nbsp;agent.align(particles, 0.1, 50);<br>
    * &nbsp;// or to half the align force, use a multiplier<br>
    * &nbsp;agent.align(particles, 0.1, 50, 0.5);
    * </code>
    */
    BB.Agent2D.prototype.align = function(particles, maxForce, neighborDistance, multiplier) {

        if (!(particles instanceof Array)) {
            particles = [ particles ];
        }

        if (typeof maxForce !== 'number') {
            maxForce = 0.1;
        }

        if (typeof neighborDistance !== 'number') {
            neighborDistance = 50;
        }

        var diff = new BB.Vector2();
        var steer = new BB.Vector2();
        var sum = new BB.Vector2();
        var count = 0;

        for (var i = 0; i < particles.length; i++) {
            
            if (! (particles[i] instanceof BB.Particle2D)) {
                throw new Error('BB.Agent2D.align: This particle is not an instance of BB.Particle2D');
            }

            var d = diff.subVectors(this.position, particles[i].position).length();

            if (d > 0 && d < neighborDistance) {

                sum.add(particles[i].velocity);
                count++;
            }
        }

         // average
        if (count > 0) {
            
            sum.divideScalar(count);
            sum.normalize();
            sum.multiplyScalar(this.maxSpeed);

            steer.subVectors(sum, this.velocity);

            if (steer.length() > maxForce) {
                steer.setLength(maxForce);
            }

            if (typeof multiplier === 'number') {
                steer.multiplyScalar(multiplier);
            }

            this.applyForce(steer);
        }
    };

    
    /**
    * Applies a steering force that is the average position of all nearby particles(s).
    * @method cohesion
    * @param  {Array} particles       An array of BB.Particle2D objects. May
    * also be a single BB.Particle2D object.
    * @param  {Number} [maxForce=0.1]     The maximum force used to limit the
    * cohesion behavior. Defaults to 0.1 if parameter is null or undefined.
    * @param  {Number} [neighborDistance=50] Threshold distance to apply the
    * cohesion behavior. Defaults to 20 if parameter is null or undefined.
    * @param  {Number} [multiplier=1]   An optional parameter (usually between 0-1.0) used to scale the
    * cohesion force. This multiplier operation is run right before the cohesion
    * force is applied, after the force may have already been limited by
    * maxForce.
    * @example <code class="code prettyprint">&nbsp;// assuming agent is an instance of BB.Agent2D<br>
    * &nbsp;// assuming particles is an array of BB.Vector2s<br>
    * &nbsp;agent.cohesion(particles, 0.1, 50);<br>
    * &nbsp;// or to half the cohesion force, use a multiplier<br>
    * &nbsp;agent.cohesion(particles, 0.1, 50, 0.5);
    * </code>
    */ 
   
    BB.Agent2D.prototype.cohesion = function(particles, maxForce, neighborDistance, multiplier) {

        if (!(particles instanceof Array)) {
            particles = [ particles ];
        }

        if (typeof maxForce !== 'number') {
            maxForce = 0.1;
        }

        if (typeof neighborDistance !== 'number') {
            neighborDistance = 50;
        }

        var diff = new BB.Vector2();
        var sum = new BB.Vector2();
        var count = 0;

        for (var i = 0; i < particles.length; i++) {
            
            if (! (particles[i] instanceof BB.Particle2D)) {
                throw new Error('BB.Agent2D.cohesion: This particle is not an instance of BB.Particle2D');
            }

            var d = diff.subVectors(this.position, particles[i].position).length();

            if (d > 0 && d < neighborDistance) {

                sum.add(particles[i].position);
                count++;
            }
        }

        // average
        if (count > 0) {
            
            sum.divideScalar(count);
            this.seek(sum, maxForce, null, multiplier);
        }
    };

    // NOTE: this must be run every update()
    /**
     * Causes the agent to steer away from a rectangular bounding box. Must be
     * run once per frame.
     * @method  avoidWalls
     * @param {Object} config The config object.
     * @param {Number} config.top The top of the bounding box.
     * @param {Number} config.bottom The bottom of the bounding box.
     * @param {Number} config.left The left of the bounding box.
     * @param {Number} config.right The right of the bounding box.
     * @param {Number} config.distance The threshold distance inside of which the
     * avoidWalls force will be applied to the agent.
     * @param {Number} [config.maxForce=0.1] The maximum force used to limit the
     * avoidWalls behavior. Defaults to 0.1 if parameter is null or undefined.
     * @example <code class="code prettyprint">&nbsp;// assuming agent is an instance of BB.Agent2D<br>
     * &nbsp;agent.avoidWalls({<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;top: 0,<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;bottom: window.innerHeight,<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;left: 0,<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;right: window.innerWidth,<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;distance: 100,<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;maxForce: 0.1<br>
     * &nbsp;});<br>
     * </code>
     */
    BB.Agent2D.prototype.avoidWalls = function(config) {

        if (typeof config.top !== 'number') 
            throw new Error('BB.Agent2D.avoidWalls: config.top must be included and a number type');
        else if (typeof config.bottom !== 'number') 
            throw new Error('BB.Agent2D.avoidWalls: config.bottom must be included and a number type');
        else if (typeof config.left !== 'number') 
            throw new Error('BB.Agent2D.avoidWalls: config.left must be included and a number type');
        else if (typeof config.right !== 'number') 
            throw new Error('BB.Agent2D.avoidWalls: config.right must be included and a number type');
        else if (typeof config.distance !== 'number') 
            throw new Error('BB.Agent2D.avoidWalls: config.distance must be included and a number type');


        var desired = null;
        var steer = new BB.Vector2();
        var maxForce = (typeof config.maxForce === 'number') ? config.maxForce : 0.1;

        if (this.position.x < config.left + config.distance) {
            desired = new BB.Vector2(this.maxSpeed, this.velocity.y);
        } 
        else if (this.position.x > config.right - config.distance) {
            desired = new BB.Vector2(-this.maxSpeed, this.velocity.y);
        }

        if (this.position.y < config.top + config.distance) {
            desired = new BB.Vector2(this.velocity.x, this.maxSpeed);
        } 
        else if (this.position.y > config.bottom - config.distance) {
            desired = new BB.Vector2(this.velocity.x, - this.maxSpeed);
        } 

        if (desired !== null) {
          
            desired.normalize().multiplyScalar(this.maxSpeed);
            steer.subVectors(desired, this.velocity);
          
            if (steer.length() > maxForce) {
                steer.setLength(maxForce);
            }
          
            this.applyForce(steer);
        }
    };

return BB.Agent2D;

});