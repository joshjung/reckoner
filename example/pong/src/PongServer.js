var Reckoner = require('../../../index');

var PongServer = Reckoner.Server._extend({
  init: function init() {
    init._super.call(this);
  },
  start: function () {
    console.log('Starting server.');
  }
});

module.exports = PongServer;