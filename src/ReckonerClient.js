var ClientPomelo = require('./client/ClientPomelo'),
  ReckonerBase = require('./ReckonerBase'),
  ClientToServerInterface = require('./client/ClientToServerInterface');

// For Client Access (this adds to window)
var ReckonerGameController = require('./control/ReckonerGameController');

/*======================================================*\
 * Globals
\*======================================================*/
var FPS = 60;

/*===================================================*\
 * ReckonerClient()
\*===================================================*/
var ReckonerClient = ReckonerBase._extend({
  /*===========================*\
   * Properties
  \*===========================*/
  setUID: function (value) {
    this.uid = value;
    this.game.setUsername(value);
  },
  isShowing: function () {
    return this.showing;
  },
  setPhaser: function(phaser) {
    this.phaser = phaser;
    this.userInputReceiver = new UserInputReceiver(this, phaser);
    this.userInputReceiver.startKeyboard();
  },
  getUserInput: function () {
    return this.userInputReceiver.getUserInput();
  },
  setState: function (value) {
    this.showing = true;
    this.game.setState(value);
  },
  /*===========================*\
   * Constructor
  \*===========================*/
  init: function init(host, port, game) {
    init._super.call(this);

    this.host = host;
    this.port = port;
    this.pomelo = new ClientPomelo(host, port);
    this.game                   = game;
    this.serverInterface        = new ClientToServerInterface(this);

    this.showing = false;
    this.errorText = undefined;
  },
  /*===========================*\
   * Methods
  \*===========================*/
  error: function (reason) {
    this.errorText = reason;

    this.game.pause();
  },
  enterGame: function (rid) {
    this.serverInterface.start(rid);
  },
  simulateUpdate: function (userInput, elapsed) {
    this.game.clientUpdate(userInput, elapsed);
  },
  /*===========================*\
   * Events
  \*===========================*/
  pomelo_disconnectHandler: function () {
    // Reset all.
    this.game.setState(null);
  },
});

if (typeof window !== 'undefined')
  window.ReckonerClient = ReckonerClient;
else
  module.exports = ReckonerClient;