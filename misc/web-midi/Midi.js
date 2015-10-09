function BaseMidiInput(note) {
    
    this.note = note;
    this.inputType = 'base';

    this.channel      = null;
    this.command      = null;
    this.type         = null;
    this.lastVelocity = null;

    this.eventStack = {
        change: []
    }
}

// channel, command, type, note, inputType

BaseMidiInput.prototype.on = function(name, callback) {

    if (name === 'change') {
        this.eventStack.change.push(callback);
        // console.log(this.eventStack);
    }
}

function MidiInputSlider(note) {

    BaseMidiInput.call(this, note);
    this.inputType = 'slider';
    this.eventStack.max = [];
    this.eventStack.min = [];
}

MidiInputSlider.prototype = Object.create(BaseMidiInput.prototype);
MidiInputSlider.prototype.constructor = BaseMidiInput;

MidiInputSlider.prototype.on = function(name, callback) {

    BaseMidiInput.prototype.on.call(this, name, callback);
    if (name === 'min') {
        this.eventStack.min.push(callback);
    } else if (name === 'max') {
        this.eventStack.max.push(callback);
    } 
    // else {
    //     throw new Error(name + ' is not a valid event type');
    // }
}

function MidiInputKnob(note) {

    BaseMidiInput.call(this, note);
    this.inputType = 'knob';
    this.eventStack.max = [];
    this.eventStack.min = [];
}

MidiInputKnob.prototype = Object.create(BaseMidiInput.prototype);
MidiInputKnob.prototype.constructor = BaseMidiInput;

MidiInputKnob.prototype.on = function(name, callback) {

    BaseMidiInput.prototype.on.call(this, name, callback);
    if (name === 'min') {
        this.eventStack.min.push(callback);
    } else if (name === 'max') {
        this.eventStack.max.push(callback);
    } 
    // else {
    //     throw new Error(name + ' is not a valid event type');
    // }
}

function MidiInputButton(note) {

    BaseMidiInput.call(this, note);
    this.inputType = 'button';
    this.eventStack.down = [];
    this.eventStack.up   = [];
}

MidiInputButton.prototype = Object.create(BaseMidiInput.prototype);
MidiInputButton.prototype.constructor = BaseMidiInput;

MidiInputButton.prototype.on = function(name, callback) {

    BaseMidiInput.prototype.on.call(this, name, callback);
    
    if (name === 'down') {
        this.eventStack.down.push(callback);
    } else if (name === 'up') {
        this.eventStack.up.push(callback);
    }

    // else {
    //     throw new Error(name + ' is not a valid event type');
    // }
}

function MidiDevice(midiMap, success, failure) {
    
    var self = this;

    self.inputs = {
        sliders: [],
        knobs: [],
        buttons: []
    };

    // note COME BACK
    var noteLUT = {} // lookup table

    var input = null;
    
    if (typeof midiMap.sliders !== 'undefined' && midiMap.sliders instanceof Array) {
        for (var i = 0; i < midiMap.sliders.length; i++) {
            input = new MidiInputSlider(midiMap.sliders[i]);
            noteLUT['key' + midiMap.sliders[i]] = [ input, i ];
            self.inputs.sliders.push(input);
        }
    }

    if (typeof midiMap.knobs !== 'undefined' && midiMap.knobs instanceof Array) {
        for (var i = 0; i < midiMap.knobs.length; i++) {
            input = new MidiInputKnob(midiMap.knobs[i]);
            noteLUT['key' + midiMap.knobs[i]] = [ input, i ];
            self.inputs.knobs.push(input);
        }
    }

    if (typeof midiMap.buttons !== 'undefined' && midiMap.buttons instanceof Array) {
        for (var i = 0; i < midiMap.buttons.length; i++) {
            input = new MidiInputButton(midiMap.buttons[i]);
            noteLUT['key' + midiMap.buttons[i]] = [ input, i ];
            self.inputs.buttons.push(input);
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
        if (type == "input") console.log("name", name, "port", port, "state", state);
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
        
        // if note is in noteLUT
        if ('key' + note in noteLUT) {
            
            var input = noteLUT['key' + note][0];
            var index = noteLUT['key' + note][1];

            // console.log(input.eventStack);

            input.command      = command;
            input.channel      = channel;
            input.type         = type;
            input.lastVelocity = velocity;

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

        // TODO: remove
        // logger(keyData, 'key data', data);
    }
}