var should        = require('should')
  , util          = require('util')
  , EventEmitter  = require('events').EventEmitter
  , common        = require('../common');

var helpers = module.exports = {};

helpers.nestedProperty = function(obj, keys, val) {
  if (keys.constructor != Array) {
    if (keys.constructor != String) {
      // assume object {'following_me.status': 'confirmed'}
      for (k in keys) break;
      val = keys[k];
      keys = k;
    }
    keys = keys.split('.');
  }

  keys.forEach(function(key){
    should.exist(obj);
    obj.should.have.property(key);
    obj = obj[key];
  });

  if (typeof val != 'undefined') should.equal(val, obj);
  return obj;
}

var ActionWatcher = function() {
  this.actionPrefix = 'yodel:events';
  this.redis = common.newRedisClient('redis');
  this.buffer = {};

  var self = this;
  self.redis.on('ready', function() {
    self.redis.subscribe('yodel:events');
  });

  self.redis.on('message', function(channel, message) {
    var result = JSON.parse(message);
    var event = message.action + ':' + message.user_id;
    var listeners = self.listeners(event);

    if (listeners.length > 0) {
      self.emit(event, result);
    } else {
      self.buffer[channel] = result;
    }
  });

  EventEmitter.call(this);
}
util.inherits(ActionWatcher, EventEmitter);

ActionWatcher.prototype.clearBuffer = function() {
  return this.buffer = {};
}

ActionWatcher.prototype.waitForEvent = function(event, listener) {
  var self = this;
  var key = 'yodel:events';

  var interval = setInterval(function() {
    if (key in self.buffer) {
      self.removeListener(event, listener);
      var result = self.buffer[key];
      delete self.buffer[key];
      return handler(null, result);
    }
  }, 1000);

  var timeout = setTimeout(function () {
    return handler(new Error('Event '+event+' never happened'));
  }, 3100);

  var handler = function(err, result) {
    clearTimeout(timeout);
    clearInterval(interval);
    return listener(err, result);
  }

  this.once(event, listener);
}

ActionWatcher.prototype.waitForPush = function(userId, listener) {
  var interval = setInterval(function() {
    common.redis.lpop('yodel:push', function(err, result) {
      return handler(null, JSON.parse(result));
    });
  }, 500);

  var timeout = setTimeout(function() {
    return handler(new Error('Push for User '+userId+' never happened'));
  }, 2000);

  var handler = function(err, result) {
    clearTimeout(timeout);
    clearInterval(interval);
    return listener(err, result);
  }
}

helpers.actionWatcher = new ActionWatcher();
