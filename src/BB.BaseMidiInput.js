/**
 * A base module for representing individual inputs on a midi device.
 * MidiInputSlider, MidiInputButton, etc derive from this base class.
 * @module BB.BaseMidiInput
 */
define(['./BB'], 
function(  BB){

    'use strict';

    /**
     * A base module for representing individual inputs on a midi device.
     * MidiInputSlider, MidiInputButton, etc derive from this base class.
     * @class BB.BaseMidiInput
     * @constructor
     * @param {Number} [note] The midi note to assign this input to.
     */
    BB.BaseMidiInput = function(note) {
        
        this.note = note;
        this.inputType = 'base';

        this.channel      = null;
        this.command      = null;
        this.type         = null;
        this.velocity     = null;

        this.eventStack = {
            change: []
        };
    };

    /**
     * Register an event for this midi input. Available events include: change.
     * @method on
     * @param  {string}   name     The name of the event. Currently only supports
     * the "change" event.
     * @param  {Function} callback Callback to run when the event has fired
     */
    BB.BaseMidiInput.prototype.on = function(name, callback) {

        if (name === 'change') {
            this.eventStack.change.push(callback);
        }
    };

    return BB.BaseMidiInput;
});