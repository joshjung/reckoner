var assert = require('assert'),
  Reckoner = require('../index');

describe('ReckonerServer', function() {
  describe('new Reckoner.Server()', function() {
    var Server = undefined;

    it('should not fail', function() {
      Server = new Reckoner.Server();
    });
  });
});