/**
 * A drive/distortion effect. extends from BB.AFX
 * @class AFXdrive
 * @constructor
 * @extends BB.AFX
 * @param {Object} [config] A optional config object ( see BB.AudioBase, BB.AFX for details )
 */
function AFXdrive( config ){

	BB.AFX.call(this, config);

    this.node = this.ctx.createWaveShaper();

    this._init();

    this.threshold = -27; // dB
    this.headroom = 21; // dB

    var curve = new Float32Array(65536);
    this._generateColortouchCurve(curve);
    this.node.curve = curve;

    this._drive = 0.5;
    this.drive = this._drive;
   
    this.dry = 0.5;
}

AFXdrive.prototype = Object.create(BB.AFX.prototype);
AFXdrive.prototype.constructor = AFXdrive;

/**
 * the drive amount
 * @property drive 
 * @type Number
 */   
Object.defineProperty(AFXdrive.prototype, "drive", {
    get: function() {
        return this._drive;
    },
    set: function(drive) {
        if( typeof drive !== 'number'){
            throw new Error("AFXdrive.drive: expecing a number");
        } else {
            if (drive < 0.01) drive = 0.01;
            this.input.gain.value = drive;
            var postDrive = Math.pow(1 / drive, 0.6);
            this.gain.gain.value = postDrive;
            this._drive = drive;
        }
    }
});

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ below this point is a re-framing of Chris Wilson's code 
// ( via: https://github.com/cwilso/Audio-Input-Effects/blob/master/js/waveshaper.js )

// Copyright 2011, Google Inc.
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
// 
//     * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//     * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

AFXdrive.prototype._e4 = function(x, k){
    return 1.0 - Math.exp(-k * x);
}

AFXdrive.prototype._dBToLinear = function(db) {
    return Math.pow(10.0, 0.05 * db);
}

AFXdrive.prototype._shape = function(x) {

    var linearThreshold = this._dBToLinear(this.threshold);
    var linearHeadroom = this._dBToLinear(this.headroom);
    
    var maximum = 1.05 * linearHeadroom * linearThreshold;
    var kk = (maximum - linearThreshold);
    
    var sign = x < 0 ? -1 : +1;
    var absx = Math.abs(x);
    
    var shapedInput = absx < linearThreshold ? absx : linearThreshold + kk * this._e4(absx - linearThreshold, 1.0 / kk);
    shapedInput *= sign;
    
    return shapedInput;
}

AFXdrive.prototype._generateColortouchCurve = function(curve) {
    var n = 65536;
    var n2 = n / 2;
    
    for (var i = 0; i < n2; ++i) {
        x = i / n2;
        x = this._shape(x);
        
        curve[n2 + i] = x;
        curve[n2 - i - 1] = -x;
    }
    
    return curve;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~