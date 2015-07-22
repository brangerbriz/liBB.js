define(function (require) {

  'use strict';

  var BBMod = require('BBModCore');
  
  //utils
  BBMod.MathUtils      = require('BBModMathUtils');
  BBMod.Color          = require('BBModColor');

  // brushes
  BBMod.BaseBrush2D    = require('BBModBaseBrush2D');
  BBMod.ImageBrush2D   = require('BBModImageBrush2D');
  BBMod.LineBrush2D    = require('BBModLineBrush2D');
  BBMod.BrushManager2D = require('BBModBrushManager2D');
  
  // inputs, etc...
  BBMod.MouseInput     = require('BBModMouseInput');
  BBMod.Pointer        = require('BBModPointer');

  return BBMod;

});