/**
 * A module representing individual piano-like key inputs on a midi device.
 * MidiInputSlider, MidiInputButton, etc derive from this base class.
 * @module BB.BaseMidiInput
 */
define(['./BB', './BB.BaseMidiInput'], 
function(  BB,        BaseMidiInput){

    'use strict';

    BB.BaseMidiInput = BaseMidiInput;

    /**
     * A module for representing individual Key inputs on a midi device. Behaves like BB.MidiInputPad.
     * @class BB.MidiInputKey
     * @constructor
     * @extends BB.BaseMidiInput
     * @param {Number} [note] The midi note to assign this input to.
     */
    BB.MidiInputKey = function(note) {

        BaseMidiInput.call(this, note);
        this.inputType = 'key';
    };

    BB.MidiInputKey.prototype = Object.create(BaseMidiInput.prototype);
    BB.MidiInputKey.prototype.constructor = BaseMidiInput;

    return BB.MidiInputKey;
});
