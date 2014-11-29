(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
module.exports=require(1)
},{"/Users/jjung/dev/node/pomelo/reckoner/example/pong/node_modules/grunt-browserify/node_modules/browserify/lib/_empty.js":1}],3:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],4:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],5:[function(require,module,exports){
exports.endianness = function () { return 'LE' };

exports.hostname = function () {
    if (typeof location !== 'undefined') {
        return location.hostname
    }
    else return '';
};

exports.loadavg = function () { return [] };

exports.uptime = function () { return 0 };

exports.freemem = function () {
    return Number.MAX_VALUE;
};

exports.totalmem = function () {
    return Number.MAX_VALUE;
};

exports.cpus = function () { return [] };

exports.type = function () { return 'Browser' };

exports.release = function () {
    if (typeof navigator !== 'undefined') {
        return navigator.appVersion;
    }
    return '';
};

exports.networkInterfaces
= exports.getNetworkInterfaces
= function () { return {} };

exports.arch = function () { return 'javascript' };

exports.platform = function () { return 'browser' };

exports.tmpdir = exports.tmpDir = function () {
    return '/tmp';
};

exports.EOL = '\n';

},{}],6:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":7}],7:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],8:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],9:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":8,"_process":7,"inherits":4}],10:[function(require,module,exports){
module.exports = {
  Server: require('./src/ReckonerServer'),
  GameObject: require('./src/game/GameObject'),
  PomeloApp: require('./src/pomelo/ReckonerPomeloApp'),
  EntryHandler: require('./src/pomelo/ReckonerEntryHandler'),
  RemoteHandler: require('./src/pomelo/ReckonerRemoteHandler'),
  GateHandler: require('./src/pomelo/ReckonerGateHandler')
};
},{"./src/ReckonerServer":40,"./src/game/GameObject":41,"./src/pomelo/ReckonerEntryHandler":43,"./src/pomelo/ReckonerGateHandler":44,"./src/pomelo/ReckonerPomeloApp":45,"./src/pomelo/ReckonerRemoteHandler":46}],11:[function(require,module,exports){
module.exports = require('./src/HashArray.js');
},{"./src/HashArray.js":12}],12:[function(require,module,exports){
/*===========================================================================*\
 * Requires
\*===========================================================================*/
var JClass = require('jclass');

/*===========================================================================*\
 * HashArray
\*===========================================================================*/
var HashArray = JClass._extend({
  //-----------------------------------
  // Constructor
  //-----------------------------------
  init: function(keyFields, callback, options) {
    keyFields = keyFields instanceof Array ? keyFields : [keyFields];

    this._map = {};
    this._list = [];
    this.callback = callback;

    this.keyFields = keyFields;

    this.isHashArray = true;
    
    this.options = options || {
      ignoreDuplicates: false
    };

    if (callback) {
      callback('construct');
    }
  },
  //-----------------------------------
  // add()
  //-----------------------------------
  addOne: function (obj) {
    var needsDupCheck = false;
    for (var key in this.keyFields) {
      key = this.keyFields[key];
      var inst = this.objectAt(obj, key);
      if (inst) {
        if (this._map[inst]) {
          if (this.options.ignoreDuplicates)
            return;
          if (this._map[inst].indexOf(obj) != -1) {
            // Cannot add the same item twice
            needsDupCheck = true;
            continue;
          }
          this._map[inst].push(obj);
        }
        else this._map[inst] = [obj];
      }
    }

    if (!needsDupCheck || this._list.indexOf(obj) == -1)
      this._list.push(obj);
  },
  add: function() {
    for (var i = 0; i < arguments.length; i++) {
      this.addOne(arguments[i]);
    }

    if (this.callback) {
      this.callback('add', Array.prototype.slice.call(arguments, 0));
    }
    
    return this;
  },
  addAll: function (arr) {
    if (arr.length < 100)
      this.add.apply(this, arr);
    else {
      for (var i = 0; i < arr.length; i++)
        this.add(arr[i]);
    }
    
    return this;
  },
  addMap: function(key, obj) {
    this._map[key] = obj;
    if (this.callback) {
      this.callback('addMap', {
        key: key,
        obj: obj
      });
    }
    
    return this;
  },
  //-----------------------------------
  // Intersection, union, etc.
  //-----------------------------------
  /**
   * Returns a new HashArray that contains the intersection between this (A) and the hasharray passed in (B). Returns A ^ B.
   */
  intersection: function (other) {
    var self = this;

    if (!other || !other.isHashArray)
      throw Error('Cannot HashArray.intersection() on a non-hasharray object. You passed in: ', other);

    var ret = this.clone(null, true),
      allItems = this.clone(null, true).addAll(this.all.concat(other.all));

    allItems.all.forEach(function (item) {
      if (self.collides(item) && other.collides(item))
        ret.add(item);
    });

    return ret;
  },
  /**
   * Returns a new HashArray that contains the complement (difference) between this hash array (A) and the hasharray passed in (B). Returns A - B.
   */
  complement: function (other) {
    var self = this;

    if (!other || !other.isHashArray)
      throw Error('Cannot HashArray.complement() on a non-hasharray object. You passed in: ', other);

    var ret = this.clone(null, true);

    this.all.forEach(function (item) {
      if (!other.collides(item))
        ret.add(item);
    });

    return ret;
  },
  //-----------------------------------
  // Retrieval
  //-----------------------------------
  get: function(key) {
    return (!(this._map[key] instanceof Array) || this._map[key].length != 1) ? this._map[key] : this._map[key][0];
  },
  getAll: function(keys) {
    keys = keys instanceof Array ? keys : [keys];

    if (keys[0] == '*')
      return this.all;

    var res = new HashArray(this.keyFields);
    for (var key in keys)
      res.add.apply(res, this.getAsArray(keys[key]));

    return res.all;
  },
  getAsArray: function(key) {
    return this._map[key] || [];
  },
  getUniqueRandomIntegers: function (count, min, max) {
    var res = [], map = {};

    count = Math.min(Math.max(max - min, 1), count);
    
    while (res.length < count)
    {
      var r = Math.floor(min + (Math.random() * (max + 1)));
      if (map[r]) continue;
      map[r] = true;
      res.push(r);
    }

    return res;
  },
  sample: function (count, keys) {
    // http://en.wikipedia.org/wiki/Image_(mathematics)
    var image = this.all,
      ixs = {},
      res = [];

    if (keys)
      image = this.getAll(keys);

    var rand = this.getUniqueRandomIntegers(count, 0, image.length - 1);

    for (var i = 0; i < rand.length; i++)
      res.push(image[rand[i]]);

    return res;
  },
  //-----------------------------------
  // Peeking
  //-----------------------------------
  has: function(key) {
    return this._map.hasOwnProperty(key);
  },
  collides: function (item) {
    for (var k in this.keyFields)
      if (this.has(this.objectAt(item, this.keyFields[k])))
        return true;
    
    return false;
  },
  hasMultiple: function(key) {
    return this._map[key] instanceof Array;
  },
  //-----------------------------------
  // Removal
  //-----------------------------------
  removeByKey: function() {
    var removed = [];
    for (var i = 0; i < arguments.length; i++) {
      var key = arguments[i];
      var items = this._map[key].concat();
      if (items) {
        removed = removed.concat(items);
        for (var j in items) {
          var item = items[j];
          for (var ix in this.keyFields) {
            var key2 = this.objectAt(item, this.keyFields[ix]);
            if (key2 && this._map[key2]) {
              var ix = this._map[key2].indexOf(item);
              if (ix != -1) {
                this._map[key2].splice(ix, 1);
              }

              if (this._map[key2].length == 0)
                delete this._map[key2];
            }
          }

          this._list.splice(this._list.indexOf(item), 1);
        }
      }
      delete this._map[key];
    }

    if (this.callback) {
      this.callback('removeByKey', removed);
    }
    
    return this;
  },
  remove: function() {
    for (var i = 0; i < arguments.length; i++) {
      var item = arguments[i];
      for (var ix in this.keyFields) {
        var key = this.objectAt(item, this.keyFields[ix]);
        if (key) {
          var ix = this._map[key].indexOf(item);
          if (ix != -1)
            this._map[key].splice(ix, 1);

          if (this._map[key].length == 0)
            delete this._map[key];
        }
      }

      this._list.splice(this._list.indexOf(item), 1);
    }

    if (this.callback) {
      this.callback('remove', arguments);
    }
    
    return this;
  },
  removeAll: function() {
    var old = this._list.concat();
    this._map = {};
    this._list = [];

    if (this.callback) {
      this.callback('remove', old);
    }
    
    return this;
  },
  //-----------------------------------
  // Utility
  //-----------------------------------
  objectAt: function(obj, path) {
    if (typeof path === 'string') {
      return obj[path];
    }

    var dup = path.concat();
    // else assume array.
    while (dup.length && obj) {
      obj = obj[dup.shift()];
    }

    return obj;
  },
  //-----------------------------------
  // Iteration
  //-----------------------------------
  forEach: function(keys, callback) {
    keys = keys instanceof Array ? keys : [keys];

    var objs = this.getAll(keys);

    objs.forEach(callback);
    
    return this;
  },
  forEachDeep: function(keys, key, callback) {
    keys = keys instanceof Array ? keys : [keys];

    var self = this,
      objs = this.getAll(keys);

    objs.forEach(function (item) {
      callback(self.objectAt(item, key), item);
    });
    
    return this;
  },
  //-----------------------------------
  // Cloning
  //-----------------------------------
  clone: function(callback, ignoreItems) {
    var n = new HashArray(this.keyFields.concat(), callback ? callback : this.callback);
    if (!ignoreItems)
      n.add.apply(n, this.all.concat());
    return n;
  },
  //-----------------------------------
  // Mathematical
  //-----------------------------------
  sum: function(keys, key, weightKey) {
    var self = this,
      ret = 0;
    this.forEachDeep(keys, key, function (value, item) {
      if (weightKey !== undefined)
        value *= self.objectAt(item, weightKey);

      ret += value;
    });
    return ret;
  },
  average: function(keys, key, weightKey) {
    var ret = 0,
      tot = 0,
      weightsTotal = 0,
      self = this;

    if (weightKey !== undefined)
      this.forEachDeep(keys, weightKey, function (value) {
        weightsTotal += value;
      })

    this.forEachDeep(keys, key, function (value, item) {
      if (weightKey !== undefined)
        value *= (self.objectAt(item, weightKey) / weightsTotal);

      ret += value;
      tot++;
    });

    return weightKey !== undefined ? ret : ret / tot;
  },
  //-----------------------------------
  // Filtering
  //-----------------------------------
  filter: function (keys, callbackOrKey) {
    var self = this;
    
    var callback = (typeof(callbackOrKey) == 'function') ? callbackOrKey : defaultCallback;

    var ha = new HashArray(this.keyFields);
    ha.addAll(this.getAll(keys).filter(callback));
    return ha;
    
    function defaultCallback(item) {
      var val = self.objectAt(item, callbackOrKey);
      return val !== undefined && val !== false;
    }
  }
});

//-----------------------------------
// Operators
//-----------------------------------
Object.defineProperty(HashArray.prototype, 'all', {
  get: function () {
    return this._list;
  }
});

Object.defineProperty(HashArray.prototype, 'map', {
  get: function () {
    return this._map;
  }
});

module.exports = HashArray;

//-----------------------------------
// Browser
//-----------------------------------
if (typeof window !== 'undefined')
  window.HashArray = HashArray;
},{"jclass":13}],13:[function(require,module,exports){
/*!
 * jclass v1.1.3
 * https://github.com/riga/jclass
 *
 * Marcel Rieger, 2014
 * MIT licensed, http://www.opensource.org/licenses/mit-license
 */

(function(factory) {
  if (typeof define === "function" && define.amd) {
    // AMD
    define([], factory);
  } else if (typeof exports === "object") {
    // CommonJS
    exports = factory();
    if (typeof module === "object") {
      // nodejs
      module.exports = exports;
    }
  } else if (window) {
    // Browser
    window.Class = factory();
  } else if (typeof console === "object" && console.error instanceof Function) {
    // error case
    console.error("cannot determine environment");
  }

})(function() {

  // helpers
  var isFn = function(obj) {
    return obj instanceof Function;
  };
  var isUndef = function(obj) {
    return obj === undefined;
  };
  var isObj = function(obj) {
    return typeof obj === "object";
  };
  var isDescr = function(obj) {
    return isObj(obj) && obj.descriptor === true;
  };
  var extend = function(target) {
    var objs = Array.prototype.slice.call(arguments, 1);
    var i, obj, key, originalValue;
    for (i in objs) {
      obj = objs[i];
      if (!isObj(obj)) return;
      for (key in obj) {
        originalValue = target[key];
        if (isUndef(originalValue)) target[key] = obj[key];
      }
    }
    return target;
  };

  // default options
  var defaultOptions = {
    _isClassObject: false
  };

  // flag to distinguish between prototype and class instantiation 
  var initializing = false;

  // empty BaseClass implementation
  var BaseClass = function(){};

  // add the _subClasses entry
  BaseClass._subClasses = [];

  // extend mechanism
  BaseClass._extend = function(instanceMembers, classMembers, options) {

    // default arguments
    if (isUndef(instanceMembers)) instanceMembers = {};
    if (isUndef(classMembers))    classMembers    = {};
    if (isUndef(options))         options         = {};

    // mixin default options
    extend(options, defaultOptions);

    // alias for readability
    var SuperClass = this;

    // sub class dummy constructor
    var Class = function() {
      // nothing happens here when we are initializing
      if (initializing) return;

      // store a reference to the class itself
      this._class = Class;

      // all construction is actually done in the init method
      if (this.init) this.init.apply(this, arguments);
    };

    // create an instance of the super class via new
    // the flag sandwich prevents a call to the init method
    initializing = true;
    var prototype = new SuperClass();
    initializing = false;

    // get the prototype of the super class
    var superPrototype = SuperClass.prototype;

    // the instance of the super class is our new prototype
    Class.prototype = prototype;

    // enforce the constructor to be what we expect
    // this will invoke the init method (see above)
    Class.prototype.constructor = Class;

    // store a reference to the super class
    Class._superClass = SuperClass;

    // store references to all extending classes
    Class._subClasses = [];
    SuperClass._subClasses.push(Class);

    // make this class extendable
    Class._extend = SuperClass._extend;

    // propagate instance members directly to the created protoype
    // the member is either a normal member or a descriptor
    var key, member, superMember;
    for (key in instanceMembers) {
      member = instanceMembers[key];

      if (isDescr(member)) {
        // descriptor -> define the property
        Object.defineProperty(prototype, key, member);

      } else {
        // normal member -> simple assignment
        prototype[key] = member;

        // if both member and the super member are distinct functions
        // add the super member to the member as "_super"
        superMember = superPrototype[key];
        if (isFn(member) && isFn(superMember) && member !== superMember) {
          member._super = superMember;
        }
      }
    }

    // propagate class members to the _members instance
    if (!options._isClassObject) {
      // find the super class of the _members instance 
      var ClassMembersSuperClass = isUndef(SuperClass._members) ?
        BaseClass : SuperClass._members._class;

      // create the actual class of the _members instance
      var opts = { _isClassObject: true };
      var ClassMembersClass = ClassMembersSuperClass._extend(classMembers, {}, opts);

      // create the instance
      Class._members = new ClassMembersClass();
    }

    // _extends returns true if the class itself extended "target"
    // in any hierarchy, e.g. every class inherits "Class" itself
    Class._extends = function(target) {
      if (this._superClass == BaseClass) return false;
      if (target == this._superClass || target == BaseClass) return true;
      return this._superClass._extends(target);
    };

    return Class;
  };


  // converts arbitrary protoype-style classes to our Class definition
  BaseClass._convert = function(cls, options) {

    // the properties consist of the class' prototype
    var instanceMembers = cls.prototype;

    // add the constructor function
    instanceMembers.init = function() {
      var self = this;

      // simply create an instance of our target class
      this._origin = BaseClass._construct(cls, arguments);

      // add properties for each own property in _origin
      Object.keys(this._origin).forEach(function(key) {
        if (!self._origin.hasOwnProperty(key)) {
          return;
        }
        Object.defineProperty(self, key, {
          get: function() {
            return self._origin[key];
          }
        });
      });
    };

    // finally, create and return our new class
    return BaseClass._extend(instanceMembers, {}, options);
  };


  // returns an instance of a class with a list of arguments
  // that are passed to the constructor 
  // this provides an apply-like constructor usage
  BaseClass._construct = function(cls, args) {
    var Class = function() {
      return cls.apply(this, args || []);
    };

    Class.prototype = cls.prototype;

    return new Class();
  };

  return BaseClass;
});

},{}],14:[function(require,module,exports){
/*!
 * @name JavaScript/NodeJS Merge v1.2.0
 * @author yeikos
 * @repository https://github.com/yeikos/js.merge

 * Copyright 2014 yeikos - MIT license
 * https://raw.github.com/yeikos/js.merge/master/LICENSE
 */

;(function(isNode) {

	/**
	 * Merge one or more objects 
	 * @param bool? clone
	 * @param mixed,... arguments
	 * @return object
	 */

	var Public = function(clone) {

		return merge(clone === true, false, arguments);

	}, publicName = 'merge';

	/**
	 * Merge two or more objects recursively 
	 * @param bool? clone
	 * @param mixed,... arguments
	 * @return object
	 */

	Public.recursive = function(clone) {

		return merge(clone === true, true, arguments);

	};

	/**
	 * Clone the input removing any reference
	 * @param mixed input
	 * @return mixed
	 */

	Public.clone = function(input) {

		var output = input,
			type = typeOf(input),
			index, size;

		if (type === 'array') {

			output = [];
			size = input.length;

			for (index=0;index<size;++index)

				output[index] = Public.clone(input[index]);

		} else if (type === 'object') {

			output = {};

			for (index in input)

				output[index] = Public.clone(input[index]);

		}

		return output;

	};

	/**
	 * Merge two objects recursively
	 * @param mixed input
	 * @param mixed extend
	 * @return mixed
	 */

	function merge_recursive(base, extend) {

		if (typeOf(base) !== 'object')

			return extend;

		for (var key in extend) {

			if (typeOf(base[key]) === 'object' && typeOf(extend[key]) === 'object') {

				base[key] = merge_recursive(base[key], extend[key]);

			} else {

				base[key] = extend[key];

			}

		}

		return base;

	}

	/**
	 * Merge two or more objects
	 * @param bool clone
	 * @param bool recursive
	 * @param array argv
	 * @return object
	 */

	function merge(clone, recursive, argv) {

		var result = argv[0],
			size = argv.length;

		if (clone || typeOf(result) !== 'object')

			result = {};

		for (var index=0;index<size;++index) {

			var item = argv[index],

				type = typeOf(item);

			if (type !== 'object') continue;

			for (var key in item) {

				var sitem = clone ? Public.clone(item[key]) : item[key];

				if (recursive) {

					result[key] = merge_recursive(result[key], sitem);

				} else {

					result[key] = sitem;

				}

			}

		}

		return result;

	}

	/**
	 * Get type of variable
	 * @param mixed input
	 * @return string
	 *
	 * @see http://jsperf.com/typeofvar
	 */

	function typeOf(input) {

		return ({}).toString.call(input).slice(8, -1).toLowerCase();

	}

	if (isNode) {

		module.exports = Public;

	} else {

		window[publicName] = Public;

	}

})(typeof module === 'object' && module && typeof module.exports === 'object' && module.exports);
},{}],15:[function(require,module,exports){
/**
 * Utility functions
 */

var util = {};

util.isObject = function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

util.isNumber = function isNumber(arg) {
  return typeof arg === 'number';
}

util.isUndefined = function isUndefined(arg) {
  return arg === void 0;
}

util.isFunction = function isFunction(arg){
  return typeof arg === 'function';
}


/**
 * EventEmitter class
 */

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

EventEmitter.init = function() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!util.isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error' && !this._events.error) {
    er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      throw Error('Uncaught, unspecified "error" event.');
    }
    return false;
  }

  handler = this._events[type];

  if (util.isUndefined(handler))
    return false;

  if (util.isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (util.isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!util.isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              util.isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (util.isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (util.isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!util.isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;

      if (util.isFunction(console.error)) {
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
      }
      if (util.isFunction(console.trace))
        console.trace();
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!util.isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!util.isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (util.isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (util.isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (util.isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (Array.isArray(listeners)) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (util.isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (util.isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

},{}],16:[function(require,module,exports){
module.exports = require('./lib/pomelo');
},{"./lib/pomelo":20}],17:[function(require,module,exports){
(function (process,__filename){
/*!
 * Pomelo -- proto
 * Copyright(c) 2012 xiechengchao <xiecc@163.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
var utils = require('./util/utils');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var EventEmitter = require('events').EventEmitter;
var events = require('./util/events');
var appUtil = require('./util/appUtil');
var Constants = require('./util/constants');
var appManager = require('./common/manager/appManager');
var fs = require('fs');
var path = require('path');

/**
 * Application prototype.
 *
 * @module
 */
var Application = module.exports = {};

/**
 * Application states
 */
var STATE_INITED  = 1;  // app has inited
var STATE_START = 2;  // app start
var STATE_STARTED = 3;  // app has started
var STATE_STOPPED  = 4;  // app has stoped

/**
 * Initialize the server to default configuration.
 *
 * opts.base: directory root (optional)
 */
Application.init = function(opts) {
  opts = opts || {};

  this.options = opts;

  this.loaded = [];           // loaded component list
  this.components = {};       // name -> component map
  this.settings = {};         // collection keep set/get

  var base = opts.base || path.dirname(require.main.filename);
  this.set(Constants.RESERVED.BASE, base, true);
  this.event = new EventEmitter();  // event object to sub/pub events

  // current server info
  this.serverId = null;       // current server id
  this.serverType = null;     // current server type
  this.curServer = null;      // current server info
  this.startTime = null;      // current server start time

  // global server infos
  this.master = null;         // master server info
  this.servers = {};          // current global server info maps, id -> info
  this.serverTypeMaps = {};   // current global type maps, type -> [info]
  this.serverTypes = [];      // current global server type list
  this.lifecycleCbs = {};     // current server custom lifecycle callbacks
  this.clusterSeq = {};       // cluster id seqence

  appUtil.defaultConfiguration(this);

  this.state = STATE_INITED;  // Set default state to initialized

  logger.info('Application initialized. Server ID: %j', this.getServerId());
};

/**
 * Get application base path
 *
 *  // cwd: /home/game/
 *  pomelo start
 *  // app.getBase() -> /home/game
 *
 * @return {String} application base path
 *
 * @memberOf Application
 */
Application.getBase = function() {
  return this.get(Constants.RESERVED.BASE);
};

/**
 * Override require method in application
 *
 * @param {String} relative path of file
 *
 * @memberOf Application
 */
Application.require = function(ph) {
  return require(path.join(Application.getBase(), ph));
};

/**
 * Configure logger with {$base}/config/log4js.json
 * 
 * @param {Object} logger pomelo-logger instance without configuration
 *
 * @memberOf Application
 */
Application.configureLogger = function(logger) {
  if (process.env.POMELO_LOGGER !== 'off') {
    var base = this.getBase();
    var env = this.get(Constants.RESERVED.ENV);
    var originPath = path.join(base, Constants.FILEPATH.LOG);
    var presentPath = path.join(base, Constants.FILEPATH.CONFIG_DIR, env, path.basename(Constants.FILEPATH.LOG));

    if(fs.existsSync(originPath)) {
      logger.configure(originPath, {serverId: this.serverId, base: base});
    } else if(fs.existsSync(presentPath)) {
      logger.configure(presentPath, {serverId: this.serverId, base: base});
    } else {
      logger.error('logger file path configuration is error.');
    }
  }
};

/**
 * add a filter to before and after filter
 *
 * @param {Object} filter provide before and after filter method.
 *                        A filter should have two methods: before and after.
 * @memberOf Application
 */
Application.filter = function (filter) {
  this.before(filter);
  this.after(filter);
};

/**
 * Add before filter.
 *
 * @param {Object|Function} bf before fileter, bf(msg, session, next)
 * @memberOf Application
 */
Application.before = function (bf) {
  addFilter(this, Constants.KEYWORDS.BEFORE_FILTER, bf);
};

/**
 * Add after filter.
 *
 * @param {Object|Function} af after filter, `af(err, msg, session, resp, next)`
 * @memberOf Application
 */
Application.after = function (af) {
  addFilter(this, Constants.KEYWORDS.AFTER_FILTER, af);
};

/**
 * add a global filter to before and after global filter
 *
 * @param {Object} filter provide before and after filter method.
 *                        A filter should have two methods: before and after.
 * @memberOf Application
 */
Application.globalFilter = function (filter) {
  this.globalBefore(filter);
  this.globalAfter(filter);
};

/**
 * Add global before filter.
 *
 * @param {Object|Function} bf before fileter, bf(msg, session, next)
 * @memberOf Application
 */
Application.globalBefore = function (bf) {
  addFilter(this, Constants.KEYWORDS.GLOBAL_BEFORE_FILTER, bf);
};

/**
 * Add global after filter.
 *
 * @param {Object|Function} af after filter, `af(err, msg, session, resp, next)`
 * @memberOf Application
 */
Application.globalAfter = function (af) {
  addFilter(this, Constants.KEYWORDS.GLOBAL_AFTER_FILTER, af);
};

/**
 * Add rpc before filter.
 *
 * @param {Object|Function} bf before fileter, bf(serverId, msg, opts, next)
 * @memberOf Application
 */
Application.rpcBefore = function(bf) {
  addFilter(this, Constants.KEYWORDS.RPC_BEFORE_FILTER, bf);
};

/**
 * Add rpc after filter.
 *
 * @param {Object|Function} af after filter, `af(serverId, msg, opts, next)`
 * @memberOf Application
 */
Application.rpcAfter = function(af) {
  addFilter(this, Constants.KEYWORDS.RPC_AFTER_FILTER, af);
};

/**
 * add a rpc filter to before and after rpc filter
 *
 * @param {Object} filter provide before and after filter method.
 *                        A filter should have two methods: before and after.
 * @memberOf Application
 */
Application.rpcFilter = function(filter) {
  this.rpcBefore(filter);
  this.rpcAfter(filter);
};

/**
 * Load a component
 *
 * @param  {String} name    (optional) Name of the component
 * @param  {Object} component Component instance or factory function of the component
 * @param  {[type]} opts    (optional) Arguments for the component factory function
 * @return {Object}     app instance for chain invoke
 * @memberOf Application
 */
Application.load = function(name, component, opts) {
  if(typeof name !== 'string') {
    opts = component;
    component = name;
    name = (typeof component.name == 'string') ? component.name : null;
  }

  if(typeof component === 'function') {
    component = component(this, opts);
  }

  if(!name && typeof component.name === 'string') {
    name = component.name;
  }

  if(name && this.components[name]) {
    // ignore duplicate component
    logger.warn('Application.load(): ignoring duplicate component: %j', name);
    return;
  }

  this.loaded.push(component);

  if(name) {
    // components with a name would get by name throught app.components later.
    this.components[name] = component;
  }

  return this;
};

/**
 * Load configuration json file to settings. (Supports different environment directory and compatible for old path)
 *
 * @param {String} key Environment key
 * @param {String} val Environment value
 * @return {Server|Mixed} for chaining, or the setting value
 * @memberOf Application
 */
Application.loadConfigBaseApp = function (key, val) {
  var env = this.get(Constants.RESERVED.ENV);
  var originPath = path.join(Application.getBase(), val);
  var presentPath = path.join(Application.getBase(), Constants.FILEPATH.CONFIG_DIR, env, path.basename(val));

  if(fs.existsSync(originPath)) {
     var file = require(originPath);
     if (file[env]) {
       file = file[env];
     }
     this.set(key, file);
  } else if (fs.existsSync(presentPath)) {
    var pfile = require(presentPath);
    this.set(key, pfile);
  } else {
    logger.error('invalid configuration with file path: %s', key);
  }
};

/**
 * Load Configure json file to settings.
 *
 * @param {String} key environment key
 * @param {String} val environment value
 * @return {Server|Mixed} for chaining, or the setting value
 * @memberOf Application
 */
Application.loadConfig = function(key, val) {
  val = require(val);
  val = val[this.get(Constants.RESERVED.ENV)] || val;

  this.set(key, val);
};

/**
 * Sets configuration directly to Javascript Object rather than loading from a file
 *
 * @param {String} key environment key
 * @param {String} val environment value
 * @return {Server|Mixed} for chaining, or the setting value
 * @memberOf Application
 */
Application.setConfig = function(key, val) {
  val = val[this.get(Constants.RESERVED.ENV)] || val;

  this.set(key, val);
};

/**
 * Set the route function for the specified server type.
 *
 * Examples:
 *
 *  app.route('area', routeFunc);
 *
 *  var routeFunc = function(session, msg, app, cb) {
 *    // all request to area would be routed to the first area server
 *    var areas = app.getServersByType('area');
 *    cb(null, areas[0].id);
 *  };
 *
 * @param  {String} serverType server type string
 * @param  {Function} routeFunc  route function. routeFunc(session, msg, app, cb)
 * @return {Object}     current application instance for chain invoking
 * @memberOf Application
 */
Application.route = function(serverType, routeFunc) {
  var routes = this.get(Constants.KEYWORDS.ROUTE);

  if (!routes) {
    routes = {};
    this.set(Constants.KEYWORDS.ROUTE, routes);
  }

  routes[serverType] = routeFunc;

  return this;
};

/**
 * Set before stop function. Called before servers stop.
 *
 * @param  {Function} fun before close function
 * @return {Void}
 * @memberOf Application
 */
Application.beforeStopHook = function(func) {
  logger.warn('this method was deprecated in pomelo 0.8');

  if(!!func && typeof func === 'function') {
    this.set(Constants.KEYWORDS.BEFORE_STOP_HOOK, func);
  }
};

/**
 * Starts the application. Loads and starts all default components.
 *
 * @param  {Function} cb callback function once startup has completed or if an error occurs
 * @memberOf Application
 */
 Application.start = function(cb) {
  this.startTime = Date.now();

  if(this.state > STATE_INITED) {
    utils.invokeCallback(cb, new Error('application has already start.'));
    return;
  }
  
  var self = this;

  appUtil.startByType(self, function() {
    appUtil.loadDefaultComponents(self);
    var startUp = function() {
      appUtil.optComponents(self.loaded, Constants.RESERVED.START, function(err) {
        self.state = STATE_START;
        if(err) {
          utils.invokeCallback(cb, err);
        } else {
          logger.info('%j enter after start...', self.getServerId());
          self.afterStart(cb);
        }
      });
    };

    var beforeStartupFunc = self.lifecycleCbs[Constants.LIFECYCLE.BEFORE_STARTUP];
    if(!!beforeStartupFunc) {
      beforeStartupFunc.call(null, self, startUp);
    } else {
      startUp();
    }
  });
};

/**
 * Lifecycle callback for after start.
 *
 * @param  {Function} cb callback function called once after start has occurred or if an error occurs.
 * @return {Void}
 */
Application.afterStart = function(cb) {
  if(this.state !== STATE_START) {
    utils.invokeCallback(cb, new Error('Application is not running now.'));
    return;
  }

  var afterFunc = this.lifecycleCbs[Constants.LIFECYCLE.AFTER_STARTUP];
  var self = this;
  appUtil.optComponents(this.loaded, Constants.RESERVED.AFTER_START, function(err) {
    self.state = STATE_STARTED;
    var id = self.getServerId();
    if(!err) {
      logger.info('%j finished start', id);
    }
    if(!!afterFunc) {
      afterFunc.call(null, self, function() {
        utils.invokeCallback(cb, err);
      });
    } else {
      utils.invokeCallback(cb, err);
    }
    var elapsed = Date.now() - self.startTime;
    logger.info('Application %j started in %s ms', id, elapsed);
    self.event.emit(events.START_SERVER, id);
  });
};

/**
 * Stop all components.
 *
 * @param  {Boolean} force Forces an immediate stop.
 */
Application.stop = function(force) {
  if(this.state > STATE_STARTED) {
    logger.warn('[pomelo application] application is not running now.');
    return;
  }

  this.state = STATE_STOPPED;

  var self = this;

  this.stopTimer = setTimeout(function() {
    process.exit(0);
  }, Constants.TIME.TIME_WAIT_STOP);

  var cancelShutDownTimer =function(){
      if(!!self.stopTimer) {
        clearTimeout(self.stopTimer);
      }
  };
  var shutDown = function() {
    appUtil.stopComps(self.loaded, 0, force, function() {
      cancelShutDownTimer();
      if(force) {
        process.exit(0);
      }
    });
  };

  var fun = this.get(Constants.KEYWORDS.BEFORE_STOP_HOOK);
  var stopFun = this.lifecycleCbs[Constants.LIFECYCLE.BEFORE_SHUTDOWN];
  if(!!stopFun) {
    stopFun.call(null, this, shutDown, cancelShutDownTimer);
  } else if(!!fun) {
    utils.invokeCallback(fun, self, shutDown, cancelShutDownTimer);
  } else {
    shutDown();
  }
};

/**
 * Assign `value` to `setting`, or return `setting`'s value.
 *
 * Example:
 *
 *  app.set('setting1', 'value1');
 *  app.get('setting1');  // 'value1'
 *  app.setting1;         // undefined
 *
 *  app.set('setting2', 'value2', true);
 *  app.get('setting2');  // 'value2'
 *  app.setting2;         // 'value2'
 *
 * @param {String} setting the setting of application
 * @param {String} val the setting's value
 * @param {Boolean} attach Attach the key as a property on application
 * @return {Server|Mixed} for chaining, or the setting value
 * @memberOf Application
 */
Application.set = function (setting, val, attach) {
  if (arguments.length === 1) {
    return this.settings[setting];
  }

  this.settings[setting] = val;

  if(attach) {
    this[setting] = val;
  }

  return this;
};

/**
 * Get property from setting
 *
 * @param {String} setting application setting
 * @return {String} val
 * @memberOf Application
 */
Application.get = function (setting) {
  return this.settings[setting];
};

/**
 * Check if `setting` is enabled.
 *
 * @param {String} setting application setting
 * @return {Boolean}
 * @memberOf Application
 */
Application.enabled = function (setting) {
  return !!this.get(setting);
};

/**
 * Check if `setting` is disabled.
 *
 * @param {String} setting application setting
 * @return {Boolean}
 * @memberOf Application
 */
Application.disabled = function (setting) {
  return !this.get(setting);
};

/**
 * Enable `setting`.
 *
 * @param {String} setting application setting
 * @return {app} for chaining
 * @memberOf Application
 */
Application.enable = function (setting) {
  return this.set(setting, true);
};

/**
 * Disable `setting`.
 *
 * @param {String} setting application setting
 * @return {app} for chaining
 * @memberOf Application
 */
Application.disable = function (setting) {
  return this.set(setting, false);
};

/**
 * Configure a callback for the specified env and server type.
 * When no env is specified that callback will
 * be invoked for all environments and when no type is specified
 * that callback will be invoked for all server types.
 *
 * Examples:
 *
 *  app.configure(function(){
 *    // executed for all envs and server types
 *  });
 *
 *  app.configure('development', function(){
 *    // executed development env
 *  });
 *
 *  app.configure('development', 'connector', function(){
 *    // executed for development env and connector server type
 *  });
 *
 * @param {String} env application environment
 * @param {Function} fn callback function
 * @param {String} serverType server type
 * @return {Application} for chaining
 * @memberOf Application
 */
Application.configure = function (env, serverType, fn) {
  var args = [].slice.call(arguments);

  fn = args.pop();
  env = serverType = Constants.RESERVED.ALL;

  if(args.length > 0) {
    env = args[0];
  }

  if(args.length > 1) {
    serverType = args[1];
  }

  if (env === Constants.RESERVED.ALL || contains(this.settings.env, env)) {
    if (serverType === Constants.RESERVED.ALL || contains(this.settings.serverType, serverType)) {
      fn.call(this);
    }
  }

  return this;
};

/**
 * Register admin modules. Admin modules is the extension point of the monitoring system.
 *
 * @param {String} module (optional) module id or provoided by module.moduleId
 * @param {Object} module module object or factory function for module
 * @param {Object} opts construct parameter for module
 * @memberOf Application
 */
Application.registerAdmin = function(moduleId, module, opts) {
  var modules = this.get(Constants.KEYWORDS.MODULE);
  if(!modules) {
    modules = {};
    this.set(Constants.KEYWORDS.MODULE, modules);
  }

  if(typeof moduleId !== 'string') {
    opts = module;
    module = moduleId;
    if(module) {
      moduleId = module.moduleId;
    }
  }

  if(!moduleId){
    return;
  }

  modules[moduleId] = {
    moduleId: moduleId,
    module: module,
    opts: opts
  };
};

/**
 * Use plugin.
 *
 * @param  {Object} plugin plugin instance
 * @param  {[type]} opts    (optional) construct parameters for the factory function
 * @memberOf Application
 */
Application.use = function(plugin, opts) {
  if(!plugin.components) {
    logger.error('Invalid plugin definition, no plugin.components object exists');
    return;
  }

  var self = this;
  opts = opts || {};
  var dir = path.dirname(plugin.components);

  if(!fs.existsSync(plugin.components)) {
    logger.error('Failed to find plugin.components in file path: %s', plugin.components);
    return;
  }

  // Read in each file in the components directory and process each as a separate
  // component for this plugin.
  fs.readdirSync(plugin.components).forEach(function (filename) {
    if (!/\.js$/.test(filename)) {
      return;
    }

    var name = path.basename(filename, '.js'),
      param = opts[name] || {},
      absolutePath = path.join(dir, Constants.DIR.COMPONENT, filename);

    if(!fs.existsSync(absolutePath)) {
      logger.error('Component %s does not exist at %s', name, absolutePath);
    } else {
      self.load(require(absolutePath), param);
    }
  });

  // load events (optional)
  if(!plugin.events) {
    return;
  } else {
    if(!fs.existsSync(plugin.events)) {
      logger.error('Failed to find plugin.events at path: %s', plugin.events);
      return;
    }

    fs.readdirSync(plugin.events).forEach(function (filename) {
      if (!/\.js$/.test(filename)) {
        return;
      }
      var absolutePath = path.join(dir, Constants.DIR.EVENT, filename);
      if(!fs.existsSync(absolutePath)) {
        logger.error('events %s not exist at %s', filename, absolutePath);
      } else {
        bindEvents(require(absolutePath), self);
      }
    });
  }
};

/**
 * Application transaction. Transactions include conditions and handlers: if conditions are satisfied, handlers will be executed.
 *
 * You can set retry times to execute handlers. The transaction log is in file logs/transaction.log.
 *
 * @param {String} name transaction name
 * @param {Object} conditions functions which are called before transaction
 * @param {Object} handlers functions which are called during transaction
 * @param {Number} retry retry times to execute handlers if conditions are successfully executed
 * @memberOf Application
 */
Application.transaction = function(name, conditions, handlers, retry) {
  appManager.transaction(name, conditions, handlers, retry);
};

/**
 * Get master server info.
 *
 * @return {Object} master server info, {id, host, port}
 * @memberOf Application
 */
Application.getMaster = function() {
  return this.master;
};

/**
 * Get current server info.
 *
 * @return {Object} current server info, {id, serverType, host, port}
 * @memberOf Application
 */
Application.getCurServer = function() {
  return this.curServer;
};

/**
 * Get current server id.
 *
 * @return {String|Number} current server id from servers.json
 * @memberOf Application
 */
Application.getServerId = function() {
  return this.serverId;
};

/**
 * Get current server type.
 *
 * @return {String|Number} current server type from servers.json
 * @memberOf Application
 */
Application.getServerType = function() {
  return this.serverType;
};

/**
 * Get all the current server infos.
 *
 * @return {Object} server info map, key: server id, value: server info
 * @memberOf Application
 */
Application.getServers = function() {
  return this.servers;
};

/**
 * Get all server infos from servers.json.
 *
 * @return {Object} server info map, key: server id, value: server info
 * @memberOf Application
 */
Application.getServersFromConfig = function() {
  return this.get(Constants.KEYWORDS.SERVER_MAP);
};

/**
 * Get all the server type.
 *
 * @return {Array} server type list
 * @memberOf Application
 */
Application.getServerTypes = function() {
  return this.serverTypes;
};

/**
 * Get server info by server id from current server cluster.
 *
 * @param  {String} serverId server id
 * @return {Object} server info or undefined
 * @memberOf Application
 */
Application.getServerById = function(serverId) {
  return this.servers[serverId];
};

/**
 * Get server info by server id from servers.json.
 *
 * @param  {String} serverId server id
 * @return {Object} server info or undefined
 * @memberOf Application
 */

Application.getServerFromConfig = function(serverId) {
  return this.get(Constants.KEYWORDS.SERVER_MAP)[serverId];
};

/**
 * Get server infos by server type.
 *
 * @param  {String} serverType server type
 * @return {Array}      server info list
 * @memberOf Application
 */
Application.getServersByType = function(serverType) {
  return this.serverTypeMaps[serverType];
};

/**
 * Check the server whether is a frontend server
 *
 * @param  {server}  server server info. it would check current server
 *            if server not specified
 * @return {Boolean}
 *
 * @memberOf Application
 */
Application.isFrontend = function(server) {
  server = server || this.getCurServer();
  return !!server && server.frontend === 'true';
};

/**
 * Check the server whether is a backend server
 *
 * @param  {server}  server server info. it would check current server
 *            if server not specified
 * @return {Boolean}
 * @memberOf Application
 */
Application.isBackend = function(server) {
  server = server || this.getCurServer();
  return !!server && !server.frontend;
};

/**
 * Check whether current server is a master server
 *
 * @return {Boolean}
 * @memberOf Application
 */
Application.isMaster = function() {
  return this.serverType === Constants.RESERVED.MASTER;
};

/**
 * Add new server info to current application in runtime.
 *
 * @param {Array} servers new server info list
 * @memberOf Application
 */
Application.addServers = function(servers) {
  if(!servers || !servers.length) {
    return;
  }

  var item, slist;
  for(var i=0, l=servers.length; i<l; i++) {
    item = servers[i];
    // update global server map
    this.servers[item.id] = item;

    // update global server type map
    slist = this.serverTypeMaps[item.serverType];
    if(!slist) {
      this.serverTypeMaps[item.serverType] = slist = [];
    }
    replaceServer(slist, item);

    // update global server type list
    if(this.serverTypes.indexOf(item.serverType) < 0) {
      this.serverTypes.push(item.serverType);
    }
  }
  this.event.emit(events.ADD_SERVERS, servers);
};

/**
 * Remove server info from current application at runtime.
 *
 * @param  {Array} ids server id list
 * @memberOf Application
 */
Application.removeServers = function(ids) {
  if(!ids || !ids.length) {
    return;
  }

  var id, item, slist;
  for(var i=0, l=ids.length; i<l; i++) {
    id = ids[i];
    item = this.servers[id];
    if(!item) {
      continue;
    }
    // clean global server map
    delete this.servers[id];

    // clean global server type map
    slist = this.serverTypeMaps[item.serverType];
    removeServer(slist, id);
    // TODO: should remove the server type if the slist is empty?
  }
  this.event.emit(events.REMOVE_SERVERS, ids);
};

/**
 * Replace server info from current application at runtime.
 *
 * @param  {Object} server id map
 * @memberOf Application
 */
Application.replaceServers = function(servers) {
  if(!servers){
    return;
  }

  this.servers = servers;
  this.serverTypeMaps = {};
  this.serverTypes = [];
  var serverArray = [];
  for(var id in servers){
    var server = servers[id];
    var serverType = server[Constants.RESERVED.SERVER_TYPE];
    var slist = this.serverTypeMaps[serverType];
    if(!slist) {
      this.serverTypeMaps[serverType] = slist = [];
    }
    this.serverTypeMaps[serverType].push(server);
    // update global server type list
    if(this.serverTypes.indexOf(serverType) < 0) {
      this.serverTypes.push(serverType);
    }
    serverArray.push(server);
  }
  this.event.emit(events.REPLACE_SERVERS, serverArray);
};

/**
 * Add crons from current application at runtime.
 *
 * @param  {Array} crons new crons would be added in application
 * @memberOf Application
 */
Application.addCrons = function(crons) {
  if(!crons || !crons.length) {
    logger.warn('crons is not defined.');
    return;
  }
  this.event.emit(events.ADD_CRONS, crons);
};

/**
 * Remove crons from current application at runtime.
 *
 * @param  {Array} crons old crons would be removed in application
 * @memberOf Application
 */
Application.removeCrons = function(crons) {
  if(!crons || !crons.length) {
    logger.warn('ids is not defined.');
    return;
  }
  this.event.emit(events.REMOVE_CRONS, crons);
};

var replaceServer = function(slist, serverInfo) {
  for(var i=0, l=slist.length; i<l; i++) {
    if(slist[i].id === serverInfo.id) {
      slist[i] = serverInfo;
      return;
    }
  }
  slist.push(serverInfo);
};

var removeServer = function(slist, id) {
  if(!slist || !slist.length) {
    return;
  }

  for(var i=0, l=slist.length; i<l; i++) {
    if(slist[i].id === id) {
      slist.splice(i, 1);
      return;
    }
  }
};

var contains = function(str, settings) {
  if(!settings) {
    return false;
  }

  var ts = settings.split("|");
  for(var i=0, l=ts.length; i<l; i++) {
    if(str === ts[i]) {
      return true;
    }
  }
  return false;
};

var bindEvents = function(Event, app) {
  var emethods = new Event(app);
  for(var m in emethods) {
    if(typeof emethods[m] === 'function') {
      app.event.on(m, emethods[m].bind(emethods));
    }
  }
};

var addFilter = function(app, type, filter) {
 var filters = app.get(type);
  if(!filters) {
    filters = [];
    app.set(type, filters);
  }
  filters.push(filter);
};
}).call(this,require('_process'),"/node_modules/reckoner/node_modules/pomelo/lib/application.js")
},{"./common/manager/appManager":18,"./util/appUtil":22,"./util/constants":23,"./util/events":24,"./util/utils":26,"_process":7,"events":3,"fs":1,"path":6,"pomelo-logger":28}],18:[function(require,module,exports){
(function (process,__filename){
var async = require('async');
var utils = require('../../util/utils');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var transactionLogger = require('pomelo-logger').getLogger('transaction-log', __filename);
var transactionErrorLogger = require('pomelo-logger').getLogger('transaction-error-log', __filename);

var manager = module.exports;

manager.transaction = function(name, conditions, handlers, retry) {
	if(!retry) {
    retry = 1;
  }

  if(typeof name !== 'string') {
    logger.error('Transaction name formatting error, name was not a string: %s.', name);
    return;
  }

  if(typeof conditions !== 'object') {
    logger.error('Transaction conditions error, conditions was not an object: %j', conditions);
    return;
  }

  if(typeof handlers !== 'object') {
    logger.error('Transaction handlers error, handlers was not an object: %j', handlers);
    return;
  }

  var cmethods=[],
    dmethods=[],
    cnames=[],
    dnames=[];

  for(var key in conditions) {
    if(typeof key !== 'string' || typeof conditions[key] !== 'function') {
      logger.error('Transaction conditions object format error. Condition \'%s\' was not a function: %j.', key, conditions[key]);
      return;
    }
    cnames.push(key);
    cmethods.push(conditions[key]);
  }

  var i = 0;
  // execute conditions
  async.forEachSeries(cmethods, function(method, cb) {
    method(cb);
    transactionLogger.info('[%s]:[%s] condition is executed.', name, cnames[i]);
    i++;
  }, function(err) {
    if(err) {
      process.nextTick(function() {
        transactionLogger.error('[%s]:[%s] condition executed with err: %j.', name, cnames[--i], err.stack);
        var log = {
          name: name,
          method: cnames[i],
          time: Date.now(),
          type: 'condition',
          description: err.stack
        };
        transactionErrorLogger.error(JSON.stringify(log));
      });
      return;
    } else {
      // execute handlers
      process.nextTick(function() {
        for(var key in handlers) {
          if(typeof key !== 'string' || typeof handlers[key] !== 'function') {
            logger.error('Transaction handlers object format error. Handler \'%s\' was not a function: %j.', key, handlers[key]);
            return;
          }
          dnames.push(key);
          dmethods.push(handlers[key]);
        }

        var flag = true;
        var times = retry;
        
        // do retry if failed util retry times
        async.whilst(
          function() {
            return retry > 0 && flag;
          },
          function(callback) {
            var j = 0;
            retry--;
            async.forEachSeries(dmethods, function(method, cb) {
              method(cb);
              transactionLogger.info('[%s]:[%s] handler is executed.', name, dnames[j]);
              j++;
            }, function(err) {
              if(err) {
                process.nextTick(function() {
                  transactionLogger.error('[%s]:[%s]:[%s] handler executed with error: %j.', name, dnames[--j], times-retry, err.stack);
                  var log = {
                    name: name,
                    method: dnames[j],
                    retry: times-retry,
                    time: Date.now(),
                    type: 'handler',
                    description: err.stack
                  };
                  transactionErrorLogger.error(JSON.stringify(log));
                  utils.invokeCallback(callback);
                });
                return;
              }
              flag = false;
              utils.invokeCallback(callback);
              process.nextTick(function() {
                transactionLogger.info('[%s] all conditions and handlers executed successfully.', name);
              });
            });
          },
          function(err) {
            if(err) {
              logger.error('Transaction process executed with error: %j', err);
            }
            // callback will not pass error
          }
        );
      });
    }
  });
};
}).call(this,require('_process'),"/node_modules/reckoner/node_modules/pomelo/lib/common/manager/appManager.js")
},{"../../util/utils":26,"_process":7,"async":27,"pomelo-logger":28}],19:[function(require,module,exports){
(function (process,__filename){
var cp = require('child_process');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var starter = module.exports;
var util = require('util');
var utils = require('../util/utils');
var Constants = require('../util/constants');
var env = Constants.RESERVED.ENV_DEV;
var os=require('os');
var cpus = {};
var pomelo = require('../pomelo');

/**
 * Run all servers
 *
 * @param {Object} app current application  context
 * @return {Void}
 */
 starter.runServers = function(app) {
  var server, servers;
  var condition = app.startId || app.type;
  switch(condition) {
    case Constants.RESERVED.MASTER:
    break;
    case Constants.RESERVED.ALL:
    servers = app.getServersFromConfig();
    for (var serverId in servers) {
      this.run(app, servers[serverId]);
    }
    break;
    default:
    server = app.getServerFromConfig(condition);
    if(!!server) {
      this.run(app, server);
    } else {
      servers = app.get(Constants.RESERVED.SERVERS)[condition];
      for(var i=0; i<servers.length; i++) {
        this.run(app, servers[i]);
      }
    }
  }
};

/**
 * Run server
 *
 * @param {Object} app current application context
 * @param {Object} server
 * @return {Void}
 */
starter.run = function(app, server, cb) {
  env = app.get(Constants.RESERVED.ENV);
  var cmd, key;
  if (utils.isLocal(server.host)) {
    var options = [];
    if (!!server.args) {
      if(typeof server.args === 'string') {
        options.push(server.args.trim());
      } else {
        options.push(server.args);
      }
    }
    cmd = app.get(Constants.RESERVED.MAIN);
    options.push(cmd);
    options.push(util.format('env=%s',  env));
    for(key in server) {
      if(key === Constants.RESERVED.CPU) {
        cpus[server.id] = server[key];
      }
      options.push(util.format('%s=%s', key, server[key]));
    }
    starter.localrun(process.execPath, null, options, cb);
  } else {
    cmd = util.format('cd "%s" && "%s"', app.getBase(), process.execPath);
    var arg = server.args;
    if (arg !== undefined) {
      cmd += arg;
    }
    cmd += util.format(' "%s" env=%s ', app.get(Constants.RESERVED.MAIN), env);
    for(key in server) {
      if(key === Constants.RESERVED.CPU) {
        cpus[server.id] = server[key];
      }
      cmd += util.format(' %s=%s ', key, server[key]);
    }
    starter.sshrun(cmd, server.host, cb);
  }
};

/**
 * Bind process with cpu
 *
 * @param {String} sid server id
 * @param {String} pid process id
 * @param {String} host server host
 * @return {Void}
 */
starter.bindCpu = function(sid, pid, host) {
  if(os.platform() === Constants.PLATFORM.LINUX && cpus[sid] !== undefined) {
    if (utils.isLocal(host)) {
      var options = [];
      options.push('-pc');
      options.push(cpus[sid]);
      options.push(pid);
      starter.localrun(Constants.COMMAND.TASKSET, null, options);
    }
    else {
      var cmd = util.format('taskset -pc "%s" "%s"', cpus[sid], pid);
      starter.sshrun(cmd, host, null);
    }
  }
};

/**
 * Kill application in all servers
 *
 * @param {String} pids  array of server's pid
 * @param {String} serverIds array of serverId
 */
starter.kill = function(pids, servers) {
  var cmd;
  for(var i = 0; i < servers.length; i++) {
    var server = servers[i];
    if(utils.isLocal(server.host)) {
      var options = [];
      if(os.platform() === Constants.PLATFORM.WIN) {
        cmd = Constants.COMMAND.TASKKILL;
        options.push('/pid');
        options.push('/f');
      } else {
        cmd = Constants.COMMAND.KILL;
        options.push(-9);
      }
      options.push(pids[i]);
      starter.localrun(cmd,null,options);
    } else {
      if(os.platform() === Constants.PLATFORM.WIN) {
        cmd = util.format('taskkill /pid %s /f', pids[i]);
      } else {
        cmd = util.format('kill -9 %s', pids[i]);
      }
      starter.sshrun(cmd, server.host);
    }
  }
};

/**
 * Use ssh to run command.
 *
 * @param {String} cmd command that would be executed in the remote server
 * @param {String} host remote server host
 * @param {Function} cb callback function
 *
 */
starter.sshrun = function(cmd, host, cb) {
  var args = [];
  args.push(host);
  var ssh_params = pomelo.app.get(Constants.RESERVED.SSH_CONFIG_PARAMS);
  if(!!ssh_params && Array.isArray(ssh_params)) {
    args = args.concat(ssh_params);
  }
  args.push(cmd);

  logger.info('Executing ' + cmd + ' on ' + host + ':22');
  spawnProcess(Constants.COMMAND.SSH, host, args, cb);
  return;
};

/**
 * Run local command.
 *
 * @param {String} cmd
 * @param {Callback} callback
 *
 */
starter.localrun = function (cmd, host, options, callback) {
  logger.info('Executing ' + cmd + ' ' + options + ' locally');
  spawnProcess(cmd, host, options, callback);
};

/**
 * Fork child process to run command.
 *
 * @param {String} command
 * @param {Object} options
 * @param {Callback} callback
 *
 */
var spawnProcess = function(command, host, options, cb) {
  var child = null;

  if(env === Constants.RESERVED.ENV_DEV) {
    child = cp.spawn(command, options);
    var prefix = command === Constants.COMMAND.SSH ? '[' + host + '] ' : '';

    child.stderr.on('data', function (chunk) {
      var msg = chunk.toString();
      process.stderr.write(msg);
      if(!!cb) {
        cb(msg);
      }
    });

    child.stdout.on('data', function (chunk) {
      var msg = prefix + chunk.toString();
      process.stdout.write(msg);
    });
  } else {
    child = cp.spawn(command, options, {detached: true, stdio: 'inherit'});
    child.unref();
  }

  child.on('exit', function (code) {
    if(code !== 0) {
      logger.warn('child process exit with error, error code: %s, executed command: %s', code,  command);
    }
    if (typeof cb === 'function') {
      cb(code === 0 ? null : code);
    }
  });
};

}).call(this,require('_process'),"/node_modules/reckoner/node_modules/pomelo/lib/master/starter.js")
},{"../pomelo":20,"../util/constants":23,"../util/utils":26,"_process":7,"child_process":1,"os":5,"pomelo-logger":28,"util":9}],20:[function(require,module,exports){
(function (__dirname){
/*!
 * Pomelo
 * Copyright(c) 2012 xiechengchao <xiecc@163.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
var fs = require('fs'),
  path = require('path'),
  application = require('./application'),
  manager = require('./pomeloManager');

/**
 * Expose `createApplication()`.
 *
 * @module
 */

var Pomelo = module.exports = {};

/**
 * Expose API to allow adding, removing, starting servers for custom build process (like Grunt, Gulp, etc.)
 */
Pomelo.manager = manager;

/**
 * Framework version.
 */

Pomelo.version = '1.1.2';

/**
 * Event definitions that would be emitted by app.event
 */
Pomelo.events = require('./util/events');

/**
 * auto loaded components
 */
Pomelo.components = {};

/**
 * auto loaded filters
 */
Pomelo.filters = {};

/**
 * auto loaded rpc filters
 */
Pomelo.rpcFilters = {};

/**
 * connectors
 */
Pomelo.connectors = {};
Pomelo.connectors.__defineGetter__('sioconnector', load.bind(null, './connectors/sioconnector'));
Pomelo.connectors.__defineGetter__('hybridconnector', load.bind(null, './connectors/hybridconnector'));
Pomelo.connectors.__defineGetter__('udpconnector', load.bind(null, './connectors/udpconnector'));
Pomelo.connectors.__defineGetter__('mqttconnector', load.bind(null, './connectors/mqttconnector'));

/**
 * pushSchedulers
 */
Pomelo.pushSchedulers = {};
Pomelo.pushSchedulers.__defineGetter__('direct', load.bind(null, './pushSchedulers/direct'));
Pomelo.pushSchedulers.__defineGetter__('buffer', load.bind(null, './pushSchedulers/buffer'));

var self = this;

/**
 * Create a pomelo application.
 *
 * @return {Application}
 * @memberOf Pomelo
 * @api public
 */
Pomelo.createApp = function (opts) {
  var app = application;
  app.init(opts);
  return self._app = app;
};

/**
 * Get application singleton
 */
Object.defineProperty(Pomelo, 'app', {
  get:function () {
    return self._app;
  }
});

/**
 * Auto-load bundled components with getters.
 */
fs.readdirSync(__dirname + '/components').forEach(autoLoad.bind(undefined, 'components', true));
fs.readdirSync(__dirname + '/filters/handler').forEach(autoLoad.bind(undefined, 'filters', true));
fs.readdirSync(__dirname + '/filters/rpc').forEach(autoLoad.bind(undefined, 'rpcFilters', false));

function autoLoad(type, defineOnPomelo, filename) {
  if (!/\.js$/.test(filename)) {
    return;
  }

  var name = path.basename(filename, '.js'),
    _load = load.bind(null, './components/', name);
  
  Pomelo[type].__defineGetter__(name, _load);

  if (defineOnPomelo)
    Pomelo.__defineGetter__(name, _load);
}

function load(path, name) {
  if (name) {
    return require(path + name);
  }
  return require(path);
}

}).call(this,"/node_modules/reckoner/node_modules/pomelo/lib")
},{"./application":17,"./pomeloManager":21,"./util/events":24,"fs":1,"path":6}],21:[function(require,module,exports){
(function (process,__dirname){
var path = require('path'),
  fs = require('fs'),
  constants = require('./util/constants'),
  spawn = require('child_process').spawn;

var CONNECT_ERROR = 'Failed to connect to admin console server.',
    FILEREAD_ERROR = 'Failed to read the file, please check if the application is started legally.',
    CLOSEAPP_INFO = 'Closing the application......\nPlease wait......',
    ADD_SERVER_INFO = 'Successfully added server.',
    RESTART_SERVER_INFO = 'Successfully restarted server.',
    INIT_PROJ_NOTICE = '\nThe default admin user is: \n\n'+ '  username'.green + ': admin\n  ' + 'password'.green+ ': admin\n\nYou can configure admin users by editing adminUser.json later.\n ',
    SCRIPT_NOT_FOUND = 'Failed to find an appropriate script to run,\nplease check the current work directory or the directory specified by option `--directory`.\n'.red,
    LOG_DIR_NOT_FOUND = 'Logging directory not defined. Specify as Pomelo.manager.start({logDir: \'blah\'}).\n'.red,
    MASTER_HA_NOT_FOUND = 'Failed to find an appropriate masterha config file, \nplease check the current work directory or the arguments passed to.\n'.red,
    COMMAND_ERROR = 'Illegal command format. See `pomelo --help`.\n'.red,
    DAEMON_INFO = 'The application is now running in the background.\n';

/**
 * Init application at the given directory `path`.
 *
 * @param {String} path
 */
function init(path) {
  console.log(INIT_PROJ_NOTICE);
  connectorType(function(type) {
    emptyDirectory(path, function(empty) {
      if(empty) {
        process.stdin.destroy();
        createApplicationAt(path, type);
      } else {
        confirm('Destination is not empty, continue? (y/n) [no] ', function(force) {
          process.stdin.destroy();
          if(force) {
            createApplicationAt(path, type);
          } else {
            abort('Fail to init a project'.red);
          }
        });
      }
    });
  });
}

/**
 * Create directory and files at the given directory `path`.
 *
 * @param {String} ph
 */
function createApplicationAt(ph, type) {
  var name = path.basename(path.resolve(CUR_DIR, ph));
  copy(path.join(__dirname, '../template/'), ph);
  mkdir(path.join(ph, 'game-server/logs'));
  mkdir(path.join(ph, 'shared'));
  // rmdir -r
  var rmdir = function(dir) {
    var list = fs.readdirSync(dir);
    for(var i = 0; i < list.length; i++) {
      var filename = path.join(dir, list[i]);
      var stat = fs.statSync(filename);
      if(filename === "." || filename === "..") {
      } else if(stat.isDirectory()) {
        rmdir(filename);
      } else {
        fs.unlinkSync(filename);
      }
    }
    fs.rmdirSync(dir);
  };
  setTimeout(function() {
    switch(type) {
      case '1':
         // use websocket
         var unlinkFiles = ['game-server/app.js.sio',
         'game-server/app.js.wss',
         'game-server/app.js.mqtt',
         'game-server/app.js.sio.wss',
         'game-server/app.js.udp',
         'web-server/app.js.https',
         'web-server/public/index.html.sio',
         'web-server/public/js/lib/pomeloclient.js',
         'web-server/public/js/lib/pomeloclient.js.wss',
         'web-server/public/js/lib/build/build.js.wss',
         'web-server/public/js/lib/socket.io.js'];
         for(var i = 0; i < unlinkFiles.length; ++i) {
            fs.unlinkSync(path.resolve(ph, unlinkFiles[i]));
         }
        break;
        case '2':
          // use socket.io
          var unlinkFiles = ['game-server/app.js',
          'game-server/app.js.wss',
          'game-server/app.js.udp',
          'game-server/app.js.mqtt',
          'game-server/app.js.sio.wss',
          'web-server/app.js.https',
          'web-server/public/index.html',
          'web-server/public/js/lib/component.json',
          'web-server/public/js/lib/pomeloclient.js.wss'];
          for(var i = 0; i < unlinkFiles.length; ++i) {
            fs.unlinkSync(path.resolve(ph, unlinkFiles[i]));
          }

          fs.renameSync(path.resolve(ph, 'game-server/app.js.sio'), path.resolve(ph, 'game-server/app.js'));
          fs.renameSync(path.resolve(ph, 'web-server/public/index.html.sio'), path.resolve(ph, 'web-server/public/index.html'));

          rmdir(path.resolve(ph, 'web-server/public/js/lib/build'));
          rmdir(path.resolve(ph, 'web-server/public/js/lib/local'));
          break;
        case '3':
          // use websocket wss
          var unlinkFiles = ['game-server/app.js.sio',
          'game-server/app.js',
          'game-server/app.js.udp',
          'game-server/app.js.sio.wss',
          'game-server/app.js.mqtt',
          'web-server/app.js',
          'web-server/public/index.html.sio',
          'web-server/public/js/lib/pomeloclient.js',
          'web-server/public/js/lib/pomeloclient.js.wss',
          'web-server/public/js/lib/build/build.js',
          'web-server/public/js/lib/socket.io.js'];
          for(var i = 0; i < unlinkFiles.length; ++i) {
            fs.unlinkSync(path.resolve(ph, unlinkFiles[i]));
          }

          fs.renameSync(path.resolve(ph, 'game-server/app.js.wss'), path.resolve(ph, 'game-server/app.js'));
          fs.renameSync(path.resolve(ph, 'web-server/app.js.https'), path.resolve(ph, 'web-server/app.js'));
          fs.renameSync(path.resolve(ph, 'web-server/public/js/lib/build/build.js.wss'), path.resolve(ph, 'web-server/public/js/lib/build/build.js'));
          break;
        case '4':
          // use socket.io wss
           var unlinkFiles = ['game-server/app.js.sio',
          'game-server/app.js',
          'game-server/app.js.udp',
          'game-server/app.js.wss',
          'game-server/app.js.mqtt',
          'web-server/app.js',
          'web-server/public/index.html',
          'web-server/public/js/lib/pomeloclient.js'];
          for(var i = 0; i < unlinkFiles.length; ++i) {
            fs.unlinkSync(path.resolve(ph, unlinkFiles[i]));
          }

          fs.renameSync(path.resolve(ph, 'game-server/app.js.sio.wss'), path.resolve(ph, 'game-server/app.js'));
          fs.renameSync(path.resolve(ph, 'web-server/app.js.https'), path.resolve(ph, 'web-server/app.js'));
          fs.renameSync(path.resolve(ph, 'web-server/public/index.html.sio'), path.resolve(ph, 'web-server/public/index.html'));
          fs.renameSync(path.resolve(ph, 'web-server/public/js/lib/pomeloclient.js.wss'), path.resolve(ph, 'web-server/public/js/lib/pomeloclient.js'));

          rmdir(path.resolve(ph, 'web-server/public/js/lib/build'));
          rmdir(path.resolve(ph, 'web-server/public/js/lib/local'));
          fs.unlinkSync(path.resolve(ph, 'web-server/public/js/lib/component.json'));
          break;
        case '5':
          // use socket.io wss
           var unlinkFiles = ['game-server/app.js.sio',
          'game-server/app.js',
          'game-server/app.js.wss',
          'game-server/app.js.mqtt',
          'game-server/app.js.sio.wss',
          'web-server/app.js.https',
          'web-server/public/index.html',
          'web-server/public/js/lib/component.json',
          'web-server/public/js/lib/pomeloclient.js.wss'];
          for(var i = 0; i < unlinkFiles.length; ++i) {
            fs.unlinkSync(path.resolve(ph, unlinkFiles[i]));
          }
          
          fs.renameSync(path.resolve(ph, 'game-server/app.js.udp'), path.resolve(ph, 'game-server/app.js'));
          rmdir(path.resolve(ph, 'web-server/public/js/lib/build'));
          rmdir(path.resolve(ph, 'web-server/public/js/lib/local'));
          break;
        case '6':
          // use socket.io
          var unlinkFiles = ['game-server/app.js',
          'game-server/app.js.wss',
          'game-server/app.js.udp',
          'game-server/app.js.sio',
          'game-server/app.js.sio.wss',
          'web-server/app.js.https',
          'web-server/public/index.html',
          'web-server/public/js/lib/component.json',
          'web-server/public/js/lib/pomeloclient.js.wss'];
          for(var i = 0; i < unlinkFiles.length; ++i) {
            fs.unlinkSync(path.resolve(ph, unlinkFiles[i]));
          }

          fs.renameSync(path.resolve(ph, 'game-server/app.js.mqtt'), path.resolve(ph, 'game-server/app.js'));
          fs.renameSync(path.resolve(ph, 'web-server/public/index.html.sio'), path.resolve(ph, 'web-server/public/index.html'));

          rmdir(path.resolve(ph, 'web-server/public/js/lib/build'));
          rmdir(path.resolve(ph, 'web-server/public/js/lib/local'));
          break;
        }
        var replaceFiles = ['game-server/app.js',
        'game-server/package.json',
        'web-server/package.json'];
        for(var j = 0; j < replaceFiles.length; j++) {
          var str = fs.readFileSync(path.resolve(ph, replaceFiles[j])).toString();
          fs.writeFileSync(path.resolve(ph, replaceFiles[j]), str.replace('$', name));
        }
        var f = path.resolve(ph, 'game-server/package.json');
        var content = fs.readFileSync(f).toString();
        fs.writeFileSync(f, content.replace('#', version));
      }, TIME_INIT);
}


/**
 * Start application.
 *
 * @param {Object} options options for `start` operation
 */
function start(options) {
  options = options || {};

  var absScript = options.appFile || path.resolve(options.directory, 'app.js');

  if (!fs.existsSync(absScript)) {
    abort(SCRIPT_NOT_FOUND, absScript);
  }

  var logDir = options.logDir || (options.directory ? path.resolve(options.directory, 'logs') : undefined);
  if (!logDir)
  {
    abort(LOG_DIR_NOT_FOUND);
  }

  if (!fs.existsSync(logDir)) {
    fs.mkdir(logDir);
  }
  
  var ls,
    type = options.type || constants.RESERVED.ALL,
    params = [absScript, 'env=' + options.env, 'type=' + type];

  if(!!options.id) {
    params.push('startId=' + options.id);
  }
  if (options.daemon) {
    ls = spawn(process.execPath, params, {detached: true, stdio: 'ignore'});
    ls.unref();
    console.log(DAEMON_INFO);
    process.exit(0);
  } else {
    ls = spawn(process.execPath, params);
    ls.stdout.on('data', function(data) {
      console.log(data.toString());
    });
    ls.stderr.on('data', function(data) {
      console.log(data.toString());
    });
  }
}

/**
 * List pomelo processes.
 *
 * @param {Object} opts options for `list` operation
 */
function list(opts) {
  var id = 'pomelo_list_' + Date.now();
  connectToMaster(id, opts, function(client) {
    client.request(co.moduleId, {signal: 'list'}, function(err, data) {
      if(err) {
        console.error(err);
      }
      var servers = [];
      for(var key in data.msg) {
        servers.push(data.msg[key]);
      }
      var comparer = function(a, b) {
        if (a.serverType < b.serverType) {
          return -1;
        } else if (a.serverType > b.serverType) {
          return 1;
        } else if (a.serverId < b.serverId) {
          return -1;
        } else if (a.serverId > b.serverId) {
          return 1;
        } else {
          return 0;
        }
      };
      servers.sort(comparer);
      var rows = [];
      rows.push(['serverId', 'serverType', 'pid', 'rss(M)', 'heapTotal(M)', 'heapUsed(M)', 'uptime(m)']);
      servers.forEach(function(server) {
        rows.push([server.serverId, server.serverType, server.pid, server.rss, server.heapTotal, server.heapUsed, server.uptime]);
      });
      console.log(cliff.stringifyRows(rows, ['red', 'blue', 'green', 'cyan', 'magenta', 'white', 'yellow']));
      process.exit(0);
    });
  });
}

/**
 * Add server to application.
 *
 * @param {Object} opts options for `add` operation
 */
function add(opts) {
  var id = 'pomelo_add_' + Date.now();
  connectToMaster(id, opts, function(client) {
    client.request(co.moduleId, { signal: 'add', args: opts.args }, function(err) {
      if(err) {
        console.error(err);
      }
      else {
        console.info(ADD_SERVER_INFO);
      }
      process.exit(0);
    });
  });
}

/**
 * Terminal application.
 *
 * @param {String} signal stop/kill
 * @param {Object} opts options for `stop/kill` operation
 */
function terminal(signal, opts) {
  console.info(CLOSEAPP_INFO);
  // option force just for `kill`
  if(opts.force) {
    if (os.platform() === constants.PLATFORM.WIN) {
      exec(KILL_CMD_WIN);
    } else {
      exec(KILL_CMD_LUX);
    }
    process.exit(1);
    return;
  }
  var id = 'pomelo_terminal_' + Date.now();
  connectToMaster(id, opts, function(client) {
    client.request(co.moduleId, {
      signal: signal, ids: opts.serverIds
    }, function(err, msg) {
      if(err) {
        console.error(err);
      }
      if(signal === 'kill') {
        if(msg.code === 'ok') {
          console.log('All the servers have been terminated!');
        } else {
          console.log('There may be some servers remained:', msg.serverIds);
        }
      }
      process.exit(0);
    });
  });
}

function restart(opts) {
  var id = 'pomelo_restart_' + Date.now();
  var serverIds = [];
  var type = null;
  if(!!opts.id) {
    serverIds.push(opts.id);
  }
  if(!!opts.type) {
    type = opts.type;
  }
  connectToMaster(id, opts, function(client) {
    client.request(co.moduleId, { signal: 'restart', ids: serverIds, type: type}, function(err, fails) {
      if(!!err) {
        console.error(err);
      } else if(!!fails.length) {
        console.info('restart fails server ids: %j', fails);
      } else {
        console.info(RESTART_SERVER_INFO);
      }
      process.exit(0);
    });
  });
}

function connectToMaster(id, opts, cb) {
  var client = new adminClient({username: opts.username, password: opts.password, md5: true});
  client.connect(id, opts.host, opts.port, function(err) {
    if(err) {
      abort(CONNECT_ERROR + err.red);
    }
    if(typeof cb === 'function') {
      cb(client);
    }
  });
}

/**
 * Start master slaves.
 *
 * @param {String} option for `startMasterha` operation
 */
function startMasterha(opts) {
  var configFile = path.join(opts.directory, constants.FILEPATH.MASTER_HA);
  if(!fs.existsSync(configFile)) {
    abort(MASTER_HA_NOT_FOUND);
  }
  var masterha = require(configFile).masterha;
  for(var i=0; i<masterha.length; i++) {
    var server = masterha[i];
    server.mode = constants.RESERVED.STAND_ALONE;
    server.masterha = 'true';
    server.home = opts.directory;
    runServer(server);
  }
}

/**
 * Check if the given directory `path` is empty.
 *
 * @param {String} path
 * @param {Function} fn
 */
function emptyDirectory(path, fn) {
  fs.readdir(path, function(err, files) {
    if(err && 'ENOENT' !== err.code) {
      abort(FILEREAD_ERROR);
    }
    fn(!files || !files.length);
  });
}

/**
 * Prompt confirmation with the given `msg`.
 *
 * @param {String} msg
 * @param {Function} fn
 */
function confirm(msg, fn) {
  prompt(msg, function(val) {
    fn(/^ *y(es)?/i.test(val));
  });
}

/**
 * Prompt input with the given `msg` and callback `fn`.
 *
 * @param {String} msg
 * @param {Function} fn
 */
function prompt(msg, fn) {
  if(' ' === msg[msg.length - 1]) {
    process.stdout.write(msg);
  } else {
    console.log(msg);
  }
  process.stdin.setEncoding('ascii');
  process.stdin.once('data', function(data) {
    fn(data);
  }).resume();
}

/**
 * Exit with the given `str`.
 *
 * @param {String} str
 */
function abort(str, obj) {
  console.error(str, obj);
  process.exit(1);
}

/**
 * Copy template files to project.
 *
 * @param {String} origin
 * @param {String} target
 */
function copy(origin, target) {
  if(!fs.existsSync(origin)) {
    abort(origin + 'does not exist.');
  }
  if(!fs.existsSync(target)) {
    mkdir(target);
    console.log('   create : '.green + target);
  }
  fs.readdir(origin, function(err, datalist) {
    if(err) {
      abort(FILEREAD_ERROR);
    }
    for(var i = 0; i < datalist.length; i++) {
      var oCurrent = path.resolve(origin, datalist[i]);
      var tCurrent = path.resolve(target, datalist[i]);
      if(fs.statSync(oCurrent).isFile()) {
        fs.writeFileSync(tCurrent, fs.readFileSync(oCurrent, ''), '');
        console.log('   create : '.green + tCurrent);
      } else if(fs.statSync(oCurrent).isDirectory()) {
        copy(oCurrent, tCurrent);
      }
    }
  });
}

/**
 * Mkdir -p.
 *
 * @param {String} path
 * @param {Function} fn
 */
function mkdir(path, fn) {
  mkdirp(path, 0755, function(err){
    if(err) {
      throw err;
    }
    console.log('   create : '.green + path);
    if(typeof fn === 'function') {
      fn();
    }
  });
}

/**
 * Get user's choice on connector selecting
 * 
 * @param {Function} cb
 */
function connectorType(cb) {
  prompt('Please select underly connector, 1 for websocket(native socket), 2 for socket.io, 3 for wss, 4 for socket.io(wss), 5 for udp, 6 for mqtt: [1]', function(msg) {
    switch(msg.trim()) {
      case '':
         cb(1);
         break;
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
         cb(msg.trim());
         break;
      default:
         console.log('Invalid choice! Please input 1 - 5.'.red + '\n');
         connectorType(cb);
         break;
    }
  });
}

/**
 * Run server.
 * 
 * @param {Object} server server information
 */
function runServer(server) {
  var cmd, key;
  var main = path.resolve(server.home, 'app.js');
  if(utils.isLocal(server.host)) {
    var options = [];
    options.push(main);
    for(key in server) {
      options.push(util.format('%s=%s', key, server[key]));
    }
    starter.localrun(process.execPath, null, options);
  } else {
    cmd = util.format('cd "%s" && "%s"', server.home, process.execPath);
    cmd += util.format(' "%s" ', main);
    for(key in server) {
      cmd += util.format(' %s=%s ', key, server[key]);
    }
    starter.sshrun(cmd, server.host);
  }
}

module.exports = {
  init: init,
  start: start,
  createApplicationAt: createApplicationAt,
  list: list,
  terminal: terminal,
  restart: restart,
  startMasterha: startMasterha
}
}).call(this,require('_process'),"/node_modules/reckoner/node_modules/pomelo/lib")
},{"./util/constants":23,"_process":7,"child_process":1,"fs":1,"path":6}],22:[function(require,module,exports){
(function (process,__filename){
var async = require('async');
var log = require('./log');
var utils = require('./utils');
var path = require('path');
var fs = require('fs');
var Constants = require('./constants');
var starter = require('../master/starter');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);

/**
 * Initialize application configuration.
 */
module.exports.defaultConfiguration = function(app) {
  var args = app.options.args || parseArgs(process.argv);
  setupEnv(app, args);
  loadMaster(app);
  loadServers(app);
  processArgs(app, args);
  configLogger(app);
  loadLifecycle(app);
};

/**
 * Start servers by type.
 */
module.exports.startByType = function(app, cb) {
  if(!!app.startId) {
    if(app.startId === Constants.RESERVED.MASTER) {
      utils.invokeCallback(cb);
    } else {
      starter.runServers(app);
    }
  } else {
    if(!!app.type && app.type !== Constants.RESERVED.ALL && app.type !== Constants.RESERVED.MASTER) {
      starter.runServers(app);
    } else {
      utils.invokeCallback(cb);
    }
  }
};

/**
 * Load default components for application.
 */
module.exports.loadDefaultComponents = function(app) {
  var pomelo = require('../pomelo');
  // load system default components
  if (app.serverType === Constants.RESERVED.MASTER) {
    app.load(pomelo.master, app.get('masterConfig'));
  } else {
    app.load(pomelo.proxy, app.get('proxyConfig'));
    if (app.getCurServer().port) {
      app.load(pomelo.remote, app.get('remoteConfig'));
    }
    if (app.isFrontend()) {
      app.load(pomelo.connection, app.get('connectionConfig'));
      app.load(pomelo.connector, app.get('connectorConfig'));
      app.load(pomelo.session, app.get('sessionConfig'));
      // compatible for schedulerConfig
      if(app.get('schedulerConfig')) {
        app.load(pomelo.pushScheduler, app.get('schedulerConfig'));
      } else {
        app.load(pomelo.pushScheduler, app.get('pushSchedulerConfig'));
      }
    }
    app.load(pomelo.backendSession, app.get('backendSessionConfig'));
    app.load(pomelo.channel, app.get('channelConfig'));
    app.load(pomelo.server, app.get('serverConfig'));
  }
  app.load(pomelo.monitor, app.get('monitorConfig'));
};

/**
 * Stop components.
 *
 * @param  {Array}  comps component list
 * @param  {Number}   index current component index
 * @param  {Boolean}  force whether stop component immediately
 * @param  {Function} cb
 */
module.exports.stopComps = function(comps, index, force, cb) {
  if (index >= comps.length) {
    utils.invokeCallback(cb);
    return;
  }
  var comp = comps[index];
  if (typeof comp.stop === 'function') {
    comp.stop(force, function() {
      // ignore any error
      module.exports.stopComps(comps, index + 1, force, cb);
    });
  } else {
    module.exports.stopComps(comps, index + 1, force, cb);
  }
};

/**
 * Apply command to loaded components.
 * This method would invoke the component {method} in series.
 * Any component {method} return err, it would return err directly.
 *
 * @param {Array} comps loaded component list
 * @param {String} method component lifecycle method name, such as: start, stop
 * @param {Function} cb
 */
module.exports.optComponents = function(comps, method, cb) {
  var i = 0;
  async.forEachSeries(comps, function(comp, done) {
    i++;
    if (typeof comp[method] === 'function') {
      comp[method](done);
    } else {
      done();
    }
  }, function(err) {
    if (err) {
      if(typeof err === 'string') {
        logger.error('fail to operate component, method: %s, err: %j', method, err);
      } else {
        logger.error('fail to operate component, method: %s, err: %j',  method, err.stack);
      }
    }
    utils.invokeCallback(cb, err);
  });
};

/**
 * Load server info from config/servers.json.
 */
var loadServers = function(app) {
  if (app.options.servers)
    app.setConfig(Constants.RESERVED.SERVERS, app.options.servers);
  else
    app.loadConfigBaseApp(Constants.RESERVED.SERVERS, Constants.FILEPATH.SERVER);

  var servers = app.get(Constants.RESERVED.SERVERS),
    serverMap = {}, slist, i, l, server;

  for (var serverType in servers) {
    slist = servers[serverType];

    for (i = 0, l = slist.length; i < l; i++) {
      server = slist[i];
      server.serverType = serverType;
      if(server[Constants.RESERVED.CLUSTER_COUNT]) {
        utils.loadCluster(app, server, serverMap);
        continue;
      }
      serverMap[server.id] = server;
      if (server.wsPort) {
        logger.warn('wsPort is deprecated, use clientPort in frontend server instead, server: %j', server);
      }
    }
  }
  app.set(Constants.KEYWORDS.SERVER_MAP, serverMap);
};

/**
 * Load master info from config/master.json.
 */
var loadMaster = function(app) {
  if (app.options.master)
    app.setConfig(Constants.RESERVED.MASTER, app.options.master);
  else
    app.loadConfigBaseApp(Constants.RESERVED.MASTER, Constants.FILEPATH.MASTER);

  app.master = app.get(Constants.RESERVED.MASTER);
};

/**
 * Process server start command
 */
var processArgs = function(app, args) {
  var serverType = args.serverType || Constants.RESERVED.MASTER;
  var serverId = args.id || app.getMaster().id;
  var mode = args.mode || Constants.RESERVED.CLUSTER;
  var masterha = args.masterha || 'false';
  var type = args.type || Constants.RESERVED.ALL;
  var startId = args.startId;

  app.set(Constants.RESERVED.MAIN, args.main, true);
  app.set(Constants.RESERVED.SERVER_TYPE, serverType, true);
  app.set(Constants.RESERVED.SERVER_ID, serverId, true);
  app.set(Constants.RESERVED.MODE, mode, true);
  app.set(Constants.RESERVED.TYPE, type, true);
  if(!!startId) {
    app.set(Constants.RESERVED.STARTID, startId, true);
  }

  if (masterha === 'true') {
    app.master = args;
    app.set(Constants.RESERVED.CURRENT_SERVER, args, true);
  } else if (serverType !== Constants.RESERVED.MASTER) {
    app.set(Constants.RESERVED.CURRENT_SERVER, args, true);
  } else {
    app.set(Constants.RESERVED.CURRENT_SERVER, app.getMaster(), true);
  }
};

/**
 * Setup enviroment.
 */
var setupEnv = function(app, args) {
  app.set(Constants.RESERVED.ENV, args.env || process.env.NODE_ENV || Constants.RESERVED.ENV_DEV, true);
};

/**
 * Configure custom logger.
 */
var configLogger = function(app) {
  if (process.env.POMELO_LOGGER !== 'off') {
    var env = app.get(Constants.RESERVED.ENV);
    var originPath = path.join(app.getBase(), Constants.FILEPATH.LOG);
    var presentPath = path.join(app.getBase(), Constants.FILEPATH.CONFIG_DIR, env, path.basename(Constants.FILEPATH.LOG));
    if(fs.existsSync(originPath)) {
      log.configure(app, originPath);
    } else if(fs.existsSync(presentPath)) {
      log.configure(app, presentPath);
    } else {
      logger.error('logger file path configuration error.');
    }
  }
};

/**
 * Parse command line arguments.
 *
 * @param args command line arguments
 *
 * @return Object argsMap map of arguments
 */
var parseArgs = function(args) {
  var argsMap = {};
  var mainPos = 1;

  while (args[mainPos].indexOf('--') > 0) {
    mainPos++;
  }
  argsMap.main = args[mainPos];

  for (var i = (mainPos + 1); i < args.length; i++) {
    var arg = args[i];
    var sep = arg.indexOf('=');
    var key = arg.slice(0, sep);
    var value = arg.slice(sep + 1);
    if (!isNaN(Number(value)) && (value.indexOf('.') < 0)) {
      value = Number(value);
    }
    argsMap[key] = value;
  }

  return argsMap;
};

/**
 * Load lifecycle file.
 *
 */
var loadLifecycle = function(app) {
  var filePath = path.join(app.getBase(), Constants.FILEPATH.SERVER_DIR, app.serverType, Constants.FILEPATH.LIFECYCLE);
  if(!fs.existsSync(filePath)) {
    return;
  }
  var lifecycle = require(filePath);
  for(var key in lifecycle) {
    if(typeof lifecycle[key] === 'function') {
      app.lifecycleCbs[key] = lifecycle[key];
    } else {
      logger.warn('lifecycle.js in %s is error format.', filePath);
    }
  }
};

}).call(this,require('_process'),"/node_modules/reckoner/node_modules/pomelo/lib/util/appUtil.js")
},{"../master/starter":19,"../pomelo":20,"./constants":23,"./log":25,"./utils":26,"_process":7,"async":27,"fs":1,"path":6,"pomelo-logger":28}],23:[function(require,module,exports){
module.exports = {
  KEYWORDS: {
    BEFORE_FILTER: '__befores__',
    AFTER_FILTER: '__afters__',
    GLOBAL_BEFORE_FILTER: '__globalBefores__',
    GLOBAL_AFTER_FILTER: '__globalAfters__',
    ROUTE: '__routes__',
    BEFORE_STOP_HOOK: '__beforeStopHook__',
    MODULE: '__modules__',
    SERVER_MAP: '__serverMap__',
    RPC_BEFORE_FILTER: '__rpcBefores__',
    RPC_AFTER_FILTER: '__rpcAfters__',
    MASTER_WATCHER: '__masterwatcher__',
    MONITOR_WATCHER: '__monitorwatcher__'
 },

  FILEPATH: {
    MASTER: '/config/master.json',
    SERVER: '/config/servers.json',
    CRON: '/config/crons.json',
    LOG: '/config/log4js.json',
    SERVER_PROTOS: '/config/serverProtos.json',
    CLIENT_PROTOS: '/config/clientProtos.json',
    MASTER_HA: '/config/masterha.json',
    LIFECYCLE: '/lifecycle.js',
    SERVER_DIR: '/app/servers/',
    CONFIG_DIR: '/config'
  },

  DIR: {
    HANDLER: 'handler',
    REMOTE: 'remote',
    CRON: 'cron',
    LOG: 'logs',
    SCRIPT: 'scripts',
    EVENT: 'events',
    COMPONENT: 'components'
  },

  RESERVED: {
    BASE: 'base',
    MAIN: 'main',
    MASTER: 'master',
    SERVERS: 'servers',
    ENV: 'env',
    CPU: 'cpu',
    ENV_DEV: 'development',
    ENV_PRO: 'production',
    ALL: 'all',
    SERVER_TYPE: 'serverType',
    SERVER_ID: 'serverId',
    CURRENT_SERVER: 'curServer',
    MODE: 'mode',
    TYPE: 'type',
    CLUSTER: 'clusters',
    STAND_ALONE: 'stand-alone',
    START: 'start',
    AFTER_START: 'afterStart',
    CRONS: 'crons',
    ERROR_HANDLER: 'errorHandler',
    GLOBAL_ERROR_HANDLER: 'globalErrorHandler',
    AUTO_RESTART: 'auto-restart',
    RESTART_FORCE: 'restart-force',
    CLUSTER_COUNT: 'clusterCount',
    CLUSTER_PREFIX: 'cluster-server-',
    CLUSTER_SIGNAL: '++',
    RPC_ERROR_HANDLER: 'rpcErrorHandler',
    SERVER: 'server',
    CLIENT: 'client',
    STARTID: 'startId',
    STOP_SERVERS: 'stop_servers',
    SSH_CONFIG_PARAMS: 'ssh_config_params'
  },

  COMMAND: {
    TASKSET: 'taskset',
    KILL: 'kill',
    TASKKILL: 'taskkill',
    SSH: 'ssh'
  },

  PLATFORM: {
    WIN: 'win32',
    LINUX: 'linux'
  },

  LIFECYCLE: {
    BEFORE_STARTUP: 'beforeStartup',
    BEFORE_SHUTDOWN: 'beforeShutdown',
    AFTER_STARTUP: 'afterStartup',
    AFTER_STARTALL: 'afterStartAll'
  },

  SIGNAL: {
    FAIL: 0,
    OK: 1
  },

 TIME: {
   TIME_WAIT_STOP: 3 * 1000,
   TIME_WAIT_KILL: 5 * 1000,
   TIME_WAIT_RESTART: 5 * 1000,
   TIME_WAIT_COUNTDOWN: 10 * 1000,
   TIME_WAIT_MASTER_KILL: 2 * 60 * 1000,
   TIME_WAIT_MONITOR_KILL: 2 * 1000,
   TIME_WAIT_PING: 30 * 1000,
   TIME_WAIT_MAX_PING: 5 * 60 * 1000,
   DEFAULT_UDP_HEARTBEAT_TIME: 20 * 1000,
   DEFAULT_UDP_HEARTBEAT_TIMEOUT: 100 * 1000
 }
};
},{}],24:[function(require,module,exports){
module.exports = {
	ADD_SERVERS: 'add_servers',
	REMOVE_SERVERS: 'remove_servers',
  REPLACE_SERVERS: 'replace_servers',
  BIND_SESSION: 'bind_session',
  UNBIND_SESSION:'unbind_session',
	CLOSE_SESSION: 'close_session',
	ADD_CRONS: 'add_crons',
	REMOVE_CRONS: 'remove_crons',
	START_SERVER: 'start_server',
	START_ALL: 'start_all'
};

},{}],25:[function(require,module,exports){
var logger = require('pomelo-logger');

/**
 * Configure pomelo logger
 */
module.exports.configure = function(app, filename) {
  var serverId = app.getServerId(),
    base = app.getBase();

  logger.configure(filename, {
    serverId: serverId,
    base: base
  });
};

},{"pomelo-logger":28}],26:[function(require,module,exports){
(function (__filename){
var os = require('os');
var util = require('util');
var exec = require('child_process').exec;
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var Constants = require('./constants');
var pomelo = require('../pomelo');

var utils = module.exports;

/**
 * Invoke callback with check
 */
utils.invokeCallback = function(cb) {
  if ( !! cb && typeof cb === 'function') {
    cb.apply(null, Array.prototype.slice.call(arguments, 1));
  }
};

/**
 * Get the count of elements of object
 */
utils.size = function(obj) {
  var count = 0;
  for (var i in obj) {
    if (obj.hasOwnProperty(i) && typeof obj[i] !== 'function') {
      count++;
    }
  }
  return count;
};

/**
 * Check a string whether ends with another string
 */
utils.endsWith = function(str, suffix) {
  if (typeof str !== 'string' || typeof suffix !== 'string' ||
    suffix.length > str.length) {
    return false;
  }
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
};

/**
 * Check a string whether starts with another string
 */
utils.startsWith = function(str, prefix) {
  if (typeof str !== 'string' || typeof prefix !== 'string' ||
    prefix.length > str.length) {
    return false;
  }

  return str.indexOf(prefix) === 0;
};

/**
 * Compare the two arrays and return the difference.
 */
utils.arrayDiff = function(array1, array2) {
  var o = {};
  for(var i = 0, len = array2.length; i < len; i++) {
    o[array2[i]] = true;
  }

  var result = [];
  for(i = 0, len = array1.length; i < len; i++) {
    var v = array1[i];
    if(o[v]) continue;
    result.push(v);
  }
  return result;
};

/*
 * Date format
 */
utils.format = function(date, format) {
  format = format || 'MMddhhmm';
  var o = {
    "M+": date.getMonth() + 1, //month
    "d+": date.getDate(), //day
    "h+": date.getHours(), //hour
    "m+": date.getMinutes(), //minute
    "s+": date.getSeconds(), //second
    "q+": Math.floor((date.getMonth() + 3) / 3), //quarter
    "S": date.getMilliseconds() //millisecond
  };

  if (/(y+)/.test(format)) {
    format = format.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
  }

  for (var k in o) {
    if (new RegExp("(" + k + ")").test(format)) {
      format = format.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] :
        ("00" + o[k]).substr(("" + o[k]).length));
    }
  }
  return format;
};

/**
 * check if has Chinese characters.
 */
utils.hasChineseChar = function(str) {
  if (/.*[\u4e00-\u9fa5]+.*$/.test(str)) {
    return true;
  } else {
    return false;
  }
};

/**
 * transform unicode to utf8
 */
utils.unicodeToUtf8 = function(str) {
  var i, len, ch;
  var utf8Str = "";
  len = str.length;
  for (i = 0; i < len; i++) {
    ch = str.charCodeAt(i);

    if ((ch >= 0x0) && (ch <= 0x7F)) {
      utf8Str += str.charAt(i);

    } else if ((ch >= 0x80) && (ch <= 0x7FF)) {
      utf8Str += String.fromCharCode(0xc0 | ((ch >> 6) & 0x1F));
      utf8Str += String.fromCharCode(0x80 | (ch & 0x3F));

    } else if ((ch >= 0x800) && (ch <= 0xFFFF)) {
      utf8Str += String.fromCharCode(0xe0 | ((ch >> 12) & 0xF));
      utf8Str += String.fromCharCode(0x80 | ((ch >> 6) & 0x3F));
      utf8Str += String.fromCharCode(0x80 | (ch & 0x3F));

    } else if ((ch >= 0x10000) && (ch <= 0x1FFFFF)) {
      utf8Str += String.fromCharCode(0xF0 | ((ch >> 18) & 0x7));
      utf8Str += String.fromCharCode(0x80 | ((ch >> 12) & 0x3F));
      utf8Str += String.fromCharCode(0x80 | ((ch >> 6) & 0x3F));
      utf8Str += String.fromCharCode(0x80 | (ch & 0x3F));

    } else if ((ch >= 0x200000) && (ch <= 0x3FFFFFF)) {
      utf8Str += String.fromCharCode(0xF8 | ((ch >> 24) & 0x3));
      utf8Str += String.fromCharCode(0x80 | ((ch >> 18) & 0x3F));
      utf8Str += String.fromCharCode(0x80 | ((ch >> 12) & 0x3F));
      utf8Str += String.fromCharCode(0x80 | ((ch >> 6) & 0x3F));
      utf8Str += String.fromCharCode(0x80 | (ch & 0x3F));

    } else if ((ch >= 0x4000000) && (ch <= 0x7FFFFFFF)) {
      utf8Str += String.fromCharCode(0xFC | ((ch >> 30) & 0x1));
      utf8Str += String.fromCharCode(0x80 | ((ch >> 24) & 0x3F));
      utf8Str += String.fromCharCode(0x80 | ((ch >> 18) & 0x3F));
      utf8Str += String.fromCharCode(0x80 | ((ch >> 12) & 0x3F));
      utf8Str += String.fromCharCode(0x80 | ((ch >> 6) & 0x3F));
      utf8Str += String.fromCharCode(0x80 | (ch & 0x3F));

    }

  }
  return utf8Str;
};

/**
 * Ping server to check if network is available
 *
 */
utils.ping = function(host, cb) {
  if(!module.exports.isLocal(host)) {
    var cmd = 'ping -w 15 ' + host;
    exec(cmd, function(err, stdout, stderr) {
      if(!!err) {
        cb(false);
        return;
      }
      cb(true);
    });
  } else {
    cb(true);
  }
};

/**
 * Check if server is exsit. 
 *
 */
utils.checkPort = function(server, cb) {
  if (!server.port && !server.clientPort) {
    this.invokeCallback(cb, 'leisure');
    return;
  }
  var self = this;
  var port = server.port || server.clientPort;
  var host = server.host;
  var generateCommand = function(self, host, port) {
    var cmd;
    var ssh_params = pomelo.app.get(Constants.RESERVED.SSH_CONFIG_PARAMS);
    if(!!ssh_params && Array.isArray(ssh_params)) {
      ssh_params = ssh_params.join(' ');
    }
    else {
      ssh_params = "";
    }
    if (!self.isLocal(host)) {
      cmd = util.format('ssh %s %s "netstat -an|awk \'{print $4}\'|grep %s|wc -l"', host, ssh_params, port);
    } else {
      cmd = util.format('netstat -an|awk \'{print $4}\'|grep %s|wc -l', port);
    }
    return cmd;
  };
  var cmd1 = generateCommand(self, host, port);
  var child = exec(cmd1, function(err, stdout, stderr) {
    if(err) {
      logger.error('command %s execute with error: %j', cmd1, err.stack);
      self.invokeCallback(cb, 'error');
    } else if(stdout.trim() !== '0') {
      self.invokeCallback(cb, 'busy');
    } else {
      port = server.clientPort;
      var cmd2 = generateCommand(self, host, port);
      exec(cmd2, function(err, stdout, stderr) {
        if(err) {
          logger.error('command %s execute with error: %j', cmd2, err.stack);
          self.invokeCallback(cb, 'error');
        } else if (stdout.trim() !== '0') {
          self.invokeCallback(cb, 'busy');
        } else {
          self.invokeCallback(cb, 'leisure');
        }
      });
    }
  });
};

utils.isLocal = function(host) {
  var app = require('../pomelo').app;
  if(!app) {
    return host === '127.0.0.1' || host === 'localhost' || inLocal(host);
  } else {
    return host === '127.0.0.1' || host === 'localhost' || inLocal(host) || host === app.master.host;
  }
};

/**
 * Load cluster server.
 *
 */
utils.loadCluster = function(app, server, serverMap) {
  var increaseFields = {};
  var host = server.host;
  var count = parseInt(server[Constants.RESERVED.CLUSTER_COUNT]);
  var seq = app.clusterSeq[server.serverType];
  if(!seq) {
    seq = 0;
    app.clusterSeq[server.serverType] = count;
  } else {
    app.clusterSeq[server.serverType] = seq + count;
  }

  for(var key in server) {
    var value = server[key].toString();
    if(value.indexOf(Constants.RESERVED.CLUSTER_SIGNAL) > 0) {
      var base = server[key].slice(0, -2);
      increaseFields[key] = base;
    }
  }

  var clone = function(src) {
    var rs = {};
    for(var key in src) {
      rs[key] = src[key];
    }
    return rs;
  };
  for(var i=0, l=seq; i<count; i++,l++) {
    var cserver = clone(server);
    cserver.id = Constants.RESERVED.CLUSTER_PREFIX + server.serverType + '-' + l;
    for(var k in increaseFields) {
      var v = parseInt(increaseFields[k]);
      cserver[k] = v + i;
    }
    serverMap[cserver.id] = cserver;
  }
};

utils.extends = function(origin, add) {
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

utils.headHandler = function(headBuffer) {
  var len = 0;
  for(var i=1; i<4; i++) {
    if(i > 1) {
      len <<= 8;
    }
    len += headBuffer.readUInt8(i);
  }
  return len;
};

var inLocal = function(host) {
  for (var index in localIps) {
    if (host === localIps[index]) {
      return true;
    }
  }
  return false;
};

var localIps = function() {
  var ifaces = os.networkInterfaces();
  var ips = [];
  var func = function(details) {
    if (details.family === 'IPv4') {
      ips.push(details.address);
    }
  };
  for (var dev in ifaces) {
    ifaces[dev].forEach(func);
  }
  return ips;
}();

var isObject = function(arg) {
  return typeof arg === 'object' && arg !== null;
};

}).call(this,"/node_modules/reckoner/node_modules/pomelo/lib/util/utils.js")
},{"../pomelo":20,"./constants":23,"child_process":1,"os":5,"pomelo-logger":28,"util":9}],27:[function(require,module,exports){
(function (process){
/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _each = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                setImmediate(fn);
            };
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
        }
    }
    else {
        async.nextTick = process.nextTick;
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback(null);
                    }
                }
            }));
        });
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            var sync = true;
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback(null);
                    }
                    else {
                        if (sync) {
                            async.nextTick(iterate);
                        }
                        else {
                            iterate();
                        }
                    }
                }
            });
            sync = false;
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (err, v) {
                results[x.index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        if (!keys.length) {
            return callback(null);
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (_keys(results).length === keys.length) {
                callback(null, results);
                callback = function () {};
            }
        });

        _each(keys, function (k) {
            var task = (tasks[k] instanceof Function) ? [tasks[k]]: tasks[k];
            var taskCallback = function (err) {
                if (err) {
                    callback(err);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    async.nextTick(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.nextTick(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            var sync = true;
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                if (sync) {
                    async.nextTick(function () {
                        async.whilst(test, iterator, callback);
                    });
                }
                else {
                    async.whilst(test, iterator, callback);
                }
            });
            sync = false;
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        var sync = true;
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            if (test()) {
                if (sync) {
                    async.nextTick(function () {
                        async.doWhilst(iterator, test, callback);
                    });
                }
                else {
                    async.doWhilst(iterator, test, callback);
                }
            }
            else {
                callback();
            }
        });
        sync = false;
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            var sync = true;
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                if (sync) {
                    async.nextTick(function () {
                        async.until(test, iterator, callback);
                    });
                }
                else {
                    async.until(test, iterator, callback);
                }
            });
            sync = false;
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        var sync = true;
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            if (!test()) {
                if (sync) {
                    async.nextTick(function () {
                        async.doUntil(iterator, test, callback);
                    });
                }
                else {
                    async.doUntil(iterator, test, callback);
                }
            }
            else {
                callback();
            }
        });
        sync = false;
    };

    async.queue = function (worker, concurrency) {
        function _insert(q, data, pos, callback) {
          if(data.constructor !== Array) {
              data = [data];
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === concurrency) {
                  q.saturated();
              }
              async.nextTick(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var sync = true;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(function () {
                        var cbArgs = arguments;

                        if (sync) {
                            async.nextTick(function () {
                                next.apply(null, cbArgs);
                            });
                        } else {
                            next.apply(null, arguments);
                        }
                    });
                    worker(task.data, cb);
                    sync = false;
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            }
        };
        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
                if(data.constructor !== Array) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.nextTick(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain) cargo.drain();
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                callback.apply(null, memo[key]);
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.compose = function (/* functions... */) {
        var fns = Array.prototype.reverse.call(arguments);
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    // AMD / RequireJS
    if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // Node.js
    else if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

}).call(this,require('_process'))
},{"_process":7}],28:[function(require,module,exports){
module.exports = require('./lib/logger');
},{"./lib/logger":29}],29:[function(require,module,exports){
(function (process){
var log4js = require('log4js');
var fs = require('fs');
var util = require('util');


var funcs = {
	'env': doEnv,
	'args': doArgs,
	'opts': doOpts
};

function getLogger(categoryName) {
	var args = arguments;
	var prefix = "";
	for (var i = 1; i < args.length; i++) {
		if (i !== args.length - 1)
			prefix = prefix + args[i] + "] [";
		else
			prefix = prefix + args[i];
	}
	if (typeof categoryName === 'string') {
		// category name is __filename then cut the prefix path
		categoryName = categoryName.replace(process.cwd(), '');
	}
	var logger = log4js.getLogger(categoryName);
	var pLogger = {};
	for (var key in logger) {
		pLogger[key] = logger[key];
	}

	['log', 'debug', 'info', 'warn', 'error', 'trace', 'fatal'].forEach(function(item) {
		pLogger[item] = function() {
			var p = "";
			if (!process.env.RAW_MESSAGE) {
				if (args.length > 1) {
					p = "[" + prefix + "] ";
				}
				if (args.length && process.env.LOGGER_LINE) {
					p = getLine() + ": " + p;
				}
				p = colorize(p, colours[item]);
			}

			if (args.length) {
				arguments[0] = p + arguments[0];
			}
			logger[item].apply(logger, arguments);
		}
	});
	return pLogger;
};

var configState = {};

function initReloadConfiguration(filename, reloadSecs) {
	if (configState.timerId) {
		clearInterval(configState.timerId);
		delete configState.timerId;
	}
	configState.filename = filename;
	configState.lastMTime = getMTime(filename);
	configState.timerId = setInterval(reloadConfiguration, reloadSecs * 1000);
};

function getMTime(filename) {
	var mtime;
	try {
		mtime = fs.statSync(filename).mtime;
	} catch (e) {
		throw new Error("Cannot find file with given path: " + filename);
	}
	return mtime;
};

function loadConfigurationFile(filename) {
	if (filename) {
		return JSON.parse(fs.readFileSync(filename, "utf8"));
	}
	return undefined;
};

function reloadConfiguration() {
	var mtime = getMTime(configState.filename);
	if (!mtime) {
		return;
	}
	if (configState.lastMTime && (mtime.getTime() > configState.lastMTime.getTime())) {
		configureOnceOff(loadConfigurationFile(configState.filename));
	}
	configState.lastMTime = mtime;
};


function configureOnceOff(config) {
	if (config) {
		try {
			configureLevels(config.levels);
			if (config.replaceConsole) {
				log4js.replaceConsole();
			} else {
				log4js.restoreConsole();
			}
		} catch (e) {
			throw new Error(
				"Problem reading log4js config " + util.inspect(config) +
				". Error was \"" + e.message + "\" (" + e.stack + ")"
			);
		}
	}
};

function configureLevels(levels) {
	if (levels) {
		for (var category in levels) {
			if (levels.hasOwnProperty(category)) {
				log4js.getLogger(category).setLevel(levels[category]);
			}
		}
	}
};

/**
 * Configure the logger.
 * Configure file just like log4js.json. And support ${scope:arg-name} format property setting.
 * It can replace the placeholder in runtime.
 * scope can be:
 *     env: environment variables, such as: env:PATH
 *     args: command line arguments, such as: args:1
 *     opts: key/value from opts argument of configure function
 *
 * @param  {String|Object} config configure file name or configure object
 * @param  {Object} opts   options
 * @return {Void}
 */

function configure(config, opts) {
	var filename = config;
	config = config || process.env.LOG4JS_CONFIG;
	opts = opts || {};

	if (typeof config === 'string') {
		config = JSON.parse(fs.readFileSync(config, "utf8"));
	}

	if (config) {
		config = replaceProperties(config, opts);
	}

	if (config && config.lineDebug) {
		process.env.LOGGER_LINE = true;
	}

	if (config && config.rawMessage) {
		process.env.RAW_MESSAGE = true;
	}

	if (filename && config && config.reloadSecs) {
		initReloadConfiguration(filename, config.reloadSecs);
	}

	// config object could not turn on the auto reload configure file in log4js

	log4js.configure(config, opts);
};

function replaceProperties(configObj, opts) {
	if (configObj instanceof Array) {
		for (var i = 0, l = configObj.length; i < l; i++) {
			configObj[i] = replaceProperties(configObj[i], opts);
		}
	} else if (typeof configObj === 'object') {
		var field;
		for (var f in configObj) {
			if (!configObj.hasOwnProperty(f)) {
				continue;
			}

			field = configObj[f];
			if (typeof field === 'string') {
				configObj[f] = doReplace(field, opts);
			} else if (typeof field === 'object') {
				configObj[f] = replaceProperties(field, opts);
			}
		}
	}

	return configObj;
}

function doReplace(src, opts) {
	if (!src) {
		return src;
	}

	var ptn = /\$\{(.*?)\}/g;
	var m, pro, ts, scope, name, defaultValue, func, res = '',
		lastIndex = 0;
	while ((m = ptn.exec(src))) {
		pro = m[1];
		ts = pro.split(':');
		if (ts.length !== 2 && ts.length !== 3) {
			res += pro;
			continue;
		}

		scope = ts[0];
		name = ts[1];
		if (ts.length === 3) {
			defaultValue = ts[2];
		}

		func = funcs[scope];
		if (!func && typeof func !== 'function') {
			res += pro;
			continue;
		}

		res += src.substring(lastIndex, m.index);
		lastIndex = ptn.lastIndex;
		res += (func(name, opts) || defaultValue);
	}

	if (lastIndex < src.length) {
		res += src.substring(lastIndex);
	}

	return res;
}

function doEnv(name) {
	return process.env[name];
}

function doArgs(name) {
	return process.argv[name];
}

function doOpts(name, opts) {
	return opts ? opts[name] : undefined;
}

function getLine() {
	var e = new Error();
	// now magic will happen: get line number from callstack
	var line = e.stack.split('\n')[3].split(':')[1];
	return line;
}

function colorizeStart(style) {
	return style ? '\x1B[' + styles[style][0] + 'm' : '';
}

function colorizeEnd(style) {
	return style ? '\x1B[' + styles[style][1] + 'm' : '';
}
/**
 * Taken from masylum's fork (https://github.com/masylum/log4js-node)
 */
function colorize(str, style) {
	return colorizeStart(style) + str + colorizeEnd(style);
}

var styles = {
	//styles
	'bold': [1, 22],
	'italic': [3, 23],
	'underline': [4, 24],
	'inverse': [7, 27],
	//grayscale
	'white': [37, 39],
	'grey': [90, 39],
	'black': [90, 39],
	//colors
	'blue': [34, 39],
	'cyan': [36, 39],
	'green': [32, 39],
	'magenta': [35, 39],
	'red': [31, 39],
	'yellow': [33, 39]
};

var colours = {
	'all': "grey",
	'trace': "blue",
	'debug': "cyan",
	'info': "green",
	'warn': "yellow",
	'error': "red",
	'fatal': "magenta",
	'off': "grey"
};

module.exports = {
	getLogger: getLogger,
	getDefaultLogger: log4js.getDefaultLogger,

	addAppender: log4js.addAppender,
	loadAppender: log4js.loadAppender,
	clearAppenders: log4js.clearAppenders,
	configure: configure,

	replaceConsole: log4js.replaceConsole,
	restoreConsole: log4js.restoreConsole,

	levels: log4js.levels,
	setGlobalLogLevel: log4js.setGlobalLogLevel,

	layouts: log4js.layouts,
	appenders: log4js.appenders
};
}).call(this,require('_process'))
},{"_process":7,"fs":1,"log4js":34,"util":9}],30:[function(require,module,exports){
"use strict";
var levels = require("./levels");
var DEFAULT_FORMAT = ':remote-addr - -' + 
  ' ":method :url HTTP/:http-version"' + 
  ' :status :content-length ":referrer"' + 
  ' ":user-agent"';
/**
 * Log requests with the given `options` or a `format` string.
 *
 * Options:
 *
 *   - `format`        Format string, see below for tokens
 *   - `level`         A log4js levels instance. Supports also 'auto'
 *
 * Tokens:
 *
 *   - `:req[header]` ex: `:req[Accept]`
 *   - `:res[header]` ex: `:res[Content-Length]`
 *   - `:http-version`
 *   - `:response-time`
 *   - `:remote-addr`
 *   - `:date`
 *   - `:method`
 *   - `:url`
 *   - `:referrer`
 *   - `:user-agent`
 *   - `:status`
 *
 * @param {String|Function|Object} format or options
 * @return {Function}
 * @api public
 */

function getLogger(logger4js, options) {
	if ('object' == typeof options) {
		options = options || {};
	} else if (options) {
		options = { format: options };
	} else {
		options = {};
	}

	var thislogger = logger4js
  , level = levels.toLevel(options.level, levels.INFO)
  , fmt = options.format || DEFAULT_FORMAT
  , nolog = options.nolog ? createNoLogCondition(options.nolog) : null;

  return function (req, res, next) {
    // mount safety
    if (req._logging) return next();

		// nologs
		if (nolog && nolog.test(req.originalUrl)) return next();
		if (thislogger.isLevelEnabled(level) || options.level === 'auto') {
      
			var start = new Date()
			, statusCode
			, writeHead = res.writeHead
			, end = res.end
			, url = req.originalUrl;

			// flag as logging
			req._logging = true;
      
			// proxy for statusCode.
			res.writeHead = function(code, headers){
				res.writeHead = writeHead;
				res.writeHead(code, headers);
				res.__statusCode = statusCode = code;
				res.__headers = headers || {};

				//status code response level handling
				if(options.level === 'auto'){
					level = levels.INFO;
					if(code >= 300) level = levels.WARN;
					if(code >= 400) level = levels.ERROR;
				} else {
					level = levels.toLevel(options.level, levels.INFO);
				}
			};
      
			// proxy end to output a line to the provided logger.
			res.end = function(chunk, encoding) {
				res.end = end;
				res.end(chunk, encoding);
				res.responseTime = new Date() - start;
				if (thislogger.isLevelEnabled(level)) {
					if (typeof fmt === 'function') {
						var line = fmt(req, res, function(str){ return format(str, req, res); });
						if (line) thislogger.log(level, line);
					} else {
						thislogger.log(level, format(fmt, req, res));
					}
				}
			};
		}
    
    //ensure next gets always called
    next();
  };
}

/**
 * Return formatted log line.
 *
 * @param  {String} str
 * @param  {IncomingMessage} req
 * @param  {ServerResponse} res
 * @return {String}
 * @api private
 */

function format(str, req, res) {
	return str
    .replace(':url', req.originalUrl)
    .replace(':method', req.method)
    .replace(':status', res.__statusCode || res.statusCode)
    .replace(':response-time', res.responseTime)
    .replace(':date', new Date().toUTCString())
    .replace(':referrer', req.headers.referer || req.headers.referrer || '')
    .replace(':http-version', req.httpVersionMajor + '.' + req.httpVersionMinor)
    .replace(
      ':remote-addr', req.ip || req._remoteAddress || ( 
      req.socket && 
        (req.socket.remoteAddress || (req.socket.socket && req.socket.socket.remoteAddress))
    ))
    .replace(':user-agent', req.headers['user-agent'] || '')
    .replace(
      ':content-length', 
      (res._headers && res._headers['content-length']) || 
        (res.__headers && res.__headers['Content-Length']) || 
        '-'
    )
    .replace(/:req\[([^\]]+)\]/g, function(_, field){ return req.headers[field.toLowerCase()]; })
    .replace(/:res\[([^\]]+)\]/g, function(_, field){
      return res._headers ? 
        (res._headers[field.toLowerCase()] || res.__headers[field])
        : (res.__headers && res.__headers[field]);
    });
}

/**
 * Return RegExp Object about nolog
 *
 * @param  {String} nolog
 * @return {RegExp}
 * @api private
 *
 * syntax
 *  1. String
 *   1.1 "\\.gif"
 *         NOT LOGGING http://example.com/hoge.gif and http://example.com/hoge.gif?fuga
 *         LOGGING http://example.com/hoge.agif
 *   1.2 in "\\.gif|\\.jpg$"
 *         NOT LOGGING http://example.com/hoge.gif and 
 *           http://example.com/hoge.gif?fuga and http://example.com/hoge.jpg?fuga
 *         LOGGING http://example.com/hoge.agif, 
 *           http://example.com/hoge.ajpg and http://example.com/hoge.jpg?hoge
 *   1.3 in "\\.(gif|jpe?g|png)$"
 *         NOT LOGGING http://example.com/hoge.gif and http://example.com/hoge.jpeg
 *         LOGGING http://example.com/hoge.gif?uid=2 and http://example.com/hoge.jpg?pid=3
 *  2. RegExp
 *   2.1 in /\.(gif|jpe?g|png)$/
 *         SAME AS 1.3
 *  3. Array
 *   3.1 ["\\.jpg$", "\\.png", "\\.gif"]
 *         SAME AS "\\.jpg|\\.png|\\.gif"
 */
function createNoLogCondition(nolog) {
  var regexp = null;

	if (nolog) {
    if (nolog instanceof RegExp) {
      regexp = nolog;
    } 
    
    if (typeof nolog === 'string') {
      regexp = new RegExp(nolog);
    }
    
    if (Array.isArray(nolog)) {
      var regexpsAsStrings = nolog.map(
        function convertToStrings(o) { 
          return o.source ? o.source : o;
        }
      );
      regexp = new RegExp(regexpsAsStrings.join('|'));
    }
  }

  return regexp;
}

exports.connectLogger = getLogger;

},{"./levels":33}],31:[function(require,module,exports){
"use strict";
exports.ISO8601_FORMAT = "yyyy-MM-dd hh:mm:ss.SSS";
exports.ISO8601_WITH_TZ_OFFSET_FORMAT = "yyyy-MM-ddThh:mm:ssO";
exports.DATETIME_FORMAT = "dd MM yyyy hh:mm:ss.SSS";
exports.ABSOLUTETIME_FORMAT = "hh:mm:ss.SSS";

function padWithZeros(vNumber, width) {
  var numAsString = vNumber + "";
  while (numAsString.length < width) {
    numAsString = "0" + numAsString;
  }
  return numAsString;
}
  
function addZero(vNumber) {
  return padWithZeros(vNumber, 2);
}

/**
 * Formats the TimeOffest
 * Thanks to http://www.svendtofte.com/code/date_format/
 * @private
 */
function offset(date) {
  // Difference to Greenwich time (GMT) in hours
  var os = Math.abs(date.getTimezoneOffset());
  var h = String(Math.floor(os/60));
  var m = String(os%60);
  if (h.length == 1) {
    h = "0" + h;
  }
  if (m.length == 1) {
    m = "0" + m;
  }
  return date.getTimezoneOffset() < 0 ? "+"+h+m : "-"+h+m;
}

exports.asString = function(/*format,*/ date) {
  var format = exports.ISO8601_FORMAT;
  if (typeof(date) === "string") {
    format = arguments[0];
    date = arguments[1];
  }

  var vDay = addZero(date.getDate());
  var vMonth = addZero(date.getMonth()+1);
  var vYearLong = addZero(date.getFullYear());
  var vYearShort = addZero(date.getFullYear().toString().substring(2,4));
  var vYear = (format.indexOf("yyyy") > -1 ? vYearLong : vYearShort);
  var vHour  = addZero(date.getHours());
  var vMinute = addZero(date.getMinutes());
  var vSecond = addZero(date.getSeconds());
  var vMillisecond = padWithZeros(date.getMilliseconds(), 3);
  var vTimeZone = offset(date);
  var formatted = format
    .replace(/dd/g, vDay)
    .replace(/MM/g, vMonth)
    .replace(/y{1,4}/g, vYear)
    .replace(/hh/g, vHour)
    .replace(/mm/g, vMinute)
    .replace(/ss/g, vSecond)
    .replace(/SSS/g, vMillisecond)
    .replace(/O/g, vTimeZone);
  return formatted;

};

},{}],32:[function(require,module,exports){
"use strict";
var dateFormat = require('./date_format')
, os = require('os')
, eol = os.EOL || '\n'
, util = require('util')
, replacementRegExp = /%[sdj]/g
, layoutMakers = {
  "messagePassThrough": function() { return messagePassThroughLayout; }, 
  "basic": function() { return basicLayout; }, 
  "colored": function() { return colouredLayout; }, 
  "coloured": function() { return colouredLayout; }, 
  "pattern": function (config) {
    return patternLayout(config && config.pattern, config && config.tokens);
	}
}
, colours = {
  ALL: "grey", 
  TRACE: "blue", 
  DEBUG: "cyan", 
  INFO: "green", 
  WARN: "yellow", 
  ERROR: "red", 
  FATAL: "magenta", 
  OFF: "grey"
};

function wrapErrorsWithInspect(items) {
  return items.map(function(item) {
    if ((item instanceof Error) && item.stack) {
      return { inspect: function() { return util.format(item) + '\n' + item.stack; } };
    } else {
      return item;
    }
  });
}

function formatLogData(logData) {
  var data = Array.isArray(logData) ? logData : Array.prototype.slice.call(arguments);
  return util.format.apply(util, wrapErrorsWithInspect(data));
}

var styles = {
    //styles
  'bold'      : [1,  22],
  'italic'    : [3,  23],
  'underline' : [4,  24],
  'inverse'   : [7,  27],
  //grayscale
  'white'     : [37, 39],
  'grey'      : [90, 39],
  'black'     : [90, 39],
  //colors
  'blue'      : [34, 39],
  'cyan'      : [36, 39],
  'green'     : [32, 39],
  'magenta'   : [35, 39],
  'red'       : [31, 39],
  'yellow'    : [33, 39]
};

function colorizeStart(style) {
  return style ? '\x1B[' + styles[style][0] + 'm' : '';
}
function colorizeEnd(style) {
  return style ? '\x1B[' + styles[style][1] + 'm' : '';
}
/**
 * Taken from masylum's fork (https://github.com/masylum/log4js-node)
 */
function colorize (str, style) {
  return colorizeStart(style) + str + colorizeEnd(style);
}

function timestampLevelAndCategory(loggingEvent, colour) {
  var output = colorize(
    formatLogData(
      '[%s] [%s] %s - '
      , dateFormat.asString(loggingEvent.startTime)
      , loggingEvent.level
      , loggingEvent.categoryName
    )
    , colour
  );
  return output;
}

/**
 * BasicLayout is a simple layout for storing the logs. The logs are stored
 * in following format:
 * <pre>
 * [startTime] [logLevel] categoryName - message\n
 * </pre>
 *
 * @author Stephan Strittmatter
 */
function basicLayout (loggingEvent) {
  return timestampLevelAndCategory(loggingEvent) + formatLogData(loggingEvent.data);
}

/**
 * colouredLayout - taken from masylum's fork.
 * same as basicLayout, but with colours.
 */
function colouredLayout (loggingEvent) {
  return timestampLevelAndCategory(
    loggingEvent,
    colours[loggingEvent.level.toString()]
  ) + formatLogData(loggingEvent.data);
}

function messagePassThroughLayout (loggingEvent) {
  return formatLogData(loggingEvent.data);
}

/**
 * PatternLayout
 * Format for specifiers is %[padding].[truncation][field]{[format]}
 * e.g. %5.10p - left pad the log level by 5 characters, up to a max of 10
 * Fields can be any of:
 *  - %r time in toLocaleTimeString format
 *  - %p log level
 *  - %c log category
 *  - %h hostname
 *  - %m log data
 *  - %d date in various formats
 *  - %% %
 *  - %n newline
 *  - %x{<tokenname>} add dynamic tokens to your log. Tokens are specified in the tokens parameter
 * You can use %[ and %] to define a colored block.
 *
 * Tokens are specified as simple key:value objects. 
 * The key represents the token name whereas the value can be a string or function
 * which is called to extract the value to put in the log message. If token is not
 * found, it doesn't replace the field.
 *
 * A sample token would be: { "pid" : function() { return process.pid; } }
 *
 * Takes a pattern string, array of tokens and returns a layout function.
 * @param {String} Log format pattern String
 * @param {object} map object of different tokens
 * @return {Function}
 * @author Stephan Strittmatter
 * @author Jan Schmidle
 */
function patternLayout (pattern, tokens) {
  var TTCC_CONVERSION_PATTERN  = "%r %p %c - %m%n";
  var regex = /%(-?[0-9]+)?(\.?[0-9]+)?([\[\]cdhmnprx%])(\{([^\}]+)\})?|([^%]+)/;
  
  pattern = pattern || TTCC_CONVERSION_PATTERN;

  function categoryName(loggingEvent, specifier) {
    var loggerName = loggingEvent.categoryName;
    if (specifier) {
      var precision = parseInt(specifier, 10);
      var loggerNameBits = loggerName.split(".");
      if (precision < loggerNameBits.length) {
        loggerName = loggerNameBits.slice(loggerNameBits.length - precision).join(".");
      }
    }
    return loggerName;
  }

  function formatAsDate(loggingEvent, specifier) {
    var format = dateFormat.ISO8601_FORMAT;
    if (specifier) {
      format = specifier;
      // Pick up special cases
      if (format == "ISO8601") {
        format = dateFormat.ISO8601_FORMAT;
      } else if (format == "ISO8601_WITH_TZ_OFFSET") {
        format = dateFormat.ISO8601_WITH_TZ_OFFSET_FORMAT; 
      } else if (format == "ABSOLUTE") {
        format = dateFormat.ABSOLUTETIME_FORMAT;
      } else if (format == "DATE") {
        format = dateFormat.DATETIME_FORMAT;
      }
    }
    // Format the date
    return dateFormat.asString(format, loggingEvent.startTime);
  }
  
  function hostname() {
    return os.hostname().toString();
  }

  function formatMessage(loggingEvent) {
    return formatLogData(loggingEvent.data);
  }
  
  function endOfLine() {
    return eol;
  }

  function logLevel(loggingEvent) {
    return loggingEvent.level.toString();
  }

  function startTime(loggingEvent) {
    return "" + loggingEvent.startTime.toLocaleTimeString();
  }

  function startColour(loggingEvent) {
    return colorizeStart(colours[loggingEvent.level.toString()]);
  }

  function endColour(loggingEvent) {
    return colorizeEnd(colours[loggingEvent.level.toString()]);
  }

  function percent() {
    return '%';
  }

  function userDefined(loggingEvent, specifier) {
    if (typeof(tokens[specifier]) !== 'undefined') {
      if (typeof(tokens[specifier]) === 'function') {
        return tokens[specifier](loggingEvent);
      } else {
        return tokens[specifier];
      }
    }
    return null;
  }

  var replacers = {
    'c': categoryName,
    'd': formatAsDate,
    'h': hostname,
    'm': formatMessage,
    'n': endOfLine,
    'p': logLevel,
    'r': startTime,
    '[': startColour,
    ']': endColour,
    '%': percent,
    'x': userDefined
  };

  function replaceToken(conversionCharacter, loggingEvent, specifier) {
    return replacers[conversionCharacter](loggingEvent, specifier);
  }

  function truncate(truncation, toTruncate) {
    var len;
    if (truncation) {
      len = parseInt(truncation.substr(1), 10);
      return toTruncate.substring(0, len);
    }

    return toTruncate;
  }

  function pad(padding, toPad) {
    var len;
    if (padding) {
      if (padding.charAt(0) == "-") {
        len = parseInt(padding.substr(1), 10);
        // Right pad with spaces
        while (toPad.length < len) {
          toPad += " ";
        }
      } else {
        len = parseInt(padding, 10);
        // Left pad with spaces
        while (toPad.length < len) {
          toPad = " " + toPad;
        }
      }
    }
    return toPad;
  }
  
  return function(loggingEvent) {
    var formattedString = "";
    var result;
    var searchString = pattern;
    
    while ((result = regex.exec(searchString))) {
      var matchedString = result[0];
      var padding = result[1];
      var truncation = result[2];
      var conversionCharacter = result[3];
      var specifier = result[5];
      var text = result[6];
      
      // Check if the pattern matched was just normal text
      if (text) {
        formattedString += "" + text;
      } else {
        // Create a raw replacement string based on the conversion
        // character and specifier
        var replacement = 
          replaceToken(conversionCharacter, loggingEvent, specifier) || 
          matchedString;

        // Format the replacement according to any padding or
        // truncation specified
        replacement = truncate(truncation, replacement);
        replacement = pad(padding, replacement);
        formattedString += replacement;
      }
      searchString = searchString.substr(result.index + result[0].length);
    }
    return formattedString;
  };

}

module.exports = {
  basicLayout: basicLayout, 
  messagePassThroughLayout: messagePassThroughLayout, 
  patternLayout: patternLayout, 
  colouredLayout: colouredLayout, 
  coloredLayout: colouredLayout, 
  layout: function(name, config) {
    return layoutMakers[name] && layoutMakers[name](config);
  }
};

},{"./date_format":31,"os":2,"util":9}],33:[function(require,module,exports){
"use strict";

function Level(level, levelStr) {
  this.level = level;
  this.levelStr = levelStr;
}

/**
 * converts given String to corresponding Level
 * @param {String} sArg String value of Level OR Log4js.Level
 * @param {Log4js.Level} defaultLevel default Level, if no String representation
 * @return Level object
 * @type Log4js.Level
 */
function toLevel(sArg, defaultLevel) {

  if (!sArg) {
    return defaultLevel;
  }

  if (typeof sArg == "string") {
    var s = sArg.toUpperCase();
    if (module.exports[s]) {
      return module.exports[s];
    } else {
      return defaultLevel;
    }
  }

  return toLevel(sArg.toString());
}

Level.prototype.toString = function() {
  return this.levelStr;
};

Level.prototype.isLessThanOrEqualTo = function(otherLevel) {
  if (typeof otherLevel === "string") {
    otherLevel = toLevel(otherLevel);
  }
  return this.level <= otherLevel.level;
};

Level.prototype.isGreaterThanOrEqualTo = function(otherLevel) {
  if (typeof otherLevel === "string") {
    otherLevel = toLevel(otherLevel);
  }
  return this.level >= otherLevel.level;
};

Level.prototype.isEqualTo = function(otherLevel) {
  if (typeof otherLevel == "string") {
    otherLevel = toLevel(otherLevel);
  }
  return this.level === otherLevel.level;
};

module.exports = {
  ALL: new Level(Number.MIN_VALUE, "ALL"), 
  TRACE: new Level(5000, "TRACE"), 
  DEBUG: new Level(10000, "DEBUG"), 
  INFO: new Level(20000, "INFO"), 
  WARN: new Level(30000, "WARN"), 
  ERROR: new Level(40000, "ERROR"), 
  FATAL: new Level(50000, "FATAL"), 
  OFF: new Level(Number.MAX_VALUE, "OFF"), 
  toLevel: toLevel
};

},{}],34:[function(require,module,exports){
(function (process){
"use strict";
/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview log4js is a library to log in JavaScript in similar manner
 * than in log4j for Java. The API should be nearly the same.
 *
 * <h3>Example:</h3>
 * <pre>
 *  var logging = require('log4js');
 *  //add an appender that logs all messages to stdout.
 *  logging.addAppender(logging.consoleAppender());
 *  //add an appender that logs "some-category" to a file
 *  logging.addAppender(logging.fileAppender("file.log"), "some-category");
 *  //get a logger
 *  var log = logging.getLogger("some-category");
 *  log.setLevel(logging.levels.TRACE); //set the Level
 *
 *  ...
 *
 *  //call the log
 *  log.trace("trace me" );
 * </pre>
 *
 * NOTE: the authors below are the original browser-based log4js authors
 * don't try to contact them about bugs in this version :)
 * @version 1.0
 * @author Stephan Strittmatter - http://jroller.com/page/stritti
 * @author Seth Chisamore - http://www.chisamore.com
 * @since 2005-05-20
 * @static
 * Website: http://log4js.berlios.de
 */
var events = require('events')
, async = require('async')
, fs = require('fs')
, path = require('path')
, util = require('util')
, layouts = require('./layouts')
, levels = require('./levels')
, loggerModule = require('./logger')
, LoggingEvent = loggerModule.LoggingEvent
, Logger = loggerModule.Logger
, ALL_CATEGORIES = '[all]'
, appenders = {}
, loggers = {}
, appenderMakers = {}
, appenderShutdowns = {}
, defaultConfig =   {
  appenders: [
    { type: "console" }
  ],
  replaceConsole: false
};

function hasLogger(logger) {
  return loggers.hasOwnProperty(logger);
}


/**
 * Get a logger instance. Instance is cached on categoryName level.
 * @param  {String} categoryName name of category to log to.
 * @return {Logger} instance of logger for the category
 * @static
 */
function getLogger (categoryName) {

  // Use default logger if categoryName is not specified or invalid
  if (typeof categoryName !== "string") {
    categoryName = Logger.DEFAULT_CATEGORY;
  }

  var appenderList;
  if (!hasLogger(categoryName)) {
    // Create the logger for this name if it doesn't already exist
    loggers[categoryName] = new Logger(categoryName);
    if (appenders[categoryName]) {
      appenderList = appenders[categoryName];
      appenderList.forEach(function(appender) {
        loggers[categoryName].addListener("log", appender);
      });
    }
    if (appenders[ALL_CATEGORIES]) {
      appenderList = appenders[ALL_CATEGORIES];
      appenderList.forEach(function(appender) {
        loggers[categoryName].addListener("log", appender);
      });
    }
  }
  
  return loggers[categoryName];
}

/**
 * args are appender, then zero or more categories
 */
function addAppender () {
  var args = Array.prototype.slice.call(arguments);
  var appender = args.shift();
  if (args.length === 0 || args[0] === undefined) {
    args = [ ALL_CATEGORIES ];
  }
  //argument may already be an array
  if (Array.isArray(args[0])) {
    args = args[0];
  }
  
  args.forEach(function(category) {
    addAppenderToCategory(appender, category);
    
    if (category === ALL_CATEGORIES) {
      addAppenderToAllLoggers(appender);
    } else if (hasLogger(category)) {
      loggers[category].addListener("log", appender);
    }
  });
}

function addAppenderToAllLoggers(appender) {
  for (var logger in loggers) {
    if (hasLogger(logger)) {
      loggers[logger].addListener("log", appender);
    }
  }
}

function addAppenderToCategory(appender, category) {
  if (!appenders[category]) {
    appenders[category] = [];
  }
  appenders[category].push(appender);
}

function clearAppenders () {
  appenders = {};
  for (var logger in loggers) {
    if (hasLogger(logger)) {
      loggers[logger].removeAllListeners("log");
    }
  }
}

function configureAppenders(appenderList, options) {
  clearAppenders();
  if (appenderList) {
    appenderList.forEach(function(appenderConfig) {
      loadAppender(appenderConfig.type);
      var appender;
      appenderConfig.makers = appenderMakers;
      try {
        appender = appenderMakers[appenderConfig.type](appenderConfig, options);
        addAppender(appender, appenderConfig.category);
      } catch(e) {
        throw new Error("log4js configuration problem for " + util.inspect(appenderConfig), e);
      }
    });
  }
}

function configureLevels(levels) {
  if (levels) {
    for (var category in levels) {
      if (levels.hasOwnProperty(category)) {
        if(category === ALL_CATEGORIES) {
          setGlobalLogLevel(levels[category]);
        }
        getLogger(category).setLevel(levels[category]);
      }
    }
  }
}

function setGlobalLogLevel(level) {
  Logger.prototype.level = levels.toLevel(level, levels.TRACE);
}

/**
 * Get the default logger instance.
 * @return {Logger} instance of default logger
 * @static
 */
function getDefaultLogger () {
  return getLogger(Logger.DEFAULT_CATEGORY);
}

var configState = {};

function loadConfigurationFile(filename) {
  if (filename) {
    return JSON.parse(fs.readFileSync(filename, "utf8"));
  }
  return undefined;
}

function configureOnceOff(config, options) {
  if (config) {
    try {
      configureAppenders(config.appenders, options);
      configureLevels(config.levels);
      
      if (config.replaceConsole) {
        replaceConsole();
      } else {
        restoreConsole();
      }
    } catch (e) {
      throw new Error(
        "Problem reading log4js config " + util.inspect(config) + 
          ". Error was \"" + e.message + "\" (" + e.stack + ")"
      );
    }
  }
}

function reloadConfiguration() {
  var mtime = getMTime(configState.filename);
  if (!mtime) return;

  if (configState.lastMTime && (mtime.getTime() > configState.lastMTime.getTime())) {
    configureOnceOff(loadConfigurationFile(configState.filename));
  }
  configState.lastMTime = mtime;
}

function getMTime(filename) {
  var mtime;
  try {
    mtime = fs.statSync(configState.filename).mtime;
  } catch (e) {
    getLogger('log4js').warn('Failed to load configuration file ' + filename);
  }
  return mtime;
}

function initReloadConfiguration(filename, options) {
  if (configState.timerId) {
    clearInterval(configState.timerId);
    delete configState.timerId;
  }
  configState.filename = filename;
  configState.lastMTime = getMTime(filename);
  configState.timerId = setInterval(reloadConfiguration, options.reloadSecs*1000);
}

function configure(configurationFileOrObject, options) {
  var config = configurationFileOrObject;
  config = config || process.env.LOG4JS_CONFIG;
  options = options || {};
  
  if (config === undefined || config === null || typeof(config) === 'string') {
    if (options.reloadSecs) {
      initReloadConfiguration(config, options);
    }
    config = loadConfigurationFile(config) || defaultConfig;
  } else {
    if (options.reloadSecs) {
      getLogger('log4js').warn(
        'Ignoring configuration reload parameter for "object" configuration.'
      );
    }
  }
  configureOnceOff(config, options);
}

var originalConsoleFunctions = {
  log: console.log,
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error
};

function replaceConsole(logger) {
  function replaceWith(fn) {
    return function() {
      fn.apply(logger, arguments);
    };
  }
  logger = logger || getLogger("console");
  ['log','debug','info','warn','error'].forEach(function (item) {
    console[item] = replaceWith(item === 'log' ? logger.info : logger[item]);
  });
}

function restoreConsole() {
  ['log', 'debug', 'info', 'warn', 'error'].forEach(function (item) {
    console[item] = originalConsoleFunctions[item];
  });
}

/**
 * Load an appenderModule based on the provided appender filepath. Will first
 * check if the appender path is a subpath of the log4js "lib/appenders" directory.
 * If not, it will attempt to load the the appender as complete path.
 *
 * @param {string} appender The filepath for the appender.
 * @returns {Object|null} The required appender or null if appender could not be loaded.
 * @private
 */
function requireAppender(appender) {
  var appenderModule;
  try {
    appenderModule = require('./appenders/' + appender);
  } catch (e) {
    appenderModule = require(appender);
  }
  return appenderModule;
}

/**
 * Load an appender. Provided the appender path to be loaded. If appenderModule is defined,
 * it will be used in place of requiring the appender module.
 *
 * @param {string} appender The path to the appender module.
 * @param {Object|void} [appenderModule] The pre-required appender module. When provided,
 * instead of requiring the appender by its path, this object will be used.
 * @returns {void}
 * @private
 */
function loadAppender(appender, appenderModule) {
  appenderModule = appenderModule || requireAppender(appender);

  if (!appenderModule) {
    throw new Error("Invalid log4js appender: " + util.inspect(appender));
  }

  module.exports.appenders[appender] = appenderModule.appender.bind(appenderModule);
  if (appenderModule.shutdown) {
    appenderShutdowns[appender] = appenderModule.shutdown.bind(appenderModule);
  }
  appenderMakers[appender] = appenderModule.configure.bind(appenderModule);
}

/**
 * Shutdown all log appenders. This will first disable all writing to appenders
 * and then call the shutdown function each appender.
 *
 * @params {Function} cb - The callback to be invoked once all appenders have
 *  shutdown. If an error occurs, the callback will be given the error object
 *  as the first argument.
 * @returns {void}
 */
function shutdown(cb) {
  // First, disable all writing to appenders. This prevents appenders from
  // not being able to be drained because of run-away log writes.
  loggerModule.disableAllLogWrites();

  // Next, get all the shutdown functions for appenders as an array.
  var shutdownFunctions = Object.keys(appenderShutdowns).reduce(
    function(accum, category) {
      return accum.concat(appenderShutdowns[category]);
    }, []);

  // Call each of the shutdown functions.
  async.forEach(
    shutdownFunctions,
    function(shutdownFn, done) {
      shutdownFn(done);
    },
		cb
  );
}

module.exports = {
  getLogger: getLogger,
  getDefaultLogger: getDefaultLogger,
  hasLogger: hasLogger,
  
  addAppender: addAppender,
  loadAppender: loadAppender,
  clearAppenders: clearAppenders,
  configure: configure,
  shutdown: shutdown,
  
  replaceConsole: replaceConsole,
  restoreConsole: restoreConsole,
  
  levels: levels,
  setGlobalLogLevel: setGlobalLogLevel,
  
  layouts: layouts,
  appenders: {},
  appenderMakers: appenderMakers,
  connectLogger: require('./connect-logger').connectLogger
};

//set ourselves up
configure();


}).call(this,require('_process'))
},{"./connect-logger":30,"./layouts":32,"./levels":33,"./logger":35,"_process":7,"async":36,"events":3,"fs":1,"path":6,"util":9}],35:[function(require,module,exports){
"use strict";
var levels = require('./levels')
, util = require('util')
, events = require('events')
, DEFAULT_CATEGORY = '[default]';

var logWritesEnabled = true;

/**
 * Models a logging event.
 * @constructor
 * @param {String} categoryName name of category
 * @param {Log4js.Level} level level of message
 * @param {Array} data objects to log
 * @param {Log4js.Logger} logger the associated logger
 * @author Seth Chisamore
 */
function LoggingEvent (categoryName, level, data, logger) {
  this.startTime = new Date();
  this.categoryName = categoryName;
  this.data = data;
  this.level = level;
  this.logger = logger;
}

/**
 * Logger to log messages.
 * use {@see Log4js#getLogger(String)} to get an instance.
 * @constructor
 * @param name name of category to log to
 * @author Stephan Strittmatter
 */
function Logger (name, level) {
  this.category = name || DEFAULT_CATEGORY;
  
  if (level) {
    this.setLevel(level);
  }
}
util.inherits(Logger, events.EventEmitter);
Logger.DEFAULT_CATEGORY = DEFAULT_CATEGORY;
Logger.prototype.level = levels.TRACE;

Logger.prototype.setLevel = function(level) {
  this.level = levels.toLevel(level, this.level || levels.TRACE);
};

Logger.prototype.removeLevel = function() {
  delete this.level;
};

Logger.prototype.log = function() {
  var args = Array.prototype.slice.call(arguments)
  , logLevel = levels.toLevel(args.shift())
  , loggingEvent;
  if (this.isLevelEnabled(logLevel)) {
    loggingEvent = new LoggingEvent(this.category, logLevel, args, this);
    this.emit("log", loggingEvent);
  }
};

Logger.prototype.isLevelEnabled = function(otherLevel) {
  return this.level.isLessThanOrEqualTo(otherLevel);
};

['Trace','Debug','Info','Warn','Error','Fatal'].forEach(
  function(levelString) {
    var level = levels.toLevel(levelString);
    Logger.prototype['is'+levelString+'Enabled'] = function() {
      return this.isLevelEnabled(level);
    };
    
    Logger.prototype[levelString.toLowerCase()] = function () {
      if (logWritesEnabled && this.isLevelEnabled(level)) {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(level);
        Logger.prototype.log.apply(this, args);
      }
    };
  }
);

/**
 * Disable all log writes.
 * @returns {void}
 */
function disableAllLogWrites() {
  logWritesEnabled = false;
}

/**
 * Enable log writes.
 * @returns {void}
 */
function enableAllLogWrites() {
  logWritesEnabled = true;
}

exports.LoggingEvent = LoggingEvent;
exports.Logger = Logger;
exports.disableAllLogWrites = disableAllLogWrites;
exports.enableAllLogWrites = enableAllLogWrites;

},{"./levels":33,"events":3,"util":9}],36:[function(require,module,exports){
// This file is just added for convenience so this repository can be
// directly checked out into a project's deps folder
module.exports = require('./lib/async');

},{"./lib/async":37}],37:[function(require,module,exports){
(function (process){
/*global setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root = this,
        previous_async = root.async;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    else {
        root.async = async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    //// cross-browser compatiblity functions ////

    var _forEach = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _forEach(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _forEach(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    var _indexOf = function (arr, item) {
        if (arr.indexOf) {
            return arr.indexOf(item);
        }
        for (var i = 0; i < arr.length; i += 1) {
            if (arr[i] === item) {
                return i;
            }
        }
        return -1;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        async.nextTick = function (fn) {
            setTimeout(fn, 0);
        };
    }
    else {
        async.nextTick = process.nextTick;
    }

    async.forEach = function (arr, iterator, callback) {
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _forEach(arr, function (x) {
            iterator(x, function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed === arr.length) {
                        callback();
                    }
                }
            });
        });
    };

    async.forEachSeries = function (arr, iterator, callback) {
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed === arr.length) {
                        callback();
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    
    async.forEachLimit = function (arr, limit, iterator, callback) {
        if (!arr.length || limit <= 0) {
            return callback(); 
        }
        var completed = 0;
        var started = 0;
        var running = 0;
        
        (function replenish () {
          if (completed === arr.length) {
              return callback();
          }
          
          while (running < limit && started < arr.length) {
            iterator(arr[started], function (err) {
              if (err) {
                  callback(err);
                  callback = function () {};
              }
              else {
                  completed += 1;
                  running -= 1;
                  if (completed === arr.length) {
                      callback();
                  }
                  else {
                      replenish();
                  }
              }
            });
            started += 1;
            running += 1;
          }
        })();
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.forEach].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.forEachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (err, v) {
                results[x.index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);


    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.forEachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.forEach(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.forEach(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        if (!keys.length) {
            return callback(null);
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            _forEach(listeners, function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (_keys(results).length === keys.length) {
                callback(null, results);
            }
        });

        _forEach(keys, function (k) {
            var task = (tasks[k] instanceof Function) ? [tasks[k]]: tasks[k];
            var taskCallback = function (err) {
                if (err) {
                    callback(err);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    taskComplete();
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.waterfall = function (tasks, callback) {
        if (!tasks.length) {
            return callback();
        }
        callback = callback || function () {};
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.nextTick(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    async.parallel = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            async.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.forEach(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.forEachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.queue = function (worker, concurrency) {
        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
                q.tasks.push({data: data, callback: callback});
                if(q.saturated && q.tasks.length == concurrency) q.saturated();
                async.nextTick(q.process);
            },
            process: function () {
                if (workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if(q.empty && q.tasks.length == 0) q.empty();
                    workers += 1;
                    worker(task.data, function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if(q.drain && q.tasks.length + workers == 0) q.drain();
                        q.process();
                    });
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            }
        };
        return q;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _forEach(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                callback.apply(null, memo[key]);
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      }
    };

}());

}).call(this,require('_process'))
},{"_process":7}],38:[function(require,module,exports){
/*===================================================*\
 * Requires
\*===================================================*/
var JClass = require('jclass'),
	EventEmitter = require('node-event-emitter');

/*===================================================*\
 * GameObject()
\*===================================================*/
var EventDispatcher = module.exports = JClass._extend(EventEmitter.prototype);
},{"jclass":13,"node-event-emitter":15}],39:[function(require,module,exports){
/*===================================================*\
 * Requires
\*===================================================*/
var JClass = require('jclass');

/*===================================================*\
 * ReckonerBase
\*===================================================*/
var ReckonerBase = JClass._extend({
	//=========================
  // Properties
  //=========================
	setState: function(value) {
		
	},
	getState: function() {
		
	},
	getFPS: function () {
    return 30;
  },
	/**
	 * Returns the world object. Not to be confused with getState which returns
	 * just state information.
	 */
	getWorld: function(value) {
		return this.world;
	},
	//=========================
  // Constructor
  //=========================
	init: function () {
	},
	//=========================
  // Methods
  //=========================
	/**
	 * Moves the game forward by elapsed milliseconds.
	 */
	update: function (elapsed, tracker) {
		
	},
	/**
	 * Projects the game elapsed milliseconds into the future and returns
	 * the world result.
	 */
	project: function (elapsed) {
		
	}
});

/*===================================================*\
 * modules
\*===================================================*/
module.exports = ReckonerBase;
},{"jclass":13}],40:[function(require,module,exports){
(function (process){
/*===================================================*\
 * Requires
\*===================================================*/
var HashArray = require('hasharray'),
  JClass = require('jclass'),
  ReckonerBase = require('./ReckonerBase');

/*===================================================*\
 * Globals
\*===================================================*/
var FPS = 30,
  MIN_FRAME_TIME = 0.3,
  /**
   * How many seconds to wait to update the clients with data.
   */
  CLIENT_UPDATE_FPS = 30;

/*===================================================*\
 * ReckonerServer()
\*===================================================*/
var ReckonerServer = ReckonerBase._extend({
  init: function init(pomelo, GameController) {
    init._super.call(this);

    this.pomelo = pomelo;

    this.messaging = pomelo.get('messagingService');

    this.games = new HashArray('rid');

    this.lastTime = undefined;
    this.elapsed = undefined;

    this.id = 'sid:' + Math.round(Math.random() * 100).toString(16) + ':' + process.pid;
    this.interval = undefined;
  },
  /*============================*\
   * Properties
  \*============================*/
  getNow: function() {
    return (new Date()).getTime();
  },
  /*============================*\
   * Methods
  \*============================*/
  addGame: function (game, rid) {
    game.messaging = this.messaging;
    game.clientUpdateTimer = 0;
    game.rid = rid;

    this.games.add(game);
  },
  sendState: function() {
    this.games.all.forEach(function (game) {
      var channel = this.pomelo.get('channelService').getChannel(game.rid, false);

      if (channel)
        channel.pushMessage('serverState', game.getState());
      else
        console.log('WARNING: attempted to push to channel but does not exist', game.rid)
    });
  },
  start: function () {
    this.interval = setInterval(this.frameHandler.bind(this), 1000 / FPS);
  },
  stopAll: function () {
    clearInterval(this.interval);
  },
  resetAll: function () {
    this.games.all.forEach(function () {
      game.reset();
      game.start();
    });
  },
  /*============================*\
   * Events
  \*============================*/
  /**
   * Called once per frame, defined by the FPS property above.
   */
  frameHandler: function () {
    var self = this;

    if (!this.lastTime)
      return this.lastTime = this.getNow();

    // Elapsed is 0.0-0.3 seconds.
    this.elapsed =  (this.getNow() - this.lastTime) / 1000.0;
    this.lastTime = this.getNow();
    this.elapsed = (this.elapsed > MIN_FRAME_TIME ? MIN_FRAME_TIME : this.elapsed);

    this.games.forEach(function (game) {
      game.serverUpdate(this.elapsed);
    });

    this.clientUpdateTimer += this.elapsed;

    if (this.clientUpdateTimer > CLIENT_UPDATE_FPS / 1000.0)
    {
      this.sendState();
      this.clientUpdateTimer = 0;
    }
  },
  /**
   * Called when the socket receives user input.
   */
  session_userInputHandler: function(msg, session) {
    var game = this.games.get(msg.rid);

    if (game)
      game.addUserInputForSession(session.uid, msg);
    else
      console.log('ERROR: unable to find game for rid: ' + msg.rid);
  },
  /**
   * Called by the game handler whenever a user disconnects or is forcibly removed from
   * the game by a connection issue.
   */
  session_disconnectedHandler: function (uid) {
    console.log('SESSION DISCONNECTED:', uid);

    this.game.world.players.removeByKey(uid);
    this.game.world.getChildren().get(uid).destroy();

    if (this.game.world.getChildren().getAsArray('player').length == 0)
      this.reset();
  },
  /**
   * Called by the reckonerHandler whenever a new user connects.
   */
  session_connectedHandler: function(session, rid) {
    var game = this.games.get(rid);

    if (!game)
    {
      console.log('Attempted to connect to game that does not exist: ' + rid);
      return;
    }

    game.startSession = game.startSession || session;

    game.addSession(session);

    console.log('SESSION CONNECTED:', session.uid, ' to ', rid);
  }
});

/*===================================================*\
 * Export
\*===================================================*/
module.exports = ReckonerServer;
}).call(this,require('_process'))
},{"./ReckonerBase":39,"_process":7,"hasharray":11,"jclass":13}],41:[function(require,module,exports){
/*===================================================*\
 * Requires
\*===================================================*/
var merge = require('merge'),
	FeatureManager = require('./features/FeatureManager'),
  JClass = require('jclass'),
  HashArray = require('hasharray'),
	EventDispatcher = require('../EventDispatcher');

/*===================================================*\
 * GameObject()
\*===================================================*/
var GameObject = module.exports = EventDispatcher._extend({
  /*======================*\
   * Properties
  \*======================*/
  isServer: function () {
    return typeof window === 'undefined';
  },
  stateSetProps: function() {
    return [];
  },
  stateGetProps: function() {
    return ['_id'];
  },
  setParent: function(value) {
    this._parent = value;
  },
  getParent: function() {
    return this._parent;
  },
  setChildren: function(value) {
    // Deserialize from server
    this._children = value;
  },
  getChildren: function() {
    // Serialize from server
    return this._children;
  },
  setId: function(value) {
    this._id = value;
  },
  getId: function() {
    return this._id || (this._id = this.randomId());
  },
  setState: function(value) {
    this._state = value;
  },
  getState: function(mergeWith) {
    if (!this.inited)
      return {};

    return this.merge.recursive(true, {
	      id: this.getId(),
	      type: this.type,
	      children: this.getChildren().all.map(function (child) {
	        return child.getState();
	      })
			}, mergeWith);
  },
  getChildrenIds: function() {
    if (!this.inited)
      return {};

    var ret = {};

    this.getChildren().all.forEach(function (child) {
      ret[child.getId()] = true;
    });

    return ret;
  },
  setChildrenState: function(value) {
    var self = this,
      ids = this.getChildrenIds();

    value.forEach(function (childState) {
      var child = self.getChildren().get(childState.id);
      if (!child)
        self.getChildren().add(self.newChildFromState(childState));
      else {
        if (Object.prototype.toString.call(child) === '[object Array]' )
        {
          console.log('Two ids are the same!', child[0].getId());
          return;
        }
        child.setState(childState);
      }

      delete ids[childState.id];
    });

    if (this.destroyUnfoundChildrenOnStateSet)
      for (var id in ids)
        this.destroyChildById(id);
  },
  getChildrenState: function() {
    if (!this.inited)
      return {};

    return this.getChildren().all.map(function (child) {
      return child.getState();
    });
  },
  setDirty: function(value) {
    // Deserialize from server
    this._dirty = value;
    (this._dirty && this.getParent()) ? this.getParent().setDirty(true) : '';
    !this._dirty ? this.getChildren().forEach(function (child) {
      child.setDirty(false);
    }) : '';
  },
  getDirty: function() {
    // Serialize from server
    return this._dirty;
  },
  /*======================*\
   * Overridden Methods
  \*======================*/
	emit: function () {
		this._super.apply(this, arguments);
		
		// Bubbling
		var p = this.getParent();
		
		if (p)
			p.emit.apply(p, arguments);
	},
  /*======================*\
   * Methods
  \*======================*/
  randomId: function () {
    return Math.round(Math.random() * 999999999).toString(16);
  },
  init: function (parent, id) {
    if (!parent)
      GameObject.prototype.world = GameObject.prototype.root = this;

		this.merge = merge;
    this.setId(id);
    this.type = 'GameObject';
    this.buildChildrenObject();
    this.setParent(parent);
    this.setDirty(true);
    this.destroyed = false;
    this.sprite = undefined;
    this.destroyUnfoundChildrenOnStateSet = true;
    this.pre = new FeatureManager(this);
    this.post = new FeatureManager(this);

    this.inited = true;
  },
  update: function (elapsed, tracker) {
    if (tracker)
      tracker.add(this);

    var self = this;

    this.pre.update(elapsed);

    // Wipe out any destroyed children.
    this.getChildren().all.concat().forEach(function (child) {
      if (child.destroyed)
        self.getChildren().remove(child);
    });

    this.getChildren().all.forEach(function (child) {
      child.update(elapsed, tracker);
    });

    this.post.update(elapsed);
  },
  newChildFromState: function (childState) {
    var child = new GameObject();
    child.init(this, childState.id)
    child.state = childState;
    return child;
  },
  destroyChildById: function (id) {
    var child = this.getChildren().get(id);

    if (!child)
    {
      console.log('Attempting to destroy non-existent child with id', id);
      return;
    }

    if (child.destroy)
    {
      child.destroy();
    }
    
    this.getChildren().remove(child);
  },
  buildChildrenObject: function () {
    this.setChildren(new HashArray(['_id', 'type']));
  },
  buildSprite: function (phaser) {
  },
  updateSprite: function (phaser) {
    if (this.sprite && this.destroyed)
        this.sprite.destroy(true);
    else
    {
      if (!this.sprite)
        this.buildSprite(phaser);

      if (this.sprite)
        this.sprite.updateWithModel(this);
    }
  },
  updatePhaser: function (phaser) {
    this.getChildren().all.forEach(function (child) {
      child.updatePhaser(phaser);
    });

    this.updateSprite(phaser);
  },
  destroy: function () {
    this.destroyed = true;
  },
  forEach: function (callback, types) {
		var children = types ? this.getChildren().getAll(types) : this.getChildren().all.concat();

    children.forEach(function (child) {
      child.forEach(callback, types);
    });

		if (!types || types.indexOf(this.type))
    	callback.apply(this);
  }
});
},{"../EventDispatcher":38,"./features/FeatureManager":42,"hasharray":11,"jclass":13,"merge":14}],42:[function(require,module,exports){
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
},{"hasharray":11}],43:[function(require,module,exports){
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
},{"jclass":13}],44:[function(require,module,exports){
var JClass = require('jclass');

var ReckonerGateHandler = JClass._extend({
  init: function (app) {
    this.app = app;
  },
  requestConnectorForClient: function(msg, session, next) {
    var clientId = msg.clientId;
    if(!clientId) {
      next(null, {
        code: 500,
        reason: 'no clientId provided'
      });
      return;
    }

    // get all connectors
    var connectors = this.app.getServersByType('connector');
    if(!connectors || connectors.length === 0) {
      next(null, {
        code: 500,
        reason: 'no connectors found'
      });
      return;
    }

    // select connector for provided client.
    var connector = findFor(clientId, connectors);
    next(null, {
      code: 200,
      host: connector.host,
      port: connector.clientPort
    });
  }
});

function findFor(uid, connectors) {
  return connectors[Math.abs(crc.crc32(uid)) % connectors.length];
};

module.exports = function(app) {
  return new ReckonerGateHandler(app);
};
},{"jclass":13}],45:[function(require,module,exports){
(function (process,global){
var JClass = require('jclass'),
    pomelo = require('pomelo');

global.isClient = false;

var ReckonerPomeloApp = JClass._extend({
  init: function (name, gameServerClass, options) {
    this.app = pomelo.createApp();
    this.gameServerClass = gameServerClass;
    this.options = options || {};

    this.app.set('name', name);

    this.configure();
  },
  start: function () {
    app.start();
  },
  configure: function () {
    this.setupConnector();
    this.setupGate();
    this.setupReckoner();
    this.setupAll();
  },
  setupConnector: function () {
    this.app.configure('production|development|staging', 'connector', this.setupConnectorHandler.bind(this));
  },
  setupConnectorHandler: function () {
    this.app.set('connectorConfig', this.options.connector || {
      connector: pomelo.connectors.hybridconnector,
      heartbeat: 3,
      useDict: true,
      useProtobuf: true
    });
  },
  setupAll: function () {
    this.app.configure('production|development|staging', this.setupAllHandler.bind(this));
  },
  setupAllHandler: function () {
    if (this.options.pidFile)
      fs.appendFileSync(pidFile, process.pid.toString() + '\n');

    this.app.route(this.name, routeUtil[this.name]);
    this.app.filter(pomelo.timeout());
  },
  setupGate: function () {
    this.app.configure('production|development|staging', 'gate', this.setupGateHandler.bind(this));
  },
  setupGateHandler: function () {
    this.app.set('connectorConfig', this.options.gate || {
      connector: pomelo.connectors.hybridconnector,
      useProtobuf: true
    });
  },
  setupReckoner: function () {
    this.app.configure('production|development|staging', this.name, this.setupReckonerHandler.bind(this));
  },
  setupReckonerHandler: function () {
    this.app.set(name + 'Service', new this.gameServerClass(this.app));
  }
});
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":7,"jclass":13,"pomelo":16}],46:[function(require,module,exports){
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
},{"jclass":13}],47:[function(require,module,exports){
var Reckoner = require('reckoner');

var PongClient = Reckoner.Client._extend({
  init: function init() {
    init._super.call(this);
  }
});

module.exports = PongClient;
},{"reckoner":10}]},{},[47]);
