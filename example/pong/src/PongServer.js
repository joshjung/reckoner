var Reckoner = require('../../../index');

var PongServer = Reckoner.Server._extend({
  init: function init() {
    init._super.call(this);
  }
});

module.exports = PongServer;