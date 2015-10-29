/**
 * A module for receiving midi messages via USB in the browser. Google Chrome
 * support only at the moment. See support for the Web MIDI API
 * (https://webaudio.github.io/web-midi-api/).
 * @module BB.Midi
 */

/**
 * A base module for representing individual inputs on a midi device.
 * MidiInputSlider, MidiInputButton, etc derive from this base class.
 * @class BB.BaseMidiInput
 * @constructor
 * @param {Number} [note] The midi note to assign this input to.
 */
function BaseMidiInput(note) {
    
    this.note = note;
    this.inputType = 'base';

    this.channel      = null;
    this.command      = null;
    this.type         = null;
    this.velocity     = null;

    this.eventStack = {
        change: []
    }
}

/**
 * Register an event for this midi input. Available events include: change.
 * @method on
 * @param  {string}   name     The name of the event. Currently only supports
 * the "change" event.
 * @param  {Function} callback Callback to run when the event has fired
 */
BaseMidiInput.prototype.on = function(name, callback) {

    if (name === 'change') {
        this.eventStack.change.push(callback);
    }
}

/**
 * A module for representing individual slider inputs on a midi device. Behaves
 * like MidiInputKnob.
 * @class BB.MidiInputSlider
 * @constructor
 * @extends BB.BaseMidiInput
 * @param {Number} [note] The midi note to assign this input to.
 */
function MidiInputSlider(note) {

    BaseMidiInput.call(this, note);
    this.inputType = 'slider';
    this.eventStack.max = [];
    this.eventStack.min = [];
}

MidiInputSlider.prototype = Object.create(BaseMidiInput.prototype);
MidiInputSlider.prototype.constructor = BaseMidiInput;

/**
 * Register an event for this midi input. Available events include: change, min,
 * and max.
 * @method on
 * @param  {string}   name     The name of the event. Supports "change", "min",
 * and "max" events.
 * @param  {Function} callback Callback to run when the event has fired
 */
MidiInputSlider.prototype.on = function(name, callback) {

    BaseMidiInput.prototype.on.call(this, name, callback);
    if (name === 'min') {
        this.eventStack.min.push(callback);
    } else if (name === 'max') {
        this.eventStack.max.push(callback);
    } 
}

/**
 * A module for representing individual knob inputs on a midi device. Behaves
 * like MidiInputSlider.
 * @class BB.MidiInputKnob
 * @constructor
 * @extends BB.BaseMidiInput
 * @param {Number} [note] The midi note to assign this input to.
 */
function MidiInputKnob(note) {

    BaseMidiInput.call(this, note);
    this.inputType = 'knob';
    this.eventStack.max = [];
    this.eventStack.min = [];
}

MidiInputKnob.prototype = Object.create(BaseMidiInput.prototype);
MidiInputKnob.prototype.constructor = BaseMidiInput;

/*
 * Register an event for this midi input. Available events include: change, min,
 * and max.
 * @method on
 * @param  {string}   name     The name of the event. Supports "change", "min",
 * and "max" events.
 * @param  {Function} callback Callback to run when the event has fired
 */
MidiInputKnob.prototype.on = function(name, callback) {

    BaseMidiInput.prototype.on.call(this, name, callback);
    if (name === 'min') {
        this.eventStack.min.push(callback);
    } else if (name === 'max') {
        this.eventStack.max.push(callback);
    } 
}

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
function MidiInputButton(note) {

    BaseMidiInput.call(this, note);
    this.inputType = 'button';
    this.eventStack.down = [];
    this.eventStack.up   = [];
}

MidiInputButton.prototype = Object.create(BaseMidiInput.prototype);
MidiInputButton.prototype.constructor = BaseMidiInput;

/**
 * Register an event for this midi input. Available events include: change, up,
 * and down.
 * @method on
 * @param  {string}   name     The name of the event. Supports "change", "up" (button up),
 * and "down" (button down) events.
 * @param  {Function} callback Callback to run when the event has fired
 */
MidiInputButton.prototype.on = function(name, callback) {

    BaseMidiInput.prototype.on.call(this, name, callback);
    
    if (name === 'down') {
        this.eventStack.down.push(callback);
    } else if (name === 'up') {
        this.eventStack.up.push(callback);
    }
}

/**
 * A module for representing individual pad inputs on a midi device. Behaves like BB.MidiInputKey.
 * @class BB.MidiInputPad
 * @constructor
 * @extends BB.BaseMidiInput
 * @param {Number} [note] The midi note to assign this input to.
 */
function MidiInputPad(note) {

    BaseMidiInput.call(this, note);
    this.inputType = 'pad';
}

MidiInputPad.prototype = Object.create(BaseMidiInput.prototype);
MidiInputPad.prototype.constructor = BaseMidiInput;

/**
 * A module for representing individual Key inputs on a midi device. Behaves like BB.MidiInputPad.
 * @class BB.MidiInputKey
 * @constructor
 * @extends BB.BaseMidiInput
 * @param {Number} [note] The midi note to assign this input to.
 */
function MidiInputKey(note) {

    BaseMidiInput.call(this, note);
    this.inputType = 'key';
}

MidiInputKey.prototype = Object.create(BaseMidiInput.prototype);
MidiInputKey.prototype.constructor = BaseMidiInput;

function MidiDevice(midiMap, success, failure) {
    
    if (typeof midiMap !== 'object') {
        throw new Error("BB.MidiDevice: midiMap parameter must be an object");
    } else if (typeof success !== 'function') {
        throw new Error("BB.MidiDevice: success parameter must be a function");
    } else if (typeof failure !== 'function') {
        throw new Error("BB.MidiDevice: failure parameter must be a function");
    }

    var self = this;

    self.inputs = {
        sliders: [],
        knobs: [],
        buttons: [],
        pads: [],
        keys: []
    };

    this._connectEvent = null;
    this._disconnectEvent = null;
    this._messageEvent = null;

    // note COME BACK
    var noteLUT = {} // lookup table

    var input = null;
    
    // sliders
    if (typeof midiMap.sliders !== 'undefined' && midiMap.sliders instanceof Array) {
        for (var i = 0; i < midiMap.sliders.length; i++) {
            input = new MidiInputSlider(midiMap.sliders[i]);
            noteLUT['key' + midiMap.sliders[i]] = [ input, i ];
            self.inputs.sliders.push(input);
        }
    }

    // knobs
    if (typeof midiMap.knobs !== 'undefined' && midiMap.knobs instanceof Array) {
        for (var i = 0; i < midiMap.knobs.length; i++) {
            input = new MidiInputKnob(midiMap.knobs[i]);
            noteLUT['key' + midiMap.knobs[i]] = [ input, i ];
            self.inputs.knobs.push(input);
        }
    }

    // buttons
    if (typeof midiMap.buttons !== 'undefined' && midiMap.buttons instanceof Array) {
        for (var i = 0; i < midiMap.buttons.length; i++) {
            input = new MidiInputButton(midiMap.buttons[i]);
            noteLUT['key' + midiMap.buttons[i]] = [ input, i ];
            self.inputs.buttons.push(input);
        }
    }

    // pads
    if (typeof midiMap.pads !== 'undefined' && midiMap.pads instanceof Array) {
        for (var i = 0; i < midiMap.pads.length; i++) {
            input = new MidiInputButton(midiMap.pads[i]);
            noteLUT['key' + midiMap.pads[i]] = [ input, i ];
            self.inputs.pads.push(input);
        }
    }

    // keys
    if (typeof midiMap.keys !== 'undefined' && midiMap.keys instanceof Array) {
        for (var i = 0; i < midiMap.keys.length; i++) {
            input = new MidiInputButton(midiMap.keys[i]);
            noteLUT['key' + midiMap.keys[i]] = [ input, i ];
            self.inputs.keys.push(input);
        }
    }

    // request MIDI access
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess({
            sysex: false
        }).then(onMIDISuccess, failure);
        return true; // support
    } else {
        return false; // no support
    }

    // midi functions
    function onMIDISuccess(midiAccess) {

        self.midiAccess = midiAccess;
        var inputs = self.midiAccess.inputs.values();
        // loop through all inputs
        for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
            // listen for midi messages
            input.value.onmidimessage = onMIDIMessage;
            // this just lists our inputs in the console
            listInputs(input);
        }
        // listen for connect/disconnect message
        self.midiAccess.onstatechange = onStateChange;
        success(midiAccess);
    }

    function onStateChange(event) {
        
        var port = event.port,
            state = port.state,
            name = port.name,
            type = port.type;

        if (state === 'connected' && self._connectEvent) {
            self._connectEvent(name, type, port);
        } else if (state === 'disconnected' && self._disconnectEvent) {
            self._disconnectEvent(name, type, port);
        }

        // console.log("name", name, "port", port, "state", state);
    }

    function onMIDIMessage(event) {

        var data = event.data;
        var command = data[0] >> 4;
        var channel = data[0] & 0xf;
        var type = data[0] & 0xf0; // channel agnostic message type. Thanks, Phil Burk.
        var note = data[1];
        var velocity = data[2];
        // with pressure and tilt off
        // note off: 128, cmd: 8 
        // note on: 144, cmd: 9
        // pressure / tilt on
        // pressure: 176, cmd 11: 
        // bend: 224, cmd: 14
        
        // TODO: remove
        logger(keyData, 'key data', data);

        if (self._messageEvent) {
            self._messageEvent({
                command: command,
                channel: channel,
                type: type,
                note: note,
                velocity: velocity
            }, event);
        }
        
        // if note is in noteLUT
        if ('key' + note in noteLUT) {
            
            var input = noteLUT['key' + note][0];
            var index = noteLUT['key' + note][1];

            // console.log(input.eventStack);

            input.command      = command;
            input.channel      = channel;
            input.type         = type;
            input.velocity     = velocity;

            var changeEventArr = input.eventStack.change;

            var data = {};
            
            // all
            for (var i = 0; i < changeEventArr.length; i++) {
                
                data = {
                    velocity: velocity,
                    channel: channel,
                    command: command,
                    type: type,
                    note: note
                }

                changeEventArr[i](data, input.inputType, index); // fire change event
            }

            // slider and knob
            if (input.inputType == 'slider' || input.inputType == 'knob') {

                // max
                if (velocity == 127) {

                    var maxEventArr = input.eventStack.max;
                    for (var i = 0; i < maxEventArr.length; i++) {

                        data = {
                            velocity: velocity,
                            channel: channel,
                            command: command,
                            type: type,
                            note: note
                        }

                        maxEventArr[i](data, input.inputType, index); // fire max event
                    }

                // min
                } else if (velocity == 0) { 

                    var minEventArr = input.eventStack.min;
                    for (var i = 0; i < minEventArr.length; i++) {

                        data = {
                            velocity: velocity,
                            channel: channel,
                            command: command,
                            type: type,
                            note: note
                        }

                        minEventArr[i](data, input.inputType, index); // fire min event
                    }
                }
            }

            // button
            if (input.inputType == 'button') {


                // down
                if (velocity == 127) {

                    var downEventArr = input.eventStack.down;
                    for (var i = 0; i < downEventArr.length; i++) {

                        data = {
                            velocity: velocity,
                            channel: channel,
                            command: command,
                            type: type,
                            note: note
                        }

                        downEventArr[i](data, input.inputType, index); // fire down event
                    }

                // up
                } else if (velocity == 0) { 

                    var upEventArr = input.eventStack.up;
                    for (var i = 0; i < upEventArr.length; i++) {

                        data = {
                            velocity: velocity,
                            channel: channel,
                            command: command,
                            type: type,
                            note: note
                        }

                        upEventArr[i](data, input.inputType, index); // fire up event
                    }
                }
            }
        }
    }
}

MidiDevice.prototype.on = function(name, callback) {
    
    if (typeof name !== 'string') {
        throw new Error("BB.MidiDevice.on: name parameter must be a string type");
    } else if (typeof callback !== 'function') {
        throw new Error("BB.MidiDevice.on: callback parameter must be a function type");
    }

    if (name === 'connect') {
        this._connectEvent = callback
    } else if (name === 'disconnect') {
        this._disconnectEvent = callback
    } else if (name === 'message') {
        this._messageEvent = callback
    } else {
        throw new Error('BB.MidiDevice.on: ' + name + ' is not a valid event name');
    }
}