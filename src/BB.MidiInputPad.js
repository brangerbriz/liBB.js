/**
 * A module representing individual pad inputs on a midi device.
 * MidiInputSlider, MidiInputButton, etc derive from this base class.
 * @module BB.BaseMidiInput
 */
define(['./BB', './BB.BaseMidiInput'], 
function(  BB,        BaseMidiInput){

    'use strict';

    BB.BaseMidiInput = BaseMidiInput;

    /**
     * A module for representing individual pad inputs on a midi device. Behaves like BB.MidiInputKey.
     * @class BB.MidiInputPad
     * @constructor
     * @extends BB.BaseMidiInput
     * @param {Number} [note] The midi note to assign this input to.
     */
    BB.MidiInputPad = function(note) {

        BaseMidiInput.call(this, note);
        this.inputType = 'pad';
    };

    BB.MidiInputPad.prototype = Object.create(BaseMidiInput.prototype);
    BB.MidiInputPad.prototype.constructor = BaseMidiInput;

    return BB.MidiInputPad;
});
