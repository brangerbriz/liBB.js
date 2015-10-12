/**
 * A module for receiving midi messages via USB in the browser. Google Chrome
 * support only at the moment. See support for the Web MIDI API
 * (https://webaudio.github.io/web-midi-api/).
 * @module BB.Midi
 */
define(['./BB',
        './BB.BaseMidiInput', 
        './BB.MidiInputButton', 
        './BB.MidiInputKey', 
        './BB.MidiInputKnob', 
        './BB.MidiInputPad', 
        './BB.MidiInputSlider'], 
function(  BB,
           BaseMidiInput,
           MidiInputButton,
           MidiInputKey,
           MidiInputKnob,
           MidiInputPad,
           MidiInputSlider){

    'use strict';

    BB.BaseMidiInput   = BaseMidiInput;
    BB.MidiInputButton = MidiInputButton;
    BB.MidiInputKey    = MidiInputKey;
    BB.MidiInputKnob   = MidiInputKnob;
    BB.MidiInputPad    = MidiInputPad;
    BB.MidiInputSlider = MidiInputSlider;

    /**
     * A class for recieving input from Midi controllers in the browser using
     * the experimental Web MIDI API. This constructor returns true if browser
     * supports Midi and false if not.
     * 
     * <em>NOTE: This implementation of
     * BB.MidiDevice currently only supports using one MIDI device connected to
     * the browser at a time. More than one may work but you may run into note
     * clashing and other oddities.</em>
     * <br><br>
     * <img src="../../examples/assets/images/midi.png"/>
     * 
     * @class  BB.MidiDevice
     * @constructor
     * @param {Object} midiMap An object with array properties for knobs, sliders, buttons, keys, and pads.
     * @param {Function} success Function to return once MIDIAccess has been received successfully.
     * @param {Function} failure Function to return if MIDIAccess is not received successfully.
     * @return {Boolean} True if browser supports Midi, false if not.
     */
    BB.MidiDevice = function(midiMap, success, failure) {
        
        if (typeof midiMap !== 'object') {
            throw new Error("BB.MidiDevice: midiMap parameter must be an object");
        } else if (typeof success !== 'function') {
            throw new Error("BB.MidiDevice: success parameter must be a function");
        } else if (typeof failure !== 'function') {
            throw new Error("BB.MidiDevice: failure parameter must be a function");
        }

        var self = this;

        /**
         * Dictionary of Midi input object arrays. Includes sliders, knobs,
         * buttons, pads, and keys (only if they are added in the midiMap passed
         * into the constructor).
         * @property inputs
         * @type {Object}
         */
        this.inputs = {
            sliders: [],
            knobs: [],
            buttons: [],
            pads: [],
            keys: []
        };

        /**
         * The Web MIDI API midiAccess object returned from navigator.requestMIDIAccess(...)
         * @property midiAccess
         * @type {MIDIAccess}
         * @default null
         */
        this.midiAccess = null;

        this._connectEvent = null;
        this._disconnectEvent = null;
        this._messageEvent = null;

        // note COME BACK
        var noteLUT = {}; // lookup table

        var input = null;

        var i = 0;
        
        // sliders
        if (typeof midiMap.sliders !== 'undefined' && midiMap.sliders instanceof Array) {
            for (i = 0; i < midiMap.sliders.length; i++) {
                input = new BB.MidiInputSlider(midiMap.sliders[i]);
                noteLUT['key' + midiMap.sliders[i]] = [ input, i ];
                self.inputs.sliders.push(input);
            }
        }

        // knobs
        if (typeof midiMap.knobs !== 'undefined' && midiMap.knobs instanceof Array) {
            for (i = 0; i < midiMap.knobs.length; i++) {
                input = new BB.MidiInputKnob(midiMap.knobs[i]);
                noteLUT['key' + midiMap.knobs[i]] = [ input, i ];
                self.inputs.knobs.push(input);
            }
        }

        // buttons
        if (typeof midiMap.buttons !== 'undefined' && midiMap.buttons instanceof Array) {
            for (i = 0; i < midiMap.buttons.length; i++) {
                input = new BB.MidiInputButton(midiMap.buttons[i]);
                noteLUT['key' + midiMap.buttons[i]] = [ input, i ];
                self.inputs.buttons.push(input);
            }
        }

        // pads
        if (typeof midiMap.pads !== 'undefined' && midiMap.pads instanceof Array) {
            for (i = 0; i < midiMap.pads.length; i++) {
                input = new BB.MidiInputButton(midiMap.pads[i]);
                noteLUT['key' + midiMap.pads[i]] = [ input, i ];
                self.inputs.pads.push(input);
            }
        }

        // keys
        if (typeof midiMap.keys !== 'undefined' && midiMap.keys instanceof Array) {
            for (i = 0; i < midiMap.keys.length; i++) {
                input = new BB.MidiInputButton(midiMap.keys[i]);
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
            // logger(keyData, 'key data', data);

            if (self._messageEvent) {
                self._messageEvent({
                    command: command,
                    channel: channel,
                    type: type,
                    note: note,
                    velocity: velocity
                }, event);
            }

            var i = 0;
            
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

                var midiData = {}; // reset data
                
                // all
                for (i = 0; i < changeEventArr.length; i++) {
                    
                    midiData = {
                        velocity: velocity,
                        channel: channel,
                        command: command,
                        type: type,
                        note: note
                    };

                    changeEventArr[i](midiData, input.inputType, index); // fire change event
                }

                // slider and knob
                if (input.inputType == 'slider' || input.inputType == 'knob') {

                    // max
                    if (velocity == 127) {

                        var maxEventArr = input.eventStack.max;
                        for (i = 0; i < maxEventArr.length; i++) {

                            midiData = {
                                velocity: velocity,
                                channel: channel,
                                command: command,
                                type: type,
                                note: note
                            };

                            maxEventArr[i](midiData, input.inputType, index); // fire max event
                        }

                    // min
                    } else if (velocity === 0) { 

                        var minEventArr = input.eventStack.min;
                        for (i = 0; i < minEventArr.length; i++) {

                            midiData = {
                                velocity: velocity,
                                channel: channel,
                                command: command,
                                type: type,
                                note: note
                            };

                            minEventArr[i](midiData, input.inputType, index); // fire min event
                        }
                    }
                }

                // button
                if (input.inputType == 'button') {


                    // down
                    if (velocity == 127) {

                        var downEventArr = input.eventStack.down;
                        for (i = 0; i < downEventArr.length; i++) {

                            midiData = {
                                velocity: velocity,
                                channel: channel,
                                command: command,
                                type: type,
                                note: note
                            };

                            downEventArr[i](midiData, input.inputType, index); // fire down event
                        }

                    // up
                    } else if (velocity === 0) { 

                        var upEventArr = input.eventStack.up;
                        for (i = 0; i < upEventArr.length; i++) {

                            midiData = {
                                velocity: velocity,
                                channel: channel,
                                command: command,
                                type: type,
                                note: note
                            };

                            upEventArr[i](midiData, input.inputType, index); // fire up event
                        }
                    }
                }
            }
        }
    };

    /**
     * Assigns event handler functions. Valid events include: connect, disconnect, message.
     * @method on
     * @param  {String}   name     Event name. Supports "connect", "disconnect", and "message".
     * @param  {Function} callback Function to run when event occurs.
     */
    BB.MidiDevice.prototype.on = function(name, callback) {
        
        if (typeof name !== 'string') {
            throw new Error("BB.MidiDevice.on: name parameter must be a string type");
        } else if (typeof callback !== 'function') {
            throw new Error("BB.MidiDevice.on: callback parameter must be a function type");
        }

        if (name === 'connect') {
            this._connectEvent = callback;
        } else if (name === 'disconnect') {
            this._disconnectEvent = callback;
        } else if (name === 'message') {
            this._messageEvent = callback;
        } else {
            throw new Error('BB.MidiDevice.on: ' + name + ' is not a valid event name');
        }
    };

    return BB.MidiDevice;
});