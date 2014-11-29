var JClass = require('jclass');

/*===================================================*\
 * EntryHandler()
\*===================================================*/
var ReckonerEntryHandler = JClass._extend({
  init: function (app) {
    this.app = app;
  },
  enter: function(msg, session, next) {
    var self = this,
      rid = msg.rid,
      uid = msg.username + '*' + rid,
      sessionService = this.app.get('sessionService');

    //duplicate log in
    if (sessionService.getByUid(uid))
      return next(null, {
        code: 500,
        error: true,
        errorText: 'Username already exists:' + msg.username + ' for this channel ' + rid
      });

    session.bind(uid);

    session.set('rid', rid);

    session.push('rid', function(err) {if (err) console.error('Set rid for session service failed! error is : %j', err.stack);});
    
    session.on('closed', this.session_closedHandler.bind(this));

    this.app.rpc.skyduel.skyduelRemote.add(session, uid, self.app.get('serverId'), rid, true, this.reckonerRemote_addCallback.bind(this, next));
  },
  session_closedHandler: function (app, session) {
    if (!session || !session.uid)
      return;

    app.rpc.skyduel.skyduelRemote.kick(session, session.uid, app.get('serverId'), session.get('rid'), null);
  },
  reckonerRemote_addCallback: function (next, users) {
    next(null, {
      users: users
    });
  }
});

/*===================================================*\
 * Module Exports
\*===================================================*/
module.exports = function(app) {
  return new ReckonerEntryHandler(app);
};