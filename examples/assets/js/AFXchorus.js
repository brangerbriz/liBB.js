/**
 * A chorus effect. extends from BB.AFX
 * @class AFXchorus
 * @constructor
 * @extends BB.AFX
 * @param {Object} [config] A optional config object ( see BB.AudioBase, BB.AFX for details )
 */
function AFXchorus( config ){

	BB.AFX.call(this, config);

    this.node = this.ctx.createDelay( 2 );
    this.node.delayTime.value = 0.03;

    this._init();

    this.osc = this.ctx.createOscillator();
    this.osc.type = 'sine';
    this.osc.frequency.value = 3.5;
    this.osc.start(0);

    this.cgain = this.ctx.createGain();
    this.cgain.gain.value = 0.002;    

    this.osc.connect( this.cgain );
    this.cgain.connect( this.node.delayTime );
   
    this.dry = 0.5;
}

AFXchorus.prototype = Object.create(BB.AFX.prototype);
AFXchorus.prototype.constructor = AFXchorus;

/**
 * the chorus speed
 * @property speed 
 * @type Number
 */   
Object.defineProperty(AFXchorus.prototype, "speed", {
    get: function() {
        return this.osc.frequency.value;
    },
    set: function(v) {
        if( typeof v !== 'number'){
            throw new Error("AFXchorus.speed: expecing a number");
        } else {
            this.osc.frequency.value = v;
        }
    }
});

/**
 * the chorus delay
 * @property delay 
 * @type Number
 */   
Object.defineProperty(AFXchorus.prototype, "delay", {
    get: function() {
        return this.node.delayTime.value;
    },
    set: function(v) {
        if( typeof v !== 'number'){
            throw new Error("AFXchorus.delay: expecing a number");
        } else {
            this.node.delayTime.value = v;
        }
    }
}); 

/**
 * the chorus depth
 * @property depth 
 * @type Number
 */   
Object.defineProperty(AFXchorus.prototype, "depth", {
    get: function() {
        return this.cgain.gain.value;
    },
    set: function(v) {
        if( typeof v !== 'number'){
            throw new Error("AFXchorus.depth: expecing a number");
        } else {
            this.cgain.gain.value = v;
        }
    }
}); 