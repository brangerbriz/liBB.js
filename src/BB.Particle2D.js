/**
 * A 2D Particle class for all your physics needs
 * @module BB.particle2D
 */
define(['./BB', './BB.Vector2'], 
function(  BB,        Vector2){

    'use strict';

    BB.Vector2 = Vector2;


    /**
     * A 2D Particle class for all your physics needs
     * @class BB.Particle2D
     * @constructor
     * @param {Object} [config] An optional config object to initialize
     * Particle2D properties, including: position ( object with x and y ), mass
     * ( defaults to 1 ), radius ( defaults to 0 ) and friction ( defaults to 1
     * ).
     *
     * an initial velocity or acceleration can also be set by passing a
     * BB.Vector2 to either of those properties ( ie. velocity or acceleration
     * ). Or an alternative approach is to initialize with a heading property
     * (radians) and speed property ( number ). If no velocity or acceleration
     * or heading/speed is set, the default velocity is BB.Vector2(0,0).
     * 
     * @example  <code class="code prettyprint">&nbsp; var WIDTH = window.innerWidth;<br>
     * &nbsp; var HEIGHT = window.innerHeight;<br><br>
     * &nbsp; var star = newBB.Particle2D({ <br>
     * &nbsp;&nbsp;&nbsp;&nbsp; position: new BB.Vector2(WIDTH/2, HEIGHT/2 ),<br> 
     * &nbsp;&nbsp;&nbsp;&nbsp; mass: 20000 <br> 
     * &nbsp;}); <br><br> 
     * &nbsp; var planet = new BB.Particle2D({ <br>
     * &nbsp;&nbsp;&nbsp;&nbsp; position: new BB.Vector2( WIDTH/2+200, HEIGHT/2),<br> 
     * &nbsp;&nbsp;&nbsp;&nbsp; heading: -Math.PI / 2, <br>
     * &nbsp;&nbsp;&nbsp;&nbsp; speed: 10 <br> 
     * &nbsp; }); <br><br>
     * &nbsp; var comet = new BB.Particle2D({<br>
     * &nbsp;&nbsp;&nbsp;&nbsp; position: new BB.Vector2( <br>
     * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; BB.MathUtils.randomInt(WIDTH), <br>
     * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; BB.MathUtils.randomInt(HEIGHT) ), <br>
     * &nbsp;&nbsp;&nbsp;&nbsp; velocity: new BB.Vector2( <br>
     * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; BB.MathUtils.randomInt(10),<br>
     * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; BB.MathUtils.randomInt(10)) <br>
     * &nbsp; });
     * </code>
     */
    
    BB.Particle2D = function(config) {

        // position -------------------------------------------------
        var x = (config && typeof config.x === 'number') ? config.x : 0;
        var y = (config && typeof config.y === 'number') ? config.y : 0;
        this.position = (config && typeof config.position === 'object' && config.position instanceof BB.Vector2) 
                            ? config.position : new BB.Vector2(x, y);
        /**
         * the particle's velocity ( see acceleration also )
         * @property velocity
         * @type BB.Vector2
         */  
        if( typeof config.velocity !== "undefined" && typeof config.heading !== 'undefined' || 
            typeof config.velocity !== "undefined" && typeof config.speed !== 'undefined' ){

            throw new Error("BB.Particle2D: either use heading/speed or velocity (can't initialize with both)");
        }
        else if (typeof config.velocity !== 'undefined' && config.velocity instanceof BB.Vector2) {
            this.velocity = config.velocity; // set velocity as per config vector
        } 
        else if(typeof config.velocity !== 'undefined' && !(config.velocity instanceof BB.Vector2) ) {
            throw new Error("BB.Particle2D: velocity must be an instance of BB.Vector2");
        }        
        else if(typeof config.speed !== 'undefined' || typeof config.heading !== 'undefined'){
            
            if(typeof config.speed !== 'undefined' && typeof config.speed !== 'number' ){
                throw new Error("BB.Particle2D: speed must be a number");
            }
            else if(typeof config.heading !== 'undefined' && typeof config.heading !== 'number' ){
                throw new Error("BB.Particle2D: heading must be a number in radians");
            }
            else if(typeof config.heading !== 'undefined' && typeof config.speed === 'undefined'){
                throw new Error("BB.Particle2D: when setting a heading, a speed parameter is also required");
            }
            else if(typeof config.speed !== 'undefined' && typeof config.heading === 'undefined'){
                throw new Error("BB.Particle2D: when setting a speed, a heading parameter is also required");
            }
            else {
                // we've got both heading + speed, && their both numbers, 
                // so create velocity vector based on heading/speed
                this.velocity = new BB.Vector2(0, 0);
                this.velocity.x = Math.cos(config.heading) * config.speed;
                this.velocity.y = Math.sin(config.heading) * config.speed;
            }
        }
        else {
            this.velocity = new BB.Vector2(0, 0); // default velocity vector
        }


        /**
         * Usually used to accumulate forces to be added to velocity each frame
         * @property acceleration
         * @type BB.Vector2
         */  
        if( typeof config.acceleration !== "undefined" && typeof config.velocity !== "undefined" || 
            typeof config.acceleration !== "undefined" && typeof config.heading !== "undefined" || 
            typeof config.acceleration !== "undefined" && typeof config.speed !== "undefined"){
            throw new Error("BB.Particle2D: acceleration shouldn't be initialized along with velocity or heading/speed, use one or the other");
        } else {
            this.acceleration = (config && typeof config.acceleration === 'object' && config.acceleration instanceof BB.Vector2) 
                            ? config.acceleration : new BB.Vector2(0, 0);
        }
        

        /**
         * the particle's mass
         * @property mass
         * @type Number
         * @default 1
         */  
        this.mass     = (config && typeof config.mass === 'number') ? config.mass : 1;
        /**
         * the particle's radius, used for callculating collistions
         * @property radius
         * @type Number
         * @default 0
         */  
        this.radius   = (config && typeof config.radius === 'number') ? config.radius : 0;
        /**
         * the particle's friction ( not environment's friction ) multiplied by velocity each frame
         * @property friction
         * @type Number
         * @default 1
         */  
        this.friction = (config && typeof config.friction === 'number') ? config.friction : 1;
        /**
         * how bouncy it is when it collides with an object
         * @property elasticity
         * @type Number
         * @default 0.05
         */  
        this.elasticity = (config && typeof config.elasticity === 'number') ? config.elasticity : 0.05;

        this.maxSpeed = (config && typeof config.maxSpeed === 'number') ? config.maxSpeed : 100;

        this._springs      = []; 
        this._colliders    = []; // array of: other Particles ( x,y,r ) to collide against
        this._world        = {}; // object w/: left, right, top, bottom properties, "walls", ie. perimeter for colliding    
        this._gravitations = []; // array of: Vectors or Object{ position:..., mass:... }

    };



    /**
     * the particle's "heading" expressed in radians, essentially: Math.atan2( velocity.y,  velocity.x );
     * @property heading
     * @type Number
     */   
    Object.defineProperty(BB.Particle2D.prototype, 'heading', {
        get: function() {
            return Math.atan2(this.velocity.y, this.velocity.x);
        },
        set: function(heading) {
            this.velocity.x = Math.cos(heading) * this.speed;
            this.velocity.y = Math.sin(heading) * this.speed;
        }
    });

    /**
     * the particle's "speed", essentially: the square root of velocity.x&#178; + velocity.y&#178;
     * @property speed
     * @type Number
     */  
    Object.defineProperty(BB.Particle2D.prototype, 'speed', {
        get: function() {
            return Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        },
        set: function(speed) {
            this.velocity.x = Math.cos(this.heading) * speed;
            this.velocity.y = Math.sin(this.heading) * speed;
        }
    });




    /**
     * identifies something to gravitate towards. the object of gravitation needs to
     * have a position ( x, y ) and mass
     * 
     * @method gravitate
     * 
     * @param {Object} particle if passed as the only argument it should be an
     * Object with a position.x, position.y and mass ( ie. an instance of
     * BB.Particle2D ). Otherwise the first argument needs to be an Object with
     * an x and y ( ie. instance of BB.Vector2 or at the very least { x: ..., y:
     * ... } )
     *
     * alternatively, gravitate could also be passed an <b>array</b> of objects 
     * ( each with position and mass properties )
     * 
     * @param {Number} [mass] when particle is not an instance of BB.Particle2D
     * and is a Vector an additional argument for mass is required
     * 
     * @example 
     * <code class="code prettyprint"> 
     * &nbsp; // assuming star and planet are both instances of BB.Particle2D  <br>
     * &nbsp; planet.gravitate( star ); <br>
     * &nbsp; // or <br>
     * &nbsp; planet.gravitate( star.position, star.mass ); <br>
     * &nbsp; // or <br>
     * &nbsp; planet.gravitate( { x:WIDTH/2, y:HEIGHT/2 }, 20000 ); <br><br>
     * &nbsp; // assuming stars is an array of BB.particle2D <br>
     * &nbsp; planet.gravitate( stars );<br>
     * </code>
     */
    BB.Particle2D.prototype.gravitate = function( particle, mass ) {
        var part;

        // if array --------------------------------------------------------------------
        if( particle instanceof Array ){
            for (var i = 0; i < particle.length; i++) {

                var p = particle[i];

                if( typeof p === "undefined"){
                    throw new Error('BB.Particle2D: gravitate array is empty');
                }
                else if( p instanceof BB.Particle2D ){
                    this._gravitations.push({ position:p.position, mass:p.mass });
                }
                else if( p instanceof BB.Vector2 && typeof mass === "number" ){
                    part = { position:p };
                    this._gravitations.push({ position:part.position, mass:mass });
                }
                else if( p instanceof BB.Vector2 && typeof mass !== "number" ){
                    throw new Error('BB.Particle2D: gravitate array objects are missing a mass');
                }
                else if( !(p instanceof BB.Vector2) ){
                    if( typeof p.x === "undefined" || typeof p.y === "undefined" ){
                        throw new Error('BB.Particle2D: gravitate array items should be objects with x and y properties');
                    } 
                    else if( typeof mass == "undefined"){
                        throw new Error('BB.Particle2D: gravitate array objects are missing a mass' );
                    }
                    else {
                        part = { position:{x:p.x, y:p.y } };
                        this._gravitations.push({ position:part.position, mass:mass });
                    }
                }
            }
        }
        
        // if single particle -----------------------------------------------------------
        else {
           
            if( typeof particle === "undefined"){
                throw new Error('BB.Particle2D: gravitate is missing arguments');
            }
            else if( particle instanceof BB.Particle2D ){
                this._gravitations.push({ position:particle.position, mass:particle.mass });
            }
            else if( particle instanceof BB.Vector2 && typeof mass === "number" ){
                part = { position:particle };
                this._gravitations.push({ position:part.position, mass:mass });
            }
            else if( particle instanceof BB.Vector2 && typeof mass !== "number" ){
                throw new Error('BB.Particle2D: gravitate\'s second argument requires a number ( mass )');
            }
            else if( !(particle instanceof BB.Vector2) ){
                if( typeof particle.x === "undefined" || typeof particle.y === "undefined" ){
                    throw new Error('BB.Particle2D: gravitate argument should be an object with an x and y property');
                } 
                else if( typeof mass == "undefined"){
                    throw new Error('BB.Particle2D: gravitate\'s second argument requires a number ( mass )' );
                }
                else {
                    part = { position:{x:particle.x, y:particle.y } };
                    this._gravitations.push({ position:part.position, mass:mass });
                }
            }            
        }


    };



    /**
     * identifies something to spring towards. the target needs to have an x,y
     * position, a k value which is a constant factor characteristic of the spring 
     * ( ie. its stiffness, usually some decimal ), and a length.
     * 
     * @method spring
     * 
     * @param {Object} config object with properties for point ( vector with x,y ), 
     * k ( number ) and length ( number ).
     *
     * alternatively, spring could also be passed an <b>array</b> of config objects 
     * 
     * @example 
     * <code class="code prettyprint"> 
     * &nbsp; // assuming ball is an instance of BB.Particle2D <br>
     * &nbsp; // and center is an object with x,y positions <br>
     * &nbsp; ball.spring({ <br>
     * &nbsp;&nbsp;&nbsp;&nbsp; position: center.position,<br>
     * &nbsp;&nbsp;&nbsp;&nbsp; k: 0.1,<br>
     * &nbsp;&nbsp;&nbsp; length: 100<br>
     * &nbsp; });<br>
     * &nbsp; <br>
     * &nbsp; // the ball will spring back and forth forever from the center position <br>
     * &nbsp; // unless ball has friction value below the default of 1.0
     * </code>
     */
    BB.Particle2D.prototype.spring = function( config ) {

        // if array --------------------------------------------------------------------
        if( config instanceof Array ){

            for (var i = 0; i < config.length; i++) {

                var p = config[i];

                if( typeof p === "undefined"){
                    throw new Error('BB.Particle2D: spring array is empty, expecting config objects');
                }
                else if( typeof p !== "object" || p.position === "undefined" ||
                          typeof p.k === "undefined" ||  typeof p.length === "undefined"){
                    throw new Error('BB.Particle2D: spring array expecting config objects, with properies for position, length and k');
                }
                else if( typeof p.position.x !== "number" || typeof p.position.y !== "number" ){
                    throw new Error('BB.Particle2D: spring array objects\' positions should have x and y properties ( numbers )');   
                }
                else if( typeof p.k !== "number" ){
                    throw new Error('BB.Particle2D: spring array object\'s k properties should be numbers ( usually a float )');   
                }
                else if( typeof p.length !== "number" ){
                    throw new Error('BB.Particle2D: spring array object\'s length properties should be numbers ( usually a integers ');   
                }
                else {
                    this._springs.push({ position:p.position, k:p.k, length:p.length });
                }

            }
        }
        
        // if single target -----------------------------------------------------------
        else {
           
            if( typeof config === "undefined"){
                throw new Error('BB.Particle2D: spring is missing arguments');
            }
            else if( typeof config !== "object" || config.position === "undefined" ||
                      typeof config.k === "undefined" ||  typeof config.length === "undefined"){
                throw new Error('BB.Particle2D: spring expecting a config object, with properies for position, length and k');
            }
            else if( typeof config.position.x !== "number" || typeof config.position.y !== "number" ){
                throw new Error('BB.Particle2D: config.position should have x and y properties ( numbers )');   
            }
            else if( typeof config.k !== "number" ){
                throw new Error('BB.Particle2D: config.k property should be a number ( usually a float )');   
            }
            else if( typeof config.length !== "number" ){
                throw new Error('BB.Particle2D: config.length property should be a number ( usually an integer )');   
            }
            else {
                this._springs.push( { position:config.position, k:config.k, length:config.length } );
            }
        }


    };


    /**
     * tracks objects to collide against, this can be other particles ( objects with 
     * position vectors and a radius ) and/or a perimeter ( top, left, right, bottom )
     * 
     * @method collide
     * 
     * @param {Object} config object with properties for top, left, bottom, right ( all numbers ) and particles ( array of other 
     * particles or objects with position.x, positon.y and radius properties )
     *       
     * @example 
     * <code class="code prettyprint"> 
     * &nbsp; // assuming ball is an instance of BB.Particle2D <br>
     * &nbsp; // assuming balls is an array of BB.Particle2D objects <br>
     * &nbsp; ball.collide({ <br> 
     * &nbsp;&nbsp;&nbsp;&nbsp; top:0, <br> 
     * &nbsp;&nbsp;&nbsp;&nbsp; right: canvas.width, <br> 
     * &nbsp;&nbsp;&nbsp;&nbsp; bottom: canvas.height, <br> 
     * &nbsp;&nbsp;&nbsp;&nbsp; left: 0, <br> 
     * &nbsp;&nbsp;&nbsp;&nbsp; particles: balls <br> 
     * &nbsp; });<br>
     * </code>
     */
    BB.Particle2D.prototype.collide = function( config ) {

        if( typeof config === "undefined" ){
            throw new Error('BB.Particle2D: collide requires arguments to konw what to collide against');   
        }


        // perimeter -----------------------------------------------
        if( typeof config.dampen !== "undefined") this._world.dampen = config.dampen;
         
        if( typeof config.left !== "undefined" ) this._world.left = config.left;        

        if( typeof config.right !== "undefined" ) this._world.right = config.right;

        if( typeof config.top !== "undefined" ) this._world.top = config.top;
        
        if( typeof config.bottom !== "undefined" ) this._world.bottom = config.bottom;    

        // other particles -----------------------------------------
        var i = 0;
        if( typeof config.particles !== "undefined" ){ // when sent along w/ above parameters
            if( !(config.particles instanceof Array) ){
                throw new Error('BB.Particle2D: collide: particles value expecting array of particles');   
            } 
            else {
                for (i = 0; i < config.particles.length; i++) {
                    // if(  !( config.particles[i] instanceof BB.Particle2D ) ){
                    if( typeof config.particles[i].position.x === "undefined" ) {
                        throw new Error('BB.Particle2D: collide: particles['+i+'] is missing a position.x');  
                    }
                    if( typeof config.particles[i].position.y === "undefined" ) {
                        throw new Error('BB.Particle2D: collide: particles['+i+'] is missing a position.y');  
                    }
                    if( typeof config.particles[i].radius === "undefined" ) {
                        throw new Error('BB.Particle2D: collide: particles['+i+'] is missing a radius');  
                    }
                    this._colliders = config.particles;
                }
            }
        }
        

    };



    BB.Particle2D.prototype.update = function() {

        var i = 0;
        var accVector = new BB.Vector2();
        var dx, dy, ax, ay, tx, ty, 
            dist, distSQ, distMin, 
            force, angle;


        // apply gravitations ---------------------------------------- 
        for (i = 0; i < this._gravitations.length; i++) {
            var g = this._gravitations[i];

            dx = g.position.x - this.position.x; 
            dy = g.position.y - this.position.y;
            distSQ = dx * dx + dy * dy;
            dist = Math.sqrt(distSQ);
            force = g.mass / distSQ;

            ax = dx / dist * force;
            ay = dy / dist * force;
            accVector.set( ax, ay );
            this.applyForce( accVector );
            // this.acceleration.add( new BB.Vector2(ax,ay) );
        }
        


        // apply springs ----------------------------------------
        for (i = 0; i < this._springs.length; i++) {
            var s = this._springs[i];

            dx = s.position.x - this.position.x;
            dy = s.position.y - this.position.y;
            dist = Math.sqrt(dx * dx + dy * dy);
            force = (dist - s.length || 0) * s.k; 
            
            ax = dx / dist * force;
            ay = dy / dist * force;            
            accVector.set( ax, ay );
            this.applyForce( accVector );
        }


        // apply collisions ----------------------------------------
        for (i = 0; i < this._colliders.length; i++) {

            var c = this._colliders[i];            

            if( c !== this ){
                dx = c.position.x - this.position.x;
                dy = c.position.y - this.position.y;
                dist = Math.sqrt(dx*dx + dy*dy);
                distMin = c.radius + this.radius;

                if (dist < distMin) { 
                    angle = Math.atan2(dy, dx);
                    tx = this.position.x + Math.cos(angle) * distMin;
                    ty = this.position.y + Math.sin(angle) * distMin;
                    ax = (tx - c.position.x) * this.elasticity;
                    ay = (ty - c.position.y) * this.elasticity;
                    accVector.set( -ax, -ay);
                    this.applyForce( accVector );
                }         
            }
        }

        if( typeof this._world.left !== "undefined" ){
            if( (this.position.x - this.radius) < this._world.left ){
                this.position.x = this._world.left + this.radius;
                this.velocity.x = -this.velocity.x;
                this.velocity.x *= this._world.dampen || 0.7;
            }
        }

        if( typeof this._world.right !== "undefined" ){
            if( (this.position.x + this.radius) > this._world.right ){
                this.position.x = this._world.right - this.radius;
                this.velocity.x = -this.velocity.x;
                this.velocity.x *= this._world.dampen || 0.7;
            }
        }

        if( typeof this._world.top !== "undefined" ){
            if( (this.position.y - this.radius) < this._world.top ) {
                this.position.y = this._world.top + this.radius;
                this.velocity.y = -this.velocity.y;
                this.velocity.y *= this._world.dampen || 0.7;
            }
        }

        if( typeof this._world.bottom !== "undefined" ){
            if( (this.position.y + this.radius) > this._world.bottom ) {
                this.position.y = this._world.bottom - this.radius;
                this.velocity.y = -this.velocity.y;
                this.velocity.y *= this._world.dampen || 0.7;
            }
        }

        // this.acceleration.multiplyScalar(this.friction); // NOT WORKING?
        this.velocity.multiplyScalar(this.friction);      // APPLYING DIRECTLY TO VELOCITY INSTEAD

        this.velocity.add(this.acceleration);
        
        if (this.velocity.length() > this.maxSpeed) {
            this.velocity.setLength(this.maxSpeed);
        }

        this.position.add(this.velocity);

        this.acceleration.multiplyScalar(0);

        this._gravitations = [];
        this._springs = [];
        this._colliders = [];
        
    };

    /**
     * takes a force, divides it by particle's mass, and applies it to acceleration ( which is added to velocity each frame )
     * 
     * @method applyForce
     * 
     * @param {BB.Vector2} vector force to be applied
     */
    BB.Particle2D.prototype.applyForce = function(force) {

        if (typeof force !== 'object' || ! (force instanceof BB.Vector2)) {
            throw new Error('BB.Particle2D.applyForce: force parameter must be present and an instance of BB.Vector2');
        }

        this.acceleration.add( force.clone().divideScalar(this.mass) );

    };

    return BB.Particle2D;
});