/* jshint esversion: 6 */

/*
      +++++++++++++
    +++++++++++++++++
  +++++++++++++++++++++
 +++++++ ---------- ++++       ____                                         ____       _
++++++++|  ______  |+++++     |  _ \                                       |  _ \     (_)
++++++__| |______| |+++++     | |_) |_ __ __ _ _ __   __ _  ___ _ __       | |_) |_ __ _ ____
+++++|  _________  |+++++     |  _ <| '__/ _` | '_ \ / _` |/ _ \ '__|      |  _ <| '__| |_  /
+++++| |_________| |+++++     | |_) | | | (_| | | | | (_| |  __/ |         | |_) | |  | |/ /
 ++++|_____________|++++      |____/|_|  \__,_|_| |_|\__, |\___|_| _______ |____/|_|  |_/___|
  +++++++++++++++++++++                              __ | |       |_______|
    +++++++++++++++++                                \___/
      +++++++++++++                                                   // libb.brangerbriz.com
*/

// import { Check } from './utils/BB.Check.js';
// note: would be nice to use 'import' 'export', but browserify can't seem to handle it
// && we want to be able to debug un-transpiled code

class BB {

	constructor(){
		// if u update this version number,
		// also update version number in package.json
		// and also update in www/docs-theme/theme.json
		this.version = "0.2.0";

		// ~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'
		// - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - .
		// ~._.~'~._.~'~._.~'	 General Utils      '~._.~'~._.~'~._.~'~._.~'~._.~'
		// - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - .
		// ~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'

		// this.Check = Check; // see note above
		this.Check 			= require('./utils/BB.Check.js');
		this.ValidArg 		= require('./utils/BB.ValidArg.js');
		this.Vector2D 		= require('./utils/BB.Vector2D.js');
		this.Maths 			= require('./utils/BB.Maths.js');
		this.EventEmitter 	= require('./utils/BB.EventEmitter.js');

		// ~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'
		// - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - .
		// ~._.~'~._.~'~._.~'	 Audio Modules      '~._.~'~._.~'~._.~'~._.~'~._.~'
		// - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - .
		// ~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'
		this.Audio 			= require('./audio/BB.Audio.js');
	}

}

// function BB() {

	// ~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'
	// - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - .
	// ~._.~'~._.~'~._.~'	 General Utils      '~._.~'~._.~'~._.~'~._.~'~._.~'
	// - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - .
	// ~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'

	// this.ValidateParam 	= require('./utils/BB.ValidateParam');

	// this.Detect			= require('./utils/BB.Detect');

	// this.Vector2D 		= require('./utils/BB.Vector2D');

	// this.Maths 			= require('./utils/BB.Maths');

	// this.EventEmitter	= require('./utils/BB.EventEmitter');


	// ~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'
	// - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - .
	// ~._.~'~._.~'~._.~'	  Input Modules     '~._.~'~._.~'~._.~'~._.~'~._.~'
	// - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - .
	// ~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'


	// this.MouseInput 	= require('./input/BB.MouseInput');
	//
	// this.LeapMotion		= require('./input/BB.LeapMotion');
	//
	// this.BaseMidiInput	= require('./input/BB.BaseMidiInput');
	// this.MidiInputButton= require('./input/BB.MidiInputButton');
	// this.MidiInputKey	= require('./input/BB.MidiInputKey');
	// this.MidiInputKnob	= require('./input/BB.MidiInputKnob');
	// this.MidiInputPad	= require('./input/BB.MidiInputPad');
	// this.MidiInputSlider= require('./input/BB.MidiInputSlider');


	// ~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'
	// - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - .
	// ~._.~'~._.~'~._.~'	 Visual Modules     '~._.~'~._.~'~._.~'~._.~'~._.~'
	// - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - .
	// ~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'

	// this.Color 			= require('./visual/BB.Color');
	// this.Logo 			= require('./visual/BB.Logo');

	// - . - . - . - . - . - . - . - . - . - . - . - . - . - |   2D   | - . - .

	// this.Pointer 		= require('./visual/2d/BB.Pointer');
	// this.BrushManager2D = require('./visual/2d/BB.BrushManager2D');
	// this.BaseBrush2D 	= require('./visual/2d/BB.BaseBrush2D');
	// this.ImageBrush2D 	= require('./visual/2d/BB.ImageBrush2D');
	// this.LineBrush2D 	= require('./visual/2d/BB.LineBrush2D');
	//
	// this.Particle2D 	= require('./visual/2d/BB.Particle2D');
	// this.Agent2D 		= require('./visual/2d/BB.Agent2D');
	// this.FlowField2D 	= require('./visual/2d/BB.FlowField2D');


	/* * * * * * * *
	 *  2d_addons  * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * * * * * * * */

	// this.SprayBrush 	= require('./addons/2d/BB.SprayBrush');
	// this.LeafBrush 		= require('./addons/2d/BB.LeafBrush');
	// this.RainbowBrush 	= require('./addons/2d/BB.RainbowBrush');
	// this.StarBrush 		= require('./addons/2d/BB.StarBrush');
	// this.WebBrush 		= require('./addons/2d/BB.WebBrush');


	// - . - . - . - . - . - . - . - . - . - . - . - . - . - |   3D   | - . -


	// ~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'
	// - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - .
	// ~._.~'~._.~'~._.~'	  Audio Modules     '~._.~'~._.~'~._.~'~._.~'~._.~'
	// - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - . - .
	// ~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'~._.~'

	// this.Audio 				= require('./audio/BB.Audio');
	// this.AudioBase 			= require('./audio/BB.AudioBase');
	// this.AudioBufferLoader 	= require('./audio/BB.AudioBufferLoader');
	// this.AudioStream 		= require('./audio/BB.AudioStream');
	// this.AudioAnalyser 		= require('./audio/BB.AudioAnalyser');
	// this.AudioFX 			= require('./audio/BB.AudioFX');
	// this.AFX 				= require('./audio/BB.AFX');
	// this.AudioNoise 		= require('./audio/BB.AudioNoise');
	// this.AudioTone 			= require('./audio/BB.AudioTone');
	// this.AudioSampler 		= require('./audio/BB.AudioSampler');
	// this.AudioSequencer 	= require('./audio/BB.AudioSequencer');

// }
window.BB = new BB();
