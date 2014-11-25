/*===================================================*\
 * Requires
\*===================================================*/
var JClass = require('jclass');

/*===================================================*\
 * ReckonerBase
\*===================================================*/
var ReckonerBase = JClass._extend({
	//=========================
  // Properties
  //=========================
	setState: function(value) {
		
	},
	getState: function() {
		
	},
	getFPS: function () {
    return 30;
  },
	/**
	 * Returns the world object. Not to be confused with getState which returns
	 * just state information.
	 */
	getWorld: function(value) {
		return this.world;
	},
	//=========================
  // Constructor
  //=========================
	init: function () {
	},
	//=========================
  // Methods
  //=========================
	/**
	 * Moves the game forward by elapsed milliseconds.
	 */
	update: function (elapsed, tracker) {
		
	},
	/**
	 * Projects the game elapsed milliseconds into the future and returns
	 * the world result.
	 */
	project: function (elapsed) {
		
	}
});

/*===================================================*\
 * modules
\*===================================================*/
module.exports = ReckonerBase;