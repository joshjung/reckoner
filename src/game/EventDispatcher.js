/*===================================================*\
 * Requires
\*===================================================*/
var JClass = require('jclass'),
	EventEmitter = require('node-event-emitter');

/*===================================================*\
 * GameObject()
\*===================================================*/
var EventDispatcher = module.exports = JClass._extend(EventEmitter.prototype);