/**
 * A flanger effect. extends from BB.AFX
 * @class AFXflanger
 * @constructor
 * @extends BB.AFX
 * @param {Object} [config] A optional config object ( see BB.AudioBase, BB.AFX for details )
 */
function AFXflanger( config ){

	BB.AFX.call(this, config);

    this.node = this.ctx.createDelay();
    this.node.delayTime.value = 0.005;

    this.depthG = this.ctx.createGain();
    this.depthG.gain.value = 0.002;
    this.depthG.connect( this.node.delayTime );

    this.osc = this.ctx.createOscillator();
    this.osc.type = 'sine';
    this.osc.frequency.value = 0.25;
    this.osc.connect( this.depthG );
    this.osc.start(0);

    this.feedbackG = this.ctx.createGain();
    this.feedbackG.gain.value = 0.5;

    this._init();

    // feedback loop
    this.node.connect( this.feedbackG );
    this.feedbackG.connect( this.input )

    this.dry = 0.5;

}

AFXflanger.prototype = Object.create(BB.AFX.prototype);
AFXflanger.prototype.constructor = AFXflanger;

/**
 * the flanger speed
 * @property speed 
 * @type Number
 */   
Object.defineProperty(AFXflanger.prototype, "speed", {
    get: function() {
        return this.osc.frequency.value;
    },
    set: function(speed) {
        if( typeof speed !== 'number'){
            throw new Error("AFXflanger.speed: expecing a number");
        } else {
            this.osc.frequency.value = speed;
        }
    }
});

/**
 * the flanger delay
 * @property delay 
 * @type Number
 */   
Object.defineProperty(AFXflanger.prototype, "delay", {
    get: function() {
        return this.node.delayTime.value;
    },
    set: function(delay) {
        if( typeof delay !== 'number'){
            throw new Error("AFXflanger.delay: expecing a number");
        } else {
            this.node.delayTime.value = delay;
        }
    }
});

/**
 * the flanger depth
 * @property depth 
 * @type Number
 */   
Object.defineProperty(AFXflanger.prototype, "depth", {
    get: function() {
        return this.depthG.gain.value;
    },
    set: function(depth) {
        if( typeof depth !== 'number'){
            throw new Error("AFXflanger.depth: expecing a number");
        } else {
            this.depthG.gain.value = depth;
        }
    }
});

/**
 * the flanger feedback
 * @property feedback 
 * @type Number
 */   
Object.defineProperty(AFXflanger.prototype, "feedback", {
    get: function() {
        return this.feedbackG.gain.value;
    },
    set: function(feedback) {
        if( typeof feedback !== 'number'){
            throw new Error("AFXflanger.feedback: expecing a number");
        } else {
            this.feedbackG.gain.value = feedback;
        }
    }
});