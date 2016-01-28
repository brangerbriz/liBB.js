define(function (require) {

  'use strict';

  var BB = require('BB');
  
  //utils
  BB.MathUtils      = require('BB.MathUtils');
  BB.Color          = require('BB.Color');

  // brushes
  BB.BaseBrush2D    = require('BB.BaseBrush2D');
  BB.ImageBrush2D   = require('BB.ImageBrush2D');
  BB.LineBrush2D    = require('BB.LineBrush2D');
  BB.BrushManager2D = require('BB.BrushManager2D');
  
  // inputs, etc...
  BB.MouseInput     = require('BB.MouseInput');
  BB.Pointer        = require('BB.Pointer');
  BB.LeapMotion     = requite('BB.LeapMotion');

  // physics
  BB.Vector2        = require('BB.Vector2');
  BB.Particle2D     = require('BB.Particle2D');

  // audio
  BB.AudioBufferLoader = require('BB.AudioBufferLoader');
  BB.AudioSampler      = require('BB.AudioSampler');
  BB.AudioAnalyser     = require('BB.AudioAnalyser');
  BB.AudioStream       = require('BB.AudioStream');

  // midi
  BB.MidiDevice      = require('BB.MidiDevice');
  BB.BaseMidiInput   = require('BB.BaseMidiInput');
  BB.MidiInputKnob   = require('BB.MidiInputKnob');
  BB.MidiInputSlider = require('BB.MidiInputSlider');
  BB.MidiInputButton = require('BB.MidiInputButton');
  BB.MidiInputKey    = require('BB.MidiInputKey');
  BB.MidiInputPad    = require('BB.MidiInputPad');

  return BB;

});