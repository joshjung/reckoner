var JClass = require('jclass'),
  Protocol = require('./ClientProtocol');

var socket = null,
  id = 1,
  callbacks = {};

var Pomelo = JClass.extend({
  init: function (host, port, callback){
    this.url = 'ws://' + host + (port ? ':' + port : '');

    socket = io.connect(this.url, {
      'force new connection': true,
      reconnect: false
    });

    socket.on('connect', function(){
      console.log('[Pomeloclient.init] websocket connected!');
      if (callback)
        callback(socket);
    });

    socket.on('reconnect', function() {
      console.log('Pomelo reconnect');
    });

    socket.on('message', function (data){
      if(typeof data === 'string')
        data = JSON.parse(data);

      if(data instanceof Array) {
        this.processMessageBatch(data);
      } else {
        this.processMessage(data);
      }
    });

    socket.on('error', function(err) {
      console.log(err);
    });

    socket.on('disconnect', function(reason) {
      this.emit('disconnect', reason);
    });
  },
  disconnect: function() {
    if(socket) {
      socket.disconnect();
      socket = null;
    }
  },
  request: function(route) {
    if(!route) return;

    var msg = {},
      callback;

    arguments = Array.prototype.slice.apply(arguments);

    if(arguments.length === 2) {
      if (typeof arguments[1] === 'function') callback = arguments[1];
      else if(typeof arguments[1] === 'object') msg = arguments[1];
    }
    else if(arguments.length === 3) {
      msg = arguments[1];
      callback = arguments[2];
    }

    msg = this.prepareMessage(msg, route);

    id++;

    callbacks[id] = callback;

    socket.send(Protocol.encode(id,route,msg));
  },
  notify: function(route,msg) {
    this.request(route, msg);
  },
  processMessageBatch: function(msgs) {
    msgs.forEach(this.processMessage.bind(this));
  },
  processMessage: function(msg) {
    var route;

    if(msg.id) {
      var callback = callbacks[msg.id];
      
      delete callbacks[msg.id];

      if(typeof callback !== 'function') {
        console.log('[Pomeloclient.processMessage] callback is not a function for request ' + msg.id);
        return;
      }

      callback(msg.body);

      return;
    }

    this.processCall(msg);
  },
  processCall: function(msg) {
    var route = msg.route;

    if(!!route) {
      if (!!msg.body) {
        var body = msg.body.body;
        if (!body) body = msg.body;
        this.emit(route, body);
      } else {
        this.emit(route, msg);
      }
    } else this.emit(msg.body.route, msg.body);
  },
  prepareMessage: function(msg, route){
    if(route.indexOf('area.') === 0) msg.areaId = this.areaId;

    msg.timestamp = Date.now();

    return msg;
  }
});

