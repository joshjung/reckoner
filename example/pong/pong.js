var Reckoner = require('reckoner'),
    PongServer = require('./src/PongServer');

var pong = new Reckoner.PomeloApp('pong', PongServer, {});