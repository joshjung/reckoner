/*===================================================*\
 * Requires
\*===================================================*/
var JClass = require('jclass'),
  HashArray = require('hasharray');

/*===================================================*\
 * Constants
\*===================================================*/
var SERVER_TIMEOUT_MS = 10000;

/*===================================================*\
 * ReckonerGameController()
\*===================================================*/
var ReckonerGameController = module.exports = JClass._extend({
  //=========================
  // Properties
  //=========================
  getNow: function() {
    return (new Date()).getTime();
  },
  getState: function () {
    return {
      time: this.getNow(),
      world: this.world.getState()
    };
  },
  setState: function (value) {
    if (value) this.world.setState(value.world);
    else
    {
      // If no state is provided, it is considered a reset.
      this.reset();
    }
  },
  getFPS: function () {
    return this.fps;
  },
  isServer: function () {
    return typeof window === 'undefined';
  },
  //=========================
  // Constructor
  //=========================
  init: function (userInputProcessor) {
    this.started = false;
    this.startTime = undefined;

    this.world = undefined;
    this.fps = 60;

    this.server = {
      inputs: {},
      lastPlayerId: 0
    };

    this.userInputProcessor = userInputProcessor;

    this.reset();
  },
  //=========================
  // Methods
  //=========================
  __fetchPlayer: function () {
    if (!this.player)
    {
      var self = this,
        players = this.world.getChildren().getAsArray('player');

      players.forEach(function (player) {
        var un = player.username.split('*')[0];
        self.player = (un == this.username) ? player : self.player;
      })
    }
  },
  applyAction: function(actions, elapsed) {
  },
  addSession: function (session) {
    if (!this.isServer())
      throw Error('ReckonerGameController::addSession should only be called on the server.');
  },
  addUserInputForSession: function (username, input) {
  },
  serverProcessUserInputFor: function (username, elapsed) {
    var userInput = this.server.userInputsByUID[username];
    
    // It's possible the player has left.
    if (this.world.getChildren().get(username))
    {
      this.userInputProcessor.update(userInput.input, elapsed, username);
    }

    delete this.server.userInputsByUID[username];
  },
  start: function () {
    this.reset();
    this.generateWorld();
  },
  reset: function () {
    if (this.deadReckoner)
      this.deadReckoner.reset();

    if (this.world)
      this.world.destroyAll();

    this.world = new World();
  },
  stop: function () {

  },
  clientUpdate: function (userInput, elapsed) {
    elapsed =  elapsed / 1000.0;

    if (elapsed > SERVER_TIMEOUT_MS)
    {
      this.stop('Server disconnected');      
    }
    if (elapsed > 0.2)
      throw Error('Elapsed is wayyyy too high man. Did server disconnect?');

    this.userInputProcessor.update(userInput, elapsed);

    this.world.update(elapsed);
  },
  serverUpdate: function(elapsed) {
    // First manage user input.
    for (var username in this.server.userInputsByUID)
      this.serverProcessUserInputFor(username, elapsed);

    this.world.update(elapsed);
  },
  clientUpdateView: function (view) {
    if (this.world)
      this.world.updateView(view);
  },
  generateWorld: function() {
  }
});

if (typeof window !== 'undefined')
  window.ReckonerGameController = ReckonerGameController;
else
  module.exports = ReckonerGameController;