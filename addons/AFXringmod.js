/**
 * A ring modulator effect. extends from BB.AFX
 * @class AFXringmod
 * @constructor
 * @extends BB.AFX
 * @param {Object} [config] A optional config object ( see BB.AudioBase, BB.AFX for details )
 */
function AFXringmod( config ){

	BB.AFX.call(this, config);

    this.node = this.ctx.createGain();
    this.node.gain.value = 0.0;

    this._frequency = 11;
    this.osc = this.ctx.createOscillator();
    this.osc.type = 'sine';
    this.osc.frequency.value = Math.pow( 2, parseFloat( this._frequency ) );
    this.osc.connect(this.node.gain);
    this.osc.start(0);

    this._init();

    this.dry = 0.5;
}

AFXringmod.prototype = Object.create(BB.AFX.prototype);
AFXringmod.prototype.constructor = AFXringmod;

/**
 * the ring mod frequency
 * @property frequency 
 * @type Number
 */   
Object.defineProperty(AFXringmod.prototype, "frequency", {
    get: function() {
        return this._frequency;
    },
    set: function(frequency) {
        if( typeof frequency !== 'number'){
            throw new Error("AFXringmod.frequency: expecing a number");
        } else {
            this._frequency = frequency;
            this.osc.frequency.value = Math.pow( 2, parseFloat( this._frequency ) );
        }
    }
});