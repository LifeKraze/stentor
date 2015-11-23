var common = require('../common')
  , redis  = common.redis
  , knex   = common.knex;

module.exports = {
  'Reset DB': {
    topic: function() {
      var callback = this.callback;
      redis.del(['yodel:subscribe', 'yodel:unsubscribe', 'yodel:notify', 'yodel:push'], function(err) {
        if (err) { return callback(err); }
        knex('devices').truncate().nodeify(callback);
      });
    }

  , 'wait for reset': function() {}
  }
}
