var log = console.log.bind(console), keyData = document.getElementById('key_data'), midi;
var AudioContext = AudioContext || webkitAudioContext; // for ios/safari
var context = new AudioContext();
var data = null;
var device = null;

var midiMap = {
    sliders: [2, 3, 4, 5, 6, 8, 9, 12, 13],
    knobs: [14, 15, 16, 17, 18, 19, 20, 21, 22],
    buttons: [23, 33, 24, 34, 25, 35, 26, 36, 27, 37, 28, 38, 29, 39, 30, 40, 31, 41]
}

window.onload = function() {

    device = new MidiDevice(midiMap, midiFound, midiNotFound);
    
    if (!device) {
        alert('Your browser does not support the MIDI API');
    }
}

function midiFound() {

    var sliders = device.inputs.sliders;
    for (var i = 0; i < sliders.length; i++) {
        
        sliders[i].on('change', function(data, inputType, index) {
            console.log(inputType + " " + index + " change event: " + data.velocity);
        });

        sliders[i].on('max', function(data, inputType, index) {
            console.log(inputType + " " + index + " max event: " + data.velocity);
        });

        sliders[i].on('min', function(data, inputType, index) {
            console.log(inputType + " " + index + " min event: " + data.velocity);
        });
    }

    var knobs = device.inputs.knobs;
    for (var i = 0; i < knobs.length; i++) {
        
        knobs[i].on('change', function(data, inputType, index) {
            console.log(inputType + " " + index + " change event: " + data.velocity);
        });

        knobs[i].on('max', function(data, inputType, index) {
            console.log(inputType + " " + index + " max event: " + data.velocity);
        });

        knobs[i].on('min', function(data, inputType, index) {
            console.log(inputType + " " + index + " min event: " + data.velocity);
        });
    }

    var buttons = device.inputs.buttons;
    for (var i = 0; i < buttons.length; i++) {
        
        buttons[i].on('change', function(data, inputType, index) {
            console.log(inputType + " " + index + " change event: " + data.velocity);
        });

        buttons[i].on('up', function(data, inputType, index) {
            console.log(inputType + " " + index + " up event: " + data.velocity);
        });

        buttons[i].on('down', function(data, inputType, index) {
            console.log(inputType + " " + index + " down event: " + data.velocity);
        });
    }
}

function midiNotFound() {

}

function listInputs(inputs) {
    var input = inputs.value;
    log("Input port : [ type:'" + input.type + "' id: '" + input.id +
        "' manufacturer: '" + input.manufacturer + "' name: '" + input.name +
        "' version: '" + input.version + "']");
}

function logger(container, label, data) {
    messages = label + " [channel: " + (data[0] & 0xf) + ", cmd: " + (data[0] >> 4) + ", type: " + (data[0] & 0xf0) + " , note: " + data[1] + " , velocity: " + data[2] + "]";
    container.textContent = messages;
}