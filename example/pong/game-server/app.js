var path = require('path'),
  Reckoner = require('../../../index'),
  PongServer = require('../src/PongServer');

new Reckoner.PomeloApp('pong', PongServer, {
  pidFile: path.resolve(__dirname, '../pid')
});