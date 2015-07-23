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

  return BB;

});