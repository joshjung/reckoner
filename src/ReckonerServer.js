/*===================================================*\
 * Requires
\*===================================================*/
var HashArray = require('hasharray'),
  JClass = require('jclass'),
  ReckonerBase = require('./ReckonerBase');

/*===================================================*\
 * Globals
\*===================================================*/
var FPS = 30,
  MIN_FRAME_TIME = 0.3,
  /**
   * How many seconds to wait to update the clients with data.
   */
  CLIENT_UPDATE_FPS = 30;

/*===================================================*\
 * ReckonerServer()
\*===================================================*/
var ReckonerServer = ReckonerBase._extend({
  init: function init(pomelo, GameController) {
    init._super.call(this);

    this.pomelo = pomelo;

    this.messaging = pomelo.get('messagingService');

    this.games = new HashArray('rid');

    this.lastTime = undefined;
    this.elapsed = undefined;

    this.id = 'sid:' + Math.round(Math.random() * 100).toString(16) + ':' + process.pid;
    this.interval = undefined;
  },
  /*============================*\
   * Properties
  \*============================*/
  getNow: function() {
    return (new Date()).getTime();
  },
  /*============================*\
   * Methods
  \*============================*/
  addGame: function (game, rid) {
    game.messaging = this.messaging;
    game.clientUpdateTimer = 0;
    game.rid = rid;

    this.games.add(game);
  },
  sendState: function() {
    this.games.all.forEach(function (game) {
      var channel = this.pomelo.get('channelService').getChannel(game.rid, false);

      if (channel)
        channel.pushMessage('serverState', game.getState());
      else
        console.log('WARNING: attempted to push to channel but does not exist', game.rid)
    });
  },
  start: function () {
    this.interval = setInterval(this.frameHandler.bind(this), 1000 / FPS);
  },
  stopAll: function () {
    clearInterval(this.interval);
  },
  resetAll: function () {
    this.games.all.forEach(function () {
      game.reset();
      game.start();
    });
  },
  /*============================*\
   * Events
  \*============================*/
  /**
   * Called once per frame, defined by the FPS property above.
   */
  frameHandler: function () {
    var self = this;

    if (!this.lastTime)
      return this.lastTime = this.getNow();

    // Elapsed is 0.0-0.3 seconds.
    this.elapsed =  (this.getNow() - this.lastTime) / 1000.0;
    this.lastTime = this.getNow();
    this.elapsed = (this.elapsed > MIN_FRAME_TIME ? MIN_FRAME_TIME : this.elapsed);

    this.games.forEach(function (game) {
      game.serverUpdate(this.elapsed);
    });

    this.clientUpdateTimer += this.elapsed;

    if (this.clientUpdateTimer > CLIENT_UPDATE_FPS / 1000.0)
    {
      this.sendState();
      this.clientUpdateTimer = 0;
    }
  },
  /**
   * Called when the socket receives user input.
   */
  session_userInputHandler: function(msg, session) {
    var game = this.games.get(msg.rid);

    if (game)
      game.addUserInputForSession(session.uid, msg);
    else
      console.log('ERROR: unable to find game for rid: ' + msg.rid);
  },
  /**
   * Called by the game handler whenever a user disconnects or is forcibly removed from
   * the game by a connection issue.
   */
  session_disconnectedHandler: function (uid) {
    console.log('SESSION DISCONNECTED:', uid);

    this.game.world.players.removeByKey(uid);
    this.game.world.getChildren().get(uid).destroy();

    if (this.game.world.getChildren().getAsArray('player').length == 0)
      this.reset();
  },
  /**
   * Called by the reckonerHandler whenever a new user connects.
   */
  session_connectedHandler: function(session, rid) {
    var game = this.games.get(rid);

    if (!game)
    {
      console.log('Attempted to connect to game that does not exist: ' + rid);
      return;
    }

    game.startSession = game.startSession || session;

    game.addSession(session);

    console.log('SESSION CONNECTED:', session.uid, ' to ', rid);
  }
});

/*===================================================*\
 * Export
\*===================================================*/
module.exports = ReckonerServer;