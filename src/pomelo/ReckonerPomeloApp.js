var JClass = require('jclass'),
    pomelo = require('pomelo');

global.isClient = false;

var ReckonerPomeloApp = JClass._extend({
  init: function (name, gameServerClass, options) {
    if (options.verbose)
      console.log('Creating Pomelo Application with options', options);

    this.options = options || {};
    this.name = name;

    if (this.options.logLineNumbers)
      process.env.LOGGER_LINE = true;

    this.app = pomelo.createApp(this.options);
    this.gameServerClass = gameServerClass;

    this.app.set('name', name);

    this.configure();

    process.on('uncaughtException', this.uncaughtExceptionHandler.bind(this));
  },
  start: function () {
    console.log('Reckoner starting Pomelo app: ', this.name);
    this.app.start();
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

    this.app.route(this.name, this.routeHandler.bind(this));
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
    this.app.set(this.name + 'Service', new this.gameServerClass(this.app));
  },
  routeHandler: function(session, msg, app, cb) {
    var servers = app.getServersByType(this.name);

    if (!servers || servers.length === 0) {
      cb(new Error('Can not find any \'' + this.name + '\' servers.'));
      return;
    }

    var connector = connectorFinder.uidToConnector(session.get('rid'), servers);

    cb(null, connector.id);
  },
  uncaughtExceptionHandler: function (err) {
    console.error(this.name + ' Caught exception: ', err);
  }
});

function uidToConnector(uid, connectors) {
  return connectors[Math.abs(crc.crc32(uid)) % connectors.length];
}

module.exports = ReckonerPomeloApp;