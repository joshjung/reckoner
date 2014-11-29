var Reckoner = require('reckoner');

var PongClient = Reckoner.Client._extend({
  init: function init() {
    init._super.call(this);
  }
});

module.exports = PongClient;