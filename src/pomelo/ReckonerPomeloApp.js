var JClass = require('jclass'),
    pomelo = require('pomelo');

global.isClient = false;

var ReckonerPomeloApp = JClass._extend({
  init: function (name, gameServerClass, options) {
    this.app = pomelo.createApp();
    this.gameServerClass = gameServerClass;
    this.options = options || {};

    this.app.set('name', name);

    this.configure();
  },
  start: function () {
    app.start();
  },
  configure: function () {
    this.setupConnector();
    this.setupGate();
    this.setupReckoner();
    this.setupAll();
  },
  setupConnector: function () {
    this.app.configure('production|development|staging', 'connector', this.setupConnectorHandler.bind(this));
  },
  setupConnectorHandler: function () {
    this.app.set('connectorConfig', this.options.connector || {
      connector: pomelo.connectors.hybridconnector,
      heartbeat: 3,
      useDict: true,
      useProtobuf: true
    });
  },
  setupAll: function () {
    this.app.configure('production|development|staging', this.setupAllHandler.bind(this));
  },
  setupAllHandler: function () {
    if (this.options.pidFile)
      fs.appendFileSync(pidFile, process.pid.toString() + '\n');

    this.app.route(this.name, routeUtil[this.name]);
    this.app.filter(pomelo.timeout());
  },
  setupGate: function () {
    this.app.configure('production|development|staging', 'gate', this.setupGateHandler.bind(this));
  },
  setupGateHandler: function () {
    this.app.set('connectorConfig', this.options.gate || {
      connector: pomelo.connectors.hybridconnector,
      useProtobuf: true
    });
  },
  setupReckoner: function () {
    this.app.configure('production|development|staging', this.name, this.setupReckonerHandler.bind(this));
  },
  setupReckonerHandler: function () {
    this.app.set(name + 'Service', new this.gameServerClass(this.app));
  }
});