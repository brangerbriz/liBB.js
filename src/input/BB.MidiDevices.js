/* jshint esversion: 6 */

/**
* A module for interfacing with Midi Devices, abstracts the <a href="https://www.w3.org/TR/webmidi/#requestmidiaccess" target="_blank">Web Midi API</a>
* @class BB.MidiDevices
* @constructor
* @example
* <code class="code prettyprint">
* &nbsp;var midi = new BB.MidiDevices((midiAcc)=>{<br>
* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;//    the midi-access object ^<br>
* <br>
* &nbsp;&nbsp;&nbsp;&nbsp;midi.getDeviceByName("nanoKONTROL MIDI 1").onchange = (msg)=>{<br>
* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;//   msg =  midi-message object<br>
* &nbsp;&nbsp;&nbsp;&nbsp;}<br>
* <br>
* &nbsp;});<br>
* </code>
* <br><br>
* you can query the list of devices currenlty attached with <b>midi.devices</b>, this will return an object with "name", "manufacturer" and "id" properties per connected device. You can use these values to target a particular device like so:
*<br><br>
* <code class="code prettyprint">
* &nbsp;var d = midi.devices[0];<br><br>
* &nbsp;midi.getDeviceById( d.id );<br>
* &nbsp;midi.getDeviceByName( d.name );<br>
* &nbsp;midi.getDeviceByMake( d.manufacturer );<br><br>
* &nbsp;// with those you can do things like:<br>
* &nbsp;midi.getDeviceById(id).state; // returns "connected"|"disconnected"<br>
* &nbsp;midi.getDeviceById(id).name; // returns name of device (ie. d.name)<br>
* &nbsp;midi.getDeviceById(id).manufacturer; // returns name of make (ie. d.manufacturer)
* </code>
* <br><br>
* perhaps most importantly, once you've targetted a device you can set it's <b>onchange</b> method
*<br><br>
* <code class="code prettyprint">
* &nbsp;var d = midi.devices[0];<br><br>
* &nbsp;midi.getDeviceById( d.id ).onchange = function(msg){<br>
* &nbsp;&nbsp;&nbsp;&nbsp;// exposes midi message object<br>
* &nbsp;}<br>
* </code>
* <br><br>
* this exposes the midi message object, which looks like this:
*<br><br>
* <code class="code prettyprint">
* &nbsp;{<br>
* &nbsp;&nbsp;&nbsp;&nbsp;channel:0, // midi channel number<br>
* &nbsp;&nbsp;&nbsp;&nbsp;command:11, // midi command number<br>
* &nbsp;&nbsp;&nbsp;&nbsp;note:22, // midi note number<br>
* &nbsp;&nbsp;&nbsp;&nbsp;velocity:127, // midi velocity value<br>
* &nbsp;&nbsp;&nbsp;&nbsp;state:"connected", // or "disconnected"<br>
* &nbsp;&nbsp;&nbsp;&nbsp;str:{<br>
* &nbsp;&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbspcommand:"control mode change",// midi command string<br>
* &nbsp;&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbspnote:"A#",// midi note string<br>
* &nbsp;&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbspoctave:1// midi note octave<br>
* &nbsp;&nbsp;&nbsp;&nbsp;}<br>
* &nbsp;}<br>
* </code>
*/
class MidiDevices {
	constructor( success, failure ){
		this.err = new BB.ValidArg(this);
		this.err.checkType(success,["undefined","function"],"success");
		this.err.checkType(failure,["undefined","function"],"failure");

		this._devices = {};

		/**
		* the web api midiAccess object
		* @type {object}
		* @property access
		*/
		this.access = null; // the midi access object

		if (navigator.requestMIDIAccess) {
			navigator.requestMIDIAccess().then((midi)=>{
				// save midi-access object
				this.access = midi;
				// create initial list of already connected devices
				this._updateDevices(midi);
				// if user registered optional success callback, fire it
				if(typeof success=="function") success(midi);
				// update list of connected devices on state change
				midi.onstatechange = (msg)=>{ this._updateDevices(midi,msg); };

			},(msg)=>{
				// if user registered optional failure callback, fire it if failure
				if(typeof failure=="function") failure(msg);
			});
		} else {
			// if client doesn't support midi ERROR
			throw new Error("BB.MidiDevices: MIDIAccess is not supported");
		}
	}

	/**
	* an array of connected midi devices ( as objects with id, name, manufacturer )
	* @type {Array}
	* @property devices
	*/
	set devices( n ){
		console.warn("BB.MidiDevices: devices is read only");
		return false;
	}
	get devices(){
		let list = [];
		for( let d in this._devices ){
			if(this._devices[d].state=="connected" ) list.push({
				name:this._devices[d].name,
				manufacturer:this._devices[d].manufacturer,
				id: this._devices[d].id
			});
		}
		return list;
	}

	// check if a particular device is already in the devices list or not
	_isNew(id){
		if( this._devices.hasOwnProperty(id) ) return false;
		else return true;
	}

	// used to update list of devices when midi detcts a state change
	_updateDevices(midi){
		let ins = midi.inputs.values();
		for (let i = ins.next(); i && !i.done; i = ins.next()) {
			if(i.value.name!=="Midi Through Port-0" && this._isNew(i.value.id) ){
				i.value.onmidimessage = (msg)=>{ this._onMidiMessage(msg); };
				i.value.onstatechange = (msg)=>{ this._onStateChange(msg); };
				i.value.onchange = null;
				this._devices[i.value.id] = i.value;
			}
		}
	}

	_lookUpCmdStr( num ){
		// see: http://www.onicos.com/staff/iz/formats/midi-event.html
		let str;
		if( num >= 0x80 && num <= 0xEF ){
			switch(num>>4){
				case 8: str="note off"; break;
				case 9: str="note off"; break;
				case 10: str="polyphonic aftertouch"; break;
				case 11: str="control mode change"; break;
				case 12: str="program change"; break;
				case 13: str="channel aftertouch"; break;
				case 14: str="pitch wheel range"; break;
			}
			return str;
		} else if( num >= 0xF0 && num <= 0xFF ){
			switch(num){
				case 0xF0: str="System Exclusive"; break;
				case 0xF1: str="System Common - undefined"; break;
				case 0xF2: str="Sys Com Song Position Pntr"; break;
				case 0xF3: str="Sys Com Song Select(Song #)"; break;
				case 0xF4: str="System Common - undefined"; break;
				case 0xF5: str="System Common - undefined"; break;
				case 0xF6: str="Sys Com tune request"; break;
				case 0xF7: str="Sys Com-end of SysEx (EOX)"; break;
				case 0xF8: str="Sys real time timing clock"; break;
				case 0xF9: str="Sys real time undefined"; break;
				case 0xFA: str="Sys real time start"; break;
				case 0xFB: str="Sys real time continue"; break;
				case 0xFC: str="Sys real time stop"; break;
				case 0xFD: str="Sys real time undefined"; break;
				case 0xFE: str="Sys real time active sensing"; break;
				case 0xFF: str="Sys real time sys reset	"; break;
			}
			return str;
		} else {
			return undefined;
		}
	}

	_lookUpNoteStr( num ){
		// see: http://www.midimountain.com/midi/midi_note_numbers.html
		let str;
		switch(num%12){
			case 0: str="C"; break;
			case 1: str="C#"; break;
			case 2: str="D"; break;
			case 3: str="D#"; break;
			case 4: str="E"; break;
			case 5: str="F"; break;
			case 6: str="F#"; break;
			case 7: str="G"; break;
			case 8: str="G#"; break;
			case 9: str="A"; break;
			case 10: str="A#"; break;
			case 11: str="B"; break;
		}
		return str;
	}

	_lookUpNoteOct( num ){
		// see: http://www.midimountain.com/midi/midi_note_numbers.html
		return Math.floor(num/12);
	}

	// fired on every devices onmidimessage event
	_onMidiMessage( message ){
		let id = message.currentTarget.id;
		if( typeof this.getDeviceById(id).onchange=="function" ){

			let res = {
				command: message.data[0] >> 4,
				channel: message.data[0] & 0xf,
				note: message.data[1],
				velocity: message.data[2],
				str: {
					command: this._lookUpCmdStr(message.data[0]),
					note: this._lookUpNoteStr(message.data[1]),
					octave: this._lookUpNoteOct(message.data[1])
				},
				state: this.getDeviceById(id).state
			};

			this.getDeviceById(id).onchange( res );
		} else {
			return id;
		}

	}

	// fired on every devices onstatechange event
	_onStateChange( message ){
		let id = message.currentTarget.id;
		if( typeof this.getDeviceById(id).onchange=="function" ){

			let res = {
				command: null,
				channel: null,
				note: null,
				velocity: null,
				str: null,
				state: this.getDeviceById(id).state
			};

			this.getDeviceById(id).onchange( res );
		} else {
			return id;
		}
	}

	/**
	* get a device object by it's id
	* @method getDeviceById
	* @param {String} id the id string of the device you want to target
	* @return {Object} a midi device object
	* @example
	* <code class="code prettyprint">
	* &nbsp;var d = midi.devices[0];<br>
	* &nbsp;midi.getDeviceById( d.id );<br>
	* </code>
	*/
	getDeviceById( id ){
		return this._devices[id];
	}

	/**
	* get a device object by it's name
	* @method getDeviceByName
	* @param {String} name the name string of the device you want to target
	* @return {Object} a midi device object
	* @example
	* <code class="code prettyprint">
	* &nbsp;var d = midi.devices[0];<br>
	* &nbsp;midi.getDeviceByName( d.name );<br>
	* </code>
	*/
	getDeviceByName( name ){
		let answer = false;
		for( let d in this._devices ){
			if( this._devices[d].name == name )
				answer = this._devices[d];
			break;
		}
		return answer;
	}

	/**
	* get a device object by it's manufacturer
	* @method getDeviceByMake
	* @param {String} manufacturer the manufacturer string of the device you want to target
	* @return {Object} a midi device object
	* @example
	* <code class="code prettyprint">
	* &nbsp;var d = midi.devices[0];<br>
	* &nbsp;midi.getDeviceByMake( d.manufacturer );<br><br>
	* </code>
	*/
	getDeviceByMake( manufacturer ){
		let answer = false;
		for( let d in this._devices ){
			if( this._devices[d].manufacturer == manufacturer )
				answer = this._devices[d];
			break;
		}
		return answer;
	}


}

module.exports = MidiDevices;
