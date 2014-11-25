(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
var Reckoner = require('../../../index');

var PongClient = Reckoner.Client._extend({
  init: function init() {
    init._super.call(this);
  }
});

module.exports = PongClient;
},{"../../../index":3}],3:[function(require,module,exports){
module.exports = {
  Server: require('./src/ReckonerServer'),
  GameObject: require('./src/game/GameObject')
};
},{"./src/ReckonerServer":10,"./src/game/GameObject":12}],4:[function(require,module,exports){
module.exports = require('./src/HashArray.js');
},{"./src/HashArray.js":5}],5:[function(require,module,exports){
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
},{"jclass":6}],6:[function(require,module,exports){
/*!
 * jclass v1.1.2
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
      // simply create an instance of our target class
      this._origin = BaseClass._construct(cls, arguments);
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

},{}],7:[function(require,module,exports){
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
},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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
},{"jclass":6}],10:[function(require,module,exports){
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
},{"./ReckonerBase":9,"_process":1,"hasharray":4,"jclass":6}],11:[function(require,module,exports){
/*===================================================*\
 * Requires
\*===================================================*/
var JClass = require('jclass'),
	EventEmitter = require('node-event-emitter');

/*===================================================*\
 * GameObject()
\*===================================================*/
var EventDispatcher = module.exports = JClass._extend(EventEmitter.prototype);
},{"jclass":6,"node-event-emitter":8}],12:[function(require,module,exports){
/*===================================================*\
 * Requires
\*===================================================*/
var merge = require('merge'),
	FeatureManager = require('./features/FeatureManager'),
  JClass = require('jclass'),
  HashArray = require('hasharray'),
	EventDispatcher = require('./EventDispatcher');

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
},{"./EventDispatcher":11,"./features/FeatureManager":13,"hasharray":4,"jclass":6,"merge":7}],13:[function(require,module,exports){
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
},{"hasharray":4}]},{},[2]);
