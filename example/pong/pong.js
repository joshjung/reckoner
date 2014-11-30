var Reckoner = require('../../index'),
    PongServer = require('./src/PongServer'),
    fs = require('fs'),
    config = require('./reckoner.json'),
    path = require('path')

var PongApp = Reckoner.PomeloApp._extend({
  init: function init () {
    init._super.call(this, 'pong', PongServer, {
      master: config.master,
      servers: config.servers,
      verbose: true,
      logLineNumbers: true,
      pidFile: 'pid',
      logConfigFile: path.resolve(__dirname, 'config/log.json')
    });
    console.log('Pong started!');
    this.start();
  }
});

new PongApp();