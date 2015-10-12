/**
 * A module representing individual button inputs on a midi device.
 * MidiInputSlider, MidiInputButton, etc derive from this base class.
 * @module BB.BaseMidiInput
 */
define(['./BB', './BB.BaseMidiInput'], 
function(  BB,        BaseMidiInput){

    'use strict';

    BB.BaseMidiInput = BaseMidiInput;

   /**
     * A module for representing individual button inputs on a midi device. A button
     * is defined as a midi input that only has two values (velocity): 0 and 127.
     * NOTE: Don't use this class for an input unless it only outpus velocity values
     * 0 and 127 exclusively even if it looks like a button, as it will cause the
     * "up" and "down" events to work improperly.
     * @class BB.MidiInputButton
     * @constructor
     * @extends BB.BaseMidiInput
     * @param {Number} [note] The midi note to assign this input to.
     */
    BB.MidiInputButton = function(note) {

        BaseMidiInput.call(this, note);
        this.inputType = 'button';
        this.eventStack.down = [];
        this.eventStack.up   = [];
    };

    BB.MidiInputButton.prototype = Object.create(BaseMidiInput.prototype);
    BB.MidiInputButton.prototype.constructor = BaseMidiInput;

    /**
     * Register an event for this midi input. Available events include: change, up,
     * and down.
     * @method on
     * @param  {string}   name     The name of the event. Supports "change", "up" (button up),
     * and "down" (button down) events.
     * @param  {Function} callback Callback to run when the event has fired
     */
    BB.MidiInputButton.prototype.on = function(name, callback) {

        BaseMidiInput.prototype.on.call(this, name, callback);
        
        if (name === 'down') {
            this.eventStack.down.push(callback);
        } else if (name === 'up') {
            this.eventStack.up.push(callback);
        }
    };

    return BB.MidiInputButton;
});
