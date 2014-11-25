/*===================================================*\
 * Globals
\*===================================================*/
var HashArray = require('hasharray');

/*===================================================*\
 * FeatureManager()
\*===================================================*/
var FeatureManager = function(gameObject) {
  this.gameObject = gameObject;
  this.features = new HashArray(['name']);
};

/*===================================================*\
 * Prototype
\*===================================================*/
FeatureManager.prototype = {
  /*=========================*\
   * Variables
  \*=========================*/
  cache: {},
  /*=========================*\
   * Methods
  \*=========================*/
  add: function (feature) {
    this.features.add(feature);
  },
  update: function (elapsed) {
    var self = this;
    this.cache = {};

    this.features.all.forEach(function (feature) {
      feature.applyUpdate(self.gameObject, elapsed, self.cache);
    });
  }
};

/*===================================================*\
 * Export (nodejs and browser agent)
\*===================================================*/
module.exports = FeatureManager;