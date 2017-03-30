/* jshint esversion: 6 */

/**
* A class for providing a basic event-based programming interface.
* Often used as a base class extended by other classes that require
* event based programming patterns.
* @class BB.EventEmitter
* @constructor
* @example
* <code class="code prettyprint"><br>
* // SHOULD LOG LIKE:<br>
* // Fired "now" event 1457470144<br>
* // seconds since the unix epoch.<br>
* // Fired "often" event 1457470145 seconds since the unix epoch.<br>
* // Fired "often" event 1457470146 seconds since the unix epoch.<br>
* // Fired "often" event 1457470147 seconds since the unix epoch.<br>
* // Fired "often" event 1457470148 seconds since the unix epoch.<br>
* // Fired "later" event 1457470149 seconds since the unix epoch.<br>
* // Removed "often" event.<br>
* <br>
* &nbsp;var emitter = new BB.EventEmitter();<br>
*<br>
* &nbsp;emitter.createEvent('now');<br>
* &nbsp;emitter.createEvent('later');<br>
* &nbsp;emitter.createEvent('often');<br>
* <br>
* &nbsp;// because this 'now' callback was registered first<br>
* &nbsp;// it will be called first.<br>
* &nbsp;emitter.on('now', function(unixTimestamp) {<br>
* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;console.log('Fired "now" event ' + unixTimestamp);<br>
* &nbsp;});<br>
*<br>
*&nbsp;// this one will be called second.<br>
*&nbsp;emitter.on('now', function(unixTimestamp) {<br>
*&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;console.log('seconds since the unix epoch.');<br>
*&nbsp;});<br>
*<br>
*&nbsp;emitter.on('often', function(unixTimestamp) {<br>
*&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;console.log('Fired "often" event ' + unixTimestamp + ' seconds since the unix epoch.');<br>
*&nbsp;});<br>
*<br>
*&nbsp;emitter.on('later', function(unixTimestamp) {<br>
*&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;console.log('Fired "later" event ' + unixTimestamp + ' seconds since the unix epoch.');<br>
*&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;emitter.removeEvent('often');<br>
*&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;console.log('Removed "often" event.');<br>
*&nbsp;});<br>
*<br>
*&nbsp;emitter.notify('now', Math.floor(Date.now() / 1000));<br>
*<br>
*&nbsp;setTimeout(function(){ emitter.notify('later', Math.floor(Date.now() / 1000)) }, 5000);<br>
*&nbsp;setInterval(function(){ emitter.notify('often', Math.floor(Date.now() / 1000)) }, 1000);<br>
*<br>
* </code>
*/
class EventEmitter {

	constructor(){
		this._eventStack = {};
		this.err = new BB.ValidArg(this);
	}

	/**
	 * Create a new event. This event can then have callbacks registered to it
	 * with on() and trigger those callbacks with notify().
	 *
	 * __Note__: if eventName
	 * has already been created this function does nothing.
	 * @method createEvent
	 * @param  {String} eventName The name of the event.
	 */
	createEvent(eventName) {

		this.err.checkType( eventName, 'string', 'eventName' );

		if (!(this._eventStack[eventName] instanceof Array)) {
			this._eventStack[eventName] = [];
		}
	}

	/**
	 * Register a callback function to an event.
	 *
	 * __Note__: callback functions
	 * registered with on() will be called via notify() with a "this" variable
	 * bound to the event emitter itself independent of the function call
	 * context.
	 * @method on
	 * @param  {String}   eventName The name of the event to register the
	 * callback to.
	 * @param  {Function} callback  The callback function to call when the event
	 * is notified.
	 * @return {Boolean}            True if the callback was successfully
	 * registered to the event.
	 */
	on(eventName, callback) {

		this.err.batchCheck([
			{ param:eventName, name:'.on( eventName )',      'type':'string'},
			{ param:callback,  name:'.on( "...", callback)', 'type':'function'}
		]);

		if (this._eventStack.hasOwnProperty(eventName) && typeof callback === 'function') {
			this._eventStack[eventName].push(callback);
			return true;
		} else return false;
	}

	/**
	 * Notify an event by name, causing all callbacks registered to that event
	 * to be called in the order they were registered. Any arguments included in
	 * this function call after eventName will be passed directly to each
	 * callback that has been registered to this event.
	 * @method notify
	 * @param  {String} eventName The event to notify.
	 * @param {Arguments} [arguments] Any arguments included in this function
	 * call after eventName will be passed directly to each callback that has
	 * been registered to this event.
	 * @return {Boolean}          True if at least one callback function was
	 * called.
	 */
	notify(eventName) {

		this.err.checkType( eventName, 'string', '.notify(eventName)');

		if (this._eventStack.hasOwnProperty(eventName)) {
			for (var i = 0; i < this._eventStack[eventName].length; i++) {
				// potential trap, this now equals instance of
				// PianoRoll no matter where it is called from
				this._eventStack[eventName][i].apply(this,
					Array.prototype.slice.call(arguments, 1));
			}
			return this._eventStack[eventName].length > 0;
		}
		return false;
	}

	/**
	 * Remove an event by name. This function also removes all registered
	 * callbacks to that event.
	 * @method removeEvent
	 * @param  {String} eventName The name of the event to remove.
	 * @return {Boolean}          True if the event existed and was removed.
	 */
	removeEvent(eventName) {

		if (this._eventStack.hasOwnProperty(eventName)) {
			delete this._eventStack[eventName];
			return true;
		}

		return false;
	}

	/**
	 * Remove a callback registered to an event by index.
	 * @method removeEventCallbackAtIndex
	 * @param  {[type]} eventName The name of the event to remove a callback
	 * from.
	 * @param  {[type]} index     The index of that callback starting at 0
	 * (counting up in the order the callbacks were registered). Negative
	 * numbers remove from the internal event array starting at the back (e.g.
	 * -1 removes the callback most recently registered).
	 * @return {[type]}           Returns the callback function if one was
	 * succesfully removed or false otherwise.
	 */
	removeEventCallbackAtIndex(eventName, index) {

		this.err.batchCheck([
			{ param:eventName, name:'.removeEventCallbackAtIndex( eventName )',    'type':'string'},
			{ param:index,     name:'.removeEventCallbackAtIndex( "...", index )', 'type':'number'}
		]);

		if (this._eventStack[eventName] instanceof Array && index > 0) {
			return this._eventStack[eventName].splice(index, 1);
		}

		return false;

	}
}

module.exports = EventEmitter;
