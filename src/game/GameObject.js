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