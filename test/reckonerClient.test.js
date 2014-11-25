var assert = require('assert'),
  ReckonerClient = require('../src/ReckonerClient'),
  Reckoner = require('../index');

describe('ReckonerClient', function() {
  describe('new PRT.Client()', function() {
    var Client = undefined;

    it('should not fail', function() {
      Client = new ReckonerClient('test', 1234);
    });
  });
});