var device = null;

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

// this map is meant for the KORG nanoKONTROL midi controller
// edit it to fit your keyboard by ordering the note inputs in the
// order in their respective array that you would like to address as.
// var midiMap = {
//     sliders: [2, 3, 4, 5, 6, 8, 9, 12, 13],
//     knobs: [14, 15, 16, 17, 18, 19, 20, 21, 22],
//     buttons: [23, 33, 24, 34, 25, 35, 26, 36, 27, 37, 28, 38, 29, 39, 30, 40, 31, 41],
//     pads: [],
//     keys: []
// }

// at octive 0
var midiMap = {
    sliders: [73, 9, 12, 72, 26, 27, 74, 71, 7],
    knobs: [87, 88, 89, 90, 79, 78, 85, 18],
    buttons: [],
    pads: [{ note: 40, channel: 9, command: 9 },
           { note: 41, channel: 9, command: 9 },
           { note: 42, channel: 9, command: 9 },
           { note: 43, channel: 9, command: 9 },
           { note: 36, channel: 9, command: 9 },
           { note: 37, channel: 9, command: 9 },
           { note: 38, channel: 9, command: 9 },
           { note: 39, channel: 9, command: 9 }],
    keys: [{ note: 36, channel: 0, command: 9 },
           { note: 37, channel: 0, command: 9 },
           { note: 38, channel: 0, command: 9 },
           { note: 39, channel: 0, command: 9 },
           { note: 40, channel: 0, command: 9 },
           { note: 41, channel: 0, command: 9 },
           { note: 42, channel: 0, command: 9 },
           { note: 43, channel: 0, command: 9 },
           { note: 44, channel: 0, command: 9 },
           { note: 45, channel: 0, command: 9 },
           { note: 46, channel: 0, command: 9 },
           { note: 47, channel: 0, command: 9 },
           { note: 48, channel: 0, command: 9 },
           { note: 49, channel: 0, command: 9 },
           { note: 50, channel: 0, command: 9 },
           { note: 51, channel: 0, command: 9 },
           { note: 52, channel: 0, command: 9 },
           { note: 53, channel: 0, command: 9 },
           { note: 54, channel: 0, command: 9 },
           { note: 55, channel: 0, command: 9 },
           { note: 56, channel: 0, command: 9 },
           { note: 57, channel: 0, command: 9 },
           { note: 58, channel: 0, command: 9 },
           { note: 59, channel: 0, command: 9 },
           { note: 60, channel: 0, command: 9 },
           { note: 61, channel: 0, command: 9 },
           { note: 62, channel: 0, command: 9 },
           { note: 63, channel: 0, command: 9 },
           { note: 64, channel: 0, command: 9 },
           { note: 65, channel: 0, command: 9 },
           { note: 66, channel: 0, command: 9 },
           { note: 67, channel: 0, command: 9 },
           { note: 68, channel: 0, command: 9 },
           { note: 69, channel: 0, command: 9 },
           { note: 70, channel: 0, command: 9 },
           { note: 71, channel: 0, command: 9 },
           { note: 72, channel: 0, command: 9 },
           { note: 73, channel: 0, command: 9 },
           { note: 74, channel: 0, command: 9 },
           { note: 75, channel: 0, command: 9 },
           { note: 76, channel: 0, command: 9 },
           { note: 77, channel: 0, command: 9 },
           { note: 78, channel: 0, command: 9 },
           { note: 79, channel: 0, command: 9 },
           { note: 80, channel: 0, command: 9 },
           { note: 81, channel: 0, command: 9 },
           { note: 82, channel: 0, command: 9 },
           { note: 83, channel: 0, command: 9 },
           { note: 84, channel: 0, command: 9 }]
}

var activeInputs = generateActiveInputs(midiMap);

window.onload = function() {

    device = new BB.MidiDevice(midiMap, midiSuccess, midiFailure);

    device.on('connect', function(name, type, port) {
        document.getElementById('device-event-info').innerHTML = 
            "<h4>Device Connected</h4>"
            + "<span>type: " + type + "</span><br>"
            + "<span>name: " + name + "</span><br>"
    });

    device.on('disconnect', function(name, type, port) {
        document.getElementById('device-event-info').innerHTML = "<h4>Device Disconnected</h4>"
    });

    device.on('message', function(data, event) {
        document.getElementById('device-event-info').innerHTML = 
        "<h4>Message Received</h4>"
        + "<span>channel: " + data.channel + "</span><br>"
        + "<span>command: " + data.command + "</span><br>"
        + "<span>type: " + data.type + "</span><br>"
        + "<span>note: " + data.note + "</span><br>"
        + "<span>velocity: " + data.velocity + "</span><br>"
    });
    
    if (!device) {
        alert('Your browser does not support the MIDI API');
    }
}

function midiSuccess() {
    
    var sliders = device.inputs.sliders;
    for (var i = 0; i < sliders.length; i++) {
        
        sliders[i].on('change', function(data, inputType, index) {
            // console.log(inputType + " " + index + " change event: " + data.velocity);
            notifyActive(activeInputs.sliders, index, 150);
            logInputEvent('slider', index, 'change');
        });

        sliders[i].on('max', function(data, inputType, index) {
            logInputEvent('slider', index, 'max');
        });

        sliders[i].on('min', function(data, inputType, index) {
            logInputEvent('slider', index, 'min');
        });
    }

    var knobs = device.inputs.knobs;
    for (var i = 0; i < knobs.length; i++) {
        
        knobs[i].on('change', function(data, inputType, index) {
            notifyActive(activeInputs.knobs, index, 150);
            logInputEvent('knob', index, 'change');
        });

        knobs[i].on('max', function(data, inputType, index) {
            logInputEvent('knob', index, 'max');
        });

        knobs[i].on('min', function(data, inputType, index) {
            logInputEvent('knob', index, 'min');
        });
    }

    var buttons = device.inputs.buttons;
    for (var i = 0; i < buttons.length; i++) {
        
        buttons[i].on('change', function(data, inputType, index) {
            logInputEvent('button', index, 'change');
        });

        buttons[i].on('up', function(data, inputType, index) {
            logInputEvent('button', index, 'up');
        });

        buttons[i].on('down', function(data, inputType, index) {
            notifyActive(activeInputs.buttons, index, 150);
            logInputEvent('button', index, 'down');
        });
    }

    var pads = device.inputs.pads;
    for (var i = 0; i < pads.length; i++) {
        
        pads[i].on('change', function(data, inputType, index) {
            logInputEvent('pad', index, 'change');
            notifyActive(activeInputs.pads, index, 80);
        });
    }

    var keys = device.inputs.keys;
    for (var i = 0; i < keys.length; i++) {
        
        keys[i].on('change', function(data, inputType, index) {
            logInputEvent('key', index, 'change');
            notifyActive(activeInputs.keys, index, 100);
        });
    }

    draw();
}

function midiFailure() {
    console.log('failure');
    alert('Plug in a midi device');
}

function draw() {

    requestAnimationFrame(draw);

    var WIDTH  = window.innerWidth;
    var HEIGHT = window.innerHeight;

    canvas.width  = WIDTH;
    canvas.height = HEIGHT;

    var startX =  WIDTH/5;
    var stopX  = WIDTH - startX;
    var startHeight = 100;
    var yPadding = 60;
    var y = startHeight;

    var knobs = device.inputs.knobs;
    for (var i = 0; i < knobs.length; i++) {
        
        if (activeInputs.knobs[i][0] === true) {
            ctx.fillStyle = "#cc3399";
        } else {
            ctx.fillStyle = "#ffb6e6";
        }

        var xSpacing = (stopX - startX)/knobs.length;
        var x = startX + xSpacing * (i + 1);
        var radius = 25;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();
        ctx.closePath();
        
        var val = knobs[i].velocity || 0;
        var theta = BB.MathUtils.map(val, 0, 127, 0, 360);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + radius * Math.cos(BB.MathUtils.degToRad(theta)), y + radius * Math.sin(BB.MathUtils.degToRad(theta)));
        ctx.stroke();
        ctx.fill();
        ctx.closePath();

    }

    var sliders = device.inputs.sliders;
    for (var i = 0; i < sliders.length; i++) {
        
        if (activeInputs.sliders[i][0] === true) {
            ctx.fillStyle = "#cc3399";
        } else {
            ctx.fillStyle = "#ffb6e6";
        }  
 
        // slider bar
        var xSpacing = (stopX - startX)/sliders.length;
        var x = startX + xSpacing * (i + 1);
        y = startHeight + yPadding;
        var barHeight = 120;
        var sliderHeight = 40;
        var sliderWidth = 20;
        ctx.beginPath();
        ctx.rect(x - 5, y, 10, barHeight);
        ctx.stroke();
        ctx.fill()

        // slider handle
        var val = sliders[i].velocity || 0;
        var theta = BB.MathUtils.map(val, 0, 127, barHeight - sliderHeight/2, sliderHeight/2);
        ctx.rect(x - sliderWidth/2, y + barHeight - sliderHeight/2 - val, sliderWidth, sliderHeight);
        ctx.stroke();
        ctx.fill();
        ctx.closePath(); 
    }

    startHeight += yPadding + barHeight;

    var buttons = device.inputs.buttons;
    for (var i = 0; i < 20; i++) { // buttons.length

        // if (activeInputs.buttons[i][0] === true) {
        //     ctx.fillStyle = "#cc3399";
        // } else {
        //     ctx.fillStyle = "#ffb6e6";
        // }

        var size = 25;
        
        var xSpacing = (stopX - startX)/20; //buttons.length

        var x = startX + xSpacing * (i + 1);
        y = startHeight + yPadding;

        ctx.beginPath();
        ctx.rect(x - size/2, y, size, size);
        ctx.stroke();
        ctx.fill();
        ctx.closePath();
    }

    startHeight += yPadding;

    var pads = device.inputs.pads;
    for (var i = 0; i < pads.length; i++) {

        if (activeInputs.pads[i][0] === true) {
            ctx.fillStyle = "#cc3399";
        } else {
            ctx.fillStyle = "#ffb6e6";
        }

        var size = 50;
        
        var xSpacing = (stopX - startX)/pads.length;

        var x = startX + xSpacing * (i + 1);
        y = startHeight + yPadding;

        ctx.beginPath();
        ctx.rect(x - size/2, y, size, size);
        ctx.stroke();
        ctx.fill();
        ctx.closePath();

    }

    startHeight += yPadding + 50;

    var keys = device.inputs.keys;
    for (var i = 0; i < keys.length; i++) {

        if (activeInputs.keys[i][0] === true) {
            ctx.fillStyle = "#cc3399";
        } else {
            ctx.fillStyle = "#ffb6e6";
        }

        var width = (stopX - startX)/keys.length;

        var x = startX + width * (i + 1);
        var y = 480;

        ctx.beginPath();
        ctx.rect(x + width/2, y, width, size);
        ctx.stroke();
        ctx.fill();
        ctx.closePath();
    }
}

function generateActiveInputs(midiMap) {
    
    var obj = {};

    for (inputType in midiMap) {
        obj[inputType] = [];
        for (var i = 0; i < midiMap[inputType].length; i++) {
            obj[inputType][i] = [false, null];
        }
    }

    return obj;
}

function notifyActive(activeArr, index, timeout) {
    // console.log(index);
    activeArr[index][0] = true;
    // console.log('started');
    clearTimeout(activeArr[index][1]);
    activeArr[index][1] = setTimeout(function(){
        activeArr[index][0] = false;
        // console.log('finished');
    }, timeout);
}

function logInputEvent(inputType, index, eventName) {
    
    var container = document.getElementById('input-event-info');
    var span = document.createElement('span');
    span.innerHTML = inputType + " " + index + " <b>" + eventName + "</b> event<br>";
    if (container.childNodes.length < 1) {
        container.appendChild(span);
    } else {
        container.insertBefore(span, container.childNodes[0]);
    }
    
    // container.appendChild(document.createElement('br'));
}
