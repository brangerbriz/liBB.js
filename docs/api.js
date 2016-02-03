YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "BB.AudioAnalyser",
        "BB.AudioBufferLoader",
        "BB.AudioSampler",
        "BB.AudioStream",
        "BB.BaseBrush2D",
        "BB.BaseMidiInput",
        "BB.BrushManager2D",
        "BB.Color",
        "BB.ImageBrush2D",
        "BB.LineBrush2D",
        "BB.MathUtils",
        "BB.MidiDevice",
        "BB.MidiInputButton",
        "BB.MidiInputKey",
        "BB.MidiInputKnob",
        "BB.MidiInputPad",
        "BB.MidiInputSlider",
        "BB.MouseInput",
        "BB.Particle2D",
        "BB.Pointer",
        "BB.Vector2"
    ],
    "modules": [
        "BB.AudioAnalyser",
        "BB.AudioBufferLoader",
        "BB.AudioSampler",
        "BB.AudioStream",
        "BB.BaseBrush2D",
        "BB.BaseMidiInput",
        "BB.BrushManager2D",
        "BB.Color",
        "BB.ImageBrush2D",
        "BB.LeapMotion",
        "BB.LineBrush2D",
        "BB.MathUtils",
        "BB.Midi",
        "BB.MouseInput",
        "BB.Pointer",
        "BB.Vector2",
        "BB.particle2D"
    ],
    "allModules": [
        {
            "displayName": "BB.AudioAnalyser",
            "name": "BB.AudioAnalyser",
            "description": "A module for doing FFT ( Fast Fourier Transform ) analysis on audio"
        },
        {
            "displayName": "BB.AudioBufferLoader",
            "name": "BB.AudioBufferLoader",
            "description": "A module for creating audio buffers from audio files"
        },
        {
            "displayName": "BB.AudioSampler",
            "name": "BB.AudioSampler",
            "description": "A module for creating an audio sampler, an object that can load, sample and play back sound files"
        },
        {
            "displayName": "BB.AudioStream",
            "name": "BB.AudioStream",
            "description": "A module for streaming user audio ( getUserMedia )"
        },
        {
            "displayName": "BB.BaseBrush2D",
            "name": "BB.BaseBrush2D",
            "description": "Base 2D brush class extended by BB.ImageBrush2D, BB.LineBrush2D, etc..."
        },
        {
            "displayName": "BB.BaseMidiInput",
            "name": "BB.BaseMidiInput",
            "description": "A module representing individual button inputs on a midi device.\nMidiInputSlider, MidiInputButton, etc derive from this base class."
        },
        {
            "displayName": "BB.BrushManager2D",
            "name": "BB.BrushManager2D",
            "description": "Basic scene manager for brushes and pointers. BB.BrushManager2D allows a\ndrawing scene (that uses brushes) to persist while the rest of the canvas is\ncleared each frame. It also provides functionality to undo/redo manager to\nyour drawing actions. <br><br> Note: The BB.BrushManager2D class creates a new canvas\nthat is added to the DOM on top of the canvas object that you pass to its\nconstructor. This is acheived through some fancy CSS inside of\nBB.BrushManager2D.updateCanvasPosition(...). For this reason the canvas\npassed to the constructor must be absolutely positioned and\nBB.BrushManager2D.updateCanvasPosition(...) should be called each time that\ncanvas' position or size is updated."
        },
        {
            "displayName": "BB.Color",
            "name": "BB.Color",
            "description": "A module for creating color objects, color schemes and doing color maths"
        },
        {
            "displayName": "BB.ImageBrush2D",
            "name": "BB.ImageBrush2D",
            "description": "A 2D brush module for drawing images in a stamp-like style."
        },
        {
            "displayName": "BB.LeapMotion",
            "name": "BB.LeapMotion",
            "description": "A module to obtain the X and Y values from \nthe LeapMotion sensor."
        },
        {
            "displayName": "BB.LineBrush2D",
            "name": "BB.LineBrush2D",
            "description": "A 2D brush module for drawing contiguous lines in a stamp-like fashion."
        },
        {
            "displayName": "BB.MathUtils",
            "name": "BB.MathUtils",
            "description": "A static utilitites class for all things math."
        },
        {
            "displayName": "BB.Midi",
            "name": "BB.Midi",
            "description": "A module for receiving midi messages via USB in the browser. Google Chrome\nsupport only at the moment. See support for the Web MIDI API\n(https://webaudio.github.io/web-midi-api/)."
        },
        {
            "displayName": "BB.MouseInput",
            "name": "BB.MouseInput",
            "description": "A module for standardizing mouse events from an HTML5 canvas so that they may be used with\nthe event funnel suite of modules.\n<br>\n<i>NOTE: For use with HTML5 canvas only.<i>"
        },
        {
            "displayName": "BB.particle2D",
            "name": "BB.particle2D",
            "description": "A 2D Particle class for all your physics needs"
        },
        {
            "displayName": "BB.Pointer",
            "name": "BB.Pointer",
            "description": "A module for funneling in and standardizing basic pointer-like interfaces\nlike mouse and touch."
        },
        {
            "displayName": "BB.Vector2",
            "name": "BB.Vector2",
            "description": "A vector in 2 dimensional space. A direct copy of Three.js's Vector2 class."
        }
    ]
} };
});