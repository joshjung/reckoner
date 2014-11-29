var JClass = require('jclass');

/*===================================================*\
 * ReckonerRemote()
\*===================================================*/
var ReckonerRemote = JClass._extend({
  init: function (app) {
    this.app = app;

    this.channelService = app.get('channelService');
    this.service = app.get('reckonerService');
  },
  add: function(uid, sid, name, flag, callback) {
    var channel = this.channelService.getChannel(name, flag),
      username = uid.split('*')[0],
      param = {
        route: 'onAdd',
        user: username
      };

    channel.pushMessage(param);

    if (!!channel) {
      channel.add(uid, sid);
    }

    callback(this.getUserList(name, flag));
  },
  getUserList: function(name, flag) {
    var channel = this.channelService.getChannel(name, flag),
      users = !!channel ? channel.getMembers() : [];

    return users.map(function (user) {
      return user.split('*')[0];
    });
  },
  kick: function(uid, sid, name, callback) {
    var username = uid.split('*')[0],
      param = {
        route: 'onLeave',
        user: username
      },
      channel = this.channelService.getChannel(name, false);

    if (!!channel)
      channel.leave(uid, sid);

    channel.pushMessage(param);

    this.service.session_disconnectedHandler(uid);

    callback();
  }
});

/*===================================================*\
 * Exports
\*===================================================*/
exports = module.exports = function(app) {
  return new ReckonerRemote(app);
};