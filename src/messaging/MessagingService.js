var JClass = require('jclass');

/*===================================================*\
 * MessagingService()
\*===================================================*/
var MessagingService = JClass._extend({
  init: function (app) {
    this.app = app;
  },
  send: function(from, message, type) {
    var channel = this.app.get('channelService').getChannel(this.rid, false);

    if (channel)
      channel.pushMessage('message', {
        message: message,
        from: from,
        type: type,
        time: (new Date).getTime()
      });
  }
});

/*===================================================*\
 * Export
\*===================================================*/
module.exports = MessagingService;