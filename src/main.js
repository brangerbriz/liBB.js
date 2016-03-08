define(function (require) {

  'use strict';

  var BB = require('BB');
  
  //utils
  BB.MathUtils      = require('BB.MathUtils');
  BB.Detect         = require('BB.Detect');
  BB.Color          = require('BB.Color');
  BB.EventEmitter   = require('BB.EventEmitter');

  // brushes
  BB.BaseBrush2D    = require('BB.BaseBrush2D');
  BB.ImageBrush2D   = require('BB.ImageBrush2D');
  BB.LineBrush2D    = require('BB.LineBrush2D');
  BB.BrushManager2D = require('BB.BrushManager2D');
  
  // inputs, etc...
  BB.MouseInput     = require('BB.MouseInput');
  BB.Pointer        = require('BB.Pointer');
  BB.LeapMotion     = require('BB.LeapMotion');

  // physics
  BB.Vector2        = require('BB.Vector2');
  BB.Particle2D     = require('BB.Particle2D');
  BB.Agent2D        = require('BB.Agent2D');
  BB.FlowField2D    = require('BB.FlowField2D');

  // audio
  BB.Audio             = require('BB.Audio');
  BB.AudioBase         = require('BB.AudioBase');
  BB.AudioStream       = require('BB.AudioStream');
  BB.AudioBufferLoader = require('BB.AudioBufferLoader');
  BB.AudioSampler      = require('BB.AudioSampler');
  BB.AudioTone         = require('BB.AudioTone');
  BB.AudioNoise        = require('BB.AudioNoise');
  BB.AudioSequencer    = require('BB.AudioSequencer');
  BB.AudioAnalyser     = require('BB.AudioAnalyser');
  BB.AudioFX           = require('BB.AudioFX');
  BB.AFX               = require('BB.AFX');
  
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