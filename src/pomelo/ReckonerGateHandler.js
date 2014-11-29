var JClass = require('jclass');

var ReckonerGateHandler = JClass._extend({
  init: function (app) {
    this.app = app;
  },
  requestConnectorForClient: function(msg, session, next) {
    var clientId = msg.clientId;
    if(!clientId) {
      next(null, {
        code: 500,
        reason: 'no clientId provided'
      });
      return;
    }

    // get all connectors
    var connectors = this.app.getServersByType('connector');
    if(!connectors || connectors.length === 0) {
      next(null, {
        code: 500,
        reason: 'no connectors found'
      });
      return;
    }

    // select connector for provided client.
    var connector = findFor(clientId, connectors);
    next(null, {
      code: 200,
      host: connector.host,
      port: connector.clientPort
    });
  }
});

function findFor(uid, connectors) {
  return connectors[Math.abs(crc.crc32(uid)) % connectors.length];
};

module.exports = function(app) {
  return new ReckonerGateHandler(app);
};